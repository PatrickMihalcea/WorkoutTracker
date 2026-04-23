import React, { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { useWorkoutOverlay } from '../../../src/components/workout';
import { routineService, notificationService } from '../../../src/services';
import { MAX_ROUTINE_WEEKS, type AddWeekMode } from '../../../src/services/routine.service';
import { confirmDeleteExercise } from '../../../src/utils/confirmDeleteExercise';
import { Button, Input, Card, DayOfWeekPicker, SwipeToDeleteRow, BottomSheetModal, AddRowButton, InlineEditRow, OverflowMenu, Toast, ExercisePickerModal, SupersetBracket, ChipPicker } from '../../../src/components/ui';
import type { OverflowMenuItem } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  RoutineDayExercise,
  Exercise,
  WeightUnit,
  DistanceUnit,
} from '../../../src/models';
import { SetsPayloadItem } from '../../../src/components/routine/AddExerciseModal';
import {
  TemplateSetRow,
  buildSetsPayload,
  setsToTemplateRows,
  validateRepRange,
  SetsTableEditor,
} from '../../../src/components/routine/SetsTableEditor';
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
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EXERCISE_THUMB_PLACEHOLDER = require('../../../assets/Setora-black-and-white.png');

function ExerciseSetsEditor({
  entry,
  wUnit,
  dUnit,
  onSave,
  styles,
}: {
  entry: RoutineDayExercise;
  wUnit: WeightUnit;
  dUnit: DistanceUnit;
  onSave: () => void;
  styles: Record<string, any>;
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
  }, [rows, useRepRange]); // eslint-disable-line react-hooks/exhaustive-deps

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

function SwipeableExerciseRow({
  ex,
  isExpanded,
  onToggle,
  onDetails,
  onDelete,
  onLongPress,
  menuItems,
  children,
  styles,
}: {
  ex: RoutineDayExercise;
  isExpanded: boolean;
  onToggle: () => void;
  onDetails?: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
  menuItems?: OverflowMenuItem[];
  children?: React.ReactNode;
  styles: Record<string, any>;
}) {
  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;
  const thumbnailUrl = ex.exercise?.thumbnail_url
    ?? ((ex.exercise?.media_type === 'image' || ex.exercise?.media_type === 'gif')
      ? ex.exercise.media_url
      : null);
  const thumbnailSource = thumbnailUrl ? { uri: thumbnailUrl } : EXERCISE_THUMB_PLACEHOLDER;
  const [nameBlockWidth, setNameBlockWidth] = useState<number | null>(null);
  const [nameMaxWidth, setNameMaxWidth] = useState<number | null>(null);

  const handleDetailsPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onDetails?.();
  };

  useEffect(() => {
    setNameBlockWidth(null);
  }, [ex.exercise?.name]);

  const handleNameLayout = useCallback((event: { nativeEvent: { lines: Array<{ width: number }> } }) => {
    const lines = event.nativeEvent.lines;
    if (!lines || lines.length === 0) return;
    const widest = Math.ceil(Math.max(...lines.map((line) => line.width)));
    setNameBlockWidth((prev) => (prev != null && Math.abs(prev - widest) < 1 ? prev : widest));
  }, []);

  const handleNameContainerLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
    setNameMaxWidth((prev) => (prev != null && Math.abs(prev - nextWidth) < 1 ? prev : nextWidth));
  }, []);

  const resolvedNameWidth = useMemo(() => {
    if (nameBlockWidth == null) return null;
    if (nameMaxWidth == null) return nameBlockWidth;
    return Math.min(nameBlockWidth, nameMaxWidth);
  }, [nameBlockWidth, nameMaxWidth]);

  return (
    <SwipeToDeleteRow onDelete={onDelete} expandedHeight={500}>
      <TouchableOpacity
        style={styles.exerciseRow}
        onPress={onToggle}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseIdentity}>
          {onDetails ? (
            <TouchableOpacity onPress={handleDetailsPress} activeOpacity={0.7}>
              <Image source={thumbnailSource} style={styles.exerciseThumb} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <Image source={thumbnailSource} style={styles.exerciseThumb} resizeMode="cover" />
          )}
          <View style={styles.exerciseInfo} onLayout={handleNameContainerLayout}>
            <View style={styles.nameRow}>
              <View style={[styles.nameTextBlock, resolvedNameWidth ? { width: resolvedNameWidth } : null]}>
                {onDetails ? (
                  <Text onPress={handleDetailsPress} onTextLayout={handleNameLayout} style={[styles.exerciseName, styles.exerciseNameLink]}>
                    {ex.exercise?.name ?? 'Exercise'}
                  </Text>
                ) : (
                  <Text onTextLayout={handleNameLayout} style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
                )}
              </View>
              <Ionicons
                style={styles.expandArrow}
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              />
            </View>
            <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group?.replace(/_/g, ' ')} · {ex.exercise?.equipment?.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <View style={styles.exerciseActions}>
          <Text style={styles.exerciseTarget}>{setsLabel}</Text>
          {menuItems && <View style={styles.menuWrap}><OverflowMenu items={menuItems} /></View>}
        </View>
      </TouchableOpacity>
      {isExpanded && children}
    </SwipeToDeleteRow>
  );
}

