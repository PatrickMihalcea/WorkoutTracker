import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRoutineStore } from '../../../../src/stores/routine.store';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { useProfileStore } from '../../../../src/stores/profile.store';
import { routineService } from '../../../../src/services';
import { confirmDeleteExercise } from '../../../../src/utils/confirmDeleteExercise';
import { DayOfWeekPicker, SwipeToDeleteRow, AddRowButton, InlineEditRow, Button, OverflowMenu, ExercisePickerModal, SupersetBracket } from '../../../../src/components/ui';
import type { OverflowMenuItem } from '../../../../src/components/ui';
import { colors, fonts } from '../../../../src/constants';
import {
  DayOfWeek,
  RoutineDayExercise,
  RoutineDayWithExercises,
  Exercise,
  WeightUnit,
  DistanceUnit,
} from '../../../../src/models';
import {
  TemplateSetRow,
  buildSetsPayload,
  setsToTemplateRows,
  validateRepRange,
  SetsTableEditor,
} from '../../../../src/components/routine/SetsTableEditor';
import { AddExerciseModal, SetsPayloadItem } from '../../../../src/components/routine/AddExerciseModal';
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
} from '../../../../src/utils/superset';
import { DayViewHeaderDropdown } from '../../../../src/components/routine/DayViewHeaderDropdown';

function SwipeableExerciseRow({
  ex,
  isExpanded,
  onToggle,
  onDetails,
  onDelete,
  onLongPress,
  menuItems,
  children,
}: {
  ex: RoutineDayExercise;
  isExpanded: boolean;
  onToggle: () => void;
  onDetails?: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
  menuItems?: OverflowMenuItem[];
  children?: React.ReactNode;
}) {
  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;

  const handleDetailsPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onDetails?.();
  };

  return (
    <SwipeToDeleteRow onDelete={onDelete} expandedHeight={500}>
      <TouchableOpacity
        style={styles.exerciseRow}
        onPress={onToggle}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseInfo}>
          <View style={styles.nameRow}>
            {onDetails ? (
              <TouchableOpacity onPress={handleDetailsPress} activeOpacity={0.7} style={styles.exerciseNameTapTarget}>
                <Text style={[styles.exerciseName, styles.exerciseNameLink]}>{ex.exercise?.name ?? 'Exercise'}
                  <Text style={styles.expandArrow}>{isExpanded ? ' ⏷' : ' ⏵'}</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
            )}
            
          </View>
          <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group?.replace(/_/g, ' ')} · {ex.exercise?.equipment?.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.exerciseTarget}>{setsLabel}</Text>
        {menuItems && <View style={styles.menuWrap}><OverflowMenu items={menuItems} /></View>}
      </TouchableOpacity>
      {isExpanded && children}
    </SwipeToDeleteRow>
  );
}

function ExerciseSetsEditor({
  entry,
  wUnit,
  dUnit,
  onSave,
}: {
  entry: RoutineDayExercise;
  wUnit: WeightUnit;
  dUnit: DistanceUnit;
  onSave: () => void;
}) {
  const initial = setsToTemplateRows(entry.sets ?? [], entry.target_reps, wUnit);
  const [useRepRange, setUseRepRange] = useState(initial.hasRepRange);
  const [rows, setRows] = useState<TemplateSetRow[]>(initial.rows);
  const mountedRef = useRef(false);

  const persist = useCallback(async (currentRows: TemplateSetRow[], repRange: boolean) => {
    if (repRange && !validateRepRange(currentRows)) return;
    const payload = buildSetsPayload(currentRows, wUnit, repRange);
    try {
      await routineService.updateExerciseSets(entry.id, payload);
      await routineService.updateDayExercise(entry.id, {
        routine_day_id: entry.routine_day_id,
        exercise_id: entry.exercise_id,
        sort_order: entry.sort_order,
        target_sets: payload.length,
        target_reps: payload[0]?.target_reps_min ?? 10,
      });
      onSave();
    } catch {
      // silent — transient save failures are acceptable
    }
  }, [entry, wUnit, onSave]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    persist(rows, useRepRange);
  }, [rows, useRepRange]);

  return (
    <View style={styles.setsEditorContainer}>
      <SetsTableEditor
        rows={rows}
        setRows={setRows}
        repRange={useRepRange}
        setRepRange={setUseRepRange}
        wUnit={wUnit}
        dUnit={dUnit}
        exerciseType={entry.exercise?.exercise_type}
      />
    </View>
  );
}

