import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, fonts } from '../../constants';

interface RestTimerBarProps {
  initialSeconds: number;
  onDismiss: () => void;
  onLongPress: () => void;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RestTimerBar({ initialSeconds, onDismiss, onLongPress }: RestTimerBarProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [total, setTotal] = useState(initialSeconds);
  const [collapsed, setCollapsed] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (remaining <= 0) {
      onDismiss();
      return;
    }
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining <= 0]);

  useEffect(() => {
    if (total <= 0) return;
    Animated.timing(progressAnim, {
      toValue: remaining / total,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [remaining, total]);

  const adjustTime = (delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
    setTotal((prev) => Math.max(1, prev + delta));
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (collapsed) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setCollapsed(false)}
        onLongPress={onLongPress}
        style={styles.progressBarCollapsed}
      >
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </TouchableOpacity>
    );
  }

  const progressBar = (
    <View style={styles.progressBarExpanded}>
      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={1} onLongPress={onLongPress} style={styles.container}>
      {progressBar}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(-15)} activeOpacity={0.7}>
          <Text style={styles.adjustText}>-15</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCollapsed(true)} onLongPress={onLongPress} activeOpacity={0.7}>
          <Text style={styles.countdown}>{formatCountdown(remaining)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(15)} activeOpacity={0.7}>
          <Text style={styles.adjustText}>+15</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function useRestTimerCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, setCollapsed };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingBottom: 24,
  },
  progressBarExpanded: {
    height: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressBarCollapsed: {
    height: 30,
    backgroundColor: colors.surface,
    justifyContent: 'flex-start',
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  adjustBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  adjustText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  countdown: {
    color: colors.text,
    fontSize: 32,
    fontFamily: fonts.bold,
    minWidth: 100,
    textAlign: 'center',
  },
  skipBtn: {
    backgroundColor: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  skipText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
