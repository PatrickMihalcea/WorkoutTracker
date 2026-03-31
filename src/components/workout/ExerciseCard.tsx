import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RoutineDayExercise, SetLog } from '../../models';
import { colors, fonts } from '../../constants';
import { Card } from '../ui/Card';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  entry: RoutineDayExercise;
  sets: SetLog[];
  previousSets: SetLog[];
  onAddSet: (exerciseId: string, weight: number, reps: number, rir: number | null) => void;
  onUpdateSet: (setId: string, weight: number, reps: number, rir: number | null) => void;
}

export function ExerciseCard({
  entry,
  sets,
  previousSets,
  onAddSet,
  onUpdateSet,
}: ExerciseCardProps) {
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = entry.exercise?.muscle_group ?? '';
  const completedSets = sets.length;
  const targetSets = entry.target_sets;

  const handleSetSave = (index: number, weight: number, reps: number, rir: number | null) => {
    const existingSet = sets[index];
    if (existingSet) {
      onUpdateSet(existingSet.id, weight, reps, rir);
    } else {
      onAddSet(entry.exercise_id, weight, reps, rir);
    }
  };

  const displayRows = Math.max(targetSets, completedSets + 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.muscleGroup}>{muscleGroup}</Text>
        </View>
        <Text style={styles.setCount}>
          {completedSets}/{targetSets}
        </Text>
      </View>

      <View style={styles.columnHeaders}>
        <View style={styles.setLabelCol}>
          <Text style={styles.colHeader}>SET</Text>
        </View>
        <View style={styles.previousCol}>
          <Text style={styles.colHeader}>PREV</Text>
        </View>
        <View style={styles.inputCol}>
          <Text style={styles.colHeader}>KG</Text>
        </View>
        <View style={styles.inputCol}>
          <Text style={styles.colHeader}>REPS</Text>
        </View>
        <View style={styles.rirCol}>
          <Text style={styles.colHeader}>RIR</Text>
        </View>
        <View style={styles.actionCol} />
      </View>

      {Array.from({ length: displayRows }, (_, i) => (
        <SetRow
          key={i}
          setNumber={i + 1}
          currentSet={sets[i]}
          previousSet={previousSets[i]}
          onSave={(w, r, rir) => handleSetSave(i, w, r, rir)}
        />
      ))}

      <TouchableOpacity
        style={styles.addSetButton}
        onPress={() => onAddSet(entry.exercise_id, 0, 0, null)}
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
    paddingHorizontal: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  colHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  setLabelCol: { width: 28, alignItems: 'center' },
  previousCol: { width: 70, alignItems: 'center' },
  inputCol: { flex: 1, alignItems: 'center' },
  rirCol: { maxWidth: 50, flex: 1, alignItems: 'center' },
  actionCol: { width: 36 },
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
