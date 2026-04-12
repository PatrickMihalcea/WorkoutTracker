import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { routineService, sessionService } from '../../../src/services';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Card, Input, Button, BottomSheetModal, OverflowMenu, ExercisePickerModal, SupersetBracket, RirCircle } from '../../../src/components/ui';
import type { OverflowMenuItem } from '../../../src/components/ui';
import { SetRow } from '../../../src/components/workout/SetRow';
import { MetricRing } from '../../../src/components/history/MetricRing';
import { colors, fonts, spacing } from '../../../src/constants';
import { SessionWithSetsAndExercises, SetLogWithExercise, WorkoutRow, Exercise, RoutineDayExercise, RoutineDayWithExercises } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';
import { formatWeight, formatDistance, formatDistanceValue, parseWeightToKg, weightUnitLabel, distanceUnitLabel, milesToKm } from '../../../src/utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../../src/utils/exerciseType';
import { formatDurationValue } from '../../../src/utils/duration';
import {
  autoCleanAfterDelete,
  getSupersetPosition,
  separateFromSuperset,
  supersetNext,
  supersetPrev,
  type SupersetGroups,
} from '../../../src/utils/superset';

interface ExerciseGroup {
  key: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  exerciseType?: string;
  exerciseOrder: number;
  supersetGroup: string | null;
  sets: SetLogWithExercise[];
}

interface ExerciseEditorState {
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  exerciseType?: string;
  exerciseOrder: number;
  supersetGroup: string | null;
  originalSetIds: string[];
  rows: WorkoutRow[];
}

const TEMP_SET_PREFIX = 'temp-set-';

function formatMuscleGroupLabel(muscleGroup: string): string {
  if (!muscleGroup) return '';
  return muscleGroup
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function groupSetsByExercise(sets: SetLogWithExercise[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  const map = new Map<string, ExerciseGroup>();

  for (const set of sets) {
    const orderKey = set.exercise_order != null ? `order_${set.exercise_order}` : `legacy_${set.exercise_id}`;
    const key = `${orderKey}_${set.exercise_id}`;
    const existing = map.get(key);
    if (existing) {
      existing.sets.push(set);
    } else {
      const group: ExerciseGroup = {
        key,
        exerciseId: set.exercise_id,
        exerciseName: set.exercise?.name ?? 'Unknown',
        muscleGroup: set.exercise?.muscle_group ?? '',
        exerciseType: set.exercise?.exercise_type,
        exerciseOrder: set.exercise_order ?? groups.length,
        supersetGroup: set.superset_group ?? null,
        sets: [set],
      };
      map.set(key, group);
      groups.push(group);
    }
  }

  return groups
    .map((group) => ({
      ...group,
      sets: [...group.sets].sort((a, b) => a.set_number - b.set_number),
    }))
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder);
}

function computeDurationMinutes(startedAt: string, completedAt: string | null): number {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 60000));
}

function toWorkoutRows(sets: SetLogWithExercise[], weightUnit: 'kg' | 'lbs', distUnit: 'km' | 'miles'): WorkoutRow[] {
  return sets.map((set) => ({
    id: set.id,
    session_id: set.session_id,
    exercise_id: set.exercise_id,
    routine_day_exercise_id: '',
    set_number: set.set_number,
    weight: formatWeight(set.weight, weightUnit),
    reps: String(set.reps_performed),
    rir: set.rir != null ? String(set.rir) : '',
    duration: set.duration > 0 ? String(set.duration) : '',
    distance: set.distance > 0 ? formatDistanceValue(set.distance, distUnit) : '',
    is_completed: true,
    is_warmup: set.is_warmup,
    target_weight: 0,
    target_reps_min: 0,
    target_reps_max: 0,
    target_duration: 0,
    target_distance: 0,
    exercise_order: set.exercise_order ?? 0,
    superset_group: set.superset_group ?? null,
  }));
}

