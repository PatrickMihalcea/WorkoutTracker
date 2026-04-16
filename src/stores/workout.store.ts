import { create } from 'zustand';

import { WorkoutSession, WorkoutRow, SetLog, RoutineDayExercise, Exercise, SessionWithSetsAndExercises } from '../models';
import { formatWeight, formatDistanceValue } from '../utils/units';
import { sessionService, workoutRowService, routineService, exerciseService } from '../services';
import { notificationService } from '../services/notification.service';
import { useProfileStore } from './profile.store';

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

export interface RestTimer {
  remaining: number;
  total: number;
  endsAt: number;
}

type SupersetGroups = Record<string, string | null>;

function resetWorkoutState() {
  return {
    session: null,
    rows: {},
    previousSets: {},
    exercises: [],
    collapsedCards: {},
    supersetGroups: {},
    restTimer: null,
  };
}

interface WorkoutState {
  session: WorkoutSession | null;
  rows: RowMap;
  previousSets: PreviousSetsMap;
  exercises: RoutineDayExercise[];
  collapsedCards: Record<string, boolean>;
  supersetGroups: SupersetGroups;
  loading: boolean;
  restTimer: RestTimer | null;

  startWorkout: (userId: string, routineDayId: string | null, exercises: RoutineDayExercise[], routineWeekIndex?: number | null) => Promise<void>;
  startWorkoutFromSession: (userId: string, completedSession: SessionWithSetsAndExercises) => Promise<void>;
  hydrateActiveSession: (session: WorkoutSession | null) => Promise<boolean>;
  resumeWorkout: (userId: string) => Promise<boolean>;
  updateRowLocal: (id: string, entryId: string, updates: Partial<Pick<WorkoutRow, 'weight' | 'reps' | 'rir' | 'duration' | 'distance'>>) => void;
  updateRow: (id: string, entryId: string, updates: Partial<Pick<WorkoutRow, 'weight' | 'reps' | 'rir' | 'duration' | 'distance'>>) => Promise<void>;
  toggleRow: (id: string, entryId: string) => Promise<void>;
  deleteRow: (id: string, entryId: string, setNumber: number) => Promise<void>;
  addRow: (entryId: string, exerciseId: string) => Promise<void>;
  addWarmupRow: (entryId: string, exerciseId: string) => Promise<void>;
  toggleWarmup: (id: string, entryId: string) => Promise<void>;
  removeExercise: (entryId: string) => Promise<void>;
  addExercise: (exercise: Exercise, setsPayload: { set_number: number; target_weight: number; target_reps_min: number; target_reps_max: number; target_duration?: number; target_distance?: number }[]) => Promise<void>;
  loadPreviousSets: (exerciseIds: string[], userId: string) => Promise<void>;
  reorderExercises: (newOrder: RoutineDayExercise[]) => Promise<void>;
  toggleCollapse: (entryId: string) => void;
  setSupersetGroup: (entryId: string, group: string | null) => Promise<void>;
  duplicateExercise: (entryId: string) => Promise<void>;
  swapExercise: (entryId: string, newExercise: Exercise) => Promise<void>;
  removeExerciseByExerciseId: (exerciseId: string) => void;
  updateExerciseInState: (exercise: Exercise) => void;
  completeWorkout: (weightUnit: string) => Promise<string | null>;
  cancelWorkout: () => Promise<void>;
  reset: () => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  adjustRestTimer: (delta: number) => void;
  dismissRestTimer: () => void;
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
  supersetGroups: {},
  loading: false,
  restTimer: null,

