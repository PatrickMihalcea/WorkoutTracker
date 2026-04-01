import { useProfileStore } from '../stores/profile.store';
import { ColorPreferences } from '../models/profile';

const DEFAULTS: Required<ColorPreferences> = {
  setCompletion: '#4CAF50',
  accent: '#FFFFFF',
};

export function useThemeColors() {
  const prefs = useProfileStore((s) => s.profile?.color_preferences) ?? {};
  return {
    setCompletion: prefs.setCompletion ?? DEFAULTS.setCompletion,
    accent: prefs.accent ?? DEFAULTS.accent,
  };
}
