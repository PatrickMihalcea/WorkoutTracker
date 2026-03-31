import { create } from 'zustand';
import { WorkoutSession, SetLog, SetLogInsert, RoutineDayExercise } from '../models';
import { sessionService } from '../services';

interface ExerciseSetMap {
  [exerciseId: string]: SetLog[];
}

interface WorkoutState {
  session: WorkoutSession | null;
  sets: ExerciseSetMap;
  previousSets: ExerciseSetMap;
  exercises: RoutineDayExercise[];
  loading: boolean;

  startWorkout: (
    userId: string,
    routineDayId: string,
    exercises: RoutineDayExercise[],
  ) => Promise<void>;
  loadPreviousSets: (exerciseIds: string[], userId: string) => Promise<void>;
  addSet: (setData: SetLogInsert) => Promise<void>;
  updateSet: (id: string, updates: Partial<SetLogInsert>) => Promise<void>;
  deleteSet: (id: string, exerciseId: string) => Promise<void>;
  completeWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  sets: {},
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
      set({ session, exercises, sets: {} });
    } finally {
      set({ loading: false });
    }
  },

  loadPreviousSets: async (exerciseIds, userId) => {
    const previousSets: ExerciseSetMap = {};
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

  addSet: async (setData) => {
    const newSet = await sessionService.addSet(setData);
    set((state) => {
      const exerciseSets = state.sets[setData.exercise_id] ?? [];
      return {
        sets: {
          ...state.sets,
          [setData.exercise_id]: [...exerciseSets, newSet],
        },
      };
    });
  },

  updateSet: async (id, updates) => {
    const updated = await sessionService.updateSet(id, updates);
    set((state) => {
      const newSets = { ...state.sets };
      for (const eid of Object.keys(newSets)) {
        newSets[eid] = newSets[eid].map((s) => (s.id === id ? updated : s));
      }
      return { sets: newSets };
    });
  },

  deleteSet: async (id, exerciseId) => {
    await sessionService.deleteSet(id);
    set((state) => ({
      sets: {
        ...state.sets,
        [exerciseId]: (state.sets[exerciseId] ?? []).filter((s) => s.id !== id),
      },
    }));
  },

  completeWorkout: async () => {
    const { session } = get();
    if (!session) return;
    await sessionService.complete(session.id);
    set({ session: null, sets: {}, exercises: [], previousSets: {} });
  },

  cancelWorkout: async () => {
    const { session } = get();
    if (!session) return;
    await sessionService.cancel(session.id);
    set({ session: null, sets: {}, exercises: [], previousSets: {} });
  },

  reset: () => {
    set({ session: null, sets: {}, exercises: [], previousSets: {} });
  },
}));
