import React, { useState, useRef, useEffect } from 'react';
import { Animated, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutRow, SetLog, WeightUnit, DistanceUnit, ExerciseType } from '../../models';
import { colors, fonts } from '../../constants';
import { formatWeight, formatDistance } from '../../utils/units';
import { getExerciseTypeConfig } from '../../utils/exerciseType';
import { formatDurationValue } from '../../utils/duration';
import { SwipeToDeleteRow, RirCircle, RirPickerModal, DurationPickerModal } from '../ui';

interface SetRowProps {
  row: WorkoutRow;
  displaySetNumber: number | string;
  previousSet?: SetLog;
  weightUnit: WeightUnit;
  distanceUnit?: DistanceUnit;
  exerciseType?: ExerciseType | string;
  suggestedWeight?: string;
  suggestedReps?: string;
  suggestedDuration?: string;
  suggestedDistance?: string;
  suggestedRir?: string;
  completionColor?: string;
  onUpdateRowLocal: (updates: { weight?: string; reps?: string; rir?: string; duration?: string; distance?: string }) => void;
  onUpdateRow: (updates: { weight?: string; reps?: string; rir?: string; duration?: string; distance?: string }) => void;
  onToggle: () => void;
  onSwipeDelete: () => void;
  onToggleWarmup: () => void;
  showCompletionToggle?: boolean;
  enableWarmupSwipe?: boolean;
  showInlineDelete?: boolean;
  onInlineDelete?: () => void;
}

