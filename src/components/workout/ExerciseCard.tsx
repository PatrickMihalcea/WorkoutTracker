import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Animated } from 'react-native';
import type { LayoutAnimationConfig } from 'react-native';
import { RoutineDayExercise, WorkoutRow, SetLog, WeightUnit, DistanceUnit } from '../../models';
import { colors, fonts } from '../../constants';
import { Card } from '../ui/Card';
import { SwipeToDeleteRow } from '../ui/SwipeToDeleteRow';
import { OverflowMenu } from '../ui/OverflowMenu';
import type { OverflowMenuItem } from '../ui/OverflowMenu';
import { SetRow } from './SetRow';
import { weightUnitLabel, distanceUnitLabel, formatWeight } from '../../utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../utils/exerciseType';
import { useThemeColors } from '../../hooks/useThemeColors';

const ANIM_DURATION = 300;

const collapseLayout: LayoutAnimationConfig = {
  duration: 320,
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.88 },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

interface ExerciseCardProps {
  entry: RoutineDayExercise;
  rows: WorkoutRow[];
  previousSets: SetLog[];
  weightUnit: WeightUnit;
  distanceUnit?: DistanceUnit;
  onUpdateRowLocal?: (id: string, entryId: string, updates: Record<string, string>) => void;
  onUpdateRow: (id: string, entryId: string, updates: Record<string, string>) => void;
  onToggleRow: (id: string, entryId: string) => void;
  onDeleteRow: (id: string, entryId: string, setNumber: number) => void;
  onAddRow: (entryId: string, exerciseId: string) => void;
  onAddWarmup: (entryId: string, exerciseId: string) => void;
  onToggleWarmup: (id: string, entryId: string) => void;
  onRemove?: () => void;
  reorderCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLongPress?: () => void;
  supersetGroup?: string | null;
  canSupersetPrev?: boolean;
  canSupersetNext?: boolean;
  onSupersetPrev?: () => void;
  onSupersetNext?: () => void;
  onSeparate?: () => void;
  onSwap?: () => void;
  onDuplicate?: () => void;
  onDetails?: () => void;
  noBottomMargin?: boolean;
}

