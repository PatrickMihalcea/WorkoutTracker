import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { AppHeader } from './AppHeader';

interface AppStackProps {
  screenOptions?: NativeStackNavigationOptions;
  children: React.ReactNode;
}

export function AppStack({ screenOptions, children }: AppStackProps) {
  const { colors } = useTheme();

  const baseOptions = useMemo<NativeStackNavigationOptions>(() => ({
    header: (props) => <AppHeader {...props} />,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fonts.bold },
  }), [colors]);

  const resolvedOptions = useMemo<NativeStackNavigationOptions>(
    () => ({ ...baseOptions, ...(screenOptions ?? {}) }),
    [baseOptions, screenOptions],
  );

  return (
    <Stack screenOptions={resolvedOptions}>
      {children}
    </Stack>
  );
}