  hydrateActiveSession: async (session) => {
    if (!session) {
      set(resetWorkoutState());
      void notificationService.cancelRestTimerNotification();
      return false;
    }

    if (!session.routine_day_id) {
      set({
        session,
        rows: {},
        previousSets: {},
        exercises: [],
        collapsedCards: {},
        supersetGroups: {},
        restTimer: null,
      });
      void notificationService.cancelRestTimerNotification();
      return true;
    }

    try {
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
          routine_day_id: session.routine_day_id,
          exercise_id: exercise.id,
          sort_order: day.exercises.length + adHocEntries.length,
          target_sets: entryRows.length,
          target_reps: entryRows[0].target_reps_min || 10,
          superset_group: entryRows[0].superset_group ?? null,
          exercise,
          sets: entryRows.map((r) => ({
            id: '',
            routine_day_exercise_id: entryId,
            set_number: r.set_number,
            target_weight: r.target_weight,
            target_reps_min: r.target_reps_min,
            target_reps_max: r.target_reps_max,
            target_rir: null,
            target_duration: r.target_duration ?? 0,
            target_distance: r.target_distance ?? 0,
            is_warmup: r.is_warmup ?? false,
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

      const groups: SupersetGroups = {};
      for (const entry of allEntries) {
        const entryRows = grouped[entry.id] ?? [];
        groups[entry.id] = entryRows[0]?.superset_group ?? entry.superset_group ?? null;
      }

      set({
        session,
        exercises: allEntries,
        rows: grouped,
        collapsedCards,
        supersetGroups: groups,
        previousSets: {},
        restTimer: null,
      });
      void notificationService.cancelRestTimerNotification();
      return true;
    } catch {
      set({
        session,
        rows: {},
        previousSets: {},
        exercises: [],
        collapsedCards: {},
        supersetGroups: {},
        restTimer: null,
      });
      void notificationService.cancelRestTimerNotification();
      return true;
    }
  },

  startWorkout: async (userId, routineDayId, exercises, routineWeekIndex = null) => {
    set({ loading: true });
    try {
      const stale = get().session;
      if (stale) {
        await workoutRowService.deleteBySession(stale.id);
        await sessionService.cancel(stale.id);
      }
      const session = await sessionService.create({
        user_id: userId,
        routine_day_id: routineDayId,
        routine_week_index: routineWeekIndex,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'in_progress',
      });
      const allRows = await workoutRowService.createInitialRows(session.id, exercises);
      const groups: SupersetGroups = {};
      for (const ex of exercises) {
        groups[ex.id] = ex.superset_group ?? null;
      }
      set({
        session,
        exercises,
        rows: groupByEntry(allRows),
        collapsedCards: {},
        supersetGroups: groups,
        previousSets: {},
        restTimer: null,
      });
      void notificationService.cancelRestTimerNotification();
    } finally {
      set({ loading: false });
    }
  },

  startWorkoutFromSession: async (userId, completedSession) => {
    set({ loading: true });
    try {
      const profile = useProfileStore.getState().profile;
      const weightUnit = profile?.weight_unit ?? 'kg';
      const distUnit = profile?.distance_unit ?? 'km';

      // Group sets by (exercise_order, exercise_id), preserving order
      const groupMap = new Map<string, { exerciseId: string; exerciseOrder: number; supersetGroup: string | null; sets: typeof completedSession.sets }>();
      for (const set of completedSession.sets) {
        const orderKey = set.exercise_order != null ? `order_${set.exercise_order}` : `legacy_${set.exercise_id}`;
        const key = `${orderKey}_${set.exercise_id}`;
        const existing = groupMap.get(key);
        if (existing) {
          existing.sets.push(set);
        } else {
          groupMap.set(key, {
            exerciseId: set.exercise_id,
            exerciseOrder: set.exercise_order ?? groupMap.size,
            supersetGroup: set.superset_group ?? null,
            sets: [set],
          });
        }
      }
      const sortedGroups = [...groupMap.values()]
        .map((g) => ({ ...g, sets: [...g.sets].sort((a, b) => a.set_number - b.set_number) }))
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder);

      // Cancel any stale in-progress session
      const stale = get().session;
      if (stale) {
        await workoutRowService.deleteBySession(stale.id);
        await sessionService.cancel(stale.id);
      }

      // Create new session mirroring the completed one
      const session = await sessionService.create({
        user_id: userId,
        routine_day_id: completedSession.routine_day_id,
        routine_week_index: completedSession.routine_week_index,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'in_progress',
      });

      // Build exercises and pre-filled row inserts
      const exercises: RoutineDayExercise[] = [];
      const rowInserts: Omit<WorkoutRow, 'id'>[] = [];
      const supersetGroups: SupersetGroups = {};

      for (let exIdx = 0; exIdx < sortedGroups.length; exIdx++) {
        const group = sortedGroups[exIdx];
        const entryId = generateId();

        exercises.push({
          id: entryId,
          routine_day_id: completedSession.routine_day_id ?? '',
          exercise_id: group.exerciseId,
          sort_order: exIdx,
          target_sets: group.sets.length,
          target_reps: group.sets[0]?.reps_performed ?? 10,
          superset_group: group.supersetGroup,
          exercise: group.sets[0]?.exercise,
          sets: group.sets.map((s) => ({
            id: '',
            routine_day_exercise_id: entryId,
            set_number: s.set_number,
            target_weight: s.weight,
            target_reps_min: s.reps_performed,
            target_reps_max: s.reps_performed,
            target_rir: s.rir,
            target_duration: s.duration,
            target_distance: s.distance,
            is_warmup: s.is_warmup,
          })),
        });

        supersetGroups[entryId] = group.supersetGroup;

        for (const s of group.sets) {
          rowInserts.push({
            session_id: session.id,
            exercise_id: group.exerciseId,
            routine_day_exercise_id: entryId,
            set_number: s.set_number,
            weight: formatWeight(s.weight, weightUnit),
            reps: String(s.reps_performed),
            rir: s.rir != null ? String(s.rir) : '',
            duration: s.duration > 0 ? String(s.duration) : '',
            distance: s.distance > 0 ? formatDistanceValue(s.distance, distUnit) : '',
            is_completed: false,
            is_warmup: s.is_warmup,
            target_weight: s.weight,
            target_reps_min: s.reps_performed,
            target_reps_max: s.reps_performed,
            target_duration: s.duration,
            target_distance: s.distance,
            exercise_order: exIdx,
            superset_group: group.supersetGroup,
          });
        }
      }

      const allRows = await workoutRowService.insertRows(rowInserts);

      set({
        session,
        exercises,
        rows: groupByEntry(allRows),
        collapsedCards: {},
        supersetGroups,
        previousSets: {},
        restTimer: null,
      });
      void notificationService.cancelRestTimerNotification();
    } finally {
      set({ loading: false });
    }
  },

  resumeWorkout: async (userId) => {
    set({ loading: true });
    try {
      const session = await sessionService.getActiveSession(userId);
      if (!session) {
        set(resetWorkoutState());
        void notificationService.cancelRestTimerNotification();
        return false;
      }
      return await get().hydrateActiveSession(session);
    } finally {
      set({ loading: false });
    }
  },

  updateRowLocal: (id, entryId, updates) => {
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) =>
          r.id === id ? { ...r, ...updates } : r,
        ),
      },
    }));
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
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) =>
          r.id === id ? { ...r, is_completed: newCompleted } : r,
        ),
      },
    }));
    await workoutRowService.updateRow(id, { is_completed: newCompleted });
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

  addWarmupRow: async (entryId, exerciseId) => {
    const { session, rows } = get();
    if (!session) return;
    const entryRows = rows[entryId] ?? [];
    const nextSetNumber = entryRows.length > 0
      ? Math.max(...entryRows.map((r) => r.set_number)) + 1
      : 1;
    const newRow = await workoutRowService.addRow(
      session.id, exerciseId, entryId, nextSetNumber, undefined, undefined, true,
    );
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: [...(state.rows[entryId] ?? []), newRow],
      },
    }));
  },

  toggleWarmup: async (id, entryId) => {
    const row = (get().rows[entryId] ?? []).find((r) => r.id === id);
    if (!row) return;
    const newWarmup = !row.is_warmup;
    set((state) => ({
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) =>
          r.id === id ? { ...r, is_warmup: newWarmup } : r,
        ),
      },
    }));
    await workoutRowService.updateWarmup(id, newWarmup);
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
        target_duration: sp.target_duration,
        target_distance: sp.target_distance,
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
      superset_group: null,
      exercise,
      sets: setsPayload.map((sp) => ({
        id: '',
        routine_day_exercise_id: entryId,
        set_number: sp.set_number,
        target_weight: sp.target_weight,
        target_reps_min: sp.target_reps_min,
        target_reps_max: sp.target_reps_max,
        target_rir: null,
        target_duration: sp.target_duration ?? 0,
        target_distance: sp.target_distance ?? 0,
        is_warmup: false,
      })),
    };
    set((state) => ({
      exercises: [...state.exercises, syntheticEntry],
      rows: { ...state.rows, [entryId]: newRows },
      supersetGroups: { ...state.supersetGroups, [entryId]: null },
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

  setSupersetGroup: async (entryId, group) => {
    const { session } = get();
    if (!session) return;
    set((state) => ({
      supersetGroups: { ...state.supersetGroups, [entryId]: group },
    }));
    await workoutRowService.updateSupersetGroup(session.id, entryId, group);
  },

  duplicateExercise: async (entryId) => {
    const { session, exercises, rows, supersetGroups } = get();
    if (!session) return;
    const idx = exercises.findIndex((e) => e.id === entryId);
    if (idx === -1) return;
    const source = exercises[idx];
    const sourceRows = rows[entryId] ?? [];
    const groupId = supersetGroups[entryId] ?? source.superset_group ?? null;

    let insertIdx = idx + 1;
    if (groupId) {
      for (let i = idx + 1; i < exercises.length; i++) {
        const g = supersetGroups[exercises[i].id] ?? exercises[i].superset_group ?? null;
        if (g === groupId) insertIdx = i + 1;
        else break;
      }
    }

    const newEntryId = generateId();
    const exerciseOrder = insertIdx;
    const newRows: WorkoutRow[] = [];
    for (const r of sourceRows) {
      const row = await workoutRowService.addRow(
        session.id, source.exercise_id, newEntryId, r.set_number,
        { target_weight: r.target_weight, target_reps_min: r.target_reps_min, target_reps_max: r.target_reps_max },
        exerciseOrder, r.is_warmup,
      );
      newRows.push(row);
    }

    const newEntry: RoutineDayExercise = {
      id: newEntryId,
      routine_day_id: source.routine_day_id,
      exercise_id: source.exercise_id,
      sort_order: insertIdx,
      target_sets: source.target_sets,
      target_reps: source.target_reps,
      superset_group: null,
      exercise: source.exercise,
      sets: source.sets,
    };

    set((state) => {
      const newExercises = [...state.exercises];
      newExercises.splice(insertIdx, 0, newEntry);
      for (let i = 0; i < newExercises.length; i++) {
        newExercises[i] = { ...newExercises[i], sort_order: i };
      }
      return {
        exercises: newExercises,
        rows: { ...state.rows, [newEntryId]: newRows },
        supersetGroups: { ...state.supersetGroups, [newEntryId]: null },
      };
    });

    const updatedExercises = get().exercises;
    await Promise.all(
      updatedExercises.map((entry, i) =>
        workoutRowService.updateExerciseOrder(session.id, entry.id, i),
      ),
    );
  },

  swapExercise: async (entryId, newExercise) => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.updateExerciseId(session.id, entryId, newExercise.id);
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.id === entryId ? { ...e, exercise_id: newExercise.id, exercise: newExercise } : e,
      ),
      rows: {
        ...state.rows,
        [entryId]: (state.rows[entryId] ?? []).map((r) => ({
          ...r,
          exercise_id: newExercise.id,
        })),
      },
    }));
  },

  removeExerciseByExerciseId: (exerciseId) => {
    set((state) => {
      const removedEntryIds = state.exercises
        .filter((entry) => entry.exercise_id === exerciseId)
        .map((entry) => entry.id);

      const nextRows = { ...state.rows };
      const nextCollapsed = { ...state.collapsedCards };
      const nextGroups = { ...state.supersetGroups };

      for (const entryId of removedEntryIds) {
        delete nextRows[entryId];
        delete nextCollapsed[entryId];
        delete nextGroups[entryId];
      }

      const { [exerciseId]: _removed, ...nextPreviousSets } = state.previousSets;

      return {
        exercises: state.exercises.filter((entry) => entry.exercise_id !== exerciseId),
        rows: nextRows,
        collapsedCards: nextCollapsed,
        supersetGroups: nextGroups,
        previousSets: nextPreviousSets,
      };
    });
  },

  updateExerciseInState: (exercise) => {
    set((state) => ({
      exercises: state.exercises.map((entry) =>
        entry.exercise_id === exercise.id
          ? { ...entry, exercise }
          : entry,
      ),
    }));
  },

  completeWorkout: async (weightUnit) => {
    const { session, rows, exercises, supersetGroups } = get();
    if (!session) return null;

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
          is_warmup: row.is_warmup,
          exercise_order: order,
          superset_group: supersetGroups[entry.id] ?? entry.superset_group ?? null,
          duration: parseFloat(row.duration) || 0,
          distance: parseFloat(row.distance) || 0,
        });
      }
      order++;
    }

    await workoutRowService.deleteBySession(session.id);
    await sessionService.complete(session.id);

    if (session.routine_day_id && session.routine_week_index != null) {
      try {
        const day = await routineService.getDay(session.routine_day_id);
        const routine = await routineService.getById(day.routine_id);
        if (routine.current_week === session.routine_week_index) {
          const weekDays = await routineService.getDaysForWeek(routine.id, routine.current_week);
          const scheduledDays = weekDays.filter((d) => d.day_of_week != null);

          if (scheduledDays.length > 0) {
            const completedDayIds = await sessionService.getCompletedDayIdsSince(
              session.user_id,
              scheduledDays.map((d) => d.id),
              routine.current_week_started_at,
            );

            const allDone = scheduledDays.every((d) => completedDayIds.includes(d.id));
            if (allDone) {
              const nextWeek = routine.current_week >= routine.week_count
                ? 1
                : routine.current_week + 1;
              await routineService.setCurrentWeek(routine.id, nextWeek);
            }
          }
        }
      } catch {
        // Do not block completion on progression updates
      }
    }

    const completedSessionId = session.id;
    set(resetWorkoutState());
    void notificationService.cancelRestTimerNotification();
    void notificationService.syncWorkoutDayReminder(useProfileStore.getState().profile);
    return completedSessionId;
  },

  cancelWorkout: async () => {
    const { session } = get();
    if (!session) return;
    await workoutRowService.deleteBySession(session.id);
    await sessionService.cancel(session.id);
    set(resetWorkoutState());
    void notificationService.cancelRestTimerNotification();
  },

  reset: () => {
    set(resetWorkoutState());
    void notificationService.cancelRestTimerNotification();
  },

  startRestTimer: (seconds) => {
    set({ restTimer: { remaining: seconds, total: seconds, endsAt: Date.now() + seconds * 1000 } });
    const profile = useProfileStore.getState().profile;
    const enabled = profile?.notify_rest_timer_enabled ?? true;
    if (enabled) {
      void notificationService.scheduleRestTimerNotification(seconds);
    }
  },

  tickRestTimer: () => {
    const { restTimer } = get();
    if (!restTimer) return;
    const next = Math.ceil((restTimer.endsAt - Date.now()) / 1000);
    if (next <= 0) {
      set({ restTimer: null });
      void notificationService.cancelRestTimerNotification();
    } else {
      set({ restTimer: { ...restTimer, remaining: next } });
    }
  },

  adjustRestTimer: (delta) => {
    const { restTimer } = get();
    if (!restTimer) return;
    const newEndsAt = restTimer.endsAt + delta * 1000;
    const newRemaining = Math.ceil((newEndsAt - Date.now()) / 1000);
    const newTotal = Math.max(0, restTimer.total + delta);
    if (newRemaining <= 0) {
      set({ restTimer: null });
      void notificationService.cancelRestTimerNotification();
    } else {
      set({ restTimer: { remaining: newRemaining, total: newTotal, endsAt: newEndsAt } });
      const profile = useProfileStore.getState().profile;
      const enabled = profile?.notify_rest_timer_enabled ?? true;
      if (enabled) {
        void notificationService.scheduleRestTimerNotification(newRemaining);
      }
    }
  },

  dismissRestTimer: () => {
    set({ restTimer: null });
    void notificationService.cancelRestTimerNotification();
  },
}));
