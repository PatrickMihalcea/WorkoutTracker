import React from 'react';
import { Stack } from 'expo-router';
import { stackScreenOptions } from '../../constants';

interface AppStackProps {
  screenOptions?: Record<string, unknown>;
  children: React.ReactNode;
}

export function AppStack({ screenOptions, children }: AppStackProps) {
  return (
    <Stack screenOptions={{ ...stackScreenOptions, ...screenOptions }}>
      {children}
    </Stack>
  );
}
