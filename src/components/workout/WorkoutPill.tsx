import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useWorkoutStore } from '../../stores/workout.store';
import { useWorkoutOverlay } from './WorkoutOverlayContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { formatElapsed } from '../../utils/date';

const PILL_HEIGHT = 44;
const PILL_MARGIN = 16;
const BORDER_RADIUS = 22;
const STROKE_WIDTH = 2.5;
const PILL_DISMISS_FADE_MS = 220;

function getMarkPhrase(msLeft: number): string | null {
  if (msLeft > 5000) return null;
  if (msLeft > 3500) return 'On Your Mark...';
  if (msLeft > 2000) return 'Get Set...';
  return 'Go!';
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildPillPath(x: number, y: number, w: number, h: number, r: number): string {
  const midTop = x + w / 2;
  return [
    `M ${midTop},${y}`,
    `L ${x + w - r},${y}`,
    `A ${r},${r} 0 0,1 ${x + w},${y + r}`,
    `L ${x + w},${y + h - r}`,
    `A ${r},${r} 0 0,1 ${x + w - r},${y + h}`,
    `L ${x + r},${y + h}`,
    `A ${r},${r} 0 0,1 ${x},${y + h - r}`,
    `L ${x},${y + r}`,
    `A ${r},${r} 0 0,1 ${x + r},${y}`,
    `Z`,
  ].join(' ');
}

export function WorkoutPill() {
  const { colors } = useTheme();
  const { session, restTimer, cancelWorkout, exercises, rows, tickRestTimer } = useWorkoutStore();
  const { expand } = useWorkoutOverlay();
  const { width: screenWidth } = useWindowDimensions();
  const pillWidth = screenWidth - PILL_MARGIN * 2;
  const [elapsed, setElapsed] = useState('');
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [displayRemaining, setDisplayRemaining] = useState(0);
  const endTimeRef = useRef(0);
  const pillOpacity = useRef(new Animated.Value(1)).current;
  const dismissingRef = useRef(false);
  const markOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(restTimer ? 0 : 1)).current;
  const [markPhrase, setMarkPhrase] = useState<string | null>(null);
  const lastPhraseRef = useRef<string | null>(null);
  const wasRestingRef = useRef(!!restTimer);

  useEffect(() => {
    if (!session) return;
    dismissingRef.current = false;
    pillOpacity.setValue(1);
    const tick = () => setElapsed(formatElapsed(session.started_at));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pillOpacity, session]);

  useEffect(() => {
    if (restTimer) {
      endTimeRef.current = restTimer.endsAt;
    }
  }, [restTimer?.endsAt]);

  useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => tickRestTimer(), 1000);
    return () => clearInterval(id);
  }, [restTimer !== null]);

  useEffect(() => {
    const isResting = !!restTimer;
    if (isResting) {
      setMarkPhrase(null);
      lastPhraseRef.current = null;
      markOpacity.setValue(0);
      contentOpacity.stopAnimation();
      contentOpacity.setValue(0);
      wasRestingRef.current = true;
      return;
    }

    if (wasRestingRef.current) {
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      contentOpacity.setValue(1);
    }

    wasRestingRef.current = false;
  }, [contentOpacity, markOpacity, restTimer !== null]);

  useEffect(() => {
    if (!restTimer) { setSmoothProgress(0); return; }
    const tick = () => {
      const msLeft = Math.max(0, endTimeRef.current - Date.now());
      setSmoothProgress(msLeft / (restTimer.total * 1000));
      setDisplayRemaining(Math.ceil(msLeft / 1000));
      const newPhrase = getMarkPhrase(msLeft);
      if (newPhrase !== lastPhraseRef.current) {
        const prevPhrase = lastPhraseRef.current;
        lastPhraseRef.current = newPhrase;
        if (prevPhrase === null && newPhrase !== null) {
          setMarkPhrase(newPhrase);
          Animated.timing(markOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        } else if (prevPhrase !== null && newPhrase !== null) {
          Animated.timing(markOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => {
            if (!finished) return;
            setMarkPhrase(newPhrase);
            Animated.timing(markOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
          });
        }
      }
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [restTimer !== null, restTimer?.total]);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 0 },
    pill: { height: PILL_HEIGHT, borderRadius: BORDER_RADIUS, backgroundColor: colors.surface, overflow: 'hidden' },
    content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: { color: colors.text, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    centerCopy: { alignItems: 'center', justifyContent: 'center' },
    dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
    dotBlue: { backgroundColor: '#4A90D9' },
    label: { color: colors.text, fontSize: 13, fontFamily: fonts.semiBold },
    exerciseName: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular, marginTop: 1 },
    trashIcon: { width: 18, height: 18, tintColor: '#ff4444' },
  }), [colors]);

  if (!session) return null;

  const fadeOutAndCancel = () => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    Animated.timing(pillOpacity, {
      toValue: 0,
      duration: PILL_DISMISS_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        dismissingRef.current = false;
        pillOpacity.setValue(1);
        return;
      }
      void cancelWorkout();
    });
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Discard this workout session?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: fadeOutAndCancel },
    ]);
  };

  const isResting = !!restTimer;

  let currentExerciseName = '';
  for (const entry of exercises) {
    const entryRows = rows[entry.id] ?? [];
    const hasIncomplete = entryRows.some((r) => !r.is_completed);
    if (hasIncomplete) { currentExerciseName = entry.exercise?.name ?? ''; break; }
  }

  const ox = STROKE_WIDTH / 2;
  const oy = STROKE_WIDTH / 2;
  const innerW = pillWidth - STROKE_WIDTH;
  const innerH = PILL_HEIGHT - STROKE_WIDTH;
  const rx = BORDER_RADIUS - STROKE_WIDTH / 2;

  const straightH = innerH - 2 * rx;
  const straightW = innerW - 2 * rx;
  const perimeter = 2 * straightW + 2 * straightH + 2 * Math.PI * rx;
  const pathD = buildPillPath(ox, oy, innerW, innerH, rx);
  const visibleLen = smoothProgress * perimeter;
  const gapLen = perimeter - visibleLen;

  return (
    <Animated.View style={[styles.wrapper, { opacity: pillOpacity }]}>
      <View style={[styles.pill, { width: pillWidth }]}>
        <Svg width={pillWidth} height={PILL_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={pathD} fill="none" stroke={colors.border} strokeWidth={STROKE_WIDTH} />
          {isResting && (
            <Path
              d={pathD}
              fill="none"
              stroke={colors.text}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${visibleLen} ${gapLen}`}
              strokeDashoffset={visibleLen}
            />
          )}
        </Svg>
        <View style={styles.content}>
          <TouchableOpacity onPress={expand} style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={styles.chevron}>&#x25B2;</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={expand} style={styles.center} activeOpacity={0.7}>
            {isResting ? (
              <>
                <View style={styles.dotRow}>
                  <View style={[styles.dot, styles.dotBlue]} />
                  <Text style={styles.label} numberOfLines={1}>
                    {`Rest: ${formatCountdown(displayRemaining)}`}
                  </Text>
                </View>
                {markPhrase !== null ? (
                  <Animated.Text style={[styles.exerciseName, { opacity: markOpacity }]} numberOfLines={1}>
                    {markPhrase}
                  </Animated.Text>
                ) : (
                  currentExerciseName !== '' ? (
                    <Text style={styles.exerciseName} numberOfLines={1}>{currentExerciseName}</Text>
                  ) : null
                )}
              </>
            ) : (
              <Animated.View style={[styles.centerCopy, { opacity: contentOpacity }]}>
                <View style={styles.dotRow}>
                  <View style={styles.dot} />
                  <Text style={styles.label} numberOfLines={1}>
                    {`Workout ${elapsed}`}
                  </Text>
                </View>
                {currentExerciseName !== '' ? (
                  <Text style={styles.exerciseName} numberOfLines={1}>{currentExerciseName}</Text>
                ) : null}
              </Animated.View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel} style={styles.iconBtn} activeOpacity={0.7}>
            <Image source={require('../../../assets/icons/bin.png')} style={styles.trashIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
