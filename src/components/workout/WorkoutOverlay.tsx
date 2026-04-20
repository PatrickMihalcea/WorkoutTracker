import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  AppState,
  useWindowDimensions,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../stores/auth.store';
import { useWorkoutStore } from '../../stores/workout.store';
import { useProfileStore } from '../../stores/profile.store';
import { useWorkoutOverlay } from './WorkoutOverlayContext';
import { ExerciseCard } from './ExerciseCard';
import { SetRow } from './SetRow';
import { RestTimerBar } from './RestTimerBar';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutPill } from './WorkoutPill';
import { Button, BottomSheetModal, ExercisePickerModal, SupersetBracket } from '../ui';
import { MuscleHeatmap } from '../history/MuscleHeatmap';
import { AddExerciseModal, SetsPayloadItem } from '../routine/AddExerciseModal';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { formatElapsed } from '../../utils/date';
import { Exercise, RoutineDayExercise, WorkoutRow } from '../../models';
import {
  supersetPrev,
  supersetNext,
  separateFromSuperset,
  autoCleanAfterDelete,
  getSupersetPosition,
  buildReorderItems,
  flattenReorderItems,
  type ReorderItem,
  type SupersetGroups,
} from '../../utils/superset';

const TAB_BAR_HEIGHT = 60;
const SLIDE_IN_MS = 500;
const SLIDE_OUT_MS = 300;
const SESSION_ID_PATH_REGEX = /^\/profile\/[0-9a-fA-F-]{36}$/;
type TooltipWarningVariant = 'empty-finish' | 'first-entry-walkthrough';
type WorkoutTooltipKey = 'setToggleDemo' | 'setSwipeActions' | 'supersetMenu' | 'reorderLongPress';

const WORKOUT_WALKTHROUGH_ORDER: readonly WorkoutTooltipKey[] = [
  'setToggleDemo',
  'setSwipeActions',
  'supersetMenu',
  'reorderLongPress',
];

const WORKOUT_TOOLTIP_COPY: Record<WorkoutTooltipKey, { title: string; message: string; demoTitle: string; demoHint: string }> = {
  setToggleDemo: {
    title: 'Mark Sets Done',
    message: 'Tap the set toggle to mark each set done so your workout is recorded accurately.',
    demoTitle: 'Set 1',
    demoHint: 'Tap + to mark it done',
  },
  setSwipeActions: {
    title: 'Swipe Set Actions',
    message: 'Swipe set rows left or right to mark Warmup or Delete quickly. Swipe an exercise right to delete the whole block.',
    demoTitle: 'Set 2',
    demoHint: 'Swipe right for W, swipe left for X',
  },
  supersetMenu: {
    title: 'Build Supersets and Duplicate',
    message: 'Open the exercise menu (⋮) to pair exercises with Superset Prev/Next or Duplicate.',
    demoTitle: 'Exercise Menu',
    demoHint: 'Use Superset Prev/Next or Duplicate',
  },
  reorderLongPress: {
    title: 'Reorder Exercises',
    message: 'Long press an exercise card header to enter reordering mode.',
    demoTitle: 'Exercise Order',
    demoHint: 'Long press and drag to reorder',
  },
};

