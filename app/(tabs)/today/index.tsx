import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useWorkoutOverlay } from '../../../src/components/workout';
import { Button, Card, EmptyState, BottomSheetModal, RirCircle, SupersetBracket, ChipPicker } from '../../../src/components/ui';
import { getSupersetPosition, type SupersetGroups } from '../../../src/utils/superset';
import { fonts, spacing } from '../../../src/constants';
import { getCurrentDayOfWeek, formatDuration } from '../../../src/utils/date';
import { weightUnitLabel, distanceUnitLabel, formatWeight, formatDistance } from '../../../src/utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../../src/utils/exerciseType';
import { formatDurationValue } from '../../../src/utils/duration';
import { DAY_LABELS, DayOfWeek, Routine, RoutineWithDays, RoutineDayWithExercises } from '../../../src/models';
import { routineService } from '../../../src/services';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl+50,
  },
  heroCard: {
    marginBottom: 14,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  routineName: {
    fontSize: 30,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 2,
  },
  heroSubtext: {
    fontSize: 13,
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  workoutCard: {
    marginBottom: 18,
    paddingHorizontal: spacing.md,
  },
  dayLabel: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    fontFamily: fonts.light,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  exerciseTarget: {
    fontSize: 14,
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
    paddingBottom: 6,
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
    paddingVertical: 4,
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
    fontSize: 15,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    marginTop: 16,
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
    paddingVertical: 34,
    paddingHorizontal: spacing.md,
  },
  restDayInProgressWrap: {
    marginTop: 10,
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
    marginBottom: 12,
    flexGrow: 0,
  },
  workoutChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
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
  secondaryActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chooseOtherBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startEmptyBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
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

export default function HomeScreen() {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const { activeRoutine, activeRoutineInitialized, fetchActiveRoutine } = useRoutineStore();
  const { session: activeSession, startWorkout, resumeWorkout } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { expand: expandWorkout } = useWorkoutOverlay();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showChooseModal, setShowChooseModal] = useState(false);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [chosenRoutine, setChosenRoutine] = useState<RoutineWithDays | null>(null);
  const [chosenRoutineWeek, setChosenRoutineWeek] = useState<number>(1);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [chosenDay, setChosenDay] = useState<RoutineDayWithExercises | null>(null);

  useEffect(() => {
    fetchActiveRoutine();
  }, [fetchActiveRoutine]);

  useEffect(() => {
    if (!activeSession) {
      setChosenDay(null);
      return;
    }

    const sessionDayFromActive = activeRoutine?.days.find((day) => day.id === activeSession.routine_day_id) ?? null;
    const sessionDayFromChosen = chosenRoutine?.days.find((day) => day.id === activeSession.routine_day_id) ?? null;
    setChosenDay(sessionDayFromActive ?? sessionDayFromChosen ?? null);
  }, [activeSession?.id, activeSession?.routine_day_id, activeRoutine?.days, chosenRoutine?.days]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveRoutine();
    setRefreshing(false);
  }, [fetchActiveRoutine]);

  const currentDay = getCurrentDayOfWeek();
  const activeWeek = activeRoutine?.current_week ?? 1;
  const todaysWorkouts = activeRoutine?.days.filter((d) => d.week_index === activeWeek && d.day_of_week === currentDay) ?? [];
  const hasCustomWorkoutInProgress = !!activeSession && !activeSession.routine_day_id;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const todaysWorkout = todaysWorkouts.length > 0 ? todaysWorkouts[selectedDayIndex] ?? todaysWorkouts[0] : null;
  const chosenDayIsScheduledToday = !!chosenDay && todaysWorkouts.some((d) => d.id === chosenDay.id);

  const handleStartWorkout = async () => {
    const target = chosenDay ?? todaysWorkout;
    if (!user || !target) return;
    try {
      await startWorkout(user.id, target.id, target.exercises, target.week_index);
      expandWorkout();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleStartEmptyWorkout = async () => {
    if (!user) return;
    try {
      await startWorkout(user.id, null, []);
      expandWorkout();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleContinueWorkout = useCallback(async () => {
    if (!user) return;
    if (activeSession) {
      expandWorkout();
      return;
    }

    const ok = await resumeWorkout(user.id);
    if (ok) {
      expandWorkout();
    }
  }, [activeSession, expandWorkout, resumeWorkout, user]);

  const renderInProgressState = () => (
    <View>
      <Button
        title="Continue Workout"
        size="lg"
        variant="accent"
        style={styles.primaryActionBtn}
        onPress={handleContinueWorkout}
      />
      <Text style={styles.inProgress}>Workout in progress</Text>
      {activeSession && (
        <Text style={styles.duration}>
          {formatDuration(activeSession.started_at, null)}
        </Text>
      )}
    </View>
  );

  const openChooseModal = async () => {
    setShowChooseModal(true);
    setChosenRoutine(null);
    setChosenRoutineWeek(1);
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
      setChosenRoutineWeek(full.current_week);
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

  if (!activeRoutineInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

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
          {activeSession && renderInProgressState()}
        </ScrollView>
      </View>
    );
  }

  const heroRoutine = chosenDay && chosenRoutine ? chosenRoutine : activeRoutine;

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
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/(tabs)/routines/${heroRoutine.id}`)}>
        <Card style={styles.heroCard} gradientColors={gradients.accent}>
          <View style={styles.heroTopRow}>
            <Text style={styles.greeting}>{DAY_LABELS[currentDay as DayOfWeek]}</Text>
          </View>
          <Text style={styles.routineName}>{heroRoutine.name}</Text>
          <Text style={styles.heroSubtext}>
            {chosenDay && !chosenDayIsScheduledToday
              ? `Custom: Week ${chosenDay.week_index} · ${chosenDay.label}`
              : (chosenDay ?? todaysWorkout)
                ? `Week ${activeWeek} · ${(chosenDay ?? todaysWorkout)?.label}`
                : `Week ${activeWeek} · Recovery Day`}
          </Text>
        </Card>
      </TouchableOpacity>

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
        const displayWorkout = hasCustomWorkoutInProgress ? null : (chosenDay ?? todaysWorkout);
        if (!displayWorkout) {
          return (
            <>
              {hasCustomWorkoutInProgress ? (
                <Card style={styles.restDayCard}>
                  <Text style={styles.restDayTitle}>Custom Workout</Text>
                  <Text style={styles.restDayMessage}>
                    Custom workout selected. Continue when you are ready.
                  </Text>
                </Card>
              ) : (
                <TouchableOpacity activeOpacity={0.8} onPress={openChooseModal}>
                  <Card style={styles.restDayCard}>
                    <Text style={styles.restDayTitle}>Rest Day</Text>
                    <Text style={styles.restDayMessage}>
                      No workout scheduled for today. Recover and come back stronger.
                    </Text>
                  </Card>
                </TouchableOpacity>
              )}
              {activeSession ? (
                <View style={styles.restDayInProgressWrap}>
                  {renderInProgressState()}
                </View>
              ) : (
                <View style={styles.secondaryActionsRow}>
                  <Button
                    title="Choose Other Workout"
                    variant="secondary"
                    onPress={openChooseModal}
                    style={styles.chooseOtherBtn}
                  />
                  <Button
                    title="Start Empty Workout"
                    variant="secondary"
                    onPress={handleStartEmptyWorkout}
                    style={styles.startEmptyBtn}
                  />
                </View>
              )}
            </>
          );
        }
        return (
          <>
            {chosenDay && !activeSession && (
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
                  Week {displayWorkout.week_index} · {displayWorkout.exercises.length} exercises
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
                    <SupersetBracket key={ex.id} position={ssPosition} contentRadius={6} style={{ paddingLeft: 8 }}>
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
                          <View style={styles.exerciseNameWrap}>
                            <View style={styles.exerciseDot} />
                            <Text style={styles.exerciseName}>
                              {ex.exercise?.name ?? 'Exercise'}
                            </Text>
                          </View>
                          <Text style={styles.exerciseTarget}>{setsLabel}</Text>
                        </TouchableOpacity>
                        {isExpanded && ex.sets && ex.sets.length > 0 && (() => {
                          const exTypeCfg = getExerciseTypeConfig(ex.exercise?.exercise_type);
                          const showWeight = exTypeCfg.fields.some((f) => f.key === 'weight');
                          const showReps = exTypeCfg.fields.some((f) => f.key === 'reps');
                          const showDuration = exTypeCfg.fields.some((f) => f.key === 'duration');
                          const showDistance = exTypeCfg.fields.some((f) => f.key === 'distance');
                          return (
                          <View style={styles.setDetails}>
                            <View style={styles.setDetailHeader}>
                              <View style={styles.setCol}><Text style={styles.setDetailCol}>SET</Text></View>
                              {showWeight && <View style={styles.setCol}><Text style={styles.setDetailCol}>{getWeightLabel(ex.exercise?.exercise_type, weightUnitLabel(wUnit))}</Text></View>}
                              {showReps && <View style={styles.setCol}><Text style={styles.setDetailCol}>REPS</Text></View>}
                              {showDuration && <View style={styles.setCol}><Text style={styles.setDetailCol}>TIME</Text></View>}
                              {showDistance && <View style={styles.setCol}><Text style={styles.setDetailCol}>{distanceUnitLabel(dUnit)}</Text></View>}
                              {exTypeCfg.showRir && <View style={styles.setCol}><Text style={styles.setDetailCol}>RIR</Text></View>}
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
                                    {showWeight && (
                                      <View style={styles.setCol}>
                                        <Text style={styles.setDetailCell}>
                                          {s.target_weight > 0 ? formatWeight(s.target_weight, wUnit) : '-'}
                                        </Text>
                                      </View>
                                    )}
                                    {showReps && (
                                      <View style={styles.setCol}>
                                        <Text style={styles.setDetailCell}>
                                          {s.target_reps_min === s.target_reps_max
                                            ? String(s.target_reps_min)
                                            : `${s.target_reps_min}-${s.target_reps_max}`}
                                        </Text>
                                      </View>
                                    )}
                                    {showDuration && (
                                      <View style={styles.setCol}>
                                        <Text style={styles.setDetailCell}>
                                          {s.target_duration > 0 ? formatDurationValue(s.target_duration) : '-'}
                                        </Text>
                                      </View>
                                    )}
                                    {showDistance && (
                                      <View style={styles.setCol}>
                                        <Text style={styles.setDetailCell}>
                                          {s.target_distance > 0 ? formatDistance(s.target_distance, dUnit) : '-'}
                                        </Text>
                                      </View>
                                    )}
                                    {exTypeCfg.showRir && (
                                      <View style={styles.setCol}>
                                        <RirCircle value={s.target_rir ?? null} size={22} />
                                      </View>
                                    )}
                                  </View>
                                );
                              });
                            })()}
                          </View>
                          );
                        })()}
                      </View>
                    </SupersetBracket>
                  );
                });
              })()}
            </Card>

            {activeSession ? (
              renderInProgressState()
            ) : (
              <>
                <Button
                  title="Start Workout"
                  variant="accent"
                  onPress={handleStartWorkout}
                  size="lg"
                  style={styles.primaryActionBtn}
                />
                <View style={styles.secondaryActionsRow}>
                  <Button
                    title="Choose Other Workout"
                    variant="secondary"
                    onPress={openChooseModal}
                    style={styles.chooseOtherBtn}
                  />
                  <Button
                    title="Start Empty Workout"
                    variant="secondary"
                    onPress={handleStartEmptyWorkout}
                    style={styles.startEmptyBtn}
                  />
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
        showCloseButton={false}
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
            <ChipPicker
              items={Array.from({ length: chosenRoutine.week_count }, (_, idx) => ({
                key: String(idx + 1),
                label: `Week ${idx + 1}`,
                value: idx + 1,
              }))}
              selected={chosenRoutineWeek}
              onChange={(value) => setChosenRoutineWeek(value ?? chosenRoutine.current_week)}
              allowDeselect={false}
            />
            {loadingRoutines ? (
              <ActivityIndicator color={colors.text} style={{ marginVertical: 24 }} />
            ) : (
              <>
                {chosenRoutine.days.filter((d) => d.week_index === chosenRoutineWeek).map((d) => (
                  <TouchableOpacity key={d.id} style={styles.chooseRow} onPress={() => handlePickDay(d)}>
                    <Text style={styles.chooseRowText}>{d.label}</Text>
                    <Text style={styles.chooseRowSub}>Week {d.week_index} · {d.exercises.length} exercises</Text>
                  </TouchableOpacity>
                ))}
                {chosenRoutine.days.filter((d) => d.week_index === chosenRoutineWeek).length === 0 && (
                  <Text style={styles.chooseEmpty}>No days in Week {chosenRoutineWeek}</Text>
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
