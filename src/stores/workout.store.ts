import { create } from 'zustand';

import { WorkoutSession, WorkoutRow, SetLog, RoutineDayExercise, Exercise } from '../models';
import { sessionService, workoutRowService, routineService, exerciseService } from '../services';

function generateId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

interface RowMap {
  [entryId: string]: WorkoutRow[];
}

interface PreviousSetsMap {
  [exerciseId: string]: SetLog[];
}

interface WorkoutState {
  session: WorkoutSession | null;
  rows: RowMap;
  previousSets: PreviousSetsMap;
  exercises: RoutineDayExercise[];
  collapsedCards: Record<string, boolean>;
  loading: boolean;

  startWorkout: (userId: string, routineDayId: string, exercises: RoutineDayExercise[]) => Promise<void>;
  resumeWorkout: (userId: string) => Promise<boolean>;
  updateRow: (id: string, entryId: string, updates: Partial<Pick<WorkoutRow, 'weight' | 'reps' | 'rir'>>) => Promise<void>;
  toggleRow: (id: string, entryId: string) => Promise<void>;
  deleteRow: (id: string, entryId: string, setNumber: number) => Promise<void>;
  addRow: (entryId: string, exerciseId: string) => Promise<void>;
  removeExercise: (entryId: string) => Promise<void>;
  addExercise: (exercise: Exercise, setsPayload: { set_number: number; target_weight: number; target_reps_min: number; target_reps_max: number }[]) => Promise<void>;
  loadPreviousSets: (exerciseIds: string[], userId: string) => Promise<void>;
  reorderExercises: (newOrder: RoutineDayExercise[]) => Promise<void>;
  toggleCollapse: (entryId: string) => void;
  completeWorkout: (weightUnit: string) => Promise<void>;
  cancelWorkout: () => Promise<void>;
  reset: () => void;
}

