import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutRow, SetLog, WeightUnit } from '../../models';
import { colors, fonts } from '../../constants';
import { formatWeight } from '../../utils/units';
import { SwipeToDeleteRow } from '../ui';

interface SetRowProps {
  row: WorkoutRow;
  previousSet?: SetLog;
  weightUnit: WeightUnit;
  suggestedWeight?: string;
  suggestedReps?: string;
  completionColor?: string;
  onUpdateRow: (updates: { weight?: string; reps?: string; rir?: string }) => void;
  onToggle: () => void;
  onSwipeDelete: () => void;
}

export function SetRow({
  row,
  previousSet,
  weightUnit,
  suggestedWeight,
  suggestedReps,
  completionColor,
  onUpdateRow,
  onToggle,
  onSwipeDelete,
}: SetRowProps) {
  const displayStoredWeight = (kg: number) => formatWeight(kg, weightUnit);

  const [weight, setWeight] = useState(row.weight);
  const [reps, setReps] = useState(row.reps);
  const [rir, setRir] = useState(row.rir);

  const suggestedRepsValue = suggestedReps?.includes('-')
    ? suggestedReps.split('-')[1]
    : suggestedReps;

  const markDone = () => {
    const finalWeight = weight || suggestedWeight || '0';
    const finalReps = reps || suggestedRepsValue || '0';
    const pendingUpdates: { weight?: string; reps?: string; rir?: string } = {};
    if (finalWeight !== row.weight) pendingUpdates.weight = finalWeight;
    if (finalReps !== row.reps) pendingUpdates.reps = finalReps;
    if (rir !== row.rir) pendingUpdates.rir = rir;
    if (Object.keys(pendingUpdates).length > 0) {
      onUpdateRow(pendingUpdates);
    }
    setWeight(finalWeight);
    setReps(finalReps);
    onToggle();
  };

  const handleWeightBlur = () => {
    if (weight !== row.weight) onUpdateRow({ weight });
  };
  const handleRepsBlur = () => {
    if (reps !== row.reps) onUpdateRow({ reps });
  };
  const handleRirBlur = () => {
    if (rir !== row.rir) onUpdateRow({ rir });
    if (rir && !row.is_completed) {
      markDone();
    }
  };

  const handleToggle = () => {
    if (!row.is_completed) {
      markDone();
    } else {
      onToggle();
    }
  };

  return (
    <SwipeToDeleteRow onDelete={onSwipeDelete} expandedHeight={60}>
      <View style={[
          styles.row,
          row.is_completed && styles.rowSaved,
          row.is_completed && completionColor && completionColor !== 'transparent' && { backgroundColor: completionColor },
        ]}>
          <View style={styles.setLabel}>
            <Text style={[
              styles.setNumber,
              row.is_completed && completionColor && completionColor !== 'transparent' && { color: '#000000' },
            ]}>{row.set_number}</Text>
          </View>

          <View style={styles.previousCol}>
            {previousSet ? (
              <Text style={[
                styles.previousText,
                row.is_completed && completionColor && completionColor !== 'transparent' && { color: '#000000' },
              ]}>
                {displayStoredWeight(previousSet.weight)}x{previousSet.reps_performed}
                {previousSet.rir !== null && ` @${previousSet.rir}`}
              </Text>
            ) : (
              <Text style={[
                styles.previousText,
                row.is_completed && completionColor && completionColor !== 'transparent' && { color: '#000000' },
              ]}>-</Text>
            )}
          </View>

          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weight}
            onChangeText={setWeight}
            onBlur={handleWeightBlur}
            placeholder={suggestedWeight ?? '0'}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />

          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            onBlur={handleRepsBlur}
            placeholder={suggestedReps ?? '0'}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            selectTextOnFocus
          />

          <TextInput
            style={[styles.input, styles.rirInput]}
            value={rir}
            onChangeText={setRir}
            onBlur={handleRirBlur}
            placeholder="-"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            selectTextOnFocus
          />

          <TouchableOpacity
            style={[styles.saveButton, row.is_completed && styles.saveButtonDone]}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.saveButtonText, row.is_completed && styles.saveButtonTextDone]}>
              {row.is_completed ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        </View>
    </SwipeToDeleteRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 4,
    backgroundColor: colors.surface,
  },
  rowSaved: {
    opacity: 0.7,
  },
  setLabel: {
    width: 22,
    alignItems: 'center',
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  previousCol: {
    width: 72,
    alignItems: 'center',
  },
  previousText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.light,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  weightInput: {
    flex: 0.8,
  },
  rirInput: {
    maxWidth: 44,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  saveButtonDone: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  saveButtonTextDone: {
    color: colors.textSecondary,
  },
});
