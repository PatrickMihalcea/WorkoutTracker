import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { WorkoutRow, SetLog, WeightUnit, RoutineDayExerciseSet } from '../../models';
import { colors, fonts } from '../../constants';
import { formatWeight } from '../../utils/units';

interface SetRowProps {
  row: WorkoutRow;
  previousSet?: SetLog;
  templateSet?: RoutineDayExerciseSet;
  weightUnit: WeightUnit;
  onUpdateRow: (updates: { weight?: string; reps?: string; rir?: string }) => void;
  onToggle: () => void;
  onSwipeDelete: () => void;
}

export function SetRow({
  row,
  previousSet,
  templateSet,
  weightUnit,
  onUpdateRow,
  onToggle,
  onSwipeDelete,
}: SetRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;
  const displayStoredWeight = (kg: number) => formatWeight(kg, weightUnit);

  const [weight, setWeight] = useState(row.weight);
  const [reps, setReps] = useState(row.reps);
  const [rir, setRir] = useState(row.rir);

  const templateWeight = templateSet && templateSet.target_weight > 0
    ? formatWeight(templateSet.target_weight, weightUnit)
    : undefined;
  const templateReps = templateSet
    ? (templateSet.target_reps_min === templateSet.target_reps_max
        ? String(templateSet.target_reps_min)
        : `${templateSet.target_reps_min}-${templateSet.target_reps_max}`)
    : undefined;

  const handleWeightBlur = () => {
    if (weight !== row.weight) onUpdateRow({ weight });
  };
  const handleRepsBlur = () => {
    if (reps !== row.reps) onUpdateRow({ reps });
  };
  const handleRirBlur = () => {
    if (rir !== row.rir) onUpdateRow({ rir });
  };

  const handleToggle = () => {
    if (!row.is_completed) {
      const finalWeight = weight || '0';
      const finalReps = reps || '0';
      const pendingUpdates: { weight?: string; reps?: string; rir?: string } = {};
      if (finalWeight !== row.weight) pendingUpdates.weight = finalWeight;
      if (finalReps !== row.reps) pendingUpdates.reps = finalReps;
      if (rir !== row.rir) pendingUpdates.rir = rir;
      if (Object.keys(pendingUpdates).length > 0) {
        onUpdateRow(pendingUpdates);
      }
      setWeight(finalWeight);
      setReps(finalReps);
    }
    onToggle();
  };

  const handleSwipeOpen = () => {
    swipeableRef.current?.close();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onSwipeDelete();
    });
  };

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

  const rowMaxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight: rowMaxHeight, overflow: 'hidden' }}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeOpen}
        rightThreshold={70}
        overshootRight={false}
      >
        <View style={[styles.row, row.is_completed && styles.rowSaved]}>
          <View style={styles.setLabel}>
            <Text style={styles.setNumber}>{row.set_number}</Text>
          </View>

          <View style={styles.previousCol}>
            {previousSet ? (
              <Text style={styles.previousText}>
                {displayStoredWeight(previousSet.weight)}x{previousSet.reps_performed}
                {previousSet.rir !== null && ` @${previousSet.rir}`}
              </Text>
            ) : (
              <Text style={styles.previousText}>-</Text>
            )}
          </View>

          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weight}
            onChangeText={setWeight}
            onBlur={handleWeightBlur}
            placeholder={templateWeight ?? '0'}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />

          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            onBlur={handleRepsBlur}
            placeholder={templateReps ?? '0'}
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
      </Swipeable>
    </Animated.View>
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
});
