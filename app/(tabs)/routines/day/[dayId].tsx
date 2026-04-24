import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRoutineStore } from '../../../../src/stores/routine.store';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { useProfileStore } from '../../../../src/stores/profile.store';
import { routineService } from '../../../../src/services';
import { confirmDeleteExercise } from '../../../../src/utils/confirmDeleteExercise';
import { DayOfWeekPicker, SwipeToDeleteRow, AddRowButton, InlineEditRow, Button, OverflowMenu, ExercisePickerModal, SupersetBracket, ExerciseIconPreview } from '../../../../src/components/ui';
import type { OverflowMenuItem } from '../../../../src/components/ui';
import { fonts, spacing } from '../../../../src/constants';
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
  type ExternalSetEditorNavigationRequest,
  type TableEditorCell,
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
import { useTheme } from '../../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../../src/constants/themes';
import { getExercisePreviewUrl, getExerciseThumbnailUrl } from '../../../../src/utils/exerciseMedia';
import { EditorDirection, EditableFieldKind } from '../../../../src/components/set-editor/types';
import { PortalHost } from '../../../../src/components/ui/PortalHost';
import { useWorkoutOverlay } from '../../../../src/components/workout';

const EXERCISE_THUMB_PLACEHOLDER = require('../../../../assets/Setora-black-and-white.png');

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
  const thumbnailUrl = getExerciseThumbnailUrl(ex.exercise);
  const previewUrl = getExercisePreviewUrl(ex.exercise);
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
          <ExerciseIconPreview
            imageSource={thumbnailSource}
            previewUri={previewUrl}
            imageStyle={styles.exerciseThumb}
            onPress={(event) => {
              event.stopPropagation();
            }}
          />
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

function ExerciseSetsEditor({
  entry,
  wUnit,
  dUnit,
  onSave,
  onEditorVisibilityChange,
  onFocusRequest,
  onFocusCell,
  onNavigateBeyondBoundary,
  canNavigateBeyondBoundary,
  externalNavigationRequest,
  forceDismissToken,
  onForceDismissHandled,
  styles,
}: {
  entry: RoutineDayExercise;
  wUnit: WeightUnit;
  dUnit: DistanceUnit;
  onSave: () => void;
  onEditorVisibilityChange?: (visible: boolean) => void;
  onFocusRequest?: () => void;
  onFocusCell?: (cell: TableEditorCell) => void;
  onNavigateBeyondBoundary?: (direction: EditorDirection, fromField: EditableFieldKind, fromFieldIndex: number) => boolean;
  canNavigateBeyondBoundary?: (direction: EditorDirection, fromField: EditableFieldKind) => boolean;
  externalNavigationRequest?: ExternalSetEditorNavigationRequest;
  forceDismissToken?: number;
  onForceDismissHandled?: () => void;
  styles: Record<string, any>;
}) {
  const initial = setsToTemplateRows(entry.sets ?? [], entry.target_reps, wUnit);
  const [useRepRange, setUseRepRange] = useState(initial.hasRepRange);
  const [rows, setRows] = useState<TemplateSetRow[]>(initial.rows);
  const mountedRef = useRef(false);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(async (currentRows: TemplateSetRow[], repRange: boolean) => {
    if (repRange && !validateRepRange(currentRows, { showAlert: false, ignoreIncomplete: true })) return;
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
    // Debounce saves so rapid set additions don't fire concurrent API calls,
    // which would cause the sets counter in the exercise header to show stale counts.
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      persist(rows, useRepRange);
    }, 500);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
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
        onEditorVisibilityChange={onEditorVisibilityChange}
        onFocusRow={() => onFocusRequest?.()}
        onFocusCell={onFocusCell}
        onNavigateBeyondBoundary={onNavigateBeyondBoundary}
        canNavigateBeyondBoundary={canNavigateBeyondBoundary}
        externalNavigationRequest={externalNavigationRequest}
        forceDismissToken={forceDismissToken}
        onForceDismissHandled={onForceDismissHandled}
        renderValueEditorInPortal
        valueEditorAnimated={false}
      />
    </View>
  );
}

