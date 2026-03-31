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
import { ExerciseCard } from '../../src/components/workout';
import { Button } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { formatDuration } from '../../src/utils/date';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    session,
    exercises,
    sets,
    previousSets,
    addSet,
    updateSet,
    loadPreviousSets,
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
  }, [session, exercises, user, loadPreviousSets, router]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(formatDuration(session.started_at, null));
    }, 10000);
    setElapsed(formatDuration(session.started_at, null));
    return () => clearInterval(interval);
  }, [session]);

  const handleAddSet = async (
    exerciseId: string,
    weight: number,
    reps: number,
    rir: number | null,
  ) => {
    if (!session) return;
    const exerciseSets = sets[exerciseId] ?? [];
    try {
      await addSet({
        session_id: session.id,
        exercise_id: exerciseId,
        set_number: exerciseSets.length + 1,
        weight,
        reps_performed: reps,
        rir,
        is_warmup: false,
      });
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleUpdateSet = async (
    setId: string,
    weight: number,
    reps: number,
    rir: number | null,
  ) => {
    try {
      await updateSet(setId, { weight, reps_performed: reps, rir });
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
          await completeWorkout();
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
      >
        {exercises.map((entry) => (
          <ExerciseCard
            key={entry.id}
            entry={entry}
            sets={sets[entry.exercise_id] ?? []}
            previousSets={previousSets[entry.exercise_id] ?? []}
            onAddSet={handleAddSet}
            onUpdateSet={handleUpdateSet}
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
    padding: 16,
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
