import { create } from 'zustand';
import { Exercise, Routine, RoutineWithDays } from '../models';
import { routineService } from '../services';
import { notificationService } from '../services/notification.service';
import { useProfileStore } from './profile.store';

interface RoutineState {
  routines: Routine[];
  activeRoutine: RoutineWithDays | null;
  currentRoutine: RoutineWithDays | null;
  loading: boolean;

  fetchRoutines: () => Promise<void>;
  fetchActiveRoutine: () => Promise<void>;
  fetchRoutineDetail: (id: string) => Promise<void>;
  createRoutine: (name: string, userId: string, weekCount?: number) => Promise<Routine>;
  duplicateRoutine: (id: string, userId: string) => Promise<Routine>;
  setActive: (id: string, userId: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  removeExerciseReferences: (exerciseId: string) => void;
  updateExerciseReferences: (exercise: Exercise) => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  routines: [],
  activeRoutine: null,
  currentRoutine: null,
  loading: false,

  fetchRoutines: async () => {
    set({ loading: true });
    try {
      const routines = await routineService.getAll();
      set({ routines });
    } finally {
      set({ loading: false });
    }
  },

  fetchActiveRoutine: async () => {
    try {
      const routine = await routineService.getActive();
      set({ activeRoutine: routine });
    } catch {
      // No active routine
    }
  },

  fetchRoutineDetail: async (id) => {
    set({ loading: true });
    try {
      const routine = await routineService.getWithDays(id);
      set({ currentRoutine: routine });
    } finally {
      set({ loading: false });
    }
  },

  createRoutine: async (name, userId, weekCount = 1) => {
    const routine = await routineService.create({
      name,
      user_id: userId,
      is_active: false,
      week_count: weekCount,
      current_week: 1,
    });
    set((state) => ({ routines: [routine, ...state.routines] }));
    return routine;
  },

  duplicateRoutine: async (id, userId) => {
    const routine = await routineService.duplicateRoutine(id, userId);
    set((state) => ({ routines: [routine, ...state.routines] }));
    return routine;
  },

  setActive: async (id, userId) => {
    await routineService.setActive(id, userId);
    set((state) => ({
      routines: state.routines.map((r) => ({
        ...r,
        is_active: r.id === id,
      })),
    }));
    const routine = await routineService.getWithDays(id);
    set({ activeRoutine: routine });
    void notificationService.syncWorkoutDayReminder(useProfileStore.getState().profile);
  },

  deleteRoutine: async (id) => {
    await routineService.delete(id);
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== id),
      activeRoutine: state.activeRoutine?.id === id ? null : state.activeRoutine,
    }));
  },

  removeExerciseReferences: (exerciseId) => {
    set((state) => {
      const pruneRoutine = (routine: RoutineWithDays | null): RoutineWithDays | null => {
        if (!routine) return null;
        return {
          ...routine,
          days: routine.days.map((day) => ({
            ...day,
            exercises: day.exercises.filter((entry) => entry.exercise_id !== exerciseId),
          })),
        };
      };

      return {
        activeRoutine: pruneRoutine(state.activeRoutine),
        currentRoutine: pruneRoutine(state.currentRoutine),
      };
    });
  },

  updateExerciseReferences: (exercise) => {
    set((state) => {
      const patchRoutine = (routine: RoutineWithDays | null): RoutineWithDays | null => {
        if (!routine) return null;
        return {
          ...routine,
          days: routine.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((entry) =>
              entry.exercise_id === exercise.id
                ? { ...entry, exercise }
                : entry,
            ),
          })),
        };
      };

      return {
        activeRoutine: patchRoutine(state.activeRoutine),
        currentRoutine: patchRoutine(state.currentRoutine),
      };
    });
  },
}));
