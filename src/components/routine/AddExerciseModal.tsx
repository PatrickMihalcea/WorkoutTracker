import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Button, BottomSheetModal, ExercisePickerModal } from '../ui';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Exercise,
  WeightUnit,
  DistanceUnit,
  RoutineDayExercise,
} from '../../models';
import {
  TemplateSetRow,
  defaultSetRow,
  buildSetsPayload,
  setsToTemplateRows,
  validateRepRange,
  SetsTableEditor,
} from './SetsTableEditor';

export interface SetsPayloadItem {
  set_number: number;
  target_weight: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rir?: number | null;
  target_duration?: number;
  target_distance?: number;
  is_warmup?: boolean;
}

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (exercise: Exercise, setsPayload: SetsPayloadItem[]) => void;
  weightUnit: WeightUnit;
  distanceUnit?: DistanceUnit;
  editingEntry?: RoutineDayExercise | null;
  onDeleteExercise?: (exercise: Exercise, onDeleted?: () => void) => void;
  onExerciseDetails?: (exerciseId: string) => void;
  autoOpenPicker?: boolean;
  preserveStateOnOpen?: boolean;
}

export function AddExerciseModal({
  visible,
  onClose,
  onConfirm,
  weightUnit,
  distanceUnit = 'km',
  editingEntry,
  onDeleteExercise,
  onExerciseDetails,
  autoOpenPicker,
  preserveStateOnOpen = false,
}: AddExerciseModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const [templateSets, setTemplateSets] = useState<TemplateSetRow[]>([defaultSetRow()]);
  const [useRepRange, setUseRepRange] = useState(false);

  useEffect(() => {
    if (visible) {
      if (!preserveStateOnOpen) {
        if (editingEntry) {
          const ex = editingEntry.exercise ?? null;
          setSelectedExercise(ex);
          const { rows, hasRepRange } = setsToTemplateRows(
            editingEntry.sets ?? [],
            editingEntry.target_reps,
            weightUnit,
          );
          setTemplateSets(rows);
          setUseRepRange(hasRepRange);
        } else {
          setSelectedExercise(null);
          setTemplateSets([defaultSetRow()]);
          setUseRepRange(false);
        }
      }
      if (autoOpenPicker) {
        setShowExercisePicker(true);
      }
      return;
    }
    setShowExercisePicker(false);
  }, [autoOpenPicker, editingEntry, preserveStateOnOpen, visible, weightUnit]);

  const handleExerciseDetails = useCallback((exerciseId: string) => {
    setShowExercisePicker(false);
    onExerciseDetails?.(exerciseId);
  }, [onExerciseDetails]);

  const resetAndClose = () => {
    setSelectedExercise(null);
    setShowExercisePicker(false);
    setTemplateSets([defaultSetRow()]);
    setUseRepRange(false);
    onClose();
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  const handlePickerExerciseDeleted = (exercise: Exercise) => {
    setSelectedExercise((prev) => (prev?.id === exercise.id ? null : prev));
  };

  const handleConfirm = () => {
    if (!selectedExercise) return;
    if (useRepRange && !validateRepRange(templateSets)) return;
    const setsPayload = buildSetsPayload(templateSets, weightUnit, useRepRange);
    onConfirm(selectedExercise, setsPayload);
    resetAndClose();
  };

  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    formBody: {
      flex: 1,
    },
    actionButtons: {
      paddingBottom: 20,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.regular,
      marginBottom: 8,
      marginTop: 12,
    },
    exercisePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    exercisePickerText: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
      flex: 1,
    },
    exercisePickerPlaceholder: {
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      flex: 1,
    },
    exercisePickerArrow: {
      fontSize: 16,
      color: colors.textMuted,
      marginLeft: 8,
    },
  }), [colors]);

  return (
      <BottomSheetModal
        visible={visible}
        title={editingEntry ? 'Edit Exercise' : 'Add Exercise'}
        fullHeight
        onClose={resetAndClose}
      >
        <View style={styles.formBody}>
          <Text style={styles.fieldLabel}>Exercise</Text>
          <TouchableOpacity
            style={styles.exercisePickerRow}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={selectedExercise ? styles.exercisePickerText : styles.exercisePickerPlaceholder}>
              {selectedExercise?.name ?? 'Select Exercise...'}
            </Text>
            <Text style={styles.exercisePickerArrow}>&#x25B8;</Text>
          </TouchableOpacity>

          <SetsTableEditor
            rows={templateSets}
            setRows={setTemplateSets}
            repRange={useRepRange}
            setRepRange={setUseRepRange}
            wUnit={weightUnit}
            dUnit={distanceUnit}
            exerciseType={selectedExercise?.exercise_type}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button
            title={editingEntry ? 'Save' : 'Add'}
            variant="accent"
            onPress={handleConfirm}
            disabled={!selectedExercise}
          />
        </View>

        <ExercisePickerModal
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={handleSelectExercise}
          onDeleteExercise={onDeleteExercise}
          onExerciseDeleted={handlePickerExerciseDeleted}
          onExerciseDetails={handleExerciseDetails}
          selectedExerciseId={selectedExercise?.id}
          animated={!preserveStateOnOpen}
          preserveStateOnOpen={preserveStateOnOpen}
        />
      </BottomSheetModal>
  );
}