export default function DayEditorScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';

  const [day, setDay] = useState<RoutineDayWithExercises | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<DayOfWeek | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
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

  const loadDay = useCallback(() => {
    if (!currentRoutine || !dayId) return;
    const found = currentRoutine.days.find((d) => d.id === dayId);
    if (found) {
      setDay(found);
      setSelectedDayOfWeek(found.day_of_week);
    }
  }, [currentRoutine, dayId]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const refresh = () => {
    if (currentRoutine) fetchRoutineDetail(currentRoutine.id);
  };

  useEffect(() => { loadDay(); }, [currentRoutine]);

  const handleSaveLabel = async () => {
    if (!dayId || !labelDraft.trim()) {
      Alert.alert('Error', 'Label cannot be empty');
      return;
    }
    try {
      await routineService.updateDay(dayId, { label: labelDraft.trim() });
      setEditingLabel(false);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDayOfWeekChange = async (newValue: DayOfWeek | null) => {
    if (!dayId) return;
    setSelectedDayOfWeek(newValue);
    try {
      await routineService.updateDay(dayId, { day_of_week: newValue });
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleRemoveExercise = async (entryId: string) => {
    await routineService.removeDayExercise(entryId);
    refresh();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddExerciseConfirm = async (exercise: Exercise, setsPayload: SetsPayloadItem[]) => {
    if (!dayId) return;
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
      const dayExercises = day?.exercises ?? [];
      await routineService.addExerciseToDay(
        {
          routine_day_id: dayId,
          exercise_id: exercise.id,
          sort_order: dayExercises.length,
          target_sets: normalizedSets.length,
          target_reps: normalizedSets[0]?.target_reps_min ?? 10,
        },
        normalizedSets,
      );
      setShowAddExercise(false);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleReorderExercises = async (reordered: RoutineDayExercise[]) => {
    try {
      await Promise.all(
        reordered.map((ex, i) =>
          routineService.updateDayExercise(ex.id, { sort_order: i })
        )
      );
      refresh();
    } catch {
      Alert.alert('Error', 'Could not reorder exercises.');
    }
  };

  const handleDeleteExercise = (exercise: Exercise, onDeleted?: () => void) =>
    confirmDeleteExercise(exercise, user?.id ?? '', () => {
      refresh();
      onDeleted?.();
    });

  const applySupersetChanges = async (dayExercises: RoutineDayExercise[], updated: SupersetGroups) => {
    for (const ex of dayExercises) {
      const newGroup = updated[ex.id] ?? null;
      const oldGroup = ex.superset_group ?? null;
      if (newGroup !== oldGroup) {
        await routineService.setSupersetGroup(ex.id, newGroup);
      }
    }
    refresh();
  };

  const handleExSupersetPrev = async (entryId: string) => {
    if (!day) return;
    const idx = day.exercises.findIndex((e) => e.id === entryId);
    if (idx <= 0) return;
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const updated = supersetPrev(day.exercises, idx, groups);
    await applySupersetChanges(day.exercises, updated);
  };

  const handleExSupersetNext = async (entryId: string) => {
    if (!day) return;
    const idx = day.exercises.findIndex((e) => e.id === entryId);
    if (idx < 0 || idx >= day.exercises.length - 1) return;
    const groups: SupersetGroups = {};
    for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
    const updated = supersetNext(day.exercises, idx, groups);
    await applySupersetChanges(day.exercises, updated);
  };

  const handleExSeparate = async (entryId: string) => {
    if (!day) return;
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

  const handleExDuplicate = async (entryId: string) => {
    if (!dayId) return;
    try {
      await routineService.duplicateExercise(entryId, dayId);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleExSwapStart = (entryId: string) => {
    setSwapEntryId(entryId);
    setShowSwapPicker(true);
  };

  const handleExSwapSelect = async (exercise: Exercise) => {
    if (!swapEntryId) return;
    try {
      await routineService.changeExercise(swapEntryId, exercise.id);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
    setShowSwapPicker(false);
    setSwapEntryId(null);
  };

  const handleSwapDeletedWithoutReplacement = (exercise: Exercise) => {
    if (!swapEntryId || !day) return;
    const entryId = swapEntryId;
    const targetEntry = day.exercises.find((item) => item.id === entryId);
    if (!targetEntry || targetEntry.exercise_id !== exercise.id) return;
    void handleExRemove(entryId);
    setShowSwapPicker(false);
    setSwapEntryId(null);
  };

  const handleExRemove = async (entryId: string) => {
    if (!day) return;
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
    refresh();
  };

  const buildExerciseMenuItems = (ex: RoutineDayExercise, idx: number): OverflowMenuItem[] => {
    if (!day) return [];
    const items: OverflowMenuItem[] = [];
    const myGroup = ex.superset_group ?? null;
    const prevGroup = idx > 0 ? (day.exercises[idx - 1].superset_group ?? null) : null;
    const nextGroup = idx < day.exercises.length - 1 ? (day.exercises[idx + 1].superset_group ?? null) : null;
    if (idx > 0 && (!myGroup || myGroup !== prevGroup))
      items.push({ label: 'Superset Prev', onPress: () => handleExSupersetPrev(ex.id) });
    if (idx < day.exercises.length - 1 && (!myGroup || myGroup !== nextGroup))
      items.push({ label: 'Superset Next', onPress: () => handleExSupersetNext(ex.id) });
    if (myGroup)
      items.push({ label: 'Separate', onPress: () => handleExSeparate(ex.id) });
    items.push({ label: 'Swap', onPress: () => handleExSwapStart(ex.id) });
    items.push({ label: 'Duplicate', onPress: () => handleExDuplicate(ex.id) });
    items.push({ label: 'Delete', onPress: () => handleExRemove(ex.id), destructive: true });
    return items;
  };

  const handleRemoveDay = useCallback(() => {
    if (!day || !dayId) return;
    Alert.alert('Delete Day', `Remove "${day.label}" from this routine?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await routineService.deleteDay(dayId);
          if (currentRoutine) fetchRoutineDetail(currentRoutine.id);
          router.back();
        },
      },
    ]);
  }, [day, dayId, currentRoutine, fetchRoutineDetail, router]);

  if (!day) return null;


  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => <DayViewHeaderDropdown dayId={dayId ?? ''} currentView="edit" />,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEnabled={!isReordering}
      >
        {editingLabel ? (
          <InlineEditRow
            value={labelDraft}
            onChangeText={setLabelDraft}
            onSave={handleSaveLabel}
            onCancel={() => setEditingLabel(false)}
          />
        ) : (
          <TouchableOpacity
            onPress={() => { setLabelDraft(day.label); setEditingLabel(true); }}
            style={styles.labelRow}
          >
            <Text style={styles.labelTitle}>{day.label}</Text>
            <Text style={styles.weekMeta}>Week {day.week_index}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Day of Week (optional)</Text>
        <DayOfWeekPicker selected={selectedDayOfWeek} onChange={handleDayOfWeekChange} />

        <Text style={styles.sectionLabel}>Exercises</Text>

        <DraggableFlatList
          data={(() => {
            const groups: SupersetGroups = {};
            for (const ex of day.exercises) groups[ex.id] = ex.superset_group ?? null;
            return buildReorderItems(day.exercises, groups);
          })()}
          keyExtractor={(item) => item.type === 'single' ? item.entry.id : item.groupId}
          scrollEnabled={false}
          activationDistance={20}
          onDragBegin={() => setIsReordering(true)}
          onRelease={() => setIsReordering(false)}
          onDragEnd={({ data }) => {
            setIsReordering(false);
            const flat = flattenReorderItems(data);
            handleReorderExercises(flat);
          }}
          renderItem={({ item, drag }: RenderItemParams<ReorderItem>) => (
            <ScaleDecorator>
              {item.type === 'single' ? (
                <SwipeableExerciseRow
                  ex={item.entry}
                  isExpanded={expandedIds.has(item.entry.id)}
                  onToggle={() => toggleExpand(item.entry.id)}
                  onDetails={() => navigateToExerciseDetail(item.entry.exercise_id)}
                  onDelete={() => handleExRemove(item.entry.id)}
                  onLongPress={drag}
                  menuItems={buildExerciseMenuItems(item.entry, day.exercises.indexOf(item.entry))}
                >
                  <ExerciseSetsEditor entry={item.entry} wUnit={wUnit} dUnit={dUnit} onSave={refresh} />
                </SwipeableExerciseRow>
              ) : (
                <View>
                  {item.entries.map((entry, idx) => {
                    const pos = idx === 0 ? 'first' as const : idx === item.entries.length - 1 ? 'last' as const : 'middle' as const;
                    return (
                      <SupersetBracket key={entry.id} position={pos} contentRadius={6}>
                        <SwipeableExerciseRow
                          ex={entry}
                          isExpanded={expandedIds.has(entry.id)}
                          onToggle={() => toggleExpand(entry.id)}
                          onDetails={() => navigateToExerciseDetail(entry.exercise_id)}
                          onDelete={() => handleExRemove(entry.id)}
                          onLongPress={drag}
                          menuItems={buildExerciseMenuItems(entry, day.exercises.indexOf(entry))}
                        >
                          <ExerciseSetsEditor entry={entry} wUnit={wUnit} dUnit={dUnit} onSave={refresh} />
                        </SwipeableExerciseRow>
                      </SupersetBracket>
                    );
                  })}
                </View>
              )}
            </ScaleDecorator>
          )}
        />

        <AddRowButton label="+ Add Exercise" onPress={() => setShowAddExercise(true)} />

        <TouchableOpacity onPress={handleRemoveDay} style={styles.removeDayBtn}>
          <Text style={styles.removeDayText}>Remove Day</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => { setShowAddExercise(false); setAutoOpenPicker(false); }}
        onConfirm={handleAddExerciseConfirm}
        weightUnit={wUnit}
        distanceUnit={dUnit}
        onDeleteExercise={handleDeleteExercise}
        onExerciseDetails={(id) => navigateToExerciseDetail(id, 'add')}
        autoOpenPicker={autoOpenPicker}
      />

      <ExercisePickerModal
        visible={showSwapPicker}
        onClose={() => { setShowSwapPicker(false); setSwapEntryId(null); }}
        onSelect={handleExSwapSelect}
        onDeletedSelectedWithoutReplacement={handleSwapDeletedWithoutReplacement}
        selectedExerciseId={swapEntryId ? (day?.exercises.find((entry) => entry.id === swapEntryId)?.exercise_id ?? null) : null}
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
    padding: 20,
    paddingBottom: 40,
  },
  labelRow: {
    marginBottom: 20,
  },
  labelTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  weekMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  exerciseInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  exerciseNameLink: {
    color: '#98c6fb',
  },
  exerciseNameTapTarget: {
    alignSelf: 'flex-start',
  },
  expandArrow: {
    fontSize: 12,
    color: colors.textMuted,
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
    marginRight: 8,
  },
  menuWrap: {
    marginLeft: 4,
    alignSelf: 'center',
  },
  setsEditorContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removeDayBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  removeDayText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#FF6B6B',
  },
});