function parseNonNegativeFloat(value: string): number {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function parseNonNegativeInt(value: string): number {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function isTempSetId(id: string): boolean {
  return id.startsWith(TEMP_SET_PREFIX);
}

function renumberRows(rows: WorkoutRow[]): WorkoutRow[] {
  return rows.map((row, index) => ({ ...row, set_number: index + 1 }));
}

function buildSupersetEntries(groups: ExerciseGroup[]): RoutineDayExercise[] {
  return groups.map((group, index) => ({
    id: group.key,
    routine_day_id: '',
    exercise_id: group.exerciseId,
    sort_order: index,
    target_sets: 0,
    target_reps: 0,
    superset_group: group.supersetGroup,
    exercise: group.sets[0]?.exercise,
  }));
}

function buildSupersetGroupMap(groups: ExerciseGroup[]): SupersetGroups {
  const mapped: SupersetGroups = {};
  for (const group of groups) {
    mapped[group.key] = group.supersetGroup ?? null;
  }
  return mapped;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function formatStatNumber(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const rounded = Math.round(value);
  return rounded.toLocaleString();
}

function formatCompactStat(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  const trimmed = (n: number) => {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  };
  if (abs >= 1_000_000) {
    if (abs >= 10_000_000) return `${Math.round(value / 1_000_000)}m`;
    return `${trimmed(value / 1_000_000)}m`;
  }
  if (abs >= 1_000) {
    if (abs >= 10_000) return `${Math.round(value / 1_000)}k`;
    return `${trimmed(value / 1_000)}k`;
  }
  return formatStatNumber(value);
}

function computeTemplateTargets(day: RoutineDayWithExercises): {
  exerciseTarget: number;
  setTarget: number;
  volumeTarget: number;
} {
  let setTarget = 0;
  let volumeTarget = 0;

  for (const ex of day.exercises) {
    const templateSets = ex.sets && ex.sets.length > 0 ? ex.sets : null;
    if (!templateSets) {
      setTarget += ex.target_sets ?? 0;
      continue;
    }

    setTarget += templateSets.length;
    for (const set of templateSets) {
      const min = set.target_reps_min > 0 ? set.target_reps_min : 0;
      const max = set.target_reps_max > 0 ? set.target_reps_max : 0;
      const reps = min > 0 && max > 0
        ? Math.round((min + max) / 2)
        : min > 0
          ? min
          : max > 0
            ? max
            : ex.target_reps > 0
              ? ex.target_reps
              : 0;
      volumeTarget += (set.target_weight ?? 0) * reps;
    }
  }

  return {
    exerciseTarget: day.exercises.length,
    setTarget,
    volumeTarget,
  };
}

export default function SessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { profile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const distUnit = profile?.distance_unit ?? 'km';
  const [session, setSession] = useState<SessionWithSetsAndExercises | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [editDuration, setEditDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [exerciseEditor, setExerciseEditor] = useState<ExerciseEditorState | null>(null);
  const [savingExerciseSets, setSavingExerciseSets] = useState(false);
  const [tempSetCounter, setTempSetCounter] = useState(0);
  const [swapGroupKey, setSwapGroupKey] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [updatingGroups, setUpdatingGroups] = useState(false);
  const [routineDayTemplate, setRoutineDayTemplate] = useState<RoutineDayWithExercises | null>(null);
  const [templateResolved, setTemplateResolved] = useState(false);

  const loadSession = async () => {
    if (!sessionId) return;
    try {
      const data = await sessionService.getByIdWithExercises(sessionId);
      setSession(data);
    } catch {
      // Handle quietly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    if (!session?.routine_day_id) {
      setRoutineDayTemplate(null);
      setTemplateResolved(true);
      return () => {
        active = false;
      };
    }

    setRoutineDayTemplate(null);
    setTemplateResolved(false);
    routineService.getDayWithExercises(session.routine_day_id)
      .then((day) => {
        if (active) {
          setRoutineDayTemplate(day);
          setTemplateResolved(true);
        }
      })
      .catch(() => {
        if (active) {
          setRoutineDayTemplate(null);
          setTemplateResolved(true);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.routine_day_id]);

  const openEditModal = () => {
    if (!session) return;
    const start = new Date(session.started_at);
    setEditDate(start);
    setEditTime(start);
    setEditDuration(String(computeDurationMinutes(session.started_at, session.completed_at)));
    setShowDatePicker(Platform.OS === 'ios');
    setShowTimePicker(Platform.OS === 'ios');
    setShowEdit(true);
  };

  const endTime = useMemo(() => {
    const d = new Date(editDate);
    d.setHours(editTime.getHours(), editTime.getMinutes(), 0, 0);
    const mins = parseInt(editDuration, 10) || 0;
    return new Date(d.getTime() + mins * 60000);
  }, [editDate, editTime, editDuration]);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setEditDate(date);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setEditTime(date);
  };

  const handleSaveEdit = async () => {
    if (!session) return;
    const mins = parseInt(editDuration, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }

    const startedAt = new Date(editDate);
    startedAt.setHours(editTime.getHours(), editTime.getMinutes(), 0, 0);
    const completedAt = new Date(startedAt.getTime() + mins * 60000);

    try {
      await sessionService.updateSession(session.id, {
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
      });
      setShowEdit(false);
      setLoading(true);
      await loadSession();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const openExerciseEditor = (group: ExerciseGroup) => {
    const rows = toWorkoutRows(group.sets, weightUnit, distUnit);
    setExerciseEditor({
      sessionId: group.sets[0]?.session_id ?? session?.id ?? '',
      exerciseId: group.exerciseId,
      exerciseName: group.exerciseName,
      exerciseType: group.exerciseType,
      exerciseOrder: group.sets[0]?.exercise_order ?? 0,
      supersetGroup: group.supersetGroup ?? null,
      originalSetIds: group.sets.map((set) => set.id),
      rows: renumberRows(rows),
    });
  };

  const updateExerciseRow = (rowId: string, updates: Partial<WorkoutRow>) => {
    setExerciseEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
      };
    });
  };

  const addExerciseSet = (warmup: boolean) => {
    setExerciseEditor((prev) => {
      if (!prev) return prev;
      const nextTempId = `${TEMP_SET_PREFIX}${tempSetCounter + 1}`;
      const base = prev.rows[0];
      const newRow: WorkoutRow = {
        id: nextTempId,
        session_id: prev.sessionId,
        exercise_id: prev.exerciseId,
        routine_day_exercise_id: '',
        set_number: prev.rows.length + 1,
        weight: '',
        reps: '',
        rir: '',
        duration: '',
        distance: '',
        is_completed: true,
        is_warmup: warmup,
        target_weight: 0,
        target_reps_min: 0,
        target_reps_max: 0,
        target_duration: 0,
        target_distance: 0,
        exercise_order: prev.exerciseOrder ?? base?.exercise_order ?? 0,
        superset_group: prev.supersetGroup,
      };

      setTempSetCounter((n) => n + 1);

      if (!warmup) {
        return { ...prev, rows: renumberRows([...prev.rows, newRow]) };
      }

      const warmups = prev.rows.filter((row) => row.is_warmup);
      const working = prev.rows.filter((row) => !row.is_warmup);
      return { ...prev, rows: renumberRows([...warmups, newRow, ...working]) };
    });
  };

  const removeExerciseRow = (rowId: string) => {
    setExerciseEditor((prev) => {
      if (!prev) return prev;
      const filtered = prev.rows.filter((row) => row.id !== rowId);
      return { ...prev, rows: renumberRows(filtered) };
    });
  };

  const toggleExerciseWarmup = (rowId: string) => {
    setExerciseEditor((prev) => {
      if (!prev) return prev;
      const nextRows = prev.rows.map((row) => (
        row.id === rowId ? { ...row, is_warmup: !row.is_warmup } : row
      ));
      const warmups = nextRows.filter((row) => row.is_warmup);
      const working = nextRows.filter((row) => !row.is_warmup);
      return { ...prev, rows: renumberRows([...warmups, ...working]) };
    });
  };

  const saveExerciseSets = async () => {
    if (!exerciseEditor) return;
    if (exerciseEditor.rows.length === 0) {
      Alert.alert('Missing Sets', 'Add at least one set before saving.');
      return;
    }
    try {
      setSavingExerciseSets(true);
      const rows = renumberRows(exerciseEditor.rows);
      const originalIds = new Set(exerciseEditor.originalSetIds);
      const remainingPersistedIds = new Set(
        rows.filter((row) => !isTempSetId(row.id)).map((row) => row.id),
      );
      const deletedIds = exerciseEditor.originalSetIds.filter((id) => !remainingPersistedIds.has(id));

      const upserts = rows.map((row) => {
        const distanceValue = parseNonNegativeFloat(row.distance);
        const payload = {
          weight: parseWeightToKg(parseNonNegativeFloat(row.weight), weightUnit),
          reps_performed: parseNonNegativeInt(row.reps),
          rir: row.rir.trim() === '' ? null : parseNonNegativeFloat(row.rir),
          duration: parseNonNegativeFloat(row.duration),
          distance: distUnit === 'miles' ? milesToKm(distanceValue) : distanceValue,
          set_number: row.set_number,
          is_warmup: row.is_warmup,
          exercise_order: exerciseEditor.exerciseOrder,
          superset_group: exerciseEditor.supersetGroup,
        };

        if (isTempSetId(row.id)) {
          return sessionService.addSet({
            session_id: exerciseEditor.sessionId,
            exercise_id: exerciseEditor.exerciseId,
            set_number: row.set_number,
            weight: payload.weight,
            reps_performed: payload.reps_performed,
            rir: payload.rir,
            is_warmup: payload.is_warmup,
            exercise_order: payload.exercise_order,
            superset_group: payload.superset_group,
            duration: payload.duration,
            distance: payload.distance,
          });
        }

        if (!originalIds.has(row.id)) {
          return Promise.resolve(null);
        }

        return sessionService.updateSet(row.id, payload);
      });

      const deletions = deletedIds.map((id) => sessionService.deleteSet(id));
      await Promise.all([...upserts, ...deletions]);
      setExerciseEditor(null);
      setLoading(true);
      await loadSession();
    } catch {
      Alert.alert('Error', 'Failed to update exercise sets.');
    } finally {
      setSavingExerciseSets(false);
    }
  };

  const persistGroupedSession = async (nextGroups: ExerciseGroup[]) => {
    await Promise.all(nextGroups.map((group, idx) => (
      sessionService.updateSetsByIds(
        group.sets.map((set) => set.id),
        { exercise_order: idx, superset_group: group.supersetGroup },
      )
    )));
  };

  const withGroupUpdate = async (action: () => Promise<void>) => {
    try {
      setUpdatingGroups(true);
      await action();
      setLoading(true);
      await loadSession();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Failed to update exercise.');
    } finally {
      setUpdatingGroups(false);
    }
  };

  const handleSupersetPrev = (group: ExerciseGroup) => {
    if (!session) return;
    const groups = groupSetsByExercise(session.sets);
    const idx = groups.findIndex((g) => g.key === group.key);
    if (idx <= 0) return;
    const entries = buildSupersetEntries(groups);
    const supersetMap = buildSupersetGroupMap(groups);
    const updated = supersetPrev(entries, idx, supersetMap);
    const nextGroups = groups.map((g) => ({ ...g, supersetGroup: updated[g.key] ?? null }));
    void withGroupUpdate(async () => {
      await persistGroupedSession(nextGroups);
    });
  };

  const handleSupersetNext = (group: ExerciseGroup) => {
    if (!session) return;
    const groups = groupSetsByExercise(session.sets);
    const idx = groups.findIndex((g) => g.key === group.key);
    if (idx < 0 || idx >= groups.length - 1) return;
    const entries = buildSupersetEntries(groups);
    const supersetMap = buildSupersetGroupMap(groups);
    const updated = supersetNext(entries, idx, supersetMap);
    const nextGroups = groups.map((g) => ({ ...g, supersetGroup: updated[g.key] ?? null }));
    void withGroupUpdate(async () => {
      await persistGroupedSession(nextGroups);
    });
  };

  const handleSeparate = (group: ExerciseGroup) => {
    if (!session) return;
    const groups = groupSetsByExercise(session.sets);
    const idx = groups.findIndex((g) => g.key === group.key);
    if (idx < 0) return;
    const entries = buildSupersetEntries(groups);
    const supersetMap = buildSupersetGroupMap(groups);
    const result = separateFromSuperset(entries, idx, supersetMap);
    const ordered = result.exercises.map((entry) => groups.find((g) => g.key === entry.id)).filter(Boolean) as ExerciseGroup[];
    const nextGroups = ordered.map((g) => ({ ...g, supersetGroup: result.groups[g.key] ?? null }));
    void withGroupUpdate(async () => {
      await persistGroupedSession(nextGroups);
    });
  };

  const handleDuplicate = (group: ExerciseGroup) => {
    if (!session) return;
    void withGroupUpdate(async () => {
      const groups = groupSetsByExercise(session.sets);
      const idx = groups.findIndex((g) => g.key === group.key);
      if (idx < 0) return;

      let insertIdx = idx + 1;
      if (group.supersetGroup) {
        for (let i = idx + 1; i < groups.length; i++) {
          if (groups[i].supersetGroup === group.supersetGroup) insertIdx = i + 1;
          else break;
        }
      }

      await Promise.all(groups.map((entry, order) => (
        order >= insertIdx
          ? sessionService.updateSetsByIds(entry.sets.map((set) => set.id), { exercise_order: order + 1 })
          : Promise.resolve()
      )));

      for (const set of group.sets) {
        await sessionService.addSet({
          session_id: set.session_id,
          exercise_id: set.exercise_id,
          set_number: set.set_number,
          weight: set.weight,
          reps_performed: set.reps_performed,
          rir: set.rir,
          is_warmup: set.is_warmup,
          exercise_order: insertIdx,
          superset_group: null,
          duration: set.duration,
          distance: set.distance,
        });
      }
    });
  };

  const handleDeleteGroup = (group: ExerciseGroup) => {
    if (!session) return;
    Alert.alert(
      'Delete Exercise',
      `Remove ${group.exerciseName} from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void withGroupUpdate(async () => {
              const groups = groupSetsByExercise(session.sets);
              const remaining = groups.filter((g) => g.key !== group.key);
              const entries = buildSupersetEntries(remaining);
              const supersetMap = buildSupersetGroupMap(remaining);
              const cleaned = autoCleanAfterDelete(entries, supersetMap);
              const cleanedGroups = remaining.map((g) => ({ ...g, supersetGroup: cleaned[g.key] ?? null }));
              await sessionService.deleteSetsByIds(group.sets.map((set) => set.id));
              await persistGroupedSession(cleanedGroups);
            });
          },
        },
      ],
    );
  };

  const handleSwapStart = (group: ExerciseGroup) => {
    setSwapGroupKey(group.key);
    setShowSwapPicker(true);
  };

  const handleSwapSelect = async (exercise: Exercise) => {
    if (!session || !swapGroupKey) return;
    const groups = groupSetsByExercise(session.sets);
    const group = groups.find((g) => g.key === swapGroupKey);
    if (!group) return;
    await withGroupUpdate(async () => {
      await sessionService.updateSetsByIds(group.sets.map((set) => set.id), { exercise_id: exercise.id });
    });
    setShowSwapPicker(false);
    setSwapGroupKey(null);
  };

  const buildExerciseMenuItems = (group: ExerciseGroup, idx: number, groups: ExerciseGroup[]): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [{ label: 'Edit Sets', onPress: () => openExerciseEditor(group) }];
    items.push({ label: 'Details', onPress: () => router.push(`/exercise/${group.exerciseId}`) });
    const myGroup = group.supersetGroup ?? null;
    const prevGroup = idx > 0 ? (groups[idx - 1].supersetGroup ?? null) : null;
    const nextGroup = idx < groups.length - 1 ? (groups[idx + 1].supersetGroup ?? null) : null;
    if (idx > 0 && (!myGroup || myGroup !== prevGroup)) {
      items.push({ label: 'Superset Prev', onPress: () => handleSupersetPrev(group) });
    }
    if (idx < groups.length - 1 && (!myGroup || myGroup !== nextGroup)) {
      items.push({ label: 'Superset Next', onPress: () => handleSupersetNext(group) });
    }
    if (myGroup) {
      items.push({ label: 'Separate', onPress: () => handleSeparate(group) });
    }
    items.push({ label: 'Swap', onPress: () => handleSwapStart(group) });
    items.push({ label: 'Duplicate', onPress: () => handleDuplicate(group) });
    items.push({ label: 'Delete', onPress: () => handleDeleteGroup(group), destructive: true });
    return items;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const groups = groupSetsByExercise(session.sets);
  const supersetEntries = buildSupersetEntries(groups);
  const supersetMap = buildSupersetGroupMap(groups);
  const actualExercises = groups.length;
  const actualSets = session.sets.length;
  const actualVolume = session.sets.reduce((sum, set) => sum + ((set.weight ?? 0) * (set.reps_performed ?? 0)), 0);
  const hasRoutineDayLink = !!session.routine_day_id;
  const waitingForTemplate = hasRoutineDayLink && !templateResolved;
  const hasRoutineTemplate = hasRoutineDayLink && !!routineDayTemplate;
  const targets = hasRoutineTemplate && routineDayTemplate
    ? computeTemplateTargets(routineDayTemplate)
    : null;

  const exercisesProgress = waitingForTemplate
    ? 0
    : hasRoutineTemplate && targets
      ? (targets.exerciseTarget > 0 ? clamp01(actualExercises / targets.exerciseTarget) : 1)
    : 1;
  const setsProgress = waitingForTemplate
    ? 0
    : hasRoutineTemplate && targets
      ? (targets.setTarget > 0 ? clamp01(actualSets / targets.setTarget) : 1)
    : 1;
  const volumeAvailable = waitingForTemplate
    ? false
    : hasRoutineTemplate && targets
      ? targets.volumeTarget > 0
    : actualVolume > 0;
  const volumeProgress = waitingForTemplate
    ? 0
    : hasRoutineTemplate && targets
      ? (targets.volumeTarget > 0 ? clamp01(actualVolume / targets.volumeTarget) : 0)
    : (actualVolume > 0 ? 1 : 0);
  const exerciseTargetText = hasRoutineTemplate && targets && targets.exerciseTarget > 0
    ? formatStatNumber(targets.exerciseTarget)
    : '--';
  const setsTargetText = hasRoutineTemplate && targets && targets.setTarget > 0
    ? formatStatNumber(targets.setTarget)
    : '--';
  const volumeTargetText = hasRoutineTemplate && targets && targets.volumeTarget > 0
    ? formatCompactStat(targets.volumeTarget)
    : '--';

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatDate(session.started_at)}</Text>
            <Text style={styles.time}>
              {formatTime(session.started_at)} · {formatDuration(session.started_at, session.completed_at)}
            </Text>
            {(session.routine_week_index ?? session.routine_day?.week_index) != null && (
              <Text style={styles.sessionWeek}>
                Week {session.routine_week_index ?? session.routine_day?.week_index}
                {session.routine_day?.label ? ` · ${session.routine_day.label}` : ''}
                {session.routine_day?.routine?.name ? ` · ${session.routine_day.routine.name}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
            <Image source={require('../../../assets/icons/edit.png')} style={styles.editIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRingsRow}>
          <MetricRing
            label="Exercises"
            valueText={formatStatNumber(actualExercises)}
            targetText={exerciseTargetText}
            progress={exercisesProgress}
            color="#4ECDC4"
            gradientToColor="#9FF5D7"
            delay={0}
          />
          <MetricRing
            label="Sets"
            valueText={formatStatNumber(actualSets)}
            targetText={setsTargetText}
            progress={setsProgress}
            color="#F5A65B"
            gradientToColor="#FFD892"
            delay={120}
          />
          <MetricRing
            label="Volume"
            valueText={volumeAvailable ? formatCompactStat(actualVolume) : '--'}
            targetText={volumeTargetText}
            progress={volumeProgress}
            color={volumeAvailable ? '#7AA2FF' : '#5C677D'}
            gradientToColor={volumeAvailable ? '#B2C9FF' : '#7C869C'}
            delay={240}
            muted={!volumeAvailable}
            compact
          />
        </View>

        {groups.map((group, idx) => {
          const position = getSupersetPosition(supersetEntries, idx, supersetMap);
          const noBottomMargin = position === 'first' || position === 'middle';
          const menuItems = buildExerciseMenuItems(group, idx, groups);
          return (
            <SupersetBracket key={group.key} position={position}>
              <Card style={[styles.exerciseCard, noBottomMargin && styles.exerciseCardNoMargin]}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderText}>
                    <Text style={styles.exerciseName}>{group.exerciseName}</Text>
                    <Text style={styles.muscleGroup}>{formatMuscleGroupLabel(group.muscleGroup)}</Text>
                  </View>
                  <OverflowMenu items={menuItems} />
                </View>

                {(() => {
                  const cfg = getExerciseTypeConfig(group.exerciseType);
                  const showWeight = cfg.fields.some((f) => f.key === 'weight');
                  const showReps = cfg.fields.some((f) => f.key === 'reps');
                  const showDuration = cfg.fields.some((f) => f.key === 'duration');
                  const showDistance = cfg.fields.some((f) => f.key === 'distance');
                  return (
                    <>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
                        {showWeight && <Text style={[styles.tableCol, styles.colFlex]}>{getWeightLabel(group.exerciseType, weightUnitLabel(weightUnit))}</Text>}
                        {showReps && <Text style={[styles.tableCol, styles.colFlex]}>REPS</Text>}
                        {showDuration && <Text style={[styles.tableCol, styles.colFlex]}>TIME</Text>}
                        {showDistance && <Text style={[styles.tableCol, styles.colFlex]}>{distanceUnitLabel(distUnit)}</Text>}
                        {cfg.showRir && <Text style={[styles.tableCol, styles.colRir]}>RIR</Text>}
                      </View>

                      {group.sets.map((set) => (
                        <View key={set.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.colSet]}>{set.set_number}</Text>
                          {showWeight && <Text style={[styles.tableCell, styles.colFlex]}>{formatWeight(set.weight, weightUnit)}</Text>}
                          {showReps && <Text style={[styles.tableCell, styles.colFlex]}>{set.reps_performed}</Text>}
                          {showDuration && <Text style={[styles.tableCell, styles.colFlex]}>{set.duration > 0 ? formatDurationValue(set.duration) : '-'}</Text>}
                          {showDistance && <Text style={[styles.tableCell, styles.colFlex]}>{set.distance > 0 ? formatDistance(set.distance, distUnit) : '-'}</Text>}
                          {cfg.showRir && (
                            <View style={[styles.tableCellBox, styles.colRir]}>
                              <RirCircle value={set.rir} size={24} />
                            </View>
                          )}
                        </View>
                      ))}
                    </>
                  );
                })()}
              </Card>
            </SupersetBracket>
          );
        })}
      </ScrollView>

      <BottomSheetModal visible={showEdit} title="Edit Session" scrollable onClose={() => setShowEdit(false)}>
            <Text style={styles.fieldLabel}>Date</Text>
            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {editDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                themeVariant="dark"
              />
            )}

            <Text style={styles.fieldLabel}>Start Time</Text>
            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {editTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={editTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                themeVariant="dark"
              />
            )}

            <Input
              label="Duration (minutes)"
              value={editDuration}
              onChangeText={setEditDuration}
              keyboardType="number-pad"
            />

            <View style={styles.endTimeRow}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <Text style={styles.endTimeValue}>
                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowEdit(false)}
              />
              <Button title="Save" onPress={handleSaveEdit} />
            </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={!!exerciseEditor}
        title={exerciseEditor ? `Edit ${exerciseEditor.exerciseName}` : 'Edit Exercise'}
        scrollable
        onClose={() => setExerciseEditor(null)}
      >
        {exerciseEditor && (
          <>
            <View style={styles.setTableHeader}>
              <Text style={[styles.tableCol, styles.editorColSet]}>SET</Text>
              <Text style={[styles.tableCol, styles.editorColPrev]}>PREV</Text>
              {getExerciseTypeConfig(exerciseEditor.exerciseType).fields.map((f) => (
                <Text key={f.key} style={[styles.tableCol, styles.colFlex]}>
                  {f.key === 'weight'
                    ? getWeightLabel(exerciseEditor.exerciseType, weightUnitLabel(weightUnit))
                    : f.key === 'distance'
                      ? distanceUnitLabel(distUnit)
                      : f.label}
                </Text>
              ))}
              {getExerciseTypeConfig(exerciseEditor.exerciseType).showRir && (
                <Text style={[styles.tableCol, styles.editorColRir]}>RIR</Text>
              )}
              <View style={styles.editorColAction} />
            </View>

            {(() => {
              let workingSetIndex = 0;
              return exerciseEditor.rows.map((row) => (
                <SetRow
                  key={row.id}
                  row={row}
                  displaySetNumber={row.is_warmup ? 'W' : ++workingSetIndex}
                  weightUnit={weightUnit}
                  distanceUnit={distUnit}
                  exerciseType={exerciseEditor.exerciseType}
                  onUpdateRowLocal={(updates) => updateExerciseRow(row.id, updates)}
                  onUpdateRow={(updates) => updateExerciseRow(row.id, updates)}
                  onToggle={() => {}}
                  onSwipeDelete={() => removeExerciseRow(row.id)}
                  onToggleWarmup={() => toggleExerciseWarmup(row.id)}
                  showCompletionToggle={false}
                  enableWarmupSwipe
                  showInlineDelete={exerciseEditor.rows.length > 1}
                  onInlineDelete={() => removeExerciseRow(row.id)}
                />
              ));
            })()}

            <View style={styles.addSetRow}>
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addExerciseSet(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addWarmupText}>+ Warmup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addExerciseSet(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setExerciseEditor(null)}
              />
              <Button
                title="Save"
                onPress={saveExerciseSets}
                loading={savingExerciseSets}
              />
            </View>
          </>
        )}
      </BottomSheetModal>
      <ExercisePickerModal
        visible={showSwapPicker}
        onClose={() => { setShowSwapPicker(false); setSwapGroupKey(null); }}
        onSelect={handleSwapSelect}
        onExerciseDetails={(exerciseId) => router.push(`/exercise/${exerciseId}`)}
      />
      {updatingGroups && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  date: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
  sessionWeek: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  editBtn: {
    padding: 8,
  },
  editIcon: {
    width: 22,
    height: 22,
    tintColor: colors.textSecondary,
  },
  summaryRingsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  exerciseCard: {
    marginBottom: 6,
  },
  exerciseCardNoMargin: {
    marginBottom: 0,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseHeaderText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  muscleGroup: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCol: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
  },
  tableCellBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colSet: { width: 28 },
  colPrev: { width: 72 },
  colWeight: { flex: 1 },
  colReps: { flex: 1 },
  colFlex: { flex: 1 },
  colRir: { width: 40 },
  colAction: { width: 36 },
  editorColSet: { width: 28 },
  editorColPrev: { width: 72 },
  editorColRir: { width: 40 },
  editorColAction: { width: 28 },
  setTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  addSetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    marginBottom: 12,
  },
  addSetButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  addWarmupText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#FFD93D',
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  pickerButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  endTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  endTimeValue: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
