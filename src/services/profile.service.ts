import { UserProfile, UserProfileInsert, UserProfileUpdate } from '../models/profile';
import { supabase } from './supabase';

export const profileService = {
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(profile: UserProfileInsert): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkDisplayNameAvailable(displayName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('display_name', displayName)
      .maybeSingle();
    if (error) throw error;
    return data === null;
  },
};
