import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRoutineStore } from '../../src/stores/routine.store';
import { useWorkoutStore } from '../../src/stores/workout.store';
import { useProfileStore } from '../../src/stores/profile.store';
import { Button, Card, EmptyState } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { getCurrentDayOfWeek, formatDuration } from '../../src/utils/date';
import { weightUnitLabel, formatWeight } from '../../src/utils/units';
import { DAY_LABELS, DayOfWeek } from '../../src/models';
import { sessionService } from '../../src/services';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeRoutine, fetchActiveRoutine } = useRoutineStore();
  const { session: activeSession, startWorkout, resumeWorkout } = useWorkoutStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hasActiveSession, setHasActiveSession] = useState(!!activeSession);

  useEffect(() => {
    if (!activeSession) setHasActiveSession(false);
  }, [activeSession]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveRoutine();
      if (user) {
        sessionService.getActiveSession(user.id).then((s) => {
          setHasActiveSession(!!s);
        });
      }
    }, [fetchActiveRoutine, user]),
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today</Text>
        </View>
        <ScrollView
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const allIds = todaysWorkout.exercises.map((e) => e.id);
                const allExpanded = allIds.every((eid) => expandedIds.has(eid));
                setExpandedIds(allExpanded ? new Set() : new Set(allIds));
              }}
            >
              <Text style={styles.dayLabel}>{todaysWorkout.label}</Text>
              <Text style={styles.exerciseCount}>
                {todaysWorkout.exercises.length} exercises
              </Text>
            </TouchableOpacity>

            {todaysWorkout.exercises.map((ex) => {
              const setsLabel = ex.sets && ex.sets.length > 0
                ? `${ex.sets.length} sets`
                : `${ex.target_sets}x${ex.target_reps}`;
              const isExpanded = expandedIds.has(ex.id);
              return (
                <View key={ex.id}>
                  <TouchableOpacity
                    style={styles.exerciseRow}
                    onPress={() => {
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(ex.id)) next.delete(ex.id);
                        else next.add(ex.id);
                        return next;
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exerciseName}>
                      {ex.exercise?.name ?? 'Exercise'}
                    </Text>
                    <Text style={styles.exerciseTarget}>{setsLabel}</Text>
                  </TouchableOpacity>
                  {isExpanded && ex.sets && ex.sets.length > 0 && (
                    <View style={styles.setDetails}>
                      <View style={styles.setDetailHeader}>
                        <Text style={[styles.setDetailCol, styles.setColNum]}>SET</Text>
                        <Text style={[styles.setDetailCol, styles.setColWeight]}>{weightUnitLabel(wUnit)}</Text>
                        <Text style={[styles.setDetailCol, styles.setColReps]}>REPS</Text>
                      </View>
                      {ex.sets.map((s) => (
                        <View key={s.id} style={styles.setDetailRow}>
                          <Text style={[styles.setDetailCell, styles.setColNum]}>{s.set_number}</Text>
                          <Text style={[styles.setDetailCell, styles.setColWeight]}>
                            {s.target_weight > 0 ? formatWeight(s.target_weight, wUnit) : '-'}
                          </Text>
                          <Text style={[styles.setDetailCell, styles.setColReps]}>
                            {s.target_reps_min === s.target_reps_max
                              ? String(s.target_reps_min)
                              : `${s.target_reps_min}-${s.target_reps_max}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Card>

          {hasActiveSession || activeSession ? (
            <View>
              <Text style={styles.inProgress}>Workout in progress</Text>
              {activeSession && (
                <Text style={styles.duration}>
                  {formatDuration(activeSession.started_at, null)}
                </Text>
              )}
              <Button
                title="Continue Workout"
                onPress={async () => {
                  if (!user || !todaysWorkout) return;
                  const ok = await resumeWorkout(user.id, todaysWorkout.exercises);
                  if (ok) router.push('/workout/active');
                  else setHasActiveSession(false);
                }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  setDetails: {
    paddingLeft: 8,
    paddingBottom: 8,
    marginBottom: 4,
  },
  setDetailHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setDetailCol: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  setDetailRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  setDetailCell: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setColNum: { width: 32 },
  setColWeight: { flex: 1 },
  setColReps: { flex: 1 },
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