export default function DayEditorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile } = useProfileStore();
  const { setChromeHidden } = useWorkoutOverlay();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';

  const [day, setDay] = useState<RoutineDayWithExercises | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<DayOfWeek | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [setEditorVisibleEntryId, setSetEditorVisibleEntryId] = useState<string | null>(null);
  const [editorNavRequests, setEditorNavRequests] = useState<Record<string, ExternalSetEditorNavigationRequest>>({});
  const [editorDismissTokens, setEditorDismissTokens] = useState<Record<string, number>>({});
  const pageScrollRef = useRef<ScrollView | null>(null);
  const pageScrollYRef = useRef(0);
  const exerciseNodeRef = useRef<Record<string, View | null>>({});
  const navTokenRef = useRef(1);
  const dismissTokenRef = useRef<Record<string, number>>({});
  const pendingSourceDismissRef = useRef<Record<string, string>>({});
  const currentVisibleEntryIdRef = useRef<string | null>(null);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDirectAddPicker, setShowDirectAddPicker] = useState(false);
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [autoOpenPicker, setAutoOpenPicker] = useState(false);
  const pendingPickerReopenRef = useRef<'swap' | 'add' | null>(null);
  const pendingReopenEntryIdRef = useRef<string | null>(null);
  const lastFocusedCellRef = useRef<Record<string, TableEditorCell>>({});

  const scrollDayExerciseIntoView = useCallback((entryId: string) => {
    const node = exerciseNodeRef.current[entryId];
    if (!node) return;
    requestAnimationFrame(() => {
      node.measureInWindow((_x, y) => {
        // Always snap the exercise header to a fixed screen position so the focused
        // cell (positioned near the top of the inner scroll) lands at the same
        // height every time the modal opens, regardless of exercise size.
        const targetTop = 110;
        const delta = y - targetTop;
        if (Math.abs(delta) < 8) return;
        const nextY = Math.max(0, pageScrollYRef.current + delta);
        pageScrollRef.current?.scrollTo({ y: nextY, animated: true });
      });
    });
  }, []);

  const requestEditorDismiss = useCallback((entryId: string) => {
    const nextToken = (dismissTokenRef.current[entryId] ?? 0) + 1;
    dismissTokenRef.current[entryId] = nextToken;
    setEditorDismissTokens((prev) => ({ ...prev, [entryId]: nextToken }));
  }, []);

  const handleForceDismissHandled = useCallback((entryId: string) => {
    setEditorDismissTokens((prev) => {
      if (prev[entryId] == null) return prev;
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  }, []);

  const handleSetEditorVisibilityChange = useCallback((entryId: string, visible: boolean) => {
    if (visible) {
      // Clean up any pending boundary-nav hint for this entry (no longer needed)
      if (pendingSourceDismissRef.current[entryId]) {
        delete pendingSourceDismissRef.current[entryId];
      }
      // Dismiss whichever editor is currently open, whether opened via direct tap or boundary nav
      const prev = currentVisibleEntryIdRef.current;
      if (prev && prev !== entryId) {
        requestEditorDismiss(prev);
      }
      currentVisibleEntryIdRef.current = entryId;
    } else if (currentVisibleEntryIdRef.current === entryId) {
      currentVisibleEntryIdRef.current = null;
    }
    setSetEditorVisibleEntryId((prev) => {
      if (visible) return entryId;
      return prev === entryId ? null : prev;
    });
  }, [requestEditorDismiss]);

  const handleSetEditorFocusRequest = useCallback((entryId: string) => {
    scrollDayExerciseIntoView(entryId);
  }, [scrollDayExerciseIntoView]);

  useEffect(() => {
    setChromeHidden(!!setEditorVisibleEntryId);
  }, [setChromeHidden, setEditorVisibleEntryId]);

  useEffect(() => () => {
    setChromeHidden(false);
  }, [setChromeHidden]);

  const handleDayBoundaryNavigation = useCallback((
    sourceEntryId: string,
    direction: EditorDirection,
    fromField: EditableFieldKind,
    fromFieldIndex: number,
  ): boolean => {
    if (!day) return false;
    const sourceIndex = day.exercises.findIndex((entry) => entry.id === sourceEntryId);
    if (sourceIndex < 0) return false;
    const delta = direction === 'up' || direction === 'left' ? -1 : 1;
    const target = day.exercises[sourceIndex + delta];
    if (!target) return false;
    setEditorDismissTokens((prev) => {
      if (prev[target.id] == null) return prev;
      const next = { ...prev };
      delete next[target.id];
      return next;
    });
    setExpandedIds((prev) => {
      if (prev.has(target.id)) return prev;
      const next = new Set(prev);
      next.add(target.id);
      return next;
    });
    setSetEditorVisibleEntryId(target.id);
    setEditorNavRequests((prev) => ({
      ...prev,
      [target.id]: {
        token: navTokenRef.current++,
        direction,
        preferredField: direction === 'up' || direction === 'down' ? fromField : undefined,
        preferredFieldIndex: direction === 'up' || direction === 'down' ? fromFieldIndex : undefined,
      },
    }));
    pendingSourceDismissRef.current[target.id] = sourceEntryId;
    scrollDayExerciseIntoView(target.id);
    return true;
  }, [day, scrollDayExerciseIntoView]);

  const canDayBoundaryNavigate = useCallback((
    sourceEntryId: string,
    direction: EditorDirection,
  ): boolean => {
    if (!day) return false;
    const sourceIndex = day.exercises.findIndex((entry) => entry.id === sourceEntryId);
    if (sourceIndex < 0) return false;
    const delta = direction === 'up' || direction === 'left' ? -1 : 1;
    return !!day.exercises[sourceIndex + delta];
  }, [day]);

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
    setShowAddExercise(false);
    setShowDirectAddPicker(false);
    setTimeout(() => openExerciseDetail(exerciseId), 280);
  }, [openExerciseDetail]);

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

  // After a superset operation, the DraggableFlatList item keys change (single → group),
  // causing ExerciseSetsEditor to remount and close the modal. Re-open it here.
  useEffect(() => {
    const entryId = pendingReopenEntryIdRef.current;
    if (!entryId || !day) return;
    pendingReopenEntryIdRef.current = null;
    if (!day.exercises.find((e) => e.id === entryId)) return;
    setExpandedIds((prev) => {
      if (prev.has(entryId)) return prev;
      const next = new Set(prev);
      next.add(entryId);
      return next;
    });
    const lastCell = lastFocusedCellRef.current[entryId];
    requestAnimationFrame(() => {
      setEditorNavRequests((prev) => ({
        ...prev,
        [entryId]: {
          token: ++navTokenRef.current,
          direction: 'down' as const,
          ...(lastCell && { targetRowIndex: lastCell.rowIndex, preferredField: lastCell.field }),
        },
      }));
    });
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Clear any pending nav request so re-expanding after collapse doesn't auto-focus.
    setEditorNavRequests((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
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
      const newEntry = await routineService.addExerciseToDay(
        {
          routine_day_id: dayId,
          exercise_id: exercise.id,
          sort_order: dayExercises.length,
          target_sets: normalizedSets.length,
          target_reps: normalizedSets[0]?.target_reps_min ?? 10,
        },
        normalizedSets,
      );
      setExpandedIds((prev) => new Set([...prev, newEntry.id]));
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
    pendingReopenEntryIdRef.current = setEditorVisibleEntryId;
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
    <PortalHost>
      <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => <DayViewHeaderDropdown dayId={dayId ?? ''} currentView="edit" />,
        }}
      />
      <ScrollView
        ref={pageScrollRef}
        contentContainerStyle={[
          styles.content,
          !!setEditorVisibleEntryId && styles.contentEditorOpen,
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEnabled={!isReordering}
        onScroll={(event) => {
          pageScrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
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
                <View
                  ref={(node) => {
                    exerciseNodeRef.current[item.entry.id] = node;
                  }}
                >
                  <SwipeableExerciseRow
                    ex={item.entry}
                    isExpanded={expandedIds.has(item.entry.id)}
                    onToggle={() => toggleExpand(item.entry.id)}
                    onDetails={() => navigateToExerciseDetail(item.entry.exercise_id)}
                    onDelete={() => handleExRemove(item.entry.id)}
                    onLongPress={drag}
                    menuItems={buildExerciseMenuItems(item.entry, day.exercises.indexOf(item.entry))}
                    styles={styles}
                  >
                    <ExerciseSetsEditor
                      entry={item.entry}
                      wUnit={wUnit}
                      dUnit={dUnit}
                      onSave={refresh}
                      onEditorVisibilityChange={(visible) => handleSetEditorVisibilityChange(item.entry.id, visible)}
                      onFocusRequest={() => handleSetEditorFocusRequest(item.entry.id)}
                      onFocusCell={(cell) => { lastFocusedCellRef.current[item.entry.id] = cell; }}
                      onNavigateBeyondBoundary={(direction, fromField, fromFieldIndex) =>
                        handleDayBoundaryNavigation(item.entry.id, direction, fromField, fromFieldIndex)}
                      canNavigateBeyondBoundary={(direction) =>
                        canDayBoundaryNavigate(item.entry.id, direction)}
                      externalNavigationRequest={editorNavRequests[item.entry.id]}
                      forceDismissToken={editorDismissTokens[item.entry.id]}
                      onForceDismissHandled={() => handleForceDismissHandled(item.entry.id)}
                      styles={styles}
                    />
                  </SwipeableExerciseRow>
                </View>
              ) : (
                <View>
                  {item.entries.map((entry, idx) => {
                    const pos = idx === 0 ? 'first' as const : idx === item.entries.length - 1 ? 'last' as const : 'middle' as const;
                    return (
                      <SupersetBracket key={entry.id} position={pos} contentRadius={6}>
                        <View
                          ref={(node) => {
                            exerciseNodeRef.current[entry.id] = node;
                          }}
                        >
                          <SwipeableExerciseRow
                            ex={entry}
                            isExpanded={expandedIds.has(entry.id)}
                            onToggle={() => toggleExpand(entry.id)}
                            onDetails={() => navigateToExerciseDetail(entry.exercise_id)}
                            onDelete={() => handleExRemove(entry.id)}
                            onLongPress={drag}
                            menuItems={buildExerciseMenuItems(entry, day.exercises.indexOf(entry))}
                            styles={styles}
                          >
                            <ExerciseSetsEditor
                              entry={entry}
                              wUnit={wUnit}
                              dUnit={dUnit}
                              onSave={refresh}
                              onEditorVisibilityChange={(visible) => handleSetEditorVisibilityChange(entry.id, visible)}
                              onFocusRequest={() => handleSetEditorFocusRequest(entry.id)}
                              onFocusCell={(cell) => { lastFocusedCellRef.current[entry.id] = cell; }}
                              onNavigateBeyondBoundary={(direction, fromField, fromFieldIndex) =>
                                handleDayBoundaryNavigation(entry.id, direction, fromField, fromFieldIndex)}
                              canNavigateBeyondBoundary={(direction) =>
                                canDayBoundaryNavigate(entry.id, direction)}
                              externalNavigationRequest={editorNavRequests[entry.id]}
                              forceDismissToken={editorDismissTokens[entry.id]}
                              onForceDismissHandled={() => handleForceDismissHandled(entry.id)}
                              styles={styles}
                            />
                          </SwipeableExerciseRow>
                        </View>
                      </SupersetBracket>
                    );
                  })}
                </View>
              )}
            </ScaleDecorator>
          )}
        />

        <AddRowButton label="+ Add Exercise" onPress={() => setShowDirectAddPicker(true)} />

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
      </View>
    </PortalHost>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: spacing.xl+50, 
  },
  contentEditorOpen: {
    paddingBottom: 420,
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
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
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
  expandArrow: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 2,
    flexShrink: 0,
    alignSelf: 'center',
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
