import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useAuthStore } from '../../src/stores/auth.store';
import { useWorkoutStore } from '../../src/stores/workout.store';
import { useProfileStore } from '../../src/stores/profile.store';
import { ExerciseCard } from '../../src/components/workout';
import { Button } from '../../src/components/ui';
import { AddExerciseModal, SetsPayloadItem } from '../../src/components/routine/AddExerciseModal';
import { colors, fonts } from '../../src/constants';
import { formatDuration } from '../../src/utils/date';
import { Exercise, RoutineDayExercise } from '../../src/models';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const {
    session,
    exercises,
    rows,
    previousSets,
    loadPreviousSets,
    updateRow,
    toggleRow,
    deleteRow,
    addRow,
    removeExercise,
    addExercise,
    reorderExercises,
    completeWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState('0m');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/(tabs)');
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
      setElapsed(formatDuration(session.started_at, null));
    }, 10000);
    setElapsed(formatDuration(session.started_at, null));
    return () => clearInterval(interval);
  }, [session]);

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
        const sets = await import('../../src/services').then(
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

  const handleComplete = () => {
    Alert.alert('Complete Workout', 'Finish and save this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          await completeWorkout(weightUnit);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Discard this workout session?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await cancelWorkout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleDragEnd = useCallback(({ data }: { data: RoutineDayExercise[] }) => {
    reorderExercises(data);
  }, [reorderExercises]);

  const renderNormalItem = useCallback(({ item }: { item: RoutineDayExercise }) => (
    <Pressable onLongPress={() => setReordering(true)}>
      <ExerciseCard
        entry={item}
        rows={rows[item.id] ?? []}
        previousSets={previousSets[item.exercise_id] ?? []}
        weightUnit={weightUnit}
        onUpdateRow={handleUpdate}
        onToggleRow={handleToggle}
        onDeleteRow={handleDelete}
        onAddRow={handleAdd}
        onRemove={() => handleRemoveExercise(item.id)}
      />
    </Pressable>
  ), [rows, previousSets, weightUnit, handleUpdate, handleToggle, handleDelete, handleAdd, handleRemoveExercise]);

  const noop = useCallback(() => {}, []);

  const renderReorderItem = useCallback(({ item, drag, isActive }: RenderItemParams<RoutineDayExercise>) => (
    <ScaleDecorator>
      <Pressable onLongPress={drag} disabled={isActive} delayLongPress={150}>
        <ExerciseCard
          entry={item}
          rows={rows[item.id] ?? []}
          previousSets={previousSets[item.exercise_id] ?? []}
          weightUnit={weightUnit}
          collapsed
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
    <TouchableOpacity
      style={styles.addExerciseBtn}
      onPress={() => setShowAddExercise(true)}
      activeOpacity={0.7}
    >
      <Text style={styles.addExerciseText}>+ Add Exercise</Text>
    </TouchableOpacity>
  ), []);

  if (!session) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>{elapsed}</Text>
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
          />
        )}
      </View>

      <View style={styles.footer}>
        {reordering ? (
          <Button
            title="Done Reordering"
            onPress={() => setReordering(false)}
            style={styles.completeBtn}
          />
        ) : (
          <>
            <Button
              title="Cancel"
              variant="danger"
              onPress={handleCancel}
              style={styles.cancelBtn}
              size="sm"
            />
            <Button
              title="Complete Workout"
              onPress={handleComplete}
              style={styles.completeBtn}
            />
          </>
        )}
      </View>

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onConfirm={handleAddExerciseConfirm}
        weightUnit={weightUnit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timer: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  addExerciseBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 0,
    paddingHorizontal: 20,
  },
  completeBtn: {
    flex: 1,
  },
});
