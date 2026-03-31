import { create } from 'zustand';
import { Routine, RoutineWithDays } from '../models';
import { routineService } from '../services';

interface RoutineState {
  routines: Routine[];
  activeRoutine: RoutineWithDays | null;
  currentRoutine: RoutineWithDays | null;
  loading: boolean;

  fetchRoutines: () => Promise<void>;
  fetchActiveRoutine: () => Promise<void>;
  fetchRoutineDetail: (id: string) => Promise<void>;
  createRoutine: (name: string, userId: string) => Promise<Routine>;
  setActive: (id: string, userId: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
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

  createRoutine: async (name, userId) => {
    const routine = await routineService.create({
      name,
      user_id: userId,
      is_active: false,
    });
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
  },

  deleteRoutine: async (id) => {
    await routineService.delete(id);
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== id),
      activeRoutine: state.activeRoutine?.id === id ? null : state.activeRoutine,
    }));
  },
}));
