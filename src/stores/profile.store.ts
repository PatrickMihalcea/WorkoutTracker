import { create } from 'zustand';
import { UserProfile, UserProfileUpdate } from '../models/profile';
import { profileService } from '../services/profile.service';
import { notificationService } from '../services/notification.service';

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

    const notificationPreferenceChanged = [
      'notify_rest_timer_enabled',
      'notify_workout_day_enabled',
      'notify_workout_day_time',
      'notify_workout_rest_days_enabled',
    ].some((key) => Object.prototype.hasOwnProperty.call(updates, key));

    if (notificationPreferenceChanged) {
      if (updates.notify_rest_timer_enabled === false) {
        void notificationService.cancelRestTimerNotification();
      }
      void notificationService.syncWorkoutDayReminder(updated);
    }
  },

  setProfile: (profile) => set({ profile }),
}));
