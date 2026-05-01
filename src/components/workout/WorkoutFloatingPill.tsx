import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../../stores/workout.store';
import { useWorkoutOverlay } from './WorkoutOverlayContext';
import { WorkoutPill } from './WorkoutPill';

const TAB_BAR_HEIGHT = 60;

export function WorkoutFloatingPill() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const session = useWorkoutStore((state) => state.session);
  const { expanded, chromeHidden } = useWorkoutOverlay();

  const hasBottomTabs = /^\/(today|routines|history|profile)(\/|$)/.test(pathname);
  const pillBottomOffset = (hasBottomTabs ? TAB_BAR_HEIGHT : 0) + Math.max(insets.bottom, 8);

  const styles = useMemo(() => StyleSheet.create({
    pillContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 99,
    },
  }), []);

  if (!session || expanded || chromeHidden) return null;

  return (
    <View style={[styles.pillContainer, { bottom: pillBottomOffset }]}>
      <WorkoutPill />
    </View>
  );
}
