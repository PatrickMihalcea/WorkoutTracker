import { useTheme } from '../contexts/ThemeContext';

export function useThemeColors() {
  const { colors, setCompletion } = useTheme();
  return { setCompletion, accent: colors.accent };
}
