import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import { useWorkoutStore } from '../../stores/workout.store';
import { useProfileStore } from '../../stores/profile.store';
import { useWorkoutOverlay } from './WorkoutOverlayContext';
import { ExerciseCard } from './ExerciseCard';
import { RestTimerBar } from './RestTimerBar';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutPill } from './WorkoutPill';
import { Button, BottomSheetModal } from '../ui';
import { MuscleHeatmap } from '../history/MuscleHeatmap';
import { AddExerciseModal, SetsPayloadItem } from '../routine/AddExerciseModal';
import { colors, fonts } from '../../constants';
import { formatElapsed } from '../../utils/date';
import { Exercise, RoutineDayExercise } from '../../models';

const TAB_BAR_HEIGHT = 60;

export function WorkoutOverlay() {
  const { user } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const restTimerDefault = profile?.rest_timer_seconds ?? 90;
  const {
    session,
    exercises,
    rows,
    previousSets,
    collapsedCards,
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
    completeWorkout,
    cancelWorkout,
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
  const [reordering, setReordering] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Slide animation
  useEffect(() => {
    if (expanded && session) {
      setShowFullScreen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowFullScreen(false);
      });
    }
  }, [expanded, !!session]);

  // Elapsed time ticker
  useEffect(() => {
    if (!session) return;
    const tick = () => setElapsed(formatElapsed(session.started_at));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Rest timer ticker
  useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => tickRestTimer(), 1000);
    return () => clearInterval(id);
  }, [restTimer !== null]);

  // Load previous sets when session loads
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

  const { muscleHeatmapData, muscleHeatmapMax } = useMemo(() => {
    const totals = new Map<string, { completed: number; total: number }>();
    for (const ex of exercises) {
      const group = ex.exercise?.muscle_group;
      if (!group) continue;
      const exRows = rows[ex.id] ?? [];
      const done = exRows.filter((r) => r.is_completed).length;
      const entry = totals.get(group) ?? { completed: 0, total: 0 };
      entry.total += exRows.length;
      entry.completed += done;
      totals.set(group, entry);
    }
    const endStateMax = Math.max(...[...totals.values()].map((v) => v.total), 1);
    const data = [...totals.entries()].map(([label, { completed }]) => ({
      label,
      value: completed,
    }));
    return { muscleHeatmapData: data, muscleHeatmapMax: endStateMax };
  }, [exercises, rows]);

  const handleComplete = useCallback(() => {
    Alert.alert('Complete Workout', 'Finish and save this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Complete', onPress: () => completeWorkout(weightUnit) },
    ]);
  }, [completeWorkout, weightUnit]);

  const handleStartRestTimer = useCallback(() => {
    if (restTimerDefault > 0) {
      startRestTimer(restTimerDefault);
    }
  }, [restTimerDefault, startRestTimer]);

  const handleUpdateLocal = (id: string, entryId: string, updates: { weight?: string; reps?: string; rir?: string }) => {
    updateRowLocal(id, entryId, updates);
  };

  const handleUpdate = async (id: string, entryId: string, updates: { weight?: string; reps?: string; rir?: string }) => {
    try {
      await updateRow(id, entryId, updates);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleToggle = async (id: string, entryId: string) => {
    try {
      const row = (rows[entryId] ?? []).find((r) => r.id === id);
      if (row && !row.is_completed) {
        handleStartRestTimer();
      }
      await toggleRow(id, entryId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDelete = async (id: string, entryId: string, setNumber: number) => {
    try {
      await deleteRow(id, entryId, setNumber);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleAdd = async (entryId: string, exerciseId: string) => {
    try {
      await addRow(entryId, exerciseId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleAddWarmup = async (entryId: string, exerciseId: string) => {
    try {
      await addWarmupRow(entryId, exerciseId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleToggleWarmup = async (id: string, entryId: string) => {
    try {
      await toggleWarmup(id, entryId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleRemoveExercise = async (entryId: string) => {
    try {
      await removeExercise(entryId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
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
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Discard this workout session?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => cancelWorkout() },
    ]);
  };

  const handleTimerSettingsSave = async (seconds: number) => {
    await updateProfile({ rest_timer_seconds: seconds });
  };

  const handleDragEnd = useCallback(({ data }: { data: RoutineDayExercise[] }) => {
    reorderExercises(data);
  }, [reorderExercises]);

  const renderNormalItem = useCallback(({ item }: { item: RoutineDayExercise }) => (
    <ExerciseCard
      entry={item}
      rows={rows[item.id] ?? []}
      previousSets={previousSets[item.exercise_id] ?? []}
      weightUnit={weightUnit}
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
    />
  ), [rows, previousSets, weightUnit, collapsedCards, toggleCollapse]);

  const noop = useCallback(() => {}, []);

  const renderReorderItem = useCallback(({ item, drag, isActive }: RenderItemParams<RoutineDayExercise>) => (
    <ScaleDecorator>
      <Pressable onLongPress={drag} disabled={isActive} delayLongPress={400}>
        <ExerciseCard
          entry={item}
          rows={rows[item.id] ?? []}
          previousSets={previousSets[item.exercise_id] ?? []}
          weightUnit={weightUnit}
          reorderCollapsed
          onUpdateRow={noop as any}
          onToggleRow={noop as any}
          onDeleteRow={noop as any}
          onAddRow={noop as any}
          onAddWarmup={noop as any}
          onToggleWarmup={noop as any}
          onRemove={() => handleRemoveExercise(item.id)}
        />
      </Pressable>
    </ScaleDecorator>
  ), [rows, previousSets, weightUnit, noop, handleRemoveExercise]);

  const keyExtractor = useCallback((item: RoutineDayExercise) => item.id, []);

  const normalFooter = useCallback(() => (
    <View>
      <Button
        title="+ Add Exercise"
        variant="dashed"
        onPress={() => setShowAddExercise(true)}
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
              <TouchableOpacity style={styles.finishBtn} onPress={handleComplete} activeOpacity={0.7}>
                <Text style={styles.finishText}>Finish</Text>
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
            >
              <MuscleHeatmap
                data={muscleHeatmapData}
                title="Muscle Progress"
                subtitle="Based on completed sets"
                bare
                maxValue={muscleHeatmapMax}
              />
            </BottomSheetModal>

            <View style={{ flex: 1 }}>
              {reordering ? (
                <DraggableFlatList
                  data={exercises}
                  keyExtractor={keyExtractor}
                  renderItem={renderReorderItem}
                  onDragEnd={handleDragEnd}
                  contentContainerStyle={styles.scrollContent}
                />
              ) : (
                <FlatList
                  data={exercises}
                  keyExtractor={keyExtractor}
                  renderItem={renderNormalItem}
                  ListFooterComponent={normalFooter}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets
                />
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
              onClose={() => setShowAddExercise(false)}
              onConfirm={handleAddExerciseConfirm}
              weightUnit={weightUnit}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
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
});
