import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRoutineStore } from '../../src/stores/routine.store';
import { useWorkoutStore } from '../../src/stores/workout.store';
import { Button, Card, EmptyState } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { getCurrentDayOfWeek, formatDuration } from '../../src/utils/date';
import { DAY_LABELS, DayOfWeek } from '../../src/models';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeRoutine, fetchActiveRoutine } = useRoutineStore();
  const { session: activeSession, startWorkout } = useWorkoutStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveRoutine();
    }, [fetchActiveRoutine]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveRoutine();
    setRefreshing(false);
  }, [fetchActiveRoutine]);

  const currentDay = getCurrentDayOfWeek();
  const todaysWorkout = activeRoutine?.days.find((d) => d.day_of_week === currentDay);

  const handleStartWorkout = async () => {
    if (!user || !todaysWorkout) return;
    try {
      await startWorkout(user.id, todaysWorkout.id, todaysWorkout.exercises);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
      return;
    }
    router.push('/workout/active');
  };

  if (!activeRoutine) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        <EmptyState
          title="No Active Routine"
          message="Create a routine and set it as active to see today's workout."
          actionLabel="Go to Routines"
          onAction={() => router.push('/(tabs)/routines')}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.textSecondary}
        />
      }
    >
      <Text style={styles.greeting}>
        {DAY_LABELS[currentDay as DayOfWeek]}
      </Text>
      <Text style={styles.routineName}>{activeRoutine.name}</Text>

      {todaysWorkout ? (
        <>
          <Card style={styles.workoutCard}>
            <Text style={styles.dayLabel}>{todaysWorkout.label}</Text>
            <Text style={styles.exerciseCount}>
              {todaysWorkout.exercises.length} exercises
            </Text>

            {todaysWorkout.exercises.map((ex) => (
              <View key={ex.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>
                  {ex.exercise?.name ?? 'Exercise'}
                </Text>
                <Text style={styles.exerciseTarget}>
                  {ex.target_sets}x{ex.target_reps}
                </Text>
              </View>
            ))}
          </Card>

          {activeSession ? (
            <View>
              <Text style={styles.inProgress}>Workout in progress</Text>
              <Text style={styles.duration}>
                {formatDuration(activeSession.started_at, null)}
              </Text>
              <Button
                title="Continue Workout"
                onPress={() => router.push('/workout/active')}
              />
            </View>
          ) : (
            <Button
              title="Start Workout"
              onPress={handleStartWorkout}
              size="lg"
            />
          )}
        </>
      ) : (
        <Card style={styles.restDayCard}>
          <Text style={styles.restDayTitle}>Rest Day</Text>
          <Text style={styles.restDayMessage}>
            No workout scheduled for today. Recover and come back stronger.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  routineName: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 4,
    marginBottom: 24,
  },
  workoutCard: {
    marginBottom: 24,
  },
  dayLabel: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  exerciseTarget: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  inProgress: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  duration: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  restDayCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  restDayTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  restDayMessage: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
