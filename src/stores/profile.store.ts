import { create } from 'zustand';
import { UserProfile, UserProfileUpdate } from '../models/profile';
import { profileService } from '../services/profile.service';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;

  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const profile = await profileService.getByUserId(userId);
      set({ profile });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    const updated = await profileService.update(profile.id, updates);
    set({ profile: updated });
  },

  setProfile: (profile) => set({ profile }),
}));
