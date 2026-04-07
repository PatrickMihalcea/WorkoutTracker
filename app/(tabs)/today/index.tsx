import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useWorkoutOverlay } from '../../../src/components/workout';
import { Button, Card, EmptyState, BottomSheetModal, RirCircle, SupersetBracket } from '../../../src/components/ui';
import { getSupersetPosition, type SupersetGroups } from '../../../src/utils/superset';
import { colors, fonts } from '../../../src/constants';
import { getCurrentDayOfWeek, formatDuration } from '../../../src/utils/date';
import { weightUnitLabel, formatWeight } from '../../../src/utils/units';
import { DAY_LABELS, DayOfWeek, Routine, RoutineWithDays, RoutineDayWithExercises } from '../../../src/models';
import { sessionService, routineService } from '../../../src/services';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeRoutine, fetchActiveRoutine } = useRoutineStore();
  const { session: activeSession, startWorkout, resumeWorkout } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { expand: expandWorkout } = useWorkoutOverlay();
  const wUnit = profile?.weight_unit ?? 'kg';
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hasActiveSession, setHasActiveSession] = useState(!!activeSession);

  const [showChooseModal, setShowChooseModal] = useState(false);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [chosenRoutine, setChosenRoutine] = useState<RoutineWithDays | null>(null);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [chosenDay, setChosenDay] = useState<RoutineDayWithExercises | null>(null);

  useEffect(() => {
    if (!activeSession) {
      setHasActiveSession(false);
      setChosenDay(null);
    }
  }, [activeSession]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveRoutine();
      if (user) {
        sessionService.getActiveSession(user.id).then(async (s) => {
          setHasActiveSession(!!s);
          if (s?.routine_day_id) {
            const day = await routineService.getDayWithExercises(s.routine_day_id);
            setChosenDay(day);
          }
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
  const todaysWorkouts = activeRoutine?.days.filter((d) => d.day_of_week === currentDay) ?? [];
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const todaysWorkout = todaysWorkouts.length > 0 ? todaysWorkouts[selectedDayIndex] ?? todaysWorkouts[0] : null;

  const handleStartWorkout = async () => {
    const target = chosenDay ?? todaysWorkout;
    if (!user || !target) return;
    try {
      await startWorkout(user.id, target.id, target.exercises);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const openChooseModal = async () => {
    setShowChooseModal(true);
    setChosenRoutine(null);
    setLoadingRoutines(true);
    try {
      const list = await routineService.getAll();
      setAllRoutines(list);
    } catch {
      Alert.alert('Error', 'Could not load routines');
    } finally {
      setLoadingRoutines(false);
    }
  };

  const handlePickRoutine = async (routine: Routine) => {
    setLoadingRoutines(true);
    try {
      const full = await routineService.getWithDays(routine.id);
      setChosenRoutine(full);
    } catch {
      Alert.alert('Error', 'Could not load routine days');
    } finally {
      setLoadingRoutines(false);
    }
  };

  const handlePickDay = (day: RoutineDayWithExercises) => {
    setChosenDay(day);
    setShowChooseModal(false);
  };

  if (!activeRoutine) {
    return (
      <View style={styles.container}>
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

      {!chosenDay && todaysWorkouts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutSelector}>
          {todaysWorkouts.map((w, i) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.workoutChip, selectedDayIndex === i && styles.workoutChipSelected]}
              onPress={() => setSelectedDayIndex(i)}
            >
              <Text style={[styles.workoutChipText, selectedDayIndex === i && styles.workoutChipTextSelected]}>
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {(() => {
        const displayWorkout = chosenDay ?? todaysWorkout;
        if (!displayWorkout) {
          return (
            <>
              <Card style={styles.restDayCard}>
                <Text style={styles.restDayTitle}>Rest Day</Text>
                <Text style={styles.restDayMessage}>
                  No workout scheduled for today. Recover and come back stronger.
                </Text>
              </Card>
              {!(hasActiveSession || activeSession) && (
                <View style={styles.chooseOtherWrap}>
                  <Button title="Choose Other Workout" variant="ghost" onPress={openChooseModal} />
                </View>
              )}
            </>
          );
        }
        return (
          <>
            {chosenDay && !(hasActiveSession || activeSession) && (
              <TouchableOpacity onPress={() => setChosenDay(null)} style={styles.clearChoiceBtn}>
                <Text style={styles.clearChoiceText}>← Back to today</Text>
              </TouchableOpacity>
            )}
            <Card style={styles.workoutCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const allIds = displayWorkout.exercises.map((e) => e.id);
                  const allExpanded = allIds.every((eid) => expandedIds.has(eid));
                  setExpandedIds(allExpanded ? new Set() : new Set(allIds));
                }}
              >
                <Text style={styles.dayLabel}>{displayWorkout.label}</Text>
                <Text style={styles.exerciseCount}>
                  {displayWorkout.exercises.length} exercises
                </Text>
              </TouchableOpacity>

              {(() => {
                const groups: SupersetGroups = {};
                for (const e of displayWorkout.exercises) groups[e.id] = e.superset_group ?? null;
                return displayWorkout.exercises.map((ex, exIdx) => {
                  const setsLabel = ex.sets && ex.sets.length > 0
                    ? `${ex.sets.length} sets`
                    : `${ex.target_sets}x${ex.target_reps}`;
                  const isExpanded = expandedIds.has(ex.id);
                  const ssPosition = getSupersetPosition(displayWorkout.exercises, exIdx, groups);
                  return (
                    <SupersetBracket key={ex.id} position={ssPosition}>
                      <View>
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
                              <View style={styles.setCol}><Text style={styles.setDetailCol}>SET</Text></View>
                              <View style={styles.setCol}><Text style={styles.setDetailCol}>{weightUnitLabel(wUnit)}</Text></View>
                              <View style={styles.setCol}><Text style={styles.setDetailCol}>REPS</Text></View>
                              <View style={styles.setCol}><Text style={styles.setDetailCol}>RIR</Text></View>
                            </View>
                            {(() => {
                              let workingCount = 0;
                              return ex.sets.map((s) => {
                                if (!s.is_warmup) workingCount++;
                                return (
                                  <View key={s.id} style={styles.setDetailRow}>
                                    <View style={styles.setCol}>
                                      {s.is_warmup ? (
                                        <View style={styles.warmupCircle}><Text style={styles.warmupText}>W</Text></View>
                                      ) : (
                                        <Text style={styles.setDetailCell}>{workingCount}</Text>
                                      )}
                                    </View>
                                    <View style={styles.setCol}>
                                      <Text style={styles.setDetailCell}>
                                        {s.target_weight > 0 ? formatWeight(s.target_weight, wUnit) : '-'}
                                      </Text>
                                    </View>
                                    <View style={styles.setCol}>
                                      <Text style={styles.setDetailCell}>
                                        {s.target_reps_min === s.target_reps_max
                                          ? String(s.target_reps_min)
                                          : `${s.target_reps_min}-${s.target_reps_max}`}
                                      </Text>
                                    </View>
                                    <View style={styles.setCol}>
                                      <RirCircle value={s.target_rir ?? null} size={22} />
                                    </View>
                                  </View>
                                );
                              });
                            })()}
                          </View>
                        )}
                      </View>
                    </SupersetBracket>
                  );
                });
              })()}
            </Card>

            {hasActiveSession || activeSession ? (
              <View>
                <Button
                  title="Continue Workout"
                  size="lg"
                  onPress={async () => {
                    if (!user) return;
                    if (activeSession) {
                      expandWorkout();
                    } else {
                      const ok = await resumeWorkout(user.id);
                      if (ok) expandWorkout();
                      else setHasActiveSession(false);
                    }
                  }}
                />
                <Text style={styles.inProgress}>Workout in progress</Text>
                {activeSession && (
                  <Text style={styles.duration}>
                    {formatDuration(activeSession.started_at, null)}
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Button
                  title="Start Workout"
                  onPress={handleStartWorkout}
                  size="lg"
                />
                <View style={styles.chooseOtherWrap}>
                  <Button title="Choose Other Workout" variant="ghost" onPress={openChooseModal} />
                </View>
              </>
            )}
          </>
        );
      })()}

      <BottomSheetModal
        visible={showChooseModal}
        title={chosenRoutine ? chosenRoutine.name : 'Pick a Routine'}
        onClose={() => setShowChooseModal(false)}
        scrollable
      >
        {!chosenRoutine ? (
          <>
            {loadingRoutines ? (
              <ActivityIndicator color={colors.text} style={{ marginVertical: 24 }} />
            ) : (
              <>
                {allRoutines.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.chooseRow} onPress={() => handlePickRoutine(r)}>
                    <Text style={styles.chooseRowText}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
                {allRoutines.length === 0 && (
                  <Text style={styles.chooseEmpty}>No routines found</Text>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.chooseSubtitle}>Pick a workout</Text>
            {loadingRoutines ? (
              <ActivityIndicator color={colors.text} style={{ marginVertical: 24 }} />
            ) : (
              <>
                {chosenRoutine.days.map((d) => (
                  <TouchableOpacity key={d.id} style={styles.chooseRow} onPress={() => handlePickDay(d)}>
                    <Text style={styles.chooseRowText}>{d.label}</Text>
                    <Text style={styles.chooseRowSub}>{d.exercises.length} exercises</Text>
                  </TouchableOpacity>
                ))}
                {chosenRoutine.days.length === 0 && (
                  <Text style={styles.chooseEmpty}>No days in this routine</Text>
                )}
              </>
            )}
            <TouchableOpacity style={styles.chooseBackBtn} onPress={() => setChosenRoutine(null)}>
              <Text style={styles.chooseBackText}>← Back to routines</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetModal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 8,
    marginBottom: 4,
  },
  setDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    paddingVertical: 3,
  },
  setDetailCell: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setCol: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  warmupCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4A017',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  warmupText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#fff',
  },
  inProgress: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    marginTop: 20,
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
  workoutSelector: {
    marginBottom: 16,
    flexGrow: 0,
  },
  workoutChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  workoutChipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  workoutChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  workoutChipTextSelected: {
    color: colors.background,
  },
  chooseOtherWrap: {
    marginTop: 12,
  },
  clearChoiceBtn: {
    marginBottom: 12,
  },
  clearChoiceText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  chooseSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  chooseRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chooseRowText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  chooseRowSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  chooseEmpty: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  chooseBackBtn: {
    marginTop: 12,
  },
  chooseBackText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
});
