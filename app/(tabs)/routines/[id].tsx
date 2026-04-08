import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { routineService } from '../../../src/services';
import { confirmDeleteExercise } from '../../../src/utils/confirmDeleteExercise';
import { Button, Input, Card, DayOfWeekPicker, SwipeToDeleteRow, BottomSheetModal, AddRowButton, InlineEditRow, OverflowMenu, Toast, ExercisePickerModal, SupersetBracket } from '../../../src/components/ui';
import type { OverflowMenuItem } from '../../../src/components/ui';
import { colors, fonts, spacing } from '../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  RoutineDayExercise,
  Exercise,
} from '../../../src/models';
import { AddExerciseModal, SetsPayloadItem } from '../../../src/components/routine/AddExerciseModal';
import { RoutineStatsChart } from '../../../src/components/routine/RoutineStatsChart';
import { MuscleHeatmap } from '../../../src/components/history/MuscleHeatmap';
import { useChartInteraction } from '../../../src/components/charts';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
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
} from '../../../src/utils/superset';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SwipeableExerciseRow({
  ex,
  onEdit,
  onDelete,
  onLongPress,
  menuItems,
}: {
  ex: RoutineDayExercise;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
  menuItems?: OverflowMenuItem[];
}) {
  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;

  return (
    <SwipeToDeleteRow onDelete={onDelete} expandedHeight={80}>
      <TouchableOpacity
        style={styles.exerciseRow}
        onPress={onEdit}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
          <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group?.replace(/_/g, ' ')} · {ex.exercise?.equipment?.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.exerciseTarget}>{setsLabel}</Text>
        {menuItems && <View style={styles.menuWrap}><OverflowMenu items={menuItems} /></View>}
      </TouchableOpacity>
    </SwipeToDeleteRow>
  );
}

