import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface AppStackProps {
  screenOptions?: Record<string, unknown>;
  children: React.ReactNode;
}

export function AppStack({ screenOptions, children }: AppStackProps) {
  const { colors } = useTheme();

  const baseOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fonts.bold },
    headerBackTitleVisible: false,
  }), [colors]);

  return (
    <Stack screenOptions={{ ...baseOptions, ...screenOptions }}>
      {children}
    </Stack>
  );
}