export function ExerciseCard({
  entry,
  rows,
  previousSets,
  weightUnit,
  distanceUnit = 'km',
  onUpdateRowLocal,
  onUpdateRow,
  onToggleRow,
  onDeleteRow,
  onAddRow,
  onAddWarmup,
  onToggleWarmup,
  onRemove,
  reorderCollapsed,
  isCollapsed,
  onToggleCollapse,
  onLongPress,
  supersetGroup,
  canSupersetPrev,
  canSupersetNext,
  onSupersetPrev,
  onSupersetNext,
  onSeparate,
  onSwap,
  onDuplicate,
  onDetails,
  noBottomMargin,
}: ExerciseCardProps) {
  const { setCompletion } = useThemeColors();
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = (entry.exercise?.muscle_group ?? '').replace(/_/g, ' ');
  const exType = entry.exercise?.exercise_type;
  const typeConfig = getExerciseTypeConfig(exType);
  const completedCount = rows.filter((r) => r.is_completed).length;
  const allDone = rows.length > 0 && rows.every((r) => r.is_completed);
  const templates = entry.sets ?? [];

  const sortedRows = useMemo(() => {
    const warmups = rows.filter((r) => r.is_warmup).sort((a, b) => a.set_number - b.set_number);
    const working = rows.filter((r) => !r.is_warmup).sort((a, b) => a.set_number - b.set_number);
    return [...warmups, ...working];
  }, [rows]);

  const completionAnim = useRef(new Animated.Value(allDone ? 1 : 0)).current;
  const prevAllDone = useRef(allDone);
  const didLongPressNameRef = useRef(false);

  const canAnimate = setCompletion !== 'transparent';

  useEffect(() => {
    if (allDone === prevAllDone.current) return;
    prevAllDone.current = allDone;

    if (allDone && canAnimate) {
      LayoutAnimation.configureNext(collapseLayout);
      onToggleCollapse?.();
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    } else if (!allDone && canAnimate) {
      Animated.timing(completionAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Overlay that fades in over the card gradient when all sets are done. */
  const completionOverlay = canAnimate ? (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: setCompletion, opacity: completionAnim }]}
    />
  ) : null;

  const doneTextColor = (allDone && canAnimate) ? '#000000' : undefined;

  const handleToggle = () => {
    LayoutAnimation.configureNext(collapseLayout);
    onToggleCollapse?.();
  };

  const handleDetailsPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (didLongPressNameRef.current) {
      didLongPressNameRef.current = false;
      return;
    }
    onDetails?.();
  };

  const handleNameLongPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    didLongPressNameRef.current = true;
    onLongPress?.();
  };

  const handleNamePressOut = () => {
    // Delay reset to keep the long-press flag valid through same-cycle onPress dispatch.
    setTimeout(() => {
      didLongPressNameRef.current = false;
    }, 0);
  };

  const renderExerciseName = (done?: string) => {
    if (!onDetails) {
      return <Text style={[styles.exerciseName, done && { color: done }]}>{exerciseName}</Text>;
    }
    return (
      <TouchableOpacity
        onPress={handleDetailsPress}
        onLongPress={handleNameLongPress}
        onPressOut={handleNamePressOut}
        delayLongPress={400}
        activeOpacity={0.7}
        style={styles.exerciseNameTapTarget}
      >
        <Text style={[styles.exerciseName, styles.exerciseNameLink, done && { color: done }]}>{exerciseName}</Text>
      </TouchableOpacity>
    );
  };

  const menuItems = useMemo((): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [];
    if (canSupersetPrev) items.push({ label: 'Superset Prev', onPress: () => onSupersetPrev?.() });
    if (canSupersetNext) items.push({ label: 'Superset Next', onPress: () => onSupersetNext?.() });
    if (supersetGroup) items.push({ label: 'Separate', onPress: () => onSeparate?.() });
    if (onSwap) items.push({ label: 'Swap', onPress: onSwap });
    if (onDuplicate) items.push({ label: 'Duplicate', onPress: onDuplicate });
    if (onRemove) items.push({ label: 'Delete', onPress: onRemove, destructive: true });
    return items;
  }, [supersetGroup, canSupersetPrev, canSupersetNext, onSupersetPrev, onSupersetNext, onSeparate, onSwap, onDuplicate, onRemove]);

  const showMenu = !reorderCollapsed && (onSwap || onDuplicate || onRemove);

  const marginOverride = noBottomMargin ? { marginBottom: 0 } : undefined;

  if (reorderCollapsed) {
    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={!!onRemove}>
        <Card style={[styles.cardCollapsed, marginOverride]}>
          {completionOverlay}
          <View style={styles.headerCollapsed}>
            <View style={{ flex: 1 }}>
              {renderExerciseName(doneTextColor)}
              <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
            </View>
            <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
              {completedCount}/{rows.length}
            </Text>
          </View>
        </Card>
      </SwipeToDeleteRow>
    );
  }

  if (isCollapsed) {
    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={!!onRemove}>
        <Card style={[styles.cardCollapsed, marginOverride]}>
          {completionOverlay}
          <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
            <View style={styles.headerCollapsed}>
              <View style={{ flex: 1 }}>
                {renderExerciseName(doneTextColor)}
                <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
              </View>
              <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
                {completedCount}/{rows.length}
              </Text>
              {showMenu && <OverflowMenu items={menuItems} />}
            </View>
          </TouchableOpacity>
        </Card>
      </SwipeToDeleteRow>
    );
  }

  let workingSetIndex = 0;

  const cardContent = (
    <Card style={[styles.card, marginOverride]}>
      {completionOverlay}
      <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {renderExerciseName(doneTextColor)}
            <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
          </View>
          <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
            {completedCount}/{rows.length}
          </Text>
          {showMenu && <OverflowMenu items={menuItems} />}
        </View>
      </TouchableOpacity>

        <View style={[styles.columnHeaders, doneTextColor && { borderBottomColor: '#000000' }]}>
          <View style={styles.setLabelCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>SET</Text>
          </View>
          <View style={styles.previousCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>PREV</Text>
          </View>
          {typeConfig.fields.map((f) => (
            <View key={f.key} style={styles.inputCol}>
              <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>
                {f.key === 'weight' ? getWeightLabel(exType, weightUnitLabel(weightUnit)) : f.key === 'distance' ? distanceUnitLabel(distanceUnit) : f.label}
              </Text>
            </View>
          ))}
          {typeConfig.showRir && (
            <View style={styles.rirCol}>
              <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>RIR</Text>
            </View>
          )}
          <View style={styles.actionCol} />
        </View>

        {sortedRows.map((row) => {
          const displayNum = row.is_warmup ? 'W' : ++workingSetIndex;

          const origIndex = rows.indexOf(row);
          let suggestedWeight: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].weight) { suggestedWeight = rows[j].weight; break; }
          }
          if (!suggestedWeight && row.target_weight > 0) {
            suggestedWeight = formatWeight(row.target_weight, weightUnit);
          }

          let suggestedReps: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].reps) { suggestedReps = rows[j].reps; break; }
          }
          if (!suggestedReps && row.target_reps_min > 0) {
            suggestedReps = row.target_reps_min === row.target_reps_max
              ? String(row.target_reps_min)
              : `${row.target_reps_min}-${row.target_reps_max}`;
          }

          let suggestedDuration: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].duration) { suggestedDuration = rows[j].duration; break; }
          }
          if (!suggestedDuration && row.target_duration > 0) {
            suggestedDuration = String(row.target_duration);
          }

          let suggestedDistance: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].distance) { suggestedDistance = rows[j].distance; break; }
          }
          if (!suggestedDistance && row.target_distance > 0) {
            suggestedDistance = String(row.target_distance);
          }

          let suggestedRir: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].rir) { suggestedRir = rows[j].rir; break; }
          }

          return (
            <SetRow
              key={row.id}
              row={row}
              displaySetNumber={displayNum}
              previousSet={previousSets[origIndex]}
              weightUnit={weightUnit}
              distanceUnit={distanceUnit}
              exerciseType={exType}
              suggestedWeight={suggestedWeight}
              suggestedReps={suggestedReps}
              suggestedDuration={suggestedDuration}
              suggestedDistance={suggestedDistance}
              suggestedRir={suggestedRir}
              completionColor={setCompletion}
              onUpdateRowLocal={(updates) => onUpdateRowLocal?.(row.id, entry.id, updates)}
              onUpdateRow={(updates) => onUpdateRow(row.id, entry.id, updates)}
              onToggle={() => onToggleRow(row.id, entry.id)}
              onSwipeDelete={() => onDeleteRow(row.id, entry.id, row.set_number)}
              onToggleWarmup={() => onToggleWarmup(row.id, entry.id)}
            />
          );
        })}

        <View style={styles.addSetRow}>
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddWarmup(entry.id, entry.exercise_id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addWarmupText, doneTextColor && { color: doneTextColor }]}>+ Warmup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddRow(entry.id, entry.exercise_id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addSetText, doneTextColor && { color: doneTextColor }]}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
    </Card>
  );

  return (
    <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={!!onRemove}>
      {cardContent}
    </SwipeToDeleteRow>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 6,
    paddingVertical: 10,
  },
  cardCollapsed: {
    marginBottom: 6,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCollapsed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  exerciseNameLink: {
    color: '#98c6fb',
  },
  exerciseNameTapTarget: {
    alignSelf: 'flex-start',
  },
  muscleGroup: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  setCount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginRight: 4,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  colHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  setLabelCol: { width: 28, alignItems: 'center', justifyContent: 'center' },
  previousCol: { width: 72, alignItems: 'center', justifyContent: 'center' },
  inputCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rirCol: { width: 40, alignItems: 'center', justifyContent: 'center' },
  actionCol: { width: 32, marginLeft: 4 },
  addSetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 4,
  },
  addSetButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  addSetText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  addWarmupText: {
    color: '#FFD93D',
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
});
