import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutRow, SetLog, WeightUnit } from '../../models';
import { colors, fonts } from '../../constants';
import { formatWeight } from '../../utils/units';
import { SwipeToDeleteRow, RirCircle, RirPickerModal } from '../ui';

interface SetRowProps {
  row: WorkoutRow;
  displaySetNumber: number | string;
  previousSet?: SetLog;
  weightUnit: WeightUnit;
  suggestedWeight?: string;
  suggestedReps?: string;
  completionColor?: string;
  onUpdateRowLocal: (updates: { weight?: string; reps?: string; rir?: string }) => void;
  onUpdateRow: (updates: { weight?: string; reps?: string; rir?: string }) => void;
  onToggle: () => void;
  onSwipeDelete: () => void;
  onToggleWarmup: () => void;
}

export function SetRow({
  row,
  displaySetNumber,
  previousSet,
  weightUnit,
  suggestedWeight,
  suggestedReps,
  completionColor,
  onUpdateRowLocal,
  onUpdateRow,
  onToggle,
  onSwipeDelete,
  onToggleWarmup,
}: SetRowProps) {
  const displayStoredWeight = (kg: number) => formatWeight(kg, weightUnit);

  const [showRirPicker, setShowRirPicker] = useState(false);

  const suggestedRepsValue = suggestedReps?.includes('-')
    ? suggestedReps.split('-')[1]
    : suggestedReps;

  const handleWeightChange = (v: string) => {
    onUpdateRowLocal({ weight: v });
  };
  const handleRepsChange = (v: string) => {
    onUpdateRowLocal({ reps: v });
  };

  const handleWeightBlur = () => {
    onUpdateRow({ weight: row.weight });
  };
  const handleRepsBlur = () => {
    onUpdateRow({ reps: row.reps });
  };

  const handleRirSelect = (value: number | null) => {
    const rirStr = value != null ? String(value) : '';
    onUpdateRowLocal({ rir: rirStr });
    onUpdateRow({ rir: rirStr });
    if (rirStr && !row.is_completed) {
      markDone(rirStr);
    }
  };

  const markDone = (overrideRir?: string) => {
    const finalWeight = row.weight || suggestedWeight || '0';
    const finalReps = row.reps || suggestedRepsValue || '0';
    const pendingUpdates: { weight?: string; reps?: string; rir?: string } = {};
    if (finalWeight !== row.weight) pendingUpdates.weight = finalWeight;
    if (finalReps !== row.reps) pendingUpdates.reps = finalReps;
    if (overrideRir !== undefined && overrideRir !== row.rir) pendingUpdates.rir = overrideRir;
    if (Object.keys(pendingUpdates).length > 0) {
      onUpdateRowLocal(pendingUpdates);
      onUpdateRow(pendingUpdates);
    }
    onToggle();
  };

  const handleToggle = () => {
    if (!row.is_completed) {
      markDone();
    } else {
      onToggle();
    }
  };

  const rirNum = row.rir ? parseFloat(row.rir) : null;
  const isWarmup = row.is_warmup;

  return (
    <>
      <SwipeToDeleteRow onDelete={onSwipeDelete} expandedHeight={60} onSwipeRight={onToggleWarmup}>
        <View style={[
            styles.row,
            row.is_completed && styles.rowSaved,
            row.is_completed && completionColor && completionColor !== 'transparent' && { backgroundColor: completionColor },
          ]}>
            <View style={styles.setLabel}>
              {isWarmup ? (
                <View style={styles.warmupCircle}>
                  <Text style={styles.warmupText}>W</Text>
                </View>
              ) : (
                <Text style={[
                  styles.setNumber,
                  row.is_completed && completionColor && completionColor !== 'transparent' && { color: '#000000' },
                ]}>{displaySetNumber}</Text>
              )}
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
              value={row.weight}
              onChangeText={handleWeightChange}
              onBlur={handleWeightBlur}
              placeholder={suggestedWeight ?? '0'}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />

            <TextInput
              style={[styles.input, styles.repsInput]}
              value={row.reps}
              onChangeText={handleRepsChange}
              onBlur={handleRepsBlur}
              placeholder={suggestedReps ?? '0'}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus
            />

            <View style={styles.rirCol}>
              <RirCircle
                value={rirNum}
                size={32}
                onPress={() => setShowRirPicker(true)}
              />
            </View>

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

      <RirPickerModal
        visible={showRirPicker}
        onClose={() => setShowRirPicker(false)}
        onSelect={handleRirSelect}
        currentValue={rirNum}
      />
    </>
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
  rowSaved: {},
  setLabel: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  warmupCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD93D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmupText: {
    color: '#000',
    fontSize: 12,
    fontFamily: fonts.bold,
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
  repsInput: {
    flex: 0.8,
  },
  rirCol: {
    width: 40,
    alignItems: 'center',
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
