import { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { ExerciseCard, RestTimerBar, RestTimerModal } from '../../../src/components/workout';
import { Button } from '../../../src/components/ui';
import { AddExerciseModal, SetsPayloadItem } from '../../../src/components/routine/AddExerciseModal';
import { colors, fonts } from '../../../src/constants';
import { formatElapsed } from '../../../src/utils/date';
import { Exercise, RoutineDayExercise } from '../../../src/models';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
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
    loadPreviousSets,
    updateRowLocal,
    updateRow,
    toggleRow,
    deleteRow,
    addRow,
    removeExercise,
    addExercise,
    reorderExercises,
    toggleCollapse,
    completeWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState('0m 00s');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerKey, setRestTimerKey] = useState(0);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

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

  const handleComplete = useCallback(() => {
    Alert.alert('Complete Workout', 'Finish and save this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          await completeWorkout(weightUnit);
          router.replace('/(tabs)/today');
        },
      },
    ]);
  }, [completeWorkout, weightUnit, router]);


  useEffect(() => {
    if (!session) {
      router.replace('/(tabs)/today');
      return;
    }
    const exerciseIds = exercises.map((e) => e.exercise_id);
    if (user && exerciseIds.length > 0) {
      loadPreviousSets(exerciseIds, user.id);
    }
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(formatElapsed(session.started_at));
    }, 1000);
    setElapsed(formatElapsed(session.started_at));
    return () => clearInterval(interval);
  }, [session]);

  const startRestTimer = useCallback(() => {
    if (restTimerDefault > 0) {
      setRestTimerActive(true);
      setRestTimerKey((k) => k + 1);
    }
  }, [restTimerDefault]);

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
      await toggleRow(id, entryId);
      const row = (rows[entryId] ?? []).find((r) => r.id === id);
      if (row && !row.is_completed) {
        startRestTimer();
      }
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
        const sets = await import('../../../src/services').then(
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
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await cancelWorkout();
          router.replace('/(tabs)/today');
        },
      },
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
      onRemove={() => handleRemoveExercise(item.id)}
    />
  ), [rows, previousSets, weightUnit, collapsedCards, toggleCollapse, handleUpdateLocal, handleUpdate, handleToggle, handleDelete, handleAdd, handleRemoveExercise]);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Today</Text>
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
      </View>

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

      {restTimerActive && (
        <RestTimerBar
          key={restTimerKey}
          initialSeconds={restTimerDefault}
          onDismiss={() => setRestTimerActive(false)}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  elapsedTimer: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    flex: 1,
  },
  timerIconBtn: {
    paddingHorizontal: 12,
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
    flex: 1,
    textAlign: 'right',
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
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  reorderFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  backText: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.regular,
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
});
