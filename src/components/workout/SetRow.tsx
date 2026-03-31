import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SetLog } from '../../models';
import { colors, fonts } from '../../constants';

interface SetRowProps {
  setNumber: number;
  previousSet?: SetLog;
  currentSet?: SetLog;
  isWarmup?: boolean;
  onSave: (weight: number, reps: number, rir: number | null) => void;
  onDelete?: () => void;
}

export function SetRow({
  setNumber,
  previousSet,
  currentSet,
  isWarmup = false,
  onSave,
  onDelete,
}: SetRowProps) {
  const [weight, setWeight] = useState(currentSet?.weight?.toString() ?? '');
  const [reps, setReps] = useState(currentSet?.reps_performed?.toString() ?? '');
  const [rir, setRir] = useState(currentSet?.rir?.toString() ?? '');
  const [saved, setSaved] = useState(!!currentSet);

  useEffect(() => {
    if (currentSet) {
      setWeight(currentSet.weight.toString());
      setReps(currentSet.reps_performed.toString());
      setRir(currentSet.rir?.toString() ?? '');
      setSaved(true);
    }
  }, [currentSet]);

  const handleSave = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    const rirVal = rir ? parseInt(rir, 10) : null;
    onSave(w, r, rirVal);
    setSaved(true);
  };

  return (
    <View style={[styles.row, saved && styles.rowSaved, isWarmup && styles.rowWarmup]}>
      <View style={styles.setLabel}>
        <Text style={styles.setNumber}>
          {isWarmup ? 'W' : setNumber}
        </Text>
      </View>

      <View style={styles.previousCol}>
        {previousSet ? (
          <Text style={styles.previousText}>
            {previousSet.weight}x{previousSet.reps_performed}
            {previousSet.rir !== null && ` @${previousSet.rir}`}
          </Text>
        ) : (
          <Text style={styles.previousText}>-</Text>
        )}
      </View>

      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />

      <TextInput
        style={styles.input}
        value={reps}
        onChangeText={setReps}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        selectTextOnFocus
      />

      <TextInput
        style={[styles.input, styles.rirInput]}
        value={rir}
        onChangeText={setRir}
        placeholder="-"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        selectTextOnFocus
      />

      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonDone]}
        onPress={handleSave}
        activeOpacity={0.7}
      >
        <Text style={styles.saveButtonText}>{saved ? '✓' : '+'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  rowSaved: {
    opacity: 0.7,
  },
  rowWarmup: {
    opacity: 0.6,
  },
  setLabel: {
    width: 28,
    alignItems: 'center',
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  previousCol: {
    width: 70,
    alignItems: 'center',
  },
  previousText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.light,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  rirInput: {
    maxWidth: 50,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
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
});
