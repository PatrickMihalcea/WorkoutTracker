import { create } from 'zustand';
import { Exercise, Routine, RoutineWithDays } from '../models';
import { routineService } from '../services';
import { notificationService } from '../services/notification.service';
import { useProfileStore } from './profile.store';
import { useSubscriptionStore } from './subscription.store';
import { getLockedRoutineIds } from '../utils/routineAccess';

interface RoutineState {
  routines: Routine[];
  routinesLoaded: boolean;
  activeRoutine: RoutineWithDays | null;
  activeRoutineInitialized: boolean;
  currentRoutine: RoutineWithDays | null;
  loading: boolean;

  fetchRoutines: () => Promise<void>;
  fetchActiveRoutine: () => Promise<void>;
  fetchRoutineDetail: (id: string) => Promise<void>;
  createRoutine: (name: string, userId: string, weekCount?: number) => Promise<Routine>;
  duplicateRoutine: (id: string, userId: string) => Promise<Routine>;
  setActive: (id: string, userId: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  removeExerciseReferences: (exerciseId: string) => void;
  updateExerciseReferences: (exercise: Exercise) => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  routines: [],
  routinesLoaded: false,
  activeRoutine: null,
  activeRoutineInitialized: false,
  currentRoutine: null,
  loading: false,

  fetchRoutines: async () => {
    set({ loading: true });
    try {
      const routines = await routineService.getAll();
      const isPremium = useSubscriptionStore.getState().isPremium;
      const lockedRoutineIds = getLockedRoutineIds(routines, isPremium);
      const lockedActiveRoutine = routines.find((routine) => routine.is_active && lockedRoutineIds.has(routine.id));

      if (lockedActiveRoutine) {
        await routineService.deactivate(lockedActiveRoutine.id);
      }

      set((state) => {
        const currentRoutine = state.currentRoutine;
        let nextCurrentRoutine = currentRoutine;

        if (currentRoutine && currentRoutine.id === lockedActiveRoutine?.id) {
          nextCurrentRoutine = { ...currentRoutine, is_active: false };
        }

        return {
          routines: lockedActiveRoutine
            ? routines.map((routine) => (
              routine.id === lockedActiveRoutine.id
                ? { ...routine, is_active: false }
                : routine
            ))
            : routines,
          routinesLoaded: true,
          activeRoutine: state.activeRoutine?.id === lockedActiveRoutine?.id ? null : state.activeRoutine,
          currentRoutine: nextCurrentRoutine,
        };
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchActiveRoutine: async () => {
    try {
      const routine = await routineService.getActive();
      if (!routine) {
        set({ activeRoutine: null, activeRoutineInitialized: true });
        return;
      }

      const isPremium = useSubscriptionStore.getState().isPremium;

      if (!isPremium) {
        const routines = await routineService.getAll();
        const lockedRoutineIds = getLockedRoutineIds(routines, false);

        if (lockedRoutineIds.has(routine.id)) {
          await routineService.deactivate(routine.id);
          set((state) => {
            const currentRoutine = state.currentRoutine;
            let nextCurrentRoutine = currentRoutine;

            if (currentRoutine && currentRoutine.id === routine.id) {
              nextCurrentRoutine = { ...currentRoutine, is_active: false };
            }

            return {
              routines: state.routines.map((entry) => entry.id === routine.id ? { ...entry, is_active: false } : entry),
              activeRoutine: null,
              activeRoutineInitialized: true,
              currentRoutine: nextCurrentRoutine,
            };
          });
          return;
        }
      }

      set({ activeRoutine: routine, activeRoutineInitialized: true });
    } catch {
      set({ activeRoutineInitialized: true });
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
      routines: state.routines.map((r) => ({ ...r, is_active: r.id === id })),
      currentRoutine: state.currentRoutine ? { ...state.currentRoutine, is_active: state.currentRoutine.id === id } : null,
    }));
    const routine = await routineService.getWithDays(id);
    set({ activeRoutine: routine });
    void notificationService.syncWorkoutDayReminder(useProfileStore.getState().profile);
  },

  deactivate: async (id) => {
    await routineService.deactivate(id);
    set((state) => ({
      routines: state.routines.map((r) => r.id === id ? { ...r, is_active: false } : r),
      currentRoutine: state.currentRoutine?.id === id ? { ...state.currentRoutine, is_active: false } : state.currentRoutine,
      activeRoutine: state.activeRoutine?.id === id ? null : state.activeRoutine,
    }));
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