export function WorkoutOverlay() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const distanceUnit = profile?.distance_unit ?? 'km';
  const restTimerDefault = profile?.rest_timer_seconds ?? 90;
  const {
    session,
    exercises,
    rows,
    previousSets,
    collapsedCards,
    supersetGroups,
    restTimer,
    loadPreviousSets,
    updateRowLocal,
    updateRow,
    toggleRow,
    deleteRow,
    addRow,
    addWarmupRow,
    toggleWarmup,
    removeExercise,
    addExercise,
    reorderExercises,
    toggleCollapse,
    setSupersetGroup,
    duplicateExercise,
    swapExercise,
    completeWorkout,
    cancelWorkout,
    enforceWorkoutDurationLimit,
    startRestTimer,
    tickRestTimer,
    dismissRestTimer,
  } = useWorkoutStore();

  const { expanded, minimize } = useWorkoutOverlay();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [showFullScreen, setShowFullScreen] = useState(false);

  const [elapsed, setElapsed] = useState('0m 00s');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDirectAddPicker, setShowDirectAddPicker] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [autoOpenPicker, setAutoOpenPicker] = useState(false);
  const [tooltipWarningVariant, setTooltipWarningVariant] = useState<TooltipWarningVariant | null>(null);
  const [walkthroughStepIndex, setWalkthroughStepIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const pendingPickerReopenRef = useRef<'swap' | 'add' | null>(null);
  const warningDemoToggle = useRef(new Animated.Value(0)).current;
  const warningDemoToggleScale = useRef(new Animated.Value(1)).current;
  const warningDemoTapOpacity = useRef(new Animated.Value(0)).current;
  const warningDemoTapScale = useRef(new Animated.Value(0.8)).current;
  const warningDemoRippleScale = useRef(new Animated.Value(0.45)).current;
  const warningDemoRippleOpacity = useRef(new Animated.Value(0)).current;
  const warningSwipeOffset = useRef(new Animated.Value(0)).current;
  const warningSupersetMenuScale = useRef(new Animated.Value(1)).current;
  const warningSupersetPopupOpacity = useRef(new Animated.Value(0)).current;
  const warningReorderOffset = useRef(new Animated.Value(0)).current;
  const warningReorderScale = useRef(new Animated.Value(1)).current;
  const warningReorderDotOpacity = useRef(new Animated.Value(0)).current;
  const warningReorderDotScale = useRef(new Animated.Value(0.8)).current;
  const warningDemoLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const firstTooltipShownSessionIdRef = useRef<string | null>(null);

  useFocusEffect(useCallback(() => {
    const which = pendingPickerReopenRef.current;
    if (which) {
      pendingPickerReopenRef.current = null;
      if (which === 'swap') {
        setShowSwapPicker(true);
      } else if (which === 'add') {
        setShowDirectAddPicker(true);
      }
    }
  }, []));

  const openExerciseDetail = useCallback((exerciseId: string) => {
    const href = `/exercise/${exerciseId}` as const;
    if (pathname.startsWith('/exercise/')) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, [pathname, router]);

  const openWorkoutDetail = useCallback((sessionId: string, justCompleted?: boolean) => {
    const suffix = justCompleted ? '?justCompleted=1' : '';
    const href = `/(tabs)/profile/${sessionId}${suffix}` as const;
    if (SESSION_ID_PATH_REGEX.test(pathname)) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, [pathname, router]);

  const navigateToExerciseDetail = useCallback((exerciseId: string, source: 'swap' | 'add') => {
    pendingPickerReopenRef.current = source;
    setShowSwapPicker(false);
    setShowAddExercise(false);
    setShowDirectAddPicker(false);
    setTimeout(() => openExerciseDetail(exerciseId), 0);
  }, [openExerciseDetail]);

  useEffect(() => {
    if (expanded && session) {
      setShowFullScreen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_IN_MS,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: SLIDE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowFullScreen(false);
      });
    }
  }, [expanded, !!session]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      setElapsed(formatElapsed(session.started_at));
      void enforceWorkoutDurationLimit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [enforceWorkoutDurationLimit, session?.id, session?.started_at]);

  useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => tickRestTimer(), 1000);
    return () => clearInterval(id);
  }, [restTimer !== null]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        tickRestTimer();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!session) return;
    const exerciseIds = exercises.map((e) => e.exercise_id);
    if (user && exerciseIds.length > 0) {
      loadPreviousSets(exerciseIds, user.id);
    }
  }, [session?.id]);

  const { completedSets, totalSets } = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const entryRows of Object.values(rows)) {
      for (const r of entryRows) {
        total++;
        if (r.is_completed) completed++;
      }
    }
    return { completedSets: completed, totalSets: total };
  }, [rows]);

  const showTooltipWarning = tooltipWarningVariant !== null;
  const hasSeenOverlayWalkthrough = !!profile?.tooltips_seen?.workout?.overlayWalkthroughCompleted;
  const walkthroughTooltipKeys = WORKOUT_WALKTHROUGH_ORDER;
  const walkthroughStepTotal = walkthroughTooltipKeys.length;
  const isWalkthroughTooltipOpen = tooltipWarningVariant === 'first-entry-walkthrough';
  const currentWalkthroughKey = isWalkthroughTooltipOpen
    ? walkthroughTooltipKeys[Math.min(walkthroughStepIndex, walkthroughStepTotal - 1)]
    : null;
  const activeDemoKey: WorkoutTooltipKey | null =
    tooltipWarningVariant === 'empty-finish'
      ? 'setToggleDemo'
      : currentWalkthroughKey;

  useEffect(() => {
    const resetDemoValues = () => {
      warningDemoLoopRef.current?.stop();
      warningDemoLoopRef.current = null;
      warningDemoToggle.setValue(0);
      warningDemoToggleScale.setValue(1);
      warningDemoTapOpacity.setValue(0);
      warningDemoTapScale.setValue(0.8);
      warningDemoRippleScale.setValue(0.45);
      warningDemoRippleOpacity.setValue(0);
      warningSwipeOffset.setValue(0);
      warningSupersetMenuScale.setValue(1);
      warningSupersetPopupOpacity.setValue(0);
      warningReorderOffset.setValue(0);
      warningReorderScale.setValue(1);
      warningReorderDotOpacity.setValue(0);
      warningReorderDotScale.setValue(0.8);
    };

    if (!showTooltipWarning || !activeDemoKey) {
      resetDemoValues();
      return;
    }

    resetDemoValues();
    let cycle: Animated.CompositeAnimation;

    if (activeDemoKey === 'setToggleDemo') {
      cycle = Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(warningDemoTapOpacity, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(warningDemoTapScale, { toValue: 1, duration: 120, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(warningDemoToggleScale, { toValue: 0.9, duration: 90, useNativeDriver: false }),
            Animated.spring(warningDemoToggleScale, { toValue: 1, friction: 5, tension: 170, useNativeDriver: false }),
          ]),
          Animated.timing(warningDemoToggle, { toValue: 1, duration: 190, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(warningDemoRippleOpacity, { toValue: 0.45, duration: 45, useNativeDriver: false }),
            Animated.parallel([
              Animated.timing(warningDemoRippleScale, { toValue: 1.35, duration: 260, useNativeDriver: false }),
              Animated.timing(warningDemoRippleOpacity, { toValue: 0, duration: 260, useNativeDriver: false }),
            ]),
          ]),
          Animated.sequence([
            Animated.timing(warningDemoTapScale, { toValue: 0.82, duration: 90, useNativeDriver: false }),
            Animated.timing(warningDemoTapScale, { toValue: 1, duration: 100, useNativeDriver: false }),
          ]),
        ]),
        Animated.delay(740),
        Animated.parallel([
          Animated.timing(warningDemoToggle, { toValue: 0, duration: 180, useNativeDriver: false }),
          Animated.timing(warningDemoTapOpacity, { toValue: 0, duration: 140, useNativeDriver: false }),
          Animated.timing(warningDemoTapScale, { toValue: 0.8, duration: 140, useNativeDriver: false }),
        ]),
        Animated.delay(240),
      ]);
    } else if (activeDemoKey === 'setSwipeActions') {
      cycle = Animated.sequence([
        Animated.delay(250),
        Animated.timing(warningSwipeOffset, {
          toValue: -30,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(220),
        Animated.timing(warningSwipeOffset, {
          toValue: 30,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(220),
        Animated.timing(warningSwipeOffset, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(280),
      ]);
    } else if (activeDemoKey === 'supersetMenu') {
      cycle = Animated.sequence([
        Animated.delay(240),
        Animated.sequence([
          Animated.timing(warningSupersetMenuScale, { toValue: 0.85, duration: 100, useNativeDriver: false }),
          Animated.spring(warningSupersetMenuScale, { toValue: 1, friction: 5, tension: 170, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(warningSupersetPopupOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(warningSupersetPopupOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
        Animated.delay(240),
      ]);
    } else {
      cycle = Animated.sequence([
        Animated.delay(240),
        Animated.parallel([
          Animated.timing(warningReorderDotOpacity, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(warningReorderDotScale, { toValue: 1, duration: 120, useNativeDriver: false }),
        ]),
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(warningReorderScale, { toValue: 1.04, duration: 180, useNativeDriver: false }),
          Animated.timing(warningReorderOffset, { toValue: -10, duration: 180, useNativeDriver: false }),
        ]),
        Animated.delay(360),
        Animated.parallel([
          Animated.timing(warningReorderScale, { toValue: 1, duration: 220, useNativeDriver: false }),
          Animated.timing(warningReorderOffset, { toValue: 0, duration: 220, useNativeDriver: false }),
          Animated.timing(warningReorderDotOpacity, { toValue: 0, duration: 220, useNativeDriver: false }),
          Animated.timing(warningReorderDotScale, { toValue: 0.8, duration: 220, useNativeDriver: false }),
        ]),
        Animated.delay(240),
      ]);
    }

    warningDemoLoopRef.current = Animated.loop(cycle);
    warningDemoLoopRef.current.start();

    return resetDemoValues;
  }, [
    activeDemoKey,
    showTooltipWarning,
    warningDemoRippleOpacity,
    warningDemoRippleScale,
    warningDemoTapOpacity,
    warningDemoTapScale,
    warningDemoToggle,
    warningDemoToggleScale,
    warningReorderDotOpacity,
    warningReorderDotScale,
    warningReorderOffset,
    warningReorderScale,
    warningSupersetMenuScale,
    warningSupersetPopupOpacity,
    warningSwipeOffset,
  ]);

  useEffect(() => {
    if (!expanded || !session?.id) return;
    if (totalSets === 0) return;
    if (hasSeenOverlayWalkthrough) return;
    if (tooltipWarningVariant !== null) return;
    if (firstTooltipShownSessionIdRef.current === session.id) return;
    firstTooltipShownSessionIdRef.current = session.id;
    setWalkthroughStepIndex(0);
    setTooltipWarningVariant('first-entry-walkthrough');
  }, [expanded, hasSeenOverlayWalkthrough, session?.id, tooltipWarningVariant, totalSets]);

  const markWalkthroughSeen = useCallback(async () => {
    if (!profile || hasSeenOverlayWalkthrough) return;
    const currentWorkout = profile.tooltips_seen?.workout ?? {};
    const nextWorkout = { ...currentWorkout };
    const changed = !nextWorkout.overlayWalkthroughCompleted;
    nextWorkout.overlayWalkthroughCompleted = true;
    if (!changed) return;
    try {
      await updateProfile({
        tooltips_seen: {
          ...(profile.tooltips_seen ?? {}),
          workout: nextWorkout,
        },
      });
    } catch {
      // Best-effort preference update only.
    }
  }, [hasSeenOverlayWalkthrough, profile, updateProfile]);

  const { muscleHeatmapData, muscleHeatmapMax } = useMemo(() => {
    const totals = new Map<string, { completed: number; total: number }>();
    const addContribution = (label: string, completed: number, total: number, weight: number = 1) => {
      if (!label) return;
      const key = label.replace(/ /g, '_');
      const entry = totals.get(key) ?? { completed: 0, total: 0 };
      entry.total += total * weight;
      entry.completed += completed * weight;
      totals.set(key, entry);
    };

    for (const ex of exercises) {
      const group = ex.exercise?.muscle_group;
      if (!group) continue;
      const exRows = rows[ex.id] ?? [];
      const done = exRows.filter((r) => r.is_completed).length;

      addContribution(group, done, exRows.length, 1);

      const secondary = ex.exercise?.secondary_muscles ?? [];
      for (const sec of secondary) {
        if (!sec || sec === group) continue;
        addContribution(sec, done, exRows.length, 0.5);
      }
    }
    const endStateMax = Math.max(...[...totals.values()].map((v) => v.total), 1);
    const data = [...totals.entries()].map(([label, { completed }]) => ({
      label,
      value: completed,
    }));
    return { muscleHeatmapData: data, muscleHeatmapMax: endStateMax };
  }, [exercises, rows]);

  const finalizeWorkout = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      const completedSessionId = await completeWorkout(weightUnit);
      if (completedSessionId) {
        openWorkoutDetail(completedSessionId, true);
      }
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Failed to complete workout.');
    } finally {
      setIsCompleting(false);
    }
  }, [completeWorkout, isCompleting, openWorkoutDetail, weightUnit]);

  const handleComplete = useCallback(() => {
    if (isCompleting) return;
    if (isWalkthroughTooltipOpen) return;
    if (completedSets === 0) {
      setTooltipWarningVariant('empty-finish');
      return;
    }

    Alert.alert('Complete Workout', 'Finish and save this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => { void finalizeWorkout(); },
      },
    ]);
  }, [completedSets, finalizeWorkout, isCompleting, isWalkthroughTooltipOpen]);

  const handleSkipAndFinish = useCallback(() => {
    setTooltipWarningVariant(null);
    void finalizeWorkout();
  }, [finalizeWorkout]);

  const handleWalkthroughPrimaryAction = useCallback(() => {
    if (!isWalkthroughTooltipOpen) return;
    const isLastPage = walkthroughStepIndex >= walkthroughStepTotal - 1;
    if (!isLastPage) {
      setWalkthroughStepIndex((prev) => prev + 1);
      return;
    }
    setTooltipWarningVariant(null);
    void markWalkthroughSeen();
  }, [isWalkthroughTooltipOpen, markWalkthroughSeen, walkthroughStepIndex, walkthroughStepTotal]);

  const handleCloseWalkthrough = useCallback(() => {
    if (!isWalkthroughTooltipOpen) return;
    setTooltipWarningVariant(null);
    void markWalkthroughSeen();
  }, [isWalkthroughTooltipOpen, markWalkthroughSeen]);

  const handleStartRestTimer = useCallback(() => {
    const latestDefault = useProfileStore.getState().profile?.rest_timer_seconds ?? 90;
    if (latestDefault > 0) {
      startRestTimer(latestDefault);
    }
  }, [startRestTimer]);

  const handleUpdateLocal = (id: string, entryId: string, updates: Record<string, string>) => {
    updateRowLocal(id, entryId, updates);
  };

  const handleUpdate = async (id: string, entryId: string, updates: Record<string, string>) => {
    try { await updateRow(id, entryId, updates); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleToggle = async (id: string, entryId: string) => {
    try {
      const row = (rows[entryId] ?? []).find((r) => r.id === id);
      if (row && !row.is_completed) handleStartRestTimer();
      await toggleRow(id, entryId);
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleDelete = async (id: string, entryId: string, setNumber: number) => {
    try { await deleteRow(id, entryId, setNumber); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleAdd = async (entryId: string, exerciseId: string) => {
    try { await addRow(entryId, exerciseId); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleAddWarmup = async (entryId: string, exerciseId: string) => {
    try { await addWarmupRow(entryId, exerciseId); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleToggleWarmup = async (id: string, entryId: string) => {
    try { await toggleWarmup(id, entryId); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleRemoveExercise = async (entryId: string) => {
    try {
      await removeExercise(entryId);
      const currentExercises = useWorkoutStore.getState().exercises;
      const currentGroups = useWorkoutStore.getState().supersetGroups;
      const cleaned = autoCleanAfterDelete(currentExercises, currentGroups);
      for (const ex of currentExercises) {
        if (cleaned[ex.id] !== currentGroups[ex.id]) {
          await setSupersetGroup(ex.id, cleaned[ex.id]);
        }
      }
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleAddExerciseConfirm = async (exercise: Exercise, setsPayload: SetsPayloadItem[]) => {
    try {
      await addExercise(exercise, setsPayload);
      if (user) {
        const sets = await import('../../services').then(
          (m) => m.sessionService.getLastSessionSets(exercise.id, user.id),
        );
        if (sets.length > 0) {
          useWorkoutStore.setState((state) => ({
            previousSets: { ...state.previousSets, [exercise.id]: sets },
          }));
        }
      }
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Discard this workout session?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          minimize();
          setTimeout(() => cancelWorkout(), SLIDE_OUT_MS);
        },
      },
    ]);
  };

  const handleTimerSettingsSave = async (seconds: number) => {
    await updateProfile({ rest_timer_seconds: seconds });
  };

  const applySupersetChange = async (updated: SupersetGroups) => {
    for (const ex of exercises) {
      const newGroup = updated[ex.id] ?? null;
      const oldGroup = supersetGroups[ex.id] ?? null;
      if (newGroup !== oldGroup) {
        await setSupersetGroup(ex.id, newGroup);
      }
    }
  };

  const handleSupersetPrev = async (entryId: string) => {
    const idx = exercises.findIndex((e) => e.id === entryId);
    if (idx <= 0) return;
    const updated = supersetPrev(exercises, idx, supersetGroups);
    await applySupersetChange(updated);
  };

  const handleSupersetNext = async (entryId: string) => {
    const idx = exercises.findIndex((e) => e.id === entryId);
    if (idx < 0 || idx >= exercises.length - 1) return;
    const updated = supersetNext(exercises, idx, supersetGroups);
    await applySupersetChange(updated);
  };

  const handleSeparate = async (entryId: string) => {
    const idx = exercises.findIndex((e) => e.id === entryId);
    if (idx < 0) return;
    const result = separateFromSuperset(exercises, idx, supersetGroups);
    await applySupersetChange(result.groups);
    if (result.exercises !== exercises) {
      await reorderExercises(result.exercises);
    }
  };

  const handleSwap = (entryId: string) => {
    setSwapEntryId(entryId);
    setShowSwapPicker(true);
  };

  const handleSwapSelect = async (exercise: Exercise) => {
    if (!swapEntryId) return;
    try {
      await swapExercise(swapEntryId, exercise);
      if (user) {
        const sets = await import('../../services').then(
          (m) => m.sessionService.getLastSessionSets(exercise.id, user.id),
        );
        if (sets.length > 0) {
          useWorkoutStore.setState((state) => ({
            previousSets: { ...state.previousSets, [exercise.id]: sets },
          }));
        }
      }
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
    setShowSwapPicker(false);
    setSwapEntryId(null);
  };

  const handleSwapDeletedWithoutReplacement = (exercise: Exercise) => {
    if (!swapEntryId) return;
    const entryId = swapEntryId;
    const targetEntry = exercises.find((item) => item.id === entryId);
    if (!targetEntry || targetEntry.exercise_id !== exercise.id) return;
    void handleRemoveExercise(entryId);
    setShowSwapPicker(false);
    setSwapEntryId(null);
  };

  const handleDuplicate = async (entryId: string) => {
    try { await duplicateExercise(entryId); }
    catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const reorderItems = useMemo(() =>
    buildReorderItems(exercises, supersetGroups),
    [exercises, supersetGroups],
  );

  const handleReorderDragEnd = useCallback(({ data }: { data: ReorderItem[] }) => {
    const flat = flattenReorderItems(data);
    reorderExercises(flat);
  }, [reorderExercises]);

  const reorderKeyExtractor = useCallback((item: ReorderItem) =>
    item.type === 'single' ? item.entry.id : item.groupId,
    [],
  );

  const renderReorderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ReorderItem>) => (
    <ScaleDecorator>
      <Pressable onLongPress={drag} disabled={isActive} delayLongPress={400}>
        {item.type === 'single' ? (
          <ExerciseCard
            entry={item.entry}
            rows={rows[item.entry.id] ?? []}
            previousSets={previousSets[item.entry.exercise_id] ?? []}
            weightUnit={weightUnit}
            distanceUnit={distanceUnit}
            reorderCollapsed
            onUpdateRow={() => {}}
            onToggleRow={() => {}}
            onDeleteRow={() => {}}
            onAddRow={() => {}}
            onAddWarmup={() => {}}
            onToggleWarmup={() => {}}
            onRemove={() => handleRemoveExercise(item.entry.id)}
          />
        ) : (
          <View style={{ marginBottom: 6 }}>
            {item.entries.map((entry, idx) => {
              const pos = idx === 0 ? 'first' as const : idx === item.entries.length - 1 ? 'last' as const : 'middle' as const;
              return (
                <SupersetBracket key={entry.id} position={pos} contentRadius={16}>
                  <ExerciseCard
                    entry={entry}
                    rows={rows[entry.id] ?? []}
                    previousSets={previousSets[entry.exercise_id] ?? []}
                    weightUnit={weightUnit}
                    distanceUnit={distanceUnit}
                    reorderCollapsed
                    noBottomMargin
                    onUpdateRow={() => {}}
                    onToggleRow={() => {}}
                    onDeleteRow={() => {}}
                    onAddRow={() => {}}
                    onAddWarmup={() => {}}
                    onToggleWarmup={() => {}}
                  />
                </SupersetBracket>
              );
            })}
          </View>
        )}
      </Pressable>
    </ScaleDecorator>
  ), [rows, previousSets, weightUnit, distanceUnit]);


  const styles = useMemo(() => StyleSheet.create({
    fullScreen: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      zIndex: 100,
    },
    pillContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 99,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      paddingVertical: 6,
      paddingRight: 12,
    },
    chevronDown: {
      color: colors.text,
      fontSize: 17,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    finishBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    finishBtnDisabled: {
      opacity: 0.55,
    },
    finishText: {
      color: colors.background,
      fontSize: 15,
      fontFamily: fonts.bold,
    },
    infoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    elapsedTimer: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    timerIconBtn: {
      paddingHorizontal: 8,
    },
    timerIcon: {
      width: 18,
      height: 18,
      tintColor: colors.text,
    },
    setsCounter: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    muscleIconBtn: {
      paddingHorizontal: 8,
    },
    muscleIcon: {
      width: 18,
      height: 18,
      tintColor: colors.text,
    },
    scrollContent: {
      paddingHorizontal: 8,
      paddingVertical: 16,
      paddingBottom: 32,
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 16,
    },
    cancelText: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: '#FF6B6B',
    },
    reorderFooter: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    finishWarningBody: {
      gap: 16,
      paddingBottom: 8,
    },
    finishWarningText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    finishWarningPager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -2,
    },
    finishWarningPageTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.bold,
    },
    finishWarningPageCount: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: fonts.semiBold,
    },
    finishWarningDemoCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceLight,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    finishWarningDemoCardStacked: {
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      gap: 12,
    },
    finishWarningDemoLeft: {
      gap: 5,
    },
    finishWarningDemoLeftStacked: {
      width: '100%',
    },
    finishWarningDemoSetTitle: {
      color: colors.text,
      fontSize: 15,
      fontFamily: fonts.semiBold,
    },
    finishWarningDemoSetSub: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: fonts.regular,
    },
    finishWarningDemoToggleWrap: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishWarningDemoToggle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.2)',
      overflow: 'hidden',
    },
    finishWarningDemoPlus: {
      position: 'absolute',
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.background,
      lineHeight: 16,
    },
    finishWarningDemoCheck: {
      position: 'absolute',
      fontSize: 15,
      fontFamily: fonts.bold,
      color: '#000000',
      lineHeight: 15,
    },
    finishWarningDemoTapDot: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.12)',
      top: -2,
      right: -2,
      zIndex: 3,
    },
    finishWarningDemoRipple: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: colors.accent,
      zIndex: 1,
    },
    finishWarningSwipeDemoFrame: {
      width: '100%',
      height: 60,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    finishWarningSwipeRevealRow: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
    },
    finishWarningSwipeAction: {
      width: 70,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishWarningSwipeActionWarmup: {
      backgroundColor: '#FFD93D',
    },
    finishWarningSwipeActionDelete: {
      backgroundColor: '#cc3333',
    },
    finishWarningSwipeActionText: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: '#000000',
    },
    finishWarningSwipeActionTextDelete: {
      color: '#FFFFFF',
    },
    finishWarningSwipeSetRowWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    finishWarningSupersetDemo: {
      width: '100%',
      overflow: 'visible',
    },
    finishWarningReorderPill: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 10,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    finishWarningReorderPillText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontFamily: fonts.semiBold,
    },
    finishWarningReorderHandle: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: fonts.bold,
    },
    finishWarningReorderDot: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.12)',
      top: -5,
      right: 12,
      zIndex: 3,
    },
    finishWarningActions: {
      flexDirection: 'row',
      gap: 10,
    },
    finishWarningEndBtn: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: 'transparent',
    },
    finishWarningEndBtnDisabled: {
      opacity: 0.55,
    },
    finishWarningEndText: {
      color: '#FF6B6B',
      fontSize: 16,
      fontFamily: fonts.semiBold,
      textAlign: 'center',
    },
  }), [colors]);

  const warningToggleBackground = warningDemoToggle.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text, colors.accent],
  });
  const warningPlusOpacity = warningDemoToggle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 0],
  });
  const warningCheckOpacity = warningDemoToggle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.35, 1],
  });
  const swipeDemoRow = useMemo<WorkoutRow>(() => ({
    id: 'walkthrough-swipe-row',
    session_id: 'walkthrough',
    exercise_id: 'walkthrough',
    routine_day_exercise_id: 'walkthrough',
    set_number: 1,
    weight: '',
    reps: '8',
    rir: '2',
    duration: '',
    distance: '',
    is_completed: false,
    is_warmup: false,
    target_weight: 0,
    target_reps_min: 8,
    target_reps_max: 12,
    target_duration: 0,
    target_distance: 0,
    exercise_order: 0,
    superset_group: null,
  }), []);
  const supersetDemoEntry = useMemo<RoutineDayExercise>(() => ({
    id: 'walkthrough-superset-entry',
    routine_day_id: 'walkthrough',
    exercise_id: 'walkthrough-superset-exercise',
    sort_order: 0,
    target_sets: 2,
    target_reps: 10,
    superset_group: null,
    exercise: {
      id: 'walkthrough-superset-exercise',
      user_id: null,
      name: 'Incline Dumbbell Press',
      muscle_group: 'chest',
      equipment: 'dumbbell',
      exercise_type: 'weight_reps',
      secondary_muscles: [],
      media_type: 'none',
      media_url: null,
      thumbnail_url: null,
      created_at: '2024-01-01T00:00:00.000Z',
    } as Exercise,
    sets: [],
  }), []);
  const supersetDemoRows = useMemo<WorkoutRow[]>(() => ([{
    id: 'walkthrough-superset-row-1',
    session_id: 'walkthrough',
    exercise_id: 'walkthrough-superset-exercise',
    routine_day_exercise_id: 'walkthrough-superset-entry',
    set_number: 1,
    weight: '60',
    reps: '10',
    rir: '2',
    duration: '',
    distance: '',
    is_completed: false,
    is_warmup: false,
    target_weight: 60,
    target_reps_min: 8,
    target_reps_max: 10,
    target_duration: 0,
    target_distance: 0,
    exercise_order: 0,
    superset_group: null,
  }]), []);
  const walkthroughStepNumber = Math.min(walkthroughStepIndex + 1, Math.max(walkthroughStepTotal, 1));
  const walkthroughCopy = currentWalkthroughKey ? WORKOUT_TOOLTIP_COPY[currentWalkthroughKey] : null;
  const walkthroughPrimaryLabel = walkthroughStepNumber >= walkthroughStepTotal ? 'Got It' : 'Next';
  const useStackedDemoLayout = tooltipWarningVariant === 'first-entry-walkthrough' && currentWalkthroughKey !== 'setToggleDemo';

  const normalFooter = useCallback(() => (
    <View>
      <Button
        title="+ Add Exercise"
        variant="dashed"
        onPress={() => setShowDirectAddPicker(true)}
        style={{ marginBottom: 12 }}
      />
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelText}>Cancel Workout</Text>
      </TouchableOpacity>
    </View>
  ), [handleCancel]);

  if (!session) return null;

  return (
    <>
      {!expanded && (
        <View style={[styles.pillContainer, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) }]}>
          <WorkoutPill />
        </View>
      )}

      {showFullScreen && (
        <Animated.View style={[styles.fullScreen, { paddingTop: insets.top, transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={minimize} activeOpacity={0.7} style={styles.backBtn}>
                <Text style={styles.chevronDown}>&#x25BC;</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Workout</Text>
              <TouchableOpacity
                style={[styles.finishBtn, isCompleting && styles.finishBtnDisabled]}
                onPress={handleComplete}
                activeOpacity={0.7}
                disabled={isCompleting}
              >
                <Text style={styles.finishText}>{isCompleting ? 'Finishing...' : 'Finish'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoBar}>
              <Text style={styles.elapsedTimer}>{elapsed}</Text>
              <TouchableOpacity onPress={() => setShowTimerSettings(true)} activeOpacity={0.7} style={styles.timerIconBtn}>
                <Image
                  source={require('../../../assets/icons/stopwatch.png')}
                  style={styles.timerIcon}
                />
              </TouchableOpacity>
              <Text style={styles.setsCounter}>Sets: {completedSets}/{totalSets}</Text>
              <TouchableOpacity onPress={() => setShowHeatmap(true)} activeOpacity={0.7} style={styles.muscleIconBtn}>
                <Image
                  source={require('../../../assets/icons/muscle.png')}
                  style={styles.muscleIcon}
                />
              </TouchableOpacity>
            </View>

            <BottomSheetModal
              visible={showHeatmap}
              onClose={() => setShowHeatmap(false)}
              showCloseButton={false}
            >
              <MuscleHeatmap
                data={muscleHeatmapData}
                title="Muscle Progress"
                subtitle="Based on completed sets"
                bare
                maxValue={muscleHeatmapMax}
              />
            </BottomSheetModal>

            <BottomSheetModal
              visible={showTooltipWarning}
              onClose={
                tooltipWarningVariant === 'first-entry-walkthrough'
                  ? handleCloseWalkthrough
                  : tooltipWarningVariant === 'empty-finish'
                  ? () => setTooltipWarningVariant(null)
                  : undefined
              }
              showCloseButton={tooltipWarningVariant !== null}
              title={tooltipWarningVariant === 'first-entry-walkthrough' ? 'Workout Tips' : 'No Sets Marked Done'}
            >
              <View style={styles.finishWarningBody}>
                {tooltipWarningVariant === 'first-entry-walkthrough' && walkthroughCopy && (
                  <View style={styles.finishWarningPager}>
                    <Text style={styles.finishWarningPageTitle}>{walkthroughCopy.title}</Text>
                    <Text style={styles.finishWarningPageCount}>{walkthroughStepNumber}/{walkthroughStepTotal}</Text>
                  </View>
                )}
                <Text style={styles.finishWarningText}>
                  {tooltipWarningVariant === 'first-entry-walkthrough'
                    ? (walkthroughCopy?.message ?? '')
                    : 'Unchecked sets won\'t be recorded. Tap the set toggle to log progress, or skip logging and finish anyway.'}
                </Text>

                <View
                  style={[styles.finishWarningDemoCard, useStackedDemoLayout && styles.finishWarningDemoCardStacked]}
                  pointerEvents="none"
                >
                  <View style={[styles.finishWarningDemoLeft, useStackedDemoLayout && styles.finishWarningDemoLeftStacked]}>
                    <Text style={styles.finishWarningDemoSetTitle}>
                      {tooltipWarningVariant === 'first-entry-walkthrough' ? (walkthroughCopy?.demoTitle ?? 'Set 1') : 'Set 1'}
                    </Text>
                    <Text style={styles.finishWarningDemoSetSub}>
                      {tooltipWarningVariant === 'first-entry-walkthrough' ? (walkthroughCopy?.demoHint ?? 'Tap + to mark it done') : 'Tap + to mark it done'}
                    </Text>
                  </View>
                  {(tooltipWarningVariant !== 'first-entry-walkthrough' || currentWalkthroughKey === 'setToggleDemo') && (
                    <View style={styles.finishWarningDemoToggleWrap}>
                      <Animated.View
                        style={[
                          styles.finishWarningDemoRipple,
                          {
                            opacity: warningDemoRippleOpacity,
                            transform: [{ scale: warningDemoRippleScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.finishWarningDemoTapDot,
                          {
                            opacity: warningDemoTapOpacity,
                            transform: [{ scale: warningDemoTapScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.finishWarningDemoToggle,
                          {
                            backgroundColor: warningToggleBackground,
                            transform: [{ scale: warningDemoToggleScale }],
                          },
                        ]}
                      >
                        <Animated.Text style={[styles.finishWarningDemoPlus, { opacity: warningPlusOpacity }]}>+</Animated.Text>
                        <Animated.Text style={[styles.finishWarningDemoCheck, { opacity: warningCheckOpacity }]}>✓</Animated.Text>
                      </Animated.View>
                    </View>
                  )}
                  {tooltipWarningVariant === 'first-entry-walkthrough' && currentWalkthroughKey === 'setSwipeActions' && (
                    <View style={styles.finishWarningSwipeDemoFrame}>
                      <View style={styles.finishWarningSwipeRevealRow}>
                        <View style={[styles.finishWarningSwipeAction, styles.finishWarningSwipeActionWarmup]}>
                          <Text style={styles.finishWarningSwipeActionText}>W</Text>
                        </View>
                        <View style={[styles.finishWarningSwipeAction, styles.finishWarningSwipeActionDelete]}>
                          <Text style={[styles.finishWarningSwipeActionText, styles.finishWarningSwipeActionTextDelete]}>X</Text>
                        </View>
                      </View>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.finishWarningSwipeSetRowWrap,
                          { transform: [{ translateX: warningSwipeOffset }] },
                        ]}
                      >
                        <SetRow
                          row={swipeDemoRow}
                          displaySetNumber={1}
                          weightUnit={weightUnit}
                          distanceUnit={distanceUnit}
                          exerciseType="bodyweight_reps"
                          rowBackgroundColor={colors.surface}
                          onUpdateRowLocal={() => {}}
                          onUpdateRow={() => {}}
                          onToggle={() => {}}
                          onSwipeDelete={() => {}}
                          onToggleWarmup={() => {}}
                        />
                      </Animated.View>
                    </View>
                  )}
                  {tooltipWarningVariant === 'first-entry-walkthrough' && currentWalkthroughKey === 'supersetMenu' && (
                    <View style={styles.finishWarningSupersetDemo}>
                      <ExerciseCard
                        entry={supersetDemoEntry}
                        rows={supersetDemoRows}
                        previousSets={[]}
                        weightUnit={weightUnit}
                        distanceUnit={distanceUnit}
                        onUpdateRow={() => {}}
                        onToggleRow={() => {}}
                        onDeleteRow={() => {}}
                        onAddRow={() => {}}
                        onAddWarmup={() => {}}
                        onToggleWarmup={() => {}}
                        canSupersetPrev
                        canSupersetNext
                        onSupersetPrev={() => {}}
                        onSupersetNext={() => {}}
                        onDuplicate={() => {}}
                        noBottomMargin
                        demoOverflowVisible
                        demoOverflowTriggerStyle={{ transform: [{ scale: warningSupersetMenuScale }] }}
                        demoOverflowMenuStyle={{ opacity: warningSupersetPopupOpacity }}
                      />
                    </View>
                  )}
                  {tooltipWarningVariant === 'first-entry-walkthrough' && currentWalkthroughKey === 'reorderLongPress' && (
                    <Animated.View
                      style={[
                        styles.finishWarningReorderPill,
                        {
                          transform: [
                            { translateY: warningReorderOffset },
                            { scale: warningReorderScale },
                          ],
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.finishWarningReorderDot,
                          {
                            opacity: warningReorderDotOpacity,
                            transform: [{ scale: warningReorderDotScale }],
                          },
                        ]}
                      />
                      <Text style={styles.finishWarningReorderPillText}>Long Press + Drag</Text>
                      <Text style={styles.finishWarningReorderHandle}>≡</Text>
                    </Animated.View>
                  )}
                </View>

                {tooltipWarningVariant === 'first-entry-walkthrough' ? (
                  <View style={styles.finishWarningActions}>
                    <Button
                      title={walkthroughPrimaryLabel}
                      variant="accent"
                      onPress={handleWalkthroughPrimaryAction}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : (
                  <View style={styles.finishWarningActions}>
                    <TouchableOpacity
                      style={[styles.finishWarningEndBtn, isCompleting && styles.finishWarningEndBtnDisabled]}
                      onPress={() => {
                        setTooltipWarningVariant(null);
                        handleCancel();
                      }}
                      disabled={isCompleting}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.finishWarningEndText}>End Workout</Text>
                    </TouchableOpacity>
                    <Button
                      title="Skip and Finish"
                      variant="accent"
                      onPress={handleSkipAndFinish}
                      loading={isCompleting}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
              </View>
            </BottomSheetModal>

            <View style={{ flex: 1 }}>
              {reordering ? (
                <DraggableFlatList
                  data={reorderItems}
                  keyExtractor={reorderKeyExtractor}
                  renderItem={renderReorderItem}
                  onDragEnd={handleReorderDragEnd}
                  contentContainerStyle={styles.scrollContent}
                />
              ) : (
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets
                >
                  {exercises.map((item, index) => {
                    const position = getSupersetPosition(exercises, index, supersetGroups);
                    const needsNoMargin = position !== null;
                    const myGroup = supersetGroups[item.id] ?? null;
                    const prevGroup = index > 0 ? (supersetGroups[exercises[index - 1].id] ?? null) : null;
                    const nextGroup = index < exercises.length - 1 ? (supersetGroups[exercises[index + 1].id] ?? null) : null;
                    const canPrev = index > 0 && (!myGroup || myGroup !== prevGroup);
                    const canNext = index < exercises.length - 1 && (!myGroup || myGroup !== nextGroup);
                    const card = (
                      <ExerciseCard
                        entry={item}
                        rows={rows[item.id] ?? []}
                        previousSets={previousSets[item.exercise_id] ?? []}
                        weightUnit={weightUnit}
                        distanceUnit={distanceUnit}
                        isCollapsed={collapsedCards[item.id] ?? false}
                        onToggleCollapse={() => toggleCollapse(item.id)}
                        onLongPress={() => setReordering(true)}
                        onUpdateRowLocal={handleUpdateLocal}
                        onUpdateRow={handleUpdate}
                        onToggleRow={handleToggle}
                        onDeleteRow={handleDelete}
                        onAddRow={handleAdd}
                        onAddWarmup={handleAddWarmup}
                        onToggleWarmup={handleToggleWarmup}
                        onRemove={() => handleRemoveExercise(item.id)}
                        supersetGroup={myGroup}
                        canSupersetPrev={canPrev}
                        canSupersetNext={canNext}
                        onSupersetPrev={() => handleSupersetPrev(item.id)}
                        onSupersetNext={() => handleSupersetNext(item.id)}
                        onSeparate={() => handleSeparate(item.id)}
                        onSwap={() => handleSwap(item.id)}
                        onDuplicate={() => handleDuplicate(item.id)}
                        onDetails={() => openExerciseDetail(item.exercise_id)}
                        noBottomMargin={needsNoMargin}
                      />
                    );
                    return <SupersetBracket key={item.id} position={position} contentRadius={16} style={position === 'last' ? { marginBottom: 6 } : undefined}>{card}</SupersetBracket>;
                  })}
                  {normalFooter()}
                </ScrollView>
              )}
            </View>

            {reordering && (
              <View style={styles.reorderFooter}>
                <Button
                  title="Done Reordering"
                  onPress={() => setReordering(false)}
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {restTimer && (
              <RestTimerBar
                onDismiss={dismissRestTimer}
                onLongPress={() => setShowTimerSettings(true)}
              />
            )}

            <RestTimerModal
              visible={showTimerSettings}
              currentValue={restTimerDefault}
              onSave={handleTimerSettingsSave}
              onClose={() => setShowTimerSettings(false)}
            />

            <AddExerciseModal
              visible={showAddExercise}
              onClose={() => { setShowAddExercise(false); setAutoOpenPicker(false); }}
              onConfirm={handleAddExerciseConfirm}
              weightUnit={weightUnit}
              distanceUnit={distanceUnit}
              onExerciseDetails={(id) => navigateToExerciseDetail(id, 'add')}
              autoOpenPicker={autoOpenPicker}
            />

            <ExercisePickerModal
              visible={showDirectAddPicker}
              onClose={() => setShowDirectAddPicker(false)}
              onSelect={(exercise) => {
                setShowDirectAddPicker(false);
                handleAddExerciseConfirm(exercise, [{
                  set_number: 1,
                  target_weight: 0,
                  target_reps_min: 8,
                  target_reps_max: 12,
                  target_rir: null,
                }]);
              }}
              onExerciseDetails={(id) => navigateToExerciseDetail(id, 'add')}
            />

            <ExercisePickerModal
              visible={showSwapPicker}
              onClose={() => { setShowSwapPicker(false); setSwapEntryId(null); }}
              onSelect={handleSwapSelect}
              onDeletedSelectedWithoutReplacement={handleSwapDeletedWithoutReplacement}
              selectedExerciseId={swapEntryId ? (exercises.find((entry) => entry.id === swapEntryId)?.exercise_id ?? null) : null}
              onExerciseDetails={(id) => navigateToExerciseDetail(id, 'swap')}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}