function groupByEntry(allRows: WorkoutRow[]): RowMap {
  const map: RowMap = {};
  for (const r of allRows) {
    if (!map[r.routine_day_exercise_id]) map[r.routine_day_exercise_id] = [];
    map[r.routine_day_exercise_id].push(r);
  }
  return map;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  rows: {},
  previousSets: {},
  exercises: [],
  collapsedCards: {},
  loading: false,

  startWorkout: async (userId, routineDayId, exercises) => {
    set({ loading: true });
    try {
      const stale = await sessionService.getActiveSession(userId);
      if (stale) {
        await workoutRowService.deleteBySession(stale.id);
        await sessionService.cancel(stale.id);
      }
      const session = await sessionService.create({
        user_id: userId,
        routine_day_id: routineDayId,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'in_progress',
      });
      const allRows = await workoutRowService.createInitialRows(session.id, exercises);
      set({ session, exercises, rows: groupByEntry(allRows), collapsedCards: {} });
    } finally {
      set({ loading: false });
    }
  },

  resumeWorkout: async (userId) => {
    set({ loading: true });
    try {
      const session = await sessionService.getActiveSession(userId);
      if (!session || !session.routine_day_id) return false;
      const day = await routineService.getDayWithExercises(session.routine_day_id);
      const allRows = await workoutRowService.getBySession(session.id);
      const grouped = groupByEntry(allRows);

      const routineEntryIds = new Set(day.exercises.map((e) => e.id));
      const adHocEntryIds = Object.keys(grouped).filter((id) => !routineEntryIds.has(id));

      const adHocEntries: RoutineDayExercise[] = [];
      for (const entryId of adHocEntryIds) {
        const entryRows = grouped[entryId];
        if (!entryRows?.length) continue;
        const exercise = await exerciseService.getById(entryRows[0].exercise_id);
        adHocEntries.push({
          id: entryId,
          routine_day_id: session.routine_day_id ?? '',
          exercise_id: exercise.id,
          sort_order: day.exercises.length + adHocEntries.length,
          target_sets: entryRows.length,
          target_reps: entryRows[0].target_reps_min || 10,
          exercise,
          sets: entryRows.map((r) => ({
            id: '',
            routine_day_exercise_id: entryId,
            set_number: r.set_number,
            target_weight: r.target_weight,
            target_reps_min: r.target_reps_min,
            target_reps_max: r.target_reps_max,
          })),
        });
      }

      const activeRoutineEntries = day.exercises.filter((e) => grouped[e.id]?.length > 0);
      const allEntries = [...activeRoutineEntries, ...adHocEntries];
      allEntries.sort((a, b) => {
        const orderA = grouped[a.id]?.[0]?.exercise_order ?? 999;
        const orderB = grouped[b.id]?.[0]?.exercise_order ?? 999;
        return orderA - orderB;
      });
      const collapsedCards: Record<string, boolean> = {};
      for (const entry of allEntries) {
        const entryRows = grouped[entry.id] ?? [];
        if (entryRows.length > 0 && entryRows.every((r) => r.is_completed)) {
          collapsedCards[entry.id] = true;
        }
      }
      set({ session, exercises: allEntries, rows: grouped, collapsedCards });
      return true;
    } finally {
      set({ loading: false });
    }
  },

  updateRow: async (id, entryId, updates) => {
    await workoutRowService.updateRow(id, updates);
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) =>
          r.id === id ? { ...r, ...updates } : r,
        ),
      },
    }));
  },

  toggleRow: async (id, entryId) => {
    const row = (get().rows[entryId] ?? []).find((r) => r.id === id);
    if (!row) return;
    const newCompleted = !row.is_completed;
    await workoutRowService.updateRow(id, { is_completed: newCompleted });
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) =>
          r.id === id ? { ...r, is_completed: newCompleted } : r,
        ),
      },
    }));
  
  },

  deleteRow: async (id, entryId, setNumber) => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteAndRenumber(id, session.id, entryId, setNumber);
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? [])
          .filter((r) => r.id !== id)
          .map((r) =>
            r.set_number > setNumber ? { ...r, set_number: r.set_number - 1 } : r,
          ),
      },
    }));
  },

  addRow: async (entryId, exerciseId) => {
    const { session, rows } = get();
    if (!session) return;
    const entryRows = rows[entryId] ?? [];
    const nextSetNumber = entryRows.length > 0
      ? Math.max(...entryRows.map((r) => r.set_number)) + 1
      : 1;
    const newRow = await workoutRowService.addRow(session.id, exerciseId, entryId, nextSetNumber);
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: [...(state.rows[entryId] ?? []), newRow],
      },
    }));
  },

  removeExercise: async (entryId) => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteByEntry(session.id, entryId);
    set((state) => {
      const { [entryId]: _, ...rest } = state.rows;
      return {
        exercises: state.exercises.filter((e) => e.id !== entryId),
        rows: rest,
      };
    });
  },

  addExercise: async (exercise, setsPayload) => {
    const { session } = get();
    if (!session) return;
    const entryId = generateId();
    const exerciseOrder = get().exercises.length;
    const newRows: WorkoutRow[] = [];
    for (const sp of setsPayload) {
      const row = await workoutRowService.addRow(session.id, exercise.id, entryId, sp.set_number, {
        target_weight: sp.target_weight,
        target_reps_min: sp.target_reps_min,
        target_reps_max: sp.target_reps_max,
      }, exerciseOrder);
      newRows.push(row);
    }
    const syntheticEntry: RoutineDayExercise = {
      id: entryId,
      routine_day_id: session.routine_day_id ?? '',
      exercise_id: exercise.id,
      sort_order: get().exercises.length,
      target_sets: setsPayload.length,
      target_reps: setsPayload[0]?.target_reps_min ?? 10,
      exercise,
      sets: setsPayload.map((sp) => ({
        id: '',
        routine_day_exercise_id: entryId,
        set_number: sp.set_number,
        target_weight: sp.target_weight,
        target_reps_min: sp.target_reps_min,
        target_reps_max: sp.target_reps_max,
      })),
    };
    set((state) => ({
      exercises: [...state.exercises, syntheticEntry],
      rows: { ...state.rows, [entryId]: newRows },
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

  toggleCollapse: (entryId) => {
    set((state) => ({
      collapsedCards: {
        ...state.collapsedCards,
        [entryId]: !state.collapsedCards[entryId],
      },
    }));
  },

  reorderExercises: async (newOrder) => {
    const { session } = get();
    if (!session) return;
    set({ exercises: newOrder });
    await Promise.all(
      newOrder.map((entry, idx) =>
        workoutRowService.updateExerciseOrder(session.id, entry.id, idx),
      ),
    );
  },

  completeWorkout: async (weightUnit) => {
    const { session, rows, exercises } = get();
    if (!session) return;

    const parseWeight = (text: string): number => {
      const val = parseFloat(text) || 0;
      if (weightUnit === 'lbs') return val * 0.453592;
      return val;
    };

    let order = 0;
    for (const entry of exercises) {
      const entryRows = rows[entry.id] ?? [];
      for (const row of entryRows) {
        if (!row.is_completed) continue;
        await sessionService.addSet({
          session_id: session.id,
          exercise_id: row.exercise_id,
          set_number: row.set_number,
          weight: parseWeight(row.weight),
          reps_performed: parseInt(row.reps, 10) || 0,
          rir: row.rir ? parseInt(row.rir, 10) : null,
          is_warmup: false,
          exercise_order: order,
        });
      }
      order++;
    }

    await workoutRowService.deleteBySession(session.id);
    await sessionService.complete(session.id);
    set({ session: null, rows: {}, exercises: [], previousSets: {}, collapsedCards: {} });
  },

  cancelWorkout: async () => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteBySession(session.id);
    await sessionService.cancel(session.id);
    set({ session: null, rows: {}, exercises: [], previousSets: {}, collapsedCards: {} });
  },

  reset: () => {
    set({ session: null, rows: {}, exercises: [], previousSets: {}, collapsedCards: {} });
  },
}));