export function SetRow({
  row,
  displaySetNumber,
  previousSet,
  weightUnit,
  distanceUnit = 'km',
  exerciseType,
  suggestedWeight,
  suggestedReps,
  suggestedDuration,
  suggestedDistance,
  suggestedRir,
  completionColor,
  onUpdateRowLocal,
  onUpdateRow,
  onToggle,
  onSwipeDelete,
  onToggleWarmup,
  showCompletionToggle = true,
  enableWarmupSwipe = true,
  showInlineDelete = false,
  onInlineDelete,
}: SetRowProps) {
  type RowFieldKey = 'weight' | 'reps' | 'duration' | 'distance';
  const displayStoredWeight = (kg: number) => formatWeight(kg, weightUnit);
  const config = getExerciseTypeConfig(exerciseType);

  const [showRirPicker, setShowRirPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(row.is_completed);
  const completedAnim = useRef(new Animated.Value(row.is_completed ? 1 : 0)).current;

  useEffect(() => {
    if (localCompleted !== row.is_completed) {
      setLocalCompleted(row.is_completed);
      Animated.timing(completedAnim, {
        toValue: row.is_completed ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  }, [row.is_completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateCompletion = (completing: boolean) => {
    setLocalCompleted(completing);
    Animated.timing(completedAnim, {
      toValue: completing ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const suggestedRepsAutofill = suggestedReps?.includes('-')
    ? suggestedReps.split('-')[1]
    : suggestedReps;

  const getSuggestedForField = (key: string): string => {
    if (key === 'weight') return suggestedWeight || '0';
    if (key === 'reps') return suggestedRepsAutofill || '0';
    if (key === 'duration') return suggestedDuration || '0';
    if (key === 'distance') return suggestedDistance || '0';
    return '0';
  };

  const getPlaceholderForField = (key: string): string => {
    if (key === 'reps') return suggestedReps || '0';
    return getSuggestedForField(key);
  };

  const getRowFieldValue = (key: RowFieldKey): string => {
    return row[key];
  };

  const handleFieldChange = (key: RowFieldKey, v: string) => {
    onUpdateRowLocal({ [key]: v });
  };

  const handleFieldBlur = (key: RowFieldKey) => {
    onUpdateRow({ [key]: getRowFieldValue(key) });
  };

  const handleRirSelect = (value: number | null) => {
    const rirStr = value != null ? String(value) : '';
    onUpdateRowLocal({ rir: rirStr });
    onUpdateRow({ rir: rirStr });
    if (rirStr && !row.is_completed) {
      animateCompletion(true);
      markDone(rirStr);
    }
  };

  const handleDurationConfirm = (totalSeconds: number) => {
    const val = String(totalSeconds);
    onUpdateRowLocal({ duration: val });
    onUpdateRow({ duration: val });
  };

  const markDone = (overrideRir?: string) => {
    const pendingUpdates: Record<string, string> = {};

    for (const field of config.fields) {
      const key = field.key as RowFieldKey;
      const rowVal = getRowFieldValue(key);
      const suggested = getSuggestedForField(field.key);
      const finalVal = rowVal || suggested;
      if (finalVal !== rowVal) pendingUpdates[field.key] = finalVal;
    }

    if (config.showRir) {
      const rirVal = overrideRir ?? row.rir ?? suggestedRir ?? '';
      if (rirVal && rirVal !== row.rir) pendingUpdates.rir = rirVal;
    }

    if (Object.keys(pendingUpdates).length > 0) {
      onUpdateRowLocal(pendingUpdates);
      onUpdateRow(pendingUpdates);
    }
    onToggle();
  };

  const handleToggle = () => {
    animateCompletion(!row.is_completed);
    if (!row.is_completed) {
      markDone();
    } else {
      onToggle();
    }
  };

  const rirNum = row.rir ? parseFloat(row.rir) : null;
  const isWarmup = row.is_warmup;

  const buildPreviousText = () => {
    if (!previousSet) return '-';
    const parts: string[] = [];
    if (config.fields.some((f) => f.key === 'weight')) {
      parts.push(displayStoredWeight(previousSet.weight));
    }
    if (config.fields.some((f) => f.key === 'reps')) {
      parts.push(`${previousSet.reps_performed}`);
    }
    if (config.fields.some((f) => f.key === 'duration') && previousSet.duration > 0) {
      parts.push(formatDurationValue(previousSet.duration));
    }
    if (config.fields.some((f) => f.key === 'distance') && previousSet.distance > 0) {
      parts.push(formatDistance(previousSet.distance, distanceUnit));
    }
    let text = parts.join('x');
    if (config.showRir && previousSet.rir !== null) {
      text += ` @${previousSet.rir}`;
    }
    return text || '-';
  };

  const durationSeconds = row.duration ? parseFloat(row.duration) || 0 : 0;
  const suggestedDurationNum = suggestedDuration ? parseFloat(suggestedDuration) || 0 : 0;

  const hasCompletionColor = !!completionColor && completionColor !== 'transparent';
  const animatedRowBg = completedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', hasCompletionColor ? completionColor! : 'transparent'],
  });

  return (
    <>
      <SwipeToDeleteRow
        onDelete={onSwipeDelete}
        expandedHeight={60}
        onSwipeRight={enableWarmupSwipe ? onToggleWarmup : undefined}
      >
        <Animated.View style={[styles.row, { backgroundColor: animatedRowBg }]}>
            <View style={styles.setLabel}>
              {isWarmup ? (
                <View style={styles.warmupCircle}>
                  <Text style={styles.warmupText}>W</Text>
                </View>
              ) : (
                <Text style={[
                  styles.setNumber,
                  localCompleted && completionColor && completionColor !== 'transparent' && { color: '#000000' },
                ]}>{displaySetNumber}</Text>
              )}
            </View>

            <View style={styles.previousCol}>
              <Text style={[
                styles.previousText,
                localCompleted && completionColor && completionColor !== 'transparent' && { color: '#000000' },
              ]}>
                {buildPreviousText()}
              </Text>
            </View>

            {config.fields.map((field) => {
              const key = field.key as RowFieldKey;
              const rowVal = getRowFieldValue(key);

              if (field.key === 'duration') {
                const displayVal = durationSeconds > 0
                  ? formatDurationValue(durationSeconds)
                  : '';
                const placeholderVal = suggestedDurationNum > 0
                  ? formatDurationValue(suggestedDurationNum)
                  : '0:00';
                return (
                  <TouchableOpacity
                    key={field.key}
                    style={[styles.input, styles.fieldInput, localCompleted && hasCompletionColor && styles.inputDone]}
                    onPress={() => setShowDurationPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      displayVal ? styles.durationText : styles.durationPlaceholder,
                      localCompleted && hasCompletionColor && { color: '#000000' },
                    ]}>
                      {displayVal || placeholderVal}
                    </Text>
                  </TouchableOpacity>
                );
              }

              const placeholder = getPlaceholderForField(field.key);
              return (
                <TextInput
                  key={field.key}
                  style={[styles.input, styles.fieldInput, localCompleted && hasCompletionColor && styles.inputDone]}
                  value={rowVal}
                  onChangeText={(v) => handleFieldChange(key, v)}
                  onBlur={() => handleFieldBlur(key)}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={field.keyboardType}
                  selectTextOnFocus
                />
              );
            })}

            {config.showRir && (
              <View style={styles.rirCol}>
                <RirCircle
                  value={rirNum}
                  size={32}
                  onPress={() => setShowRirPicker(true)}
                  style={localCompleted && hasCompletionColor ? styles.rirDone : undefined}
                />
              </View>
            )}

            {showCompletionToggle && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  localCompleted && styles.saveButtonDone,
                  localCompleted && hasCompletionColor && { backgroundColor: completionColor, borderColor: 'rgba(0,0,0,0.25)' },
                ]}
                onPress={handleToggle}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.saveButtonText,
                  localCompleted && styles.saveButtonTextDone,
                  localCompleted && hasCompletionColor && { color: '#000000' },
                ]}>
                  {localCompleted ? '✓' : '+'}
                </Text>
              </TouchableOpacity>
            )}
            {showInlineDelete && onInlineDelete && (
              <TouchableOpacity
                style={styles.inlineDeleteButton}
                onPress={onInlineDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.inlineDeleteText}>×</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
      </SwipeToDeleteRow>

      {config.showRir && (
        <RirPickerModal
          visible={showRirPicker}
          onClose={() => setShowRirPicker(false)}
          onSelect={handleRirSelect}
          currentValue={rirNum}
        />
      )}

      <DurationPickerModal
        visible={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onConfirm={handleDurationConfirm}
        value={durationSeconds || suggestedDurationNum}
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  fieldInput: {
    flex: 1,
  },
  durationText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  durationPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
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
  inputDone: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    color: '#000000',
  },
  rirDone: {
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  inlineDeleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  inlineDeleteText: {
    fontSize: 18,
    color: colors.danger,
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
});