export default function RoutineDetailScreen() {
  const { scrollEnabled } = useChartInteraction();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile, updateProfile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [dayLabel, setDayLabel] = useState('');

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<RoutineDayExercise | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const perfExpanded = profile?.show_routine_performance ?? true;
  const [reorderingDayId, setReorderingDayId] = useState<string | null>(null);
  const [swapDayId, setSwapDayId] = useState<string | null>(null);
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [autoOpenPicker, setAutoOpenPicker] = useState(false);
  const pendingPickerReopenRef = useRef<'swap' | 'add' | null>(null);

  useFocusEffect(useCallback(() => {
    const which = pendingPickerReopenRef.current;
    if (which) {
      pendingPickerReopenRef.current = null;
      if (which === 'swap') {
        setShowSwapPicker(true);
      } else if (which === 'add') {
        setAutoOpenPicker(true);
        setShowAddExercise(true);
      }
    }
  }, []));

  const navigateToExerciseDetail = useCallback((exerciseId: string, source?: 'swap' | 'add') => {
    if (source) pendingPickerReopenRef.current = source;
    setShowSwapPicker(false);
    setShowAddExercise(false);
    setTimeout(() => router.push(`/exercise/${exerciseId}`), 280);
  }, [router]);

  const { session: activeSession, startWorkout } = useWorkoutStore();

  const routineMuscleData = useMemo(() => {
    if (!currentRoutine) return [];
    const counts = new Map<string, number>();
    for (const day of currentRoutine.days) {
      for (const ex of day.exercises) {
        const group = ex.exercise?.muscle_group;
        if (!group || group === 'full_body') continue;
        counts.set(group, (counts.get(group) ?? 0) + (ex.sets?.length ?? ex.target_sets));
      }
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([group, count]) => ({
        label: group,
        value: Math.round((count / total) * 100),
      }));
  }, [currentRoutine]);

  useEffect(() => {
    if (id) fetchRoutineDetail(id);
  }, [id, fetchRoutineDetail]);

  const handleAddDay = async () => {
    if (!id || !dayLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for this day');
      return;
    }
    try {
      await routineService.addDay({
        routine_id: id,
        day_of_week: selectedDay,
        label: dayLabel.trim(),
      });
      setShowAddDay(false);
      setDayLabel('');
      fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteDay = useCallback((dayId: string, label: string) => {
    Alert.alert('Delete Day', `Remove "${label}" from this routine?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await routineService.deleteDay(dayId);
          if (id) fetchRoutineDetail(id);
        },
      },
    ]);
  }, [id, fetchRoutineDetail]);

  const openAddExercise = (dayId: string) => {
    setAddExerciseDayId(dayId);
    setEditingEntry(null);
    setShowAddExercise(true);
  };

  const handleAddExerciseConfirm = async (exercise: Exercise, setsPayload: SetsPayloadItem[]) => {
    if (!addExerciseDayId) return;
    const normalizedSets = setsPayload.map((s) => ({
      set_number: s.set_number,
      target_weight: s.target_weight,
      target_reps_min: s.target_reps_min,
      target_reps_max: s.target_reps_max,
      target_rir: s.target_rir ?? null,
      target_duration: s.target_duration ?? 0,
      target_distance: s.target_distance ?? 0,
      is_warmup: s.is_warmup ?? false,
    }));
    try {
      if (editingEntry) {
        if (editingEntry.exercise_id !== exercise.id) {
          await routineService.changeExercise(editingEntry.id, exercise.id);
        }
        await routineService.updateExerciseSets(editingEntry.id, normalizedSets);
        await routineService.updateDayExercise(editingEntry.id, {
          routine_day_id: editingEntry.routine_day_id,
          exercise_id: exercise.id,
          sort_order: editingEntry.sort_order,
          target_sets: normalizedSets.length,
          target_reps: normalizedSets[0]?.target_reps_min ?? 10,
        });
      } else {
        const dayExercises = currentRoutine?.days.find(
          (d) => d.id === addExerciseDayId,
        )?.exercises ?? [];
        await routineService.addExerciseToDay(
          {
            routine_day_id: addExerciseDayId,
            exercise_id: exercise.id,
            sort_order: dayExercises.length,
            target_sets: normalizedSets.length,
            target_reps: normalizedSets[0]?.target_reps_min ?? 10,
          },
          normalizedSets,
        );
      }
      setShowAddExercise(false);
      setEditingEntry(null);
      if (id) fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteExercise = (exercise: Exercise) =>
    confirmDeleteExercise(exercise, user?.id ?? '', () => { if (id) fetchRoutineDetail(id); });

  const handleRemoveExercise = async (entryId: string) => {
    await routineService.removeDayExercise(entryId);
    if (id) fetchRoutineDetail(id);
  };

  const handleStartEditName = () => {
    if (!currentRoutine) return;
    setNameDraft(currentRoutine.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!id || !nameDraft.trim()) {
      Alert.alert('Error', 'Routine name cannot be empty');
      return;
    }
    try {
      await routineService.update(id, { name: nameDraft.trim() });
      fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
    setEditingName(false);
  };

  const handleReorderExercises = async (reordered: RoutineDayExercise[]) => {
    try {
      await Promise.all(
        reordered.map((ex, i) =>
          routineService.updateDayExercise(ex.id, { sort_order: i })
        )
      );
      if (id) fetchRoutineDetail(id);
    } catch {
      Alert.alert('Error', 'Could not reorder exercises.');
    }
  };

  const handleOpenExerciseEdit = (entry: RoutineDayExercise, dayId: string) => {
    setEditingEntry(entry);
    setAddExerciseDayId(dayId);
    setShowAddExercise(true);
  };

  const handleStartDay = useCallback(async (day: RoutineDayWithExercises) => {
    if (activeSession) {
      setToastMessage('Cannot start during active workout.');
      return;
    }
    if (!user) return;
    try {
      await startWorkout(user.id, day.id, day.exercises);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [activeSession, user, startWorkout]);

  const handleDuplicateDay = useCallback(async (day: RoutineDayWithExercises) => {
    try {
      const newDay = await routineService.duplicateDay(day.id);
      if (id) fetchRoutineDetail(id);
      router.push(`/(tabs)/routines/day/${newDay.id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [id, fetchRoutineDetail, router]);

  const applySupersetChanges = async (dayExercises: RoutineDayExercise[], updated: SupersetGroups) => {
    for (const ex of dayExercises) {
      const newGroup = updated[ex.id] ?? null;
      const oldGroup = ex.superset_group ?? null;
      if (newGroup !== oldGroup) {
        await routineService.setSupersetGroup(ex.id, newGroup);
      }
    }
    if (id) fetchRoutineDetail(id);
  };

  const handleExSupersetPrev = async (day: RoutineDayWithExercises, entryId: string) => {
    const idx = day.exercises.findIndex((e) => e.id === entryId);
    if (idx <= 0) return;
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const updated = supersetPrev(day.exercises, idx, groups);
    await applySupersetChanges(day.exercises, updated);
  };

  const handleExSupersetNext = async (day: RoutineDayWithExercises, entryId: string) => {
    const idx = day.exercises.findIndex((e) => e.id === entryId);
    if (idx < 0 || idx >= day.exercises.length - 1) return;
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const updated = supersetNext(day.exercises, idx, groups);
    await applySupersetChanges(day.exercises, updated);
  };

  const handleExSeparate = async (day: RoutineDayWithExercises, entryId: string) => {
    const idx = day.exercises.findIndex((e) => e.id === entryId);
    if (idx < 0) return;
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const result = separateFromSuperset(day.exercises, idx, groups);
    await applySupersetChanges(day.exercises, result.groups);
    if (result.exercises !== day.exercises) {
      await handleReorderExercises(result.exercises);
    }
  };

  const handleExDuplicate = async (entryId: string, dayId: string) => {
    try {
      await routineService.duplicateExercise(entryId, dayId);
      if (id) fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleExSwapStart = (entryId: string, dayId: string) => {
    setSwapEntryId(entryId);
    setSwapDayId(dayId);
    setShowSwapPicker(true);
  };

  const handleExSwapSelect = async (exercise: Exercise) => {
    if (!swapEntryId) return;
    try {
      await routineService.changeExercise(swapEntryId, exercise.id);
      if (id) fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
    setShowSwapPicker(false);
    setSwapEntryId(null);
    setSwapDayId(null);
  };

  const handleExRemove = async (entryId: string, day: RoutineDayWithExercises) => {
    await routineService.removeDayExercise(entryId);
    const remaining = day.exercises.filter((e) => e.id !== entryId);
    const groups: SupersetGroups = {};
    for (const ex of remaining) groups[ex.id] = ex.superset_group ?? null;
    const cleaned = autoCleanAfterDelete(remaining, groups);
    for (const ex of remaining) {
      if ((cleaned[ex.id] ?? null) !== (ex.superset_group ?? null)) {
        await routineService.setSupersetGroup(ex.id, cleaned[ex.id] ?? null);
      }
    }
    if (id) fetchRoutineDetail(id);
  };

  const buildExerciseMenuItems = (day: RoutineDayWithExercises, ex: RoutineDayExercise, idx: number): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [];
    items.push({ label: 'Details', onPress: () => navigateToExerciseDetail(ex.exercise_id) });
    const myGroup = ex.superset_group ?? null;
    const prevGroup = idx > 0 ? (day.exercises[idx - 1].superset_group ?? null) : null;
    const nextGroup = idx < day.exercises.length - 1 ? (day.exercises[idx + 1].superset_group ?? null) : null;
    if (idx > 0 && (!myGroup || myGroup !== prevGroup))
      items.push({ label: 'Superset Prev', onPress: () => handleExSupersetPrev(day, ex.id) });
    if (idx < day.exercises.length - 1 && (!myGroup || myGroup !== nextGroup))
      items.push({ label: 'Superset Next', onPress: () => handleExSupersetNext(day, ex.id) });
    if (myGroup)
      items.push({ label: 'Separate', onPress: () => handleExSeparate(day, ex.id) });
    items.push({ label: 'Swap', onPress: () => handleExSwapStart(ex.id, day.id) });
    items.push({ label: 'Duplicate', onPress: () => handleExDuplicate(ex.id, day.id) });
    items.push({ label: 'Delete', onPress: () => handleExRemove(ex.id, day), destructive: true });
    return items;
  };

  const buildDayMenuItems = useCallback((day: RoutineDayWithExercises): OverflowMenuItem[] => [
    {
      label: 'Start Day',
      onPress: () => handleStartDay(day),
      disabled: !!activeSession,
    },
    {
      label: 'Duplicate',
      onPress: () => handleDuplicateDay(day),
    },
    {
      label: 'Remove',
      onPress: () => handleDeleteDay(day.id, day.label),
      destructive: true,
    },
  ], [activeSession, handleStartDay, handleDuplicateDay, handleDeleteDay]);

  if (!currentRoutine) return null;

  const renderDay = (day: RoutineDayWithExercises) => {
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const reorderData = buildReorderItems(day.exercises, groups);

    return (
      <Card key={day.id} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push(`/(tabs)/routines/day/${day.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.dayLabel}>{day.label}</Text>
            <Text style={styles.dayOfWeek}>
              {day.day_of_week ? DAY_LABELS[day.day_of_week as DayOfWeek] : 'No day assigned'}
            </Text>
          </TouchableOpacity>
          <OverflowMenu items={buildDayMenuItems(day)} />
        </View>

        <DraggableFlatList
          data={reorderData}
          keyExtractor={(item) => item.type === 'single' ? item.entry.id : item.groupId}
          scrollEnabled={false}
          onDragEnd={({ data }) => {
            const flat = flattenReorderItems(data);
            handleReorderExercises(flat);
          }}
          renderItem={({ item, drag }: RenderItemParams<ReorderItem>) => (
            <ScaleDecorator>
              {item.type === 'single' ? (
                <SwipeableExerciseRow
                  ex={item.entry}
                  onEdit={() => handleOpenExerciseEdit(item.entry, day.id)}
                  onDelete={() => handleExRemove(item.entry.id, day)}
                  onLongPress={drag}
                  menuItems={buildExerciseMenuItems(day, item.entry, day.exercises.indexOf(item.entry))}
                />
              ) : (
                <View>
                  {item.entries.map((entry, idx) => {
                    const pos = idx === 0 ? 'first' as const : idx === item.entries.length - 1 ? 'last' as const : 'middle' as const;
                    return (
                      <SupersetBracket key={entry.id} position={pos}>
                        <SwipeableExerciseRow
                          ex={entry}
                          onEdit={() => handleOpenExerciseEdit(entry, day.id)}
                          onDelete={() => handleExRemove(entry.id, day)}
                          onLongPress={drag}
                          menuItems={buildExerciseMenuItems(day, entry, day.exercises.indexOf(entry))}
                        />
                      </SupersetBracket>
                    );
                  })}
                </View>
              )}
            </ScaleDecorator>
          )}
        />

        <AddRowButton label="+ Add Exercise" onPress={() => openAddExercise(day.id)} borderTop />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Toast message={toastMessage} visible={!!toastMessage} onDismiss={() => setToastMessage('')} />
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets scrollEnabled={scrollEnabled}>
        {editingName ? (
          <InlineEditRow
            value={nameDraft}
            onChangeText={setNameDraft}
            onSave={handleSaveName}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <TouchableOpacity onPress={handleStartEditName} style={styles.titleRow}>
            <Text style={styles.title}>{currentRoutine.name}</Text>
            <Image source={require('../../../assets/icons/edit.png')} style={styles.editHintIcon} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.subHeaderRow}
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            updateProfile({ show_routine_performance: !perfExpanded });
          }}
        >
          <Text style={styles.subHeader}>Performance</Text>
          <Text style={styles.chevron}>{perfExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {perfExpanded && (
          <>
            {id && <RoutineStatsChart routineId={id} />}
            {routineMuscleData.length > 0 && (
              <MuscleHeatmap
                data={routineMuscleData}
                title="Targeted Muscles"
                subtitle="Set distribution by muscle group"
              />
            )}
          </>
        )}

        <Text style={styles.subHeader}>Routine</Text>

        {currentRoutine.days.map(renderDay)}

        <Button
          title="+ Add Day"
          variant="secondary"
          onPress={() => setShowAddDay(true)}
        />
      </ScrollView>

      {/* Add Day Modal */}
      <BottomSheetModal visible={showAddDay} title="Add Training Day" onClose={() => setShowAddDay(false)} showCloseButton={false}>
            <Text style={styles.fieldLabel}>Day of Week (optional)</Text>
            <DayOfWeekPicker selected={selectedDay} onChange={setSelectedDay} />

            <Input
              label="Label"
              value={dayLabel}
              onChangeText={setDayLabel}
              placeholder='e.g. "Push Day" or "Upper Body"'
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowAddDay(false)}
              />
              <Button title="Add Day" onPress={handleAddDay} />
            </View>
      </BottomSheetModal>

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => {
          setShowAddExercise(false);
          setEditingEntry(null);
          setAutoOpenPicker(false);
        }}
        onConfirm={handleAddExerciseConfirm}
        weightUnit={wUnit}
        distanceUnit={dUnit}
        editingEntry={editingEntry}
        onDeleteExercise={handleDeleteExercise}
        onExerciseDetails={(id) => navigateToExerciseDetail(id, 'add')}
        autoOpenPicker={autoOpenPicker}
      />

      <ExercisePickerModal
        visible={showSwapPicker}
        onClose={() => { setShowSwapPicker(false); setSwapEntryId(null); setSwapDayId(null); }}
        onSelect={handleExSwapSelect}
        onExerciseDetails={(id) => navigateToExerciseDetail(id, 'swap')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  editHintIcon: {
    width: 18,
    height: 18,
    tintColor: colors.textMuted,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dayCard: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  dayOfWeek: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  exerciseTarget: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  menuWrap: {
    marginLeft: 8,
    alignSelf: 'center',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
});
