import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { RoutineDayExercise, WorkoutRow, SetLog, WeightUnit } from '../../models';
import { colors, fonts } from '../../constants';
import { Card } from '../ui/Card';
import { SetRow } from './SetRow';
import { weightUnitLabel } from '../../utils/units';

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
  collapsed?: boolean;
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
  collapsed,
}: ExerciseCardProps) {
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = entry.exercise?.muscle_group ?? '';
  const completedCount = rows.filter((r) => r.is_completed).length;
  const templates = entry.sets ?? [];

  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const translateX = dragX.interpolate({
      inputRange: [-70, 0],
      outputRange: [0, 70],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={handleSwipeOpen} activeOpacity={0.8}>
        <Animated.View style={[styles.deleteContent, { transform: [{ translateX }] }]}>
          <Text style={styles.deleteText}>X</Text>
        </Animated.View>
      </TouchableOpacity>
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
    outputRange: [0, 600],
  });

  const headerContent = (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        <Text style={styles.muscleGroup}>{muscleGroup}</Text>
      </View>
      <Text style={styles.setCount}>
        {completedCount}/{rows.length}
      </Text>
    </View>
  );

  if (collapsed) {
    const collapsedHeader = (
      <View style={styles.headerCollapsed}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.muscleGroup}>{muscleGroup}</Text>
        </View>
        <Text style={styles.setCount}>
          {completedCount}/{rows.length}
        </Text>
      </View>
    );
    return (
      <Card style={styles.cardCollapsed}>
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
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' }}>
      <Card style={styles.card}>
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

        <View style={styles.columnHeaders}>
          <View style={styles.setLabelCol}>
            <Text style={styles.colHeader}>SET</Text>
          </View>
          <View style={styles.previousCol}>
            <Text style={styles.colHeader}>PREV</Text>
          </View>
          <View style={styles.weightCol}>
            <Text style={styles.colHeader}>{weightUnitLabel(weightUnit)}</Text>
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.colHeader}>REPS</Text>
          </View>
          <View style={styles.rirCol}>
            <Text style={styles.colHeader}>RIR</Text>
          </View>
          <View style={styles.actionCol} />
        </View>

        {rows.map((row, i) => (
          <SetRow
            key={row.id}
            row={row}
            previousSet={previousSets[i]}
            templateSet={templates[i]}
            weightUnit={weightUnit}
            onUpdateRow={(updates) => onUpdateRow(row.id, entry.id, updates)}
            onToggle={() => onToggleRow(row.id, entry.id)}
            onSwipeDelete={() => onDeleteRow(row.id, entry.id, row.set_number)}
          />
        ))}

        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => onAddRow(entry.id, entry.exercise_id)}
          activeOpacity={0.7}
        >
          <Text style={styles.addSetText}>+ Add Set</Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  cardCollapsed: {
    marginBottom: 6,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  headerCollapsed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
  deleteContent: {
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
