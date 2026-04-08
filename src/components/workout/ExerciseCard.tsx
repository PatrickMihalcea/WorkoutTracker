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

const ANIM_DURATION = 500;

const slowLayout: LayoutAnimationConfig = {
  duration: ANIM_DURATION,
  update: { type: LayoutAnimation.Types.easeInEaseOut },
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

  const colorAnim = useRef(new Animated.Value(allDone ? 1 : 0)).current;
  const prevAllDone = useRef(allDone);

  const canAnimate = setCompletion !== 'transparent';

  useEffect(() => {
    if (allDone === prevAllDone.current) return;
    prevAllDone.current = allDone;

    if (allDone && canAnimate) {
      LayoutAnimation.configureNext(slowLayout);
      onToggleCollapse?.();
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: false,
      }).start();
    } else if (!allDone && canAnimate) {
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: false,
      }).start();
    }
  }, [allDone]);

  const animatedBg = canAnimate
    ? colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surface, setCompletion],
      })
    : undefined;

  const doneTextColor = (allDone && canAnimate) ? '#000000' : undefined;

  const handleToggle = () => {
    LayoutAnimation.configureNext(slowLayout);
    onToggleCollapse?.();
  };

  const menuItems = useMemo((): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [];
    if (onDetails) items.push({ label: 'Details', onPress: onDetails });
    if (canSupersetPrev) items.push({ label: 'Superset Prev', onPress: () => onSupersetPrev?.() });
    if (canSupersetNext) items.push({ label: 'Superset Next', onPress: () => onSupersetNext?.() });
    if (supersetGroup) items.push({ label: 'Separate', onPress: () => onSeparate?.() });
    if (onSwap) items.push({ label: 'Swap', onPress: onSwap });
    if (onDuplicate) items.push({ label: 'Duplicate', onPress: onDuplicate });
    if (onRemove) items.push({ label: 'Delete', onPress: onRemove, destructive: true });
    return items;
  }, [onDetails, supersetGroup, canSupersetPrev, canSupersetNext, onSupersetPrev, onSupersetNext, onSeparate, onSwap, onDuplicate, onRemove]);

  const showMenu = !reorderCollapsed && (onSwap || onDuplicate || onRemove);

  const marginOverride = noBottomMargin ? { marginBottom: 0 } : undefined;

  if (reorderCollapsed) {
    const reorderCardStyle = (allDone && canAnimate)
      ? [styles.cardCollapsed, { backgroundColor: setCompletion }, marginOverride]
      : [styles.cardCollapsed, marginOverride];
    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={!!onRemove}>
        <Card style={StyleSheet.flatten(reorderCardStyle)}>
          <View style={styles.headerCollapsed}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
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
    const collapsedBg = animatedBg ?? (allDone && canAnimate ? setCompletion : undefined);
    const collapsedStyle = collapsedBg
      ? [styles.cardCollapsed, { backgroundColor: collapsedBg }, marginOverride] as any
      : [styles.cardCollapsed, marginOverride];

    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={!!onRemove}>
        <Card style={collapsedStyle}>
          <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
            <View style={styles.headerCollapsed}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
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

  const expandedBg = animatedBg ?? undefined;
  const expandedStyle = expandedBg
    ? [styles.card, { backgroundColor: expandedBg }, marginOverride] as any
    : [styles.card, marginOverride];

  let workingSetIndex = 0;

  const cardContent = (
    <Card style={expandedStyle}>
      <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
        <View style={[styles.header, (allDone && canAnimate) && { backgroundColor: 'transparent' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
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
    marginBottom: 12,
    backgroundColor: colors.surface,
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
