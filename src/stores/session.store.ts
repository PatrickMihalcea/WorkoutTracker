import { create } from 'zustand';
import { WorkoutSessionWithRoutine } from '../models';
import { sessionService } from '../services';

interface SessionState {
  sessions: WorkoutSessionWithRoutine[];
  recordCounts: Record<string, number>;
  sessionsLoaded: boolean;

  fetchSessions: () => Promise<void>;
  removeSession: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  recordCounts: {},
  sessionsLoaded: false,

  fetchSessions: async () => {
    try {
      const data = await sessionService.getAll();
      const completed = data.filter((s) => s.status === 'completed');

      const countEntries = await Promise.all(
        completed.map(async (session) => {
          try {
            const count = await sessionService.getRecordsAchievedCount(session.id);
            return [session.id, count] as const;
          } catch {
            return [session.id, 0] as const;
          }
        }),
      );

      set({
        sessions: completed,
        recordCounts: Object.fromEntries(countEntries),
        sessionsLoaded: true,
      });
    } catch {
      set({ sessionsLoaded: true });
    }
  },

  removeSession: (id) => {
    set((state) => {
      const { [id]: _, ...nextCounts } = state.recordCounts;
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        recordCounts: nextCounts,
      };
    });
  },
}));
