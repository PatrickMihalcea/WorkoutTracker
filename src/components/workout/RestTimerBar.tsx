import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useWorkoutStore } from '../../stores/workout.store';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface RestTimerBarProps {
  onDismiss: () => void;
  onLongPress: () => void;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RestTimerBar({ onDismiss, onLongPress }: RestTimerBarProps) {
  const { colors } = useTheme();
  const { restTimer, adjustRestTimer } = useWorkoutStore();
  const [collapsed, setCollapsed] = React.useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const remaining = restTimer?.remaining ?? 0;
  const total = restTimer?.total ?? 1;

  useEffect(() => {
    if (total <= 0) return;
    Animated.timing(progressAnim, {
      toValue: remaining / total,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [remaining, total]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = useMemo(() => StyleSheet.create({
    container: { backgroundColor: colors.surface, paddingBottom: 24 },
    progressBarExpanded: { height: 4, backgroundColor: colors.border, overflow: 'hidden' },
    progressBarCollapsed: { height: 30, backgroundColor: colors.surface, justifyContent: 'flex-start' },
    progressTrack: { height: 4, backgroundColor: colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.text },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    adjustBtn: { backgroundColor: colors.surfaceLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    adjustText: { color: colors.text, fontSize: 16, fontFamily: fonts.semiBold },
    countdown: { color: colors.text, fontSize: 32, fontFamily: fonts.bold, minWidth: 100, textAlign: 'center' },
    skipBtn: { backgroundColor: colors.text, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    skipText: { color: colors.background, fontSize: 16, fontFamily: fonts.semiBold },
  }), [colors]);

  if (!restTimer) return null;

  if (collapsed) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => setCollapsed(false)} onLongPress={onLongPress} style={styles.progressBarCollapsed}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={1} onLongPress={onLongPress} style={styles.container}>
      <View style={styles.progressBarExpanded}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRestTimer(-15)} activeOpacity={0.7}>
          <Text style={styles.adjustText}>-15</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCollapsed(true)} onLongPress={onLongPress} activeOpacity={0.7}>
          <Text style={styles.countdown}>{formatCountdown(remaining)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRestTimer(15)} activeOpacity={0.7}>
          <Text style={styles.adjustText}>+15</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
