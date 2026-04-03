import { colors, fonts } from './theme';

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.bold },
  headerBackTitleStyle: { fontSize: 12, fontFamily: fonts.regular },
} as const;
