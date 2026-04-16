import React, { createContext, useContext, useMemo } from 'react';
import { useProfileStore } from '../stores/profile.store';
import {
  Theme,
  ThemeColors,
  ThemeGradients,
  DEFAULT_THEME,
  THEME_MAP,
} from '../constants/themes';

export interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  gradients: ThemeGradients;
  setCompletion: string;
  /** @internal — guards against calling useTheme() outside ThemeProvider in dev */
  __isProvided: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  colors: DEFAULT_THEME.colors,
  gradients: DEFAULT_THEME.gradients,
  setCompletion: DEFAULT_THEME.setCompletion,
  __isProvided: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useProfileStore(
    (s) => s.profile?.color_preferences?.themeId,
  );

  const theme = useMemo(
    () => THEME_MAP[themeId ?? ''] ?? DEFAULT_THEME,
    [themeId],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme.colors,
      gradients: theme.gradients,
      setCompletion: theme.setCompletion,
      __isProvided: true,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (__DEV__ && !ctx.__isProvided) {
    console.warn('[useTheme] called outside <ThemeProvider>');
  }
  return ctx;
}
