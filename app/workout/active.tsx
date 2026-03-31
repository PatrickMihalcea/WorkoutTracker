import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useWorkoutStore } from '../../src/stores/workout.store';
import { useProfileStore } from '../../src/stores/profile.store';
import { ExerciseCard } from '../../src/components/workout';
import { Button } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { formatDuration } from '../../src/utils/date';

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
    completeWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState('0m');

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

  const handleUpdate = async (id: string, exerciseId: string, updates: { weight?: string; reps?: string; rir?: string }) => {
    try {
      await updateRow(id, exerciseId, updates);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleToggle = async (id: string, exerciseId: string) => {
    try {
      await toggleRow(id, exerciseId);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDelete = async (id: string, exerciseId: string, setNumber: number) => {
    try {
      await deleteRow(id, exerciseId, setNumber);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleAdd = async (exerciseId: string) => {
    try {
      await addRow(exerciseId);
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

  if (!session) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>{elapsed}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {exercises.map((entry) => (
          <ExerciseCard
            key={entry.id}
            entry={entry}
            rows={rows[entry.exercise_id] ?? []}
            previousSets={previousSets[entry.exercise_id] ?? []}
            weightUnit={weightUnit}
            onUpdateRow={handleUpdate}
            onToggleRow={handleToggle}
            onDeleteRow={handleDelete}
            onAddRow={handleAdd}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
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
      </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    paddingBottom: 32,
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
