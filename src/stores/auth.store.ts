import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '../services';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      set({
        session: session as Session | null,
        user: (session as Session | null)?.user ?? null,
        initialized: true,
      });
    } catch {
      set({ initialized: true });
    }

    authService.onAuthStateChange((session) => {
      set({
        session: session as Session | null,
        user: (session as Session | null)?.user ?? null,
      });
    });
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      await authService.signUp(email, password);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      await authService.signIn(email, password);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ session: null, user: null });
  },
}));
