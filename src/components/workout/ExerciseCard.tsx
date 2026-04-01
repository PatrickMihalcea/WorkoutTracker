import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { RoutineDayExercise, WorkoutRow, SetLog, WeightUnit } from '../../models';
import { colors, fonts } from '../../constants';
import { Card } from '../ui/Card';
import { SetRow } from './SetRow';
import { weightUnitLabel, formatWeight } from '../../utils/units';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ExerciseCardProps {
  entry: RoutineDayExercise;
  rows: WorkoutRow[];
  previousSets: SetLog[];
  weightUnit: WeightUnit;
  onUpdateRow: (id: string, entryId: string, updates: { weight?: string; reps?: string; rir?: string }) => void;
  onToggleRow: (id: string, entryId: string) => void;
  onDeleteRow: (id: string, entryId: string, setNumber: number) => void;
  onAddRow: (entryId: string, exerciseId: string) => void;
  onRemove?: () => void;
  reorderCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLongPress?: () => void;
}

export function ExerciseCard({
  entry,
  rows,
  previousSets,
  weightUnit,
  onUpdateRow,
  onToggleRow,
  onDeleteRow,
  onAddRow,
  onRemove,
  reorderCollapsed,
  isCollapsed,
  onToggleCollapse,
  onLongPress,
}: ExerciseCardProps) {
  const { setCompletion } = useThemeColors();
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = entry.exercise?.muscle_group ?? '';
  const completedCount = rows.filter((r) => r.is_completed).length;
  const allDone = rows.length > 0 && rows.every((r) => r.is_completed);
  const templates = entry.sets ?? [];

  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const hasDoneBackground = allDone && setCompletion !== 'transparent';
  const doneTextColor = hasDoneBackground ? '#000000' : undefined;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCollapse?.();
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [70, 0],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Text style={styles.deleteText}>X</Text>
      </Animated.View>
    );
  };

  const handleSwipeOpen = () => {
    swipeRef.current?.close();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => {
      onRemove?.();
    });
  };

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5000],
  });

  // Reorder mode: minimal collapsed card (no tap-to-expand)
  if (reorderCollapsed) {
    const reorderCardStyle = StyleSheet.flatten(
      hasDoneBackground
        ? [styles.cardCollapsed, { backgroundColor: setCompletion }]
        : [styles.cardCollapsed],
    );
    const reorderHeader = (
      <View style={styles.headerCollapsed}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
          <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
        </View>
        <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
          {completedCount}/{rows.length}
        </Text>
      </View>
    );
    return (
      <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' }}>
        <Card style={reorderCardStyle}>
          {onRemove ? (
            <Swipeable
              ref={swipeRef}
              renderRightActions={renderRightActions}
              onSwipeableOpen={handleSwipeOpen}
              rightThreshold={70}
              overshootRight={false}
            >
              {reorderHeader}
            </Swipeable>
          ) : (
            reorderHeader
          )}
        </Card>
      </Animated.View>
    );
  }

  // User-collapsed mode: tappable header, completion color when all done
  if (isCollapsed) {
    const collapsedCardStyle = StyleSheet.flatten(
      hasDoneBackground
        ? [styles.cardCollapsed, { backgroundColor: setCompletion }]
        : [styles.cardCollapsed],
    );

    const collapsedHeader = (
      <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
        <View style={styles.headerCollapsed}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
            <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
          </View>
          <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
            {completedCount}/{rows.length}
          </Text>
        </View>
      </TouchableOpacity>
    );

    return (
      <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' }}>
        <Card style={collapsedCardStyle}>
          {onRemove ? (
            <Swipeable
              ref={swipeRef}
              renderRightActions={renderRightActions}
              onSwipeableOpen={handleSwipeOpen}
              rightThreshold={70}
              overshootRight={false}
            >
              {collapsedHeader}
            </Swipeable>
          ) : (
            collapsedHeader
          )}
        </Card>
      </Animated.View>
    );
  }

  // Expanded mode
  const expandedCardStyle = StyleSheet.flatten(
    hasDoneBackground
      ? [styles.card, { backgroundColor: setCompletion }]
      : [styles.card],
  );
  const headerContent = (
    <TouchableOpacity onPress={handleToggle} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={[styles.header, hasDoneBackground && { backgroundColor: 'transparent' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, doneTextColor && { color: doneTextColor }]}>{exerciseName}</Text>
          <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
        </View>
        <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
          {completedCount}/{rows.length}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' }}>
      <Card style={expandedCardStyle}>
        {onRemove ? (
          <Swipeable
            ref={swipeRef}
            renderRightActions={renderRightActions}
            onSwipeableOpen={handleSwipeOpen}
            rightThreshold={70}
            overshootRight={false}
          >
            {headerContent}
          </Swipeable>
        ) : (
          headerContent
        )}

        <View style={[styles.columnHeaders, doneTextColor && { borderBottomColor: '#000000' }]}>
          <View style={styles.setLabelCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>SET</Text>
          </View>
          <View style={styles.previousCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>PREV</Text>
          </View>
          <View style={styles.weightCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>{weightUnitLabel(weightUnit)}</Text>
          </View>
          <View style={styles.inputCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>REPS</Text>
          </View>
          <View style={styles.rirCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>RIR</Text>
          </View>
          <View style={styles.actionCol} />
        </View>

        {rows.map((row, i) => {
          let suggestedWeight: string | undefined;
          for (let j = i - 1; j >= 0; j--) {
            if (rows[j].weight) { suggestedWeight = rows[j].weight; break; }
          }
          if (!suggestedWeight) {
            const tpl = templates[i];
            if (tpl?.target_weight > 0) suggestedWeight = formatWeight(tpl.target_weight, weightUnit);
          }

          let suggestedReps: string | undefined;
          for (let j = i - 1; j >= 0; j--) {
            if (rows[j].reps) { suggestedReps = rows[j].reps; break; }
          }
          if (!suggestedReps) {
            const tpl = templates[i];
            if (tpl) {
              suggestedReps = tpl.target_reps_min === tpl.target_reps_max
                ? String(tpl.target_reps_min)
                : `${tpl.target_reps_min}-${tpl.target_reps_max}`;
            }
          }

          return (
            <SetRow
              key={row.id}
              row={row}
              previousSet={previousSets[i]}
              weightUnit={weightUnit}
              suggestedWeight={suggestedWeight}
              suggestedReps={suggestedReps}
              completionColor={setCompletion}
              onUpdateRow={(updates) => onUpdateRow(row.id, entry.id, updates)}
              onToggle={() => onToggleRow(row.id, entry.id)}
              onSwipeDelete={() => onDeleteRow(row.id, entry.id, row.set_number)}
            />
          );
        })}

        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => onAddRow(entry.id, entry.exercise_id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.addSetText, doneTextColor && { color: doneTextColor }]}>+ Add Set</Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
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
  },
  deleteAction: {
    width: 70,
    backgroundColor: '#cc3333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
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
  setLabelCol: { width: 22, alignItems: 'center' },
  previousCol: { width: 72, alignItems: 'center' },
  weightCol: { flex: 0.8, alignItems: 'center' },
  inputCol: { flex: 1, alignItems: 'center' },
  rirCol: { maxWidth: 44, flex: 1, alignItems: 'center' },
  actionCol: { width: 32, marginLeft: 4 },
  addSetButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  addSetText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
});
