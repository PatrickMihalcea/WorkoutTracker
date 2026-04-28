import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

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

  async signInWithOAuth(provider: 'google' | 'facebook') {
    const redirectTo = makeRedirectUri({ scheme: 'workout-tracker' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') return;

    const url = result.url;

    // PKCE flow: URL contains ?code=
    const codeMatch = url.match(/[?&]code=([^&#]+)/);
    if (codeMatch) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
      if (exchangeError) throw exchangeError;
      return;
    }

    // Implicit flow: tokens in URL fragment
    const fragmentMatch = url.match(/#(.+)/);
    if (fragmentMatch) {
      const params = new URLSearchParams(fragmentMatch[1]);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) throw sessionError;
      }
    }
  },
};
