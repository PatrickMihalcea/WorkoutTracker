import { supabase } from './supabase';

export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      const message = String(error.message ?? '').toLowerCase();
      const isRefreshTokenError = message.includes('refresh token');
      if (isRefreshTokenError) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        return null;
      }
      throw error;
    }
    return data.session;
  },

  onAuthStateChange(callback: (session: unknown) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};
