import { create } from 'zustand';
import { WorkoutSession, WorkoutRow, SetLog, RoutineDayExercise } from '../models';
import { sessionService, workoutRowService } from '../services';

interface RowMap {
  [exerciseId: string]: WorkoutRow[];
}

interface PreviousSetsMap {
  [exerciseId: string]: SetLog[];
}

interface WorkoutState {
  session: WorkoutSession | null;
  rows: RowMap;
  previousSets: PreviousSetsMap;
  exercises: RoutineDayExercise[];
  loading: boolean;

  startWorkout: (userId: string, routineDayId: string, exercises: RoutineDayExercise[]) => Promise<void>;
  resumeWorkout: (userId: string, exercises: RoutineDayExercise[]) => Promise<boolean>;
  updateRow: (id: string, exerciseId: string, updates: Partial<Pick<WorkoutRow, 'weight' | 'reps' | 'rir'>>) => Promise<void>;
  toggleRow: (id: string, exerciseId: string) => Promise<void>;
  deleteRow: (id: string, exerciseId: string, setNumber: number) => Promise<void>;
  addRow: (exerciseId: string) => Promise<void>;
  loadPreviousSets: (exerciseIds: string[], userId: string) => Promise<void>;
  completeWorkout: (weightUnit: string) => Promise<void>;
  cancelWorkout: () => Promise<void>;
  reset: () => void;
}

function groupByExercise(allRows: WorkoutRow[]): RowMap {
  const map: RowMap = {};
  for (const r of allRows) {
    if (!map[r.exercise_id]) map[r.exercise_id] = [];
    map[r.exercise_id].push(r);
  }
  return map;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  rows: {},
  previousSets: {},
  exercises: [],
  loading: false,

  startWorkout: async (userId, routineDayId, exercises) => {
    set({ loading: true });
    try {
      const session = await sessionService.create({
        user_id: userId,
        routine_day_id: routineDayId,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'in_progress',
      });
      const allRows = await workoutRowService.createInitialRows(session.id, exercises);
      set({ session, exercises, rows: groupByExercise(allRows) });
    } finally {
      set({ loading: false });
    }
  },

  resumeWorkout: async (userId, exercises) => {
    set({ loading: true });
    try {
      const session = await sessionService.getActiveSession(userId);
      if (!session) return false;
      const allRows = await workoutRowService.getBySession(session.id);
      set({ session, exercises, rows: groupByExercise(allRows) });
      return true;
    } finally {
      set({ loading: false });
    }
  },

  updateRow: async (id, exerciseId, updates) => {
    await workoutRowService.updateRow(id, updates);
    set((state) => ({
      rows: {
        ...state.rows,
        [exerciseId]: (state.rows[exerciseId] ?? []).map((r) =>
          r.id === id ? { ...r, ...updates } : r,
        ),
      },
    }));
  },

  toggleRow: async (id, exerciseId) => {
    const row = (get().rows[exerciseId] ?? []).find((r) => r.id === id);
    if (!row) return;
    const newCompleted = !row.is_completed;
    await workoutRowService.updateRow(id, { is_completed: newCompleted });
    set((state) => ({
      rows: {
        ...state.rows,
        [exerciseId]: (state.rows[exerciseId] ?? []).map((r) =>
          r.id === id ? { ...r, is_completed: newCompleted } : r,
        ),
      },
    }));
  },

  deleteRow: async (id, exerciseId, setNumber) => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteAndRenumber(id, session.id, exerciseId, setNumber);
    set((state) => ({
      rows: {
        ...state.rows,
        [exerciseId]: (state.rows[exerciseId] ?? [])
          .filter((r) => r.id !== id)
          .map((r) =>
            r.set_number > setNumber ? { ...r, set_number: r.set_number - 1 } : r,
          ),
      },
    }));
  },

  addRow: async (exerciseId) => {
    const { session, rows } = get();
    if (!session) return;
    const exerciseRows = rows[exerciseId] ?? [];
    const nextSetNumber = exerciseRows.length > 0
      ? Math.max(...exerciseRows.map((r) => r.set_number)) + 1
      : 1;
    const newRow = await workoutRowService.addRow(session.id, exerciseId, nextSetNumber);
    set((state) => ({
      rows: {
        ...state.rows,
        [exerciseId]: [...(state.rows[exerciseId] ?? []), newRow],
      },
    }));
  },

  loadPreviousSets: async (exerciseIds, userId) => {
    const previousSets: PreviousSetsMap = {};
    await Promise.all(
      exerciseIds.map(async (eid) => {
        try {
          const sets = await sessionService.getLastSessionSets(eid, userId);
          if (sets.length > 0) previousSets[eid] = sets;
        } catch {
          // No previous data
        }
      }),
    );
    set({ previousSets });
  },

  completeWorkout: async (weightUnit) => {
    const { session, rows } = get();
    if (!session) return;

    const parseWeight = (text: string): number => {
      const val = parseFloat(text) || 0;
      if (weightUnit === 'lbs') return val * 0.453592;
      return val;
    };

    for (const exerciseId of Object.keys(rows)) {
      for (const row of rows[exerciseId]) {
        if (!row.is_completed) continue;
        await sessionService.addSet({
          session_id: session.id,
          exercise_id: exerciseId,
          set_number: row.set_number,
          weight: parseWeight(row.weight),
          reps_performed: parseInt(row.reps, 10) || 0,
          rir: row.rir ? parseInt(row.rir, 10) : null,
          is_warmup: false,
        });
      }
    }

    await workoutRowService.deleteBySession(session.id);
    await sessionService.complete(session.id);
    set({ session: null, rows: {}, exercises: [], previousSets: {} });
  },

  cancelWorkout: async () => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteBySession(session.id);
    await sessionService.cancel(session.id);
    set({ session: null, rows: {}, exercises: [], previousSets: {} });
  },

  reset: () => {
    set({ session: null, rows: {}, exercises: [], previousSets: {} });
  },
}));
