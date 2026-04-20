import { supabase } from './supabase';
import { exerciseMediaService } from './exerciseMedia.service';

export const accountService = {
  async deleteAccount(): Promise<void> {
    // Best-effort cloud cleanup. We still proceed with account deletion if this fails.
    try {
      await exerciseMediaService.deleteUserMedia();
    } catch (error: unknown) {
      console.warn('deleteUserMedia failed during account deletion:', error);
    }

    // RPC removes auth.users row for the current user.
    // App data is deleted via FK cascades.
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
  },
};
