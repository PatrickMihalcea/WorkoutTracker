import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  onUpdateRow: (id: string, exerciseId: string, updates: { weight?: string; reps?: string; rir?: string }) => void;
  onToggleRow: (id: string, exerciseId: string) => void;
  onDeleteRow: (id: string, exerciseId: string, setNumber: number) => void;
  onAddRow: (exerciseId: string) => void;
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
}: ExerciseCardProps) {
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = entry.exercise?.muscle_group ?? '';
  const completedCount = rows.filter((r) => r.is_completed).length;
  const templates = entry.sets ?? [];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.muscleGroup}>{muscleGroup}</Text>
        </View>
        <Text style={styles.setCount}>
          {completedCount}/{rows.length}
        </Text>
      </View>

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
          onUpdateRow={(updates) => onUpdateRow(row.id, entry.exercise_id, updates)}
          onToggle={() => onToggleRow(row.id, entry.exercise_id)}
          onSwipeDelete={() => onDeleteRow(row.id, entry.exercise_id, row.set_number)}
        />
      ))}

      <TouchableOpacity
        style={styles.addSetButton}
        onPress={() => onAddRow(entry.exercise_id)}
        activeOpacity={0.7}
      >
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
