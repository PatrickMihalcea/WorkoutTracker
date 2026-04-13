import { supabase } from './supabase';

export const accountService = {
  async deleteAccount(): Promise<void> {
    // RPC removes auth.users row for the current user.
    // App data is deleted via FK cascades.
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
  },
};
