import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { accountService, authService } from '../services';
import { supabase } from '../services/supabase';
import { useProfileStore } from './profile.store';
import { notificationService } from '../services/notification.service';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      const typedSession = session as Session | null;
      set({
        session: typedSession,
        user: typedSession?.user ?? null,
        initialized: true,
      });
      if (typedSession?.user) {
        await useProfileStore.getState().fetchProfile(typedSession.user.id);
      }
    } catch {
      await authService.signOut().catch(() => {});
      set({
        session: null,
        user: null,
        initialized: true,
      });
    }

    authService.onAuthStateChange(async (session) => {
      const typedSession = session as Session | null;
      set({
        session: typedSession,
        user: typedSession?.user ?? null,
      });
      if (typedSession?.user) {
        await useProfileStore.getState().fetchProfile(typedSession.user.id);
      } else {
        useProfileStore.getState().setProfile(null);
        void notificationService.cancelRestTimerNotification();
        void notificationService.cancelWorkoutDayReminderNotifications();
      }
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
    useProfileStore.getState().setProfile(null);
    void notificationService.cancelRestTimerNotification();
    void notificationService.cancelWorkoutDayReminderNotifications();
    set({ session: null, user: null });
  },

  deleteAccount: async () => {
    set({ loading: true });
    try {
      await accountService.deleteAccount();
      try {
        await authService.signOut();
      } catch {
        // User may already be invalidated after deletion.
      }
      useProfileStore.getState().setProfile(null);
      void notificationService.cancelRestTimerNotification();
      void notificationService.cancelWorkoutDayReminderNotifications();
      set({ session: null, user: null });
    } finally {
      set({ loading: false });
    }
  },

  updateEmail: async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const user = useAuthStore.getState().user;
    if (!user?.email) throw new Error('No user email found');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) throw new Error('Current password is incorrect');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
}));