export default function RoutineDetailScreen() {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scrollEnabled } = useChartInteraction();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { routines, currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile, updateProfile } = useProfileStore();
  const { expand: expandWorkout } = useWorkoutOverlay();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [dayLabel, setDayLabel] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [updatingWeeks, setUpdatingWeeks] = useState(false);
  const [addingWeek, setAddingWeek] = useState(false);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [addWeekMode, setAddWeekMode] = useState<AddWeekMode>('progressive_ai');
  const [selectedAddWeekSource, setSelectedAddWeekSource] = useState<number | null>(null);
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [copyActionMode, setCopyActionMode] = useState<'from' | 'to' | null>(null);
  const [selectedCopyWeekValue, setSelectedCopyWeekValue] = useState<number | 'new' | null>(null);

  const [showCopyDayModal, setShowCopyDayModal] = useState(false);
  const [copyDaySource, setCopyDaySource] = useState<RoutineDayWithExercises | null>(null);
  const [copyDayTargetRoutineId, setCopyDayTargetRoutineId] = useState<string | null>(null);
  const [copyDayTargetWeek, setCopyDayTargetWeek] = useState<number | null>(null);
  const [copyingDay, setCopyingDay] = useState(false);

  const [showDirectAddPicker, setShowDirectAddPicker] = useState(false);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const perfExpanded = profile?.show_routine_performance ?? true;
  const [reorderingDayId, setReorderingDayId] = useState<string | null>(null);
  const [swapDayId, setSwapDayId] = useState<string | null>(null);
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((entryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  }, []);
  const pendingPickerReopenRef = useRef<'swap' | 'add' | null>(null);

  useFocusEffect(useCallback(() => {
    const which = pendingPickerReopenRef.current;
    if (which) {
      pendingPickerReopenRef.current = null;
      if (which === 'swap') {
        setShowSwapPicker(true);
      } else if (which === 'add') {
        setShowDirectAddPicker(true);
      }
    }
  }, []));

  const openExerciseDetail = useCallback((exerciseId: string) => {
    const href = `/exercise/${exerciseId}` as const;
    if (pathname.startsWith('/exercise/')) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, [pathname, router]);

  const navigateToExerciseDetail = useCallback((exerciseId: string, source?: 'swap' | 'add') => {
    if (source) pendingPickerReopenRef.current = source;
    setShowSwapPicker(false);
    setShowDirectAddPicker(false);
    setTimeout(() => openExerciseDetail(exerciseId), 280);
  }, [openExerciseDetail]);

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

  const visibleWeekCount = useMemo(() => {
    if (!currentRoutine) return 0;
    return Math.min(currentRoutine.week_count, MAX_ROUTINE_WEEKS);
  }, [currentRoutine]);

  const weekItems = useMemo(() => {
    if (!currentRoutine || visibleWeekCount <= 0) return [];
    return Array.from({ length: visibleWeekCount }, (_, index) => {
      const week = index + 1;
      return { key: String(week), label: `W${week}`, value: week };
    });
  }, [currentRoutine, visibleWeekCount]);

  const copyWeekOptions = useMemo(() => {
    if (!currentRoutine || !copyActionMode) return [];
    const viewedWeek = selectedWeek;
    const weekChoices = Array.from({ length: visibleWeekCount }, (_, index) => {
      const week = index + 1;
      return { key: `week-${week}`, label: `Week ${week}`, value: week as number | 'new' };
    }).filter((item) => item.value !== viewedWeek);

    if (copyActionMode === 'to' && currentRoutine.week_count < MAX_ROUTINE_WEEKS) {
      weekChoices.push({ key: 'week-new', label: '+ New Week', value: 'new' });
    }

    return weekChoices;
  }, [currentRoutine, copyActionMode, selectedWeek, visibleWeekCount]);

  const addWeekSourceOptions = useMemo(() => {
    if (!currentRoutine) return [];
    return Array.from({ length: visibleWeekCount }, (_, index) => {
      const week = index + 1;
      return { key: `add-week-${week}`, label: `Week ${week}`, value: week };
    });
  }, [currentRoutine, visibleWeekCount]);

  const deferredSelectedWeek = useDeferredValue(selectedWeek);

  const selectedWeekDays = useMemo(() => {
    if (!currentRoutine) return [];
    return currentRoutine.days.filter((d) => d.week_index === deferredSelectedWeek);
  }, [currentRoutine, deferredSelectedWeek]);

  useEffect(() => {
    if (id) fetchRoutineDetail(id);
  }, [id, fetchRoutineDetail]);

  useEffect(() => {
    if (!currentRoutine) return;
    setSelectedWeek((prev) => {
      const fallbackWeek = Math.min(currentRoutine.current_week, visibleWeekCount || 1);
      if (prev < 1) return fallbackWeek;
      if (prev > visibleWeekCount) return fallbackWeek;
      return prev;
    });
  }, [currentRoutine, visibleWeekCount]);

  useEffect(() => {
    if (!currentRoutine) return;
    setSelectedAddWeekSource((prev) => {
      if (prev && prev >= 1 && prev <= visibleWeekCount) return prev;
      return selectedWeek >= 1 && selectedWeek <= visibleWeekCount
        ? selectedWeek
        : visibleWeekCount;
    });
  }, [currentRoutine, selectedWeek, visibleWeekCount]);

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
        week_index: selectedWeek,
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

  const openDirectAddPicker = (dayId: string) => {
    setAddExerciseDayId(dayId);
    setShowDirectAddPicker(true);
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
      const dayExercises = currentRoutine?.days.find(
        (d) => d.id === addExerciseDayId,
      )?.exercises ?? [];
      const newEntry = await routineService.addExerciseToDay(
        {
          routine_day_id: addExerciseDayId,
          exercise_id: exercise.id,
          sort_order: dayExercises.length,
          target_sets: normalizedSets.length,
          target_reps: normalizedSets[0]?.target_reps_min ?? 10,
        },
        normalizedSets,
      );
      setExpandedIds((prev) => new Set([...prev, newEntry.id]));
      setShowDirectAddPicker(false);
      if (id) fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteExercise = (exercise: Exercise, onDeleted?: () => void) =>
    confirmDeleteExercise(exercise, user?.id ?? '', () => {
      if (id) fetchRoutineDetail(id);
      onDeleted?.();
    });

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

  const handleStartDay = useCallback((day: RoutineDayWithExercises) => {
    if (!user) return;
    const doStart = async () => {
      try {
        await startWorkout(user.id, day.id, day.exercises, day.week_index);
        expandWorkout();
      } catch (error: unknown) {
        Alert.alert('Error', (error as Error).message);
      }
    };
    if (activeSession) {
      Alert.alert(
        'Workout In Progress',
        'Starting this workout will cancel your current session. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Anyway', style: 'destructive', onPress: () => void doStart() },
        ],
      );
    } else {
      void doStart();
    }
  }, [activeSession, user, startWorkout, expandWorkout]);

  const copyDayRoutineOptions = useMemo(() =>
    routines.map((r) => ({ key: r.id, label: r.name, value: r.id })),
  [routines]);

  const copyDayWeekOptions = useMemo(() => {
    const target = routines.find((r) => r.id === copyDayTargetRoutineId);
    if (!target) return [];
    return Array.from({ length: target.week_count }, (_, i) => ({
      key: `cdw-${i + 1}`,
      label: `Week ${i + 1}`,
      value: i + 1,
    }));
  }, [routines, copyDayTargetRoutineId]);

  const openCopyDayModal = useCallback((day: RoutineDayWithExercises) => {
    setCopyDaySource(day);
    setCopyDayTargetRoutineId(id ?? null);
    setCopyDayTargetWeek(selectedWeek);
    setShowCopyDayModal(true);
  }, [id, selectedWeek]);

  const handleConfirmCopyDay = useCallback(async () => {
    if (!copyDaySource || !copyDayTargetRoutineId || copyDayTargetWeek == null) return;
    setCopyingDay(true);
    try {
      await routineService.copyDayTo(copyDaySource.id, copyDayTargetRoutineId, copyDayTargetWeek);
      setShowCopyDayModal(false);
      if (copyDayTargetRoutineId === id && id) fetchRoutineDetail(id);
      const targetName = routines.find((r) => r.id === copyDayTargetRoutineId)?.name ?? 'routine';
      setToastMessage(`Copied "${copyDaySource.label}" to ${targetName} · Week ${copyDayTargetWeek}.`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setCopyingDay(false);
    }
  }, [copyDaySource, copyDayTargetRoutineId, copyDayTargetWeek, id, routines, fetchRoutineDetail]);

  const openAddWeekMenu = useCallback(() => {
    if (!currentRoutine || updatingWeeks) return;
    if (currentRoutine.week_count >= MAX_ROUTINE_WEEKS) {
      Alert.alert('Maximum reached', `You can have up to ${MAX_ROUTINE_WEEKS} weeks.`);
      return;
    }
    setAddWeekMode('progressive_ai');
    setSelectedAddWeekSource(selectedWeek >= 1 && selectedWeek <= visibleWeekCount
      ? selectedWeek
      : visibleWeekCount);
    setShowAddWeekModal(true);
  }, [currentRoutine, selectedWeek, updatingWeeks, visibleWeekCount]);

  const handleConfirmAddWeek = useCallback(async () => {
    if (!currentRoutine || !id || updatingWeeks) return;
    if (addWeekMode === 'copy_exact' && selectedAddWeekSource == null) return;
    if (currentRoutine.week_count >= MAX_ROUTINE_WEEKS) {
      Alert.alert('Maximum reached', `You can have up to ${MAX_ROUTINE_WEEKS} weeks.`);
      return;
    }

    setAddingWeek(true);
    setUpdatingWeeks(true);
    try {
      const newWeek = await routineService.addWeekWithMode({
        routineId: id,
        mode: addWeekMode,
        sourceWeekIndex: addWeekMode === 'copy_exact' ? selectedAddWeekSource ?? undefined : undefined,
      });
      setSelectedWeek(newWeek);
      await fetchRoutineDetail(id);
      setShowAddWeekModal(false);

      if (addWeekMode === 'empty') {
        setToastMessage(`Created empty Week ${newWeek}.`);
      } else if (addWeekMode === 'copy_exact') {
        setToastMessage(`Copied Week ${selectedAddWeekSource} to new Week ${newWeek}.`);
      } else {
        setToastMessage(`Built Week ${newWeek} with progressive overload.`);
      }
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setAddingWeek(false);
      setUpdatingWeeks(false);
    }
  }, [
    currentRoutine,
    id,
    updatingWeeks,
    addWeekMode,
    selectedAddWeekSource,
    fetchRoutineDetail,
  ]);

  const handleDeleteSelectedWeek = useCallback(async () => {
    if (!currentRoutine || !id || currentRoutine.week_count <= 1 || updatingWeeks) return;
    const deletingWeek = selectedWeek;
    Alert.alert(
      'Delete Week',
      `Delete week ${deletingWeek} from this routine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdatingWeeks(true);
            try {
              await routineService.deleteWeek(id, deletingWeek);
              setSelectedWeek(Math.min(deletingWeek, currentRoutine.week_count - 1));
              await fetchRoutineDetail(id);
            } catch (error: unknown) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setUpdatingWeeks(false);
            }
          },
        },
      ],
    );
  }, [currentRoutine, id, selectedWeek, fetchRoutineDetail, updatingWeeks]);

  const handleSetActiveWeek = useCallback(async () => {
    if (!currentRoutine || !id) return;
    if (currentRoutine.current_week === selectedWeek) return;
    try {
      await routineService.setCurrentWeek(id, selectedWeek);
      await fetchRoutineDetail(id);
      void notificationService.syncWorkoutDayReminder(profile);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [currentRoutine, id, selectedWeek, fetchRoutineDetail, profile]);

  const executeCopyWeek = useCallback(async (sourceWeek: number, targetWeek: number, toast: string) => {
    if (!currentRoutine || !id || updatingWeeks) return;
    setUpdatingWeeks(true);
    try {
      await routineService.copyWeek(id, sourceWeek, targetWeek);
      await fetchRoutineDetail(id);
      setToastMessage(toast);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setUpdatingWeeks(false);
    }
  }, [currentRoutine, id, fetchRoutineDetail, updatingWeeks]);

  const executeCopyToNewWeek = useCallback(async (sourceWeek: number) => {
    if (!currentRoutine || !id || updatingWeeks) return;
    if (currentRoutine.week_count >= MAX_ROUTINE_WEEKS) {
      Alert.alert('Maximum reached', `You can have up to ${MAX_ROUTINE_WEEKS} weeks.`);
      return;
    }
    setUpdatingWeeks(true);
    try {
      const nextWeek = await routineService.addWeekWithMode({
        routineId: id,
        mode: 'copy_exact',
        sourceWeekIndex: sourceWeek,
      });
      setSelectedWeek(nextWeek);
      await fetchRoutineDetail(id);
      setToastMessage(`Copied Week ${sourceWeek} to new Week ${nextWeek}.`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setUpdatingWeeks(false);
    }
  }, [currentRoutine, id, fetchRoutineDetail, updatingWeeks]);

  const openCopyFromMenu = useCallback(() => {
    if (!currentRoutine || updatingWeeks || currentRoutine.week_count <= 1) return;
    setCopyActionMode('from');
    setSelectedCopyWeekValue(null);
    setShowCopyWeekModal(true);
  }, [currentRoutine, updatingWeeks]);

  const openCopyToMenu = useCallback(() => {
    if (!currentRoutine || updatingWeeks) return;
    setCopyActionMode('to');
    setSelectedCopyWeekValue(null);
    setShowCopyWeekModal(true);
  }, [currentRoutine, updatingWeeks]);

  const handleConfirmCopyWeekSelection = useCallback(() => {
    if (!currentRoutine || !id || !copyActionMode || selectedCopyWeekValue == null || updatingWeeks) return;

    const viewedWeek = selectedWeek;
    setShowCopyWeekModal(false);

    if (copyActionMode === 'from') {
      if (typeof selectedCopyWeekValue !== 'number') return;
      const sourceWeek = selectedCopyWeekValue;
      Alert.alert(
        'Copy From',
        `Copy week ${sourceWeek} into week ${viewedWeek}? This will replace all days in week ${viewedWeek}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              void executeCopyWeek(
                sourceWeek,
                viewedWeek,
                `Copied Week ${sourceWeek} to Week ${viewedWeek}.`,
              );
            },
          },
        ],
      );
      return;
    }

    if (selectedCopyWeekValue === 'new') {
      const newWeek = currentRoutine.week_count + 1;
      Alert.alert(
        'Copy To',
        `Copy week ${viewedWeek} to new week ${newWeek}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              void executeCopyToNewWeek(viewedWeek);
            },
          },
        ],
      );
      return;
    }

    const targetWeek = selectedCopyWeekValue;
    Alert.alert(
      'Copy To',
      `Copy week ${viewedWeek} to week ${targetWeek}? This will replace all days in week ${targetWeek}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            void executeCopyWeek(
              viewedWeek,
              targetWeek,
              `Copied Week ${viewedWeek} to Week ${targetWeek}.`,
            );
          },
        },
      ],
    );
  }, [
    currentRoutine,
    id,
    copyActionMode,
    selectedCopyWeekValue,
    selectedWeek,
    updatingWeeks,
    executeCopyWeek,
    executeCopyToNewWeek,
  ]);

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

  const handleSwapDeletedWithoutReplacement = (exercise: Exercise) => {
    if (!swapEntryId || !swapDayId || !currentRoutine) return;
    const entryId = swapEntryId;
    const dayId = swapDayId;
    const day = currentRoutine.days.find((item) => item.id === dayId);
    const targetEntry = day?.exercises.find((item) => item.id === entryId);
    if (!day || !targetEntry || targetEntry.exercise_id !== exercise.id) return;
    void handleExRemove(entryId, day);
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
      label: 'Details',
      onPress: () => router.push(`/(tabs)/routines/day-details/${day.id}`),
    },
    {
      label: 'Edit Day',
      onPress: () => router.push(`/(tabs)/routines/day/${day.id}`),
    },
    {
      label: 'Start Day',
      onPress: () => handleStartDay(day),
    },
    {
      label: 'Copy To',
      onPress: () => openCopyDayModal(day),
    },
    {
      label: 'Remove',
      onPress: () => handleDeleteDay(day.id, day.label),
      destructive: true,
    },
  ], [handleStartDay, openCopyDayModal, handleDeleteDay, router]);

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
            onPress={() => {
              const ids = day.exercises.map((e) => e.id);
              const allExpanded = ids.length > 0 && ids.every((eid) => expandedIds.has(eid));
              setExpandedIds((prev) => {
                const next = new Set(prev);
                if (allExpanded) ids.forEach((eid) => next.delete(eid));
                else ids.forEach((eid) => next.add(eid));
                return next;
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dayOfWeek}>
              {day.day_of_week ? DAY_LABELS[day.day_of_week as DayOfWeek] : 'No day assigned'} · Week {day.week_index}
            </Text>
            <Text style={styles.dayLabel}>{day.label}</Text>
          </TouchableOpacity>
          <OverflowMenu items={buildDayMenuItems(day)} />
        </View>

        <DraggableFlatList
          data={reorderData}
          keyExtractor={(item) => item.type === 'single' ? item.entry.id : item.groupId}
          scrollEnabled={false}
          activationDistance={20}
          onDragBegin={() => setReorderingDayId(day.id)}
          onRelease={() => setReorderingDayId(null)}
          onDragEnd={({ data }) => {
            setReorderingDayId(null);
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
                  onDelete={() => handleExRemove(item.entry.id, day)}
                  onLongPress={drag}
                  menuItems={buildExerciseMenuItems(day, item.entry, day.exercises.indexOf(item.entry))}
                  styles={styles}
                >
                  <ExerciseSetsEditor
                    entry={item.entry}
                    wUnit={wUnit}
                    dUnit={dUnit}
                    onSave={() => { if (id) fetchRoutineDetail(id); }}
                    styles={styles}
                  />
                </SwipeableExerciseRow>
              ) : (
                <View>
                  {item.entries.map((entry, idx) => {
                    const pos = idx === 0 ? 'first' as const : idx === item.entries.length - 1 ? 'last' as const : 'middle' as const;
                    return (
                      <SupersetBracket key={entry.id} position={pos} contentRadius={6} style={{ paddingLeft: 8 }}>
                        <SwipeableExerciseRow
                          ex={entry}
                          isExpanded={expandedIds.has(entry.id)}
                          onToggle={() => toggleExpand(entry.id)}
                          onDetails={() => navigateToExerciseDetail(entry.exercise_id)}
                          onDelete={() => handleExRemove(entry.id, day)}
                          onLongPress={drag}
                          menuItems={buildExerciseMenuItems(day, entry, day.exercises.indexOf(entry))}
                          styles={styles}
                        >
                          <ExerciseSetsEditor
                            entry={entry}
                            wUnit={wUnit}
                            dUnit={dUnit}
                            onSave={() => { if (id) fetchRoutineDetail(id); }}
                            styles={styles}
                          />
                        </SwipeableExerciseRow>
                      </SupersetBracket>
                    );
                  })}
                </View>
              )}
            </ScaleDecorator>
          )}
        />

        <AddRowButton label="+ Add Exercise" onPress={() => openDirectAddPicker(day.id)} borderTop />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Toast message={toastMessage} visible={!!toastMessage} onDismiss={() => setToastMessage('')} />
      <ScrollView
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled && !reorderingDayId}
      >
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

        <Text style={styles.weekMeta}>
          Active Week: {Math.min(currentRoutine.current_week, MAX_ROUTINE_WEEKS)} / {visibleWeekCount}
        </Text>
        <ChipPicker
          items={weekItems}
          selected={selectedWeek}
          onChange={(week) => {
            if (typeof week === 'number') {
              setSelectedWeek(week);
            }
          }}
          allowDeselect={false}
          keyboardPersistTaps
          horizontal={false}
          chipStyle={styles.weekChip}
          getChipStyle={(item, isSelected) => {
            const isActiveWeek = item.value === currentRoutine.current_week;
            if (!isActiveWeek) return undefined;
            return isSelected ? styles.weekChipActiveSelected : styles.weekChipActive;
          }}
          getChipTextStyle={(item, isSelected) => {
            const isActiveWeek = item.value === currentRoutine.current_week;
            if (!isActiveWeek) return undefined;
            return isSelected ? styles.weekChipActiveTextSelected : styles.weekChipActiveText;
          }}
          getChipGradientColors={(item, isSelected) => {
            const isActiveWeek = item.value === currentRoutine.current_week;
            if (!isActiveWeek || !isSelected) return undefined;
            return gradients.accent;
          }}
        />
        {addingWeek && (
          <View style={styles.weekLoadingNotice}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.weekLoadingText}>Building your new week...</Text>
          </View>
        )}
        <View style={styles.weekActionsInline}>
          <TouchableOpacity
            style={[
              styles.weekMiniBtn,
              styles.weekMinusBtn,
              (updatingWeeks || currentRoutine.week_count <= 1) && styles.weekMiniBtnDisabled,
            ]}
            onPress={handleDeleteSelectedWeek}
            disabled={updatingWeeks || currentRoutine.week_count <= 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekMiniBtnText, styles.weekMinusText]}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.weekMiniBtn,
              styles.weekPlusBtn,
              (updatingWeeks || currentRoutine.week_count >= MAX_ROUTINE_WEEKS) && styles.weekMiniBtnDisabled,
            ]}
            onPress={openAddWeekMenu}
            disabled={updatingWeeks || currentRoutine.week_count >= MAX_ROUTINE_WEEKS}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekMiniBtnText, styles.weekPlusText]}>+</Text>
          </TouchableOpacity>
          <Button
            title="Copy To"
            variant="secondary"
            size="sm"
            onPress={openCopyToMenu}
            disabled={updatingWeeks}
            style={styles.weekActionBtn}
          />
          <Button
            title="Copy From"
            variant="secondary"
            size="sm"
            onPress={openCopyFromMenu}
            disabled={updatingWeeks || currentRoutine.week_count <= 1}
            style={styles.weekActionBtn}
          />
        </View>
        {!updatingWeeks && selectedWeek !== currentRoutine.current_week && (
          <Button
            title={`Set Week ${selectedWeek} Active`}
            variant="secondary"
            onPress={handleSetActiveWeek}
            style={styles.activeWeekBtn}
          />
        )}

        <TouchableOpacity
          style={styles.subHeaderRow}
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            updateProfile({ show_routine_performance: !perfExpanded });
          }}
        >
          <Text style={styles.subHeader}>
            Performance
            <Ionicons
              style={styles.chevron}
              name={perfExpanded ? 'chevron-down' : 'chevron-forward'}
            />
          </Text>
          
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

        <Text style={styles.subHeader}>Routine · Week {deferredSelectedWeek}</Text>

        {selectedWeekDays.length > 0 ? (
          selectedWeekDays.map(renderDay)
        ) : (
          <Card style={styles.emptyWeekCard}>
            <Text style={styles.emptyWeekText}>No days in Week {deferredSelectedWeek} yet.</Text>
          </Card>
        )}

        <Button
          title="+ Add Day"
          variant="secondary"
          onPress={() => setShowAddDay(true)}
        />
      </ScrollView>

      <BottomSheetModal
        visible={showCopyWeekModal}
        title={copyActionMode === 'from' ? 'Copy From' : 'Copy To'}
        onClose={() => setShowCopyWeekModal(false)}
      >
        <Text style={styles.copyWeekHelper}>
          {copyActionMode === 'from'
            ? `Choose which week to copy into week ${selectedWeek}.`
            : `Choose where to copy week ${selectedWeek}.`}
        </Text>

        <ChipPicker
          items={copyWeekOptions}
          selected={selectedCopyWeekValue}
          onChange={setSelectedCopyWeekValue}
          allowDeselect={false}
          keyboardPersistTaps
          horizontal={false}
          maxHeight={220}
        />

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowCopyWeekModal(false)}
          />
          <Button
            title="Copy"
            variant="accent"
            onPress={handleConfirmCopyWeekSelection}
            disabled={selectedCopyWeekValue == null || updatingWeeks}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={showAddWeekModal}
        title="Add Week"
        onClose={() => {
          if (!addingWeek) setShowAddWeekModal(false);
        }}
      >
        <Text style={styles.copyWeekHelper}>
          Choose how Week {currentRoutine.week_count + 1} should be created.
        </Text>

        <ChipPicker
          items={[
            { key: 'add-copy', label: 'Copy From', value: 'copy_exact' as AddWeekMode },
            { key: 'add-empty', label: 'Make Empty', value: 'empty' as AddWeekMode },
            { key: 'add-ai', label: 'AI Progressively Overload', value: 'progressive_ai' as AddWeekMode, tooltip: 'Our agent analyzes your entire routine and automatically increases weights, reps, or sets to keep you progressing without changing the exercises. \n\nNote: Week 5 is modified to be a deloading week.' },
          ]}
          selected={addWeekMode}
          onChange={(value) => setAddWeekMode((value ?? 'progressive_ai') as AddWeekMode)}
          allowDeselect={false}
          keyboardPersistTaps
          horizontal={false}
          style={addingWeek ? styles.disabledSection : undefined}
        />

        {addWeekMode === 'copy_exact' && (
          <>
            <Text style={styles.fieldLabel}>Source Week</Text>
            <ChipPicker
              items={addWeekSourceOptions}
              selected={selectedAddWeekSource}
              onChange={(value) => setSelectedAddWeekSource(value ?? null)}
              allowDeselect={false}
              keyboardPersistTaps
              horizontal={false}
              maxHeight={180}
              style={addingWeek ? styles.disabledSection : undefined}
            />
          </>
        )}

        {addingWeek && (
          <View style={styles.weekLoadingNotice}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.weekLoadingText}>Adding week and applying progression...</Text>
          </View>
        )}

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowAddWeekModal(false)}
            disabled={addingWeek}
          />
          <Button
            title={addingWeek ? 'Adding...' : 'Add Week'}
            variant="accent"
            onPress={handleConfirmAddWeek}
            disabled={addingWeek || updatingWeeks || (addWeekMode !== 'empty' && selectedAddWeekSource == null)}
          />
        </View>
      </BottomSheetModal>

      {/* Add Day Modal */}
      <BottomSheetModal visible={showAddDay} title="Add Training Day" onClose={() => setShowAddDay(false)} showCloseButton={false}>
            <Text style={styles.fieldLabel}>Week {selectedWeek}</Text>
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
              <Button title="Add Day" variant="accent" onPress={handleAddDay} />
            </View>
      </BottomSheetModal>

      <ExercisePickerModal
        visible={showSwapPicker}
        onClose={() => { setShowSwapPicker(false); setSwapEntryId(null); setSwapDayId(null); }}
        onSelect={handleExSwapSelect}
        onDeletedSelectedWithoutReplacement={handleSwapDeletedWithoutReplacement}
        selectedExerciseId={swapEntryId && swapDayId
          ? (currentRoutine?.days.find((day) => day.id === swapDayId)?.exercises.find((entry) => entry.id === swapEntryId)?.exercise_id ?? null)
          : null}
        onExerciseDetails={(id) => navigateToExerciseDetail(id, 'swap')}
      />

      <ExercisePickerModal
        visible={showDirectAddPicker}
        onClose={() => setShowDirectAddPicker(false)}
        onSelect={(exercise) => {
          setShowDirectAddPicker(false);
          handleAddExerciseConfirm(exercise, [{
            set_number: 1, target_weight: 0,
            target_reps_min: 8, target_reps_max: 12, target_rir: null,
          }]);
        }}
        onExerciseDetails={(id) => navigateToExerciseDetail(id, 'add')}
      />

      <BottomSheetModal
        visible={showCopyDayModal}
        title={`Copy "${copyDaySource?.label ?? 'Day'}"`}
        onClose={() => { if (!copyingDay) setShowCopyDayModal(false); }}
        scrollable
      >
        <Text style={styles.fieldLabel}>Routine</Text>
        <ChipPicker
          items={copyDayRoutineOptions}
          selected={copyDayTargetRoutineId}
          onChange={(val) => {
            setCopyDayTargetRoutineId(val ?? null);
            setCopyDayTargetWeek(1);
          }}
          allowDeselect={false}
          keyboardPersistTaps
          horizontal={false}
          maxHeight={160}
          style={copyingDay ? styles.disabledSection : undefined}
        />
        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Week</Text>
        <ChipPicker
          items={copyDayWeekOptions}
          selected={copyDayTargetWeek}
          onChange={(val) => setCopyDayTargetWeek(val ?? null)}
          allowDeselect={false}
          keyboardPersistTaps
          horizontal={false}
          maxHeight={160}
          style={copyingDay ? styles.disabledSection : undefined}
        />
        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowCopyDayModal(false)}
            disabled={copyingDay}
          />
          <Button
            title={copyingDay ? 'Copying...' : 'Copy'}
            variant="accent"
            onPress={handleConfirmCopyDay}
            disabled={copyingDay || !copyDayTargetRoutineId || copyDayTargetWeek == null}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl+50,
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
    alignSelf: 'flex-start',
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
  weekMeta: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  weekChip: {
    minHeight: 30,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weekChipActive: {
    borderColor: colors.border,
    backgroundColor: colors.accentDim,
  },
  weekChipActiveSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
    shadowColor: colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  weekChipActiveText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
  },
  weekChipActiveTextSelected: {
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  weekActionsInline: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 8,
  },
  weekLoadingNotice: {
    marginTop: -6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekLoadingText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  weekMiniBtn: {
    width: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekMiniBtnDisabled: {
    opacity: 0.45,
  },
  weekMinusBtn: {
    borderColor: '#FF5A5A',
  },
  weekPlusBtn: {
    borderColor: colors.text,
  },
  weekMiniBtnText: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: fonts.bold,
  },
  weekMinusText: {
    color: '#FF5A5A',
  },
  weekPlusText: {
    color: colors.text,
  },
  weekActionBtn: {
    flex: 1,
  },
  copyWeekHelper: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 10,
  },
  activeWeekBtn: {
    marginBottom: 6,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  dayCard: {
    marginBottom: 16,
  },
  emptyWeekCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyWeekText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
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
    color: colors.textSecondary,
    paddingBottom: 4,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'transparent',
  },
  exerciseIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
  },
  exerciseInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nameTextBlock: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  expandArrow: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 2,
    flexShrink: 0,
    alignSelf: 'center',
  },
  setsEditorContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
    flexShrink: 1,
  },
  exerciseNameLink: {
    color: colors.accent,
  },
  exerciseNameTapTarget: {
    alignSelf: 'flex-start',
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
    minWidth: 58,
    textAlign: 'right',
    flexShrink: 0,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
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
  disabledSection: {
    opacity: 0.65,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
});
