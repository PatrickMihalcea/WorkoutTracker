import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { exerciseService } from '../../services';
import { Button, Input, ChipPicker, BottomSheetModal, ExercisePickerModal } from '../ui';
import { colors, fonts } from '../../constants';
import {
  Exercise,
  MuscleGroup,
  Equipment,
  WeightUnit,
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
}

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (exercise: Exercise, setsPayload: SetsPayloadItem[]) => void;
  weightUnit: WeightUnit;
  editingEntry?: RoutineDayExercise | null;
  onDeleteExercise?: (exercise: Exercise) => void;
}

export function AddExerciseModal({
  visible,
  onClose,
  onConfirm,
  weightUnit,
  editingEntry,
  onDeleteExercise,
}: AddExerciseModalProps) {
  const { user } = useAuthStore();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);

  const [templateSets, setTemplateSets] = useState<TemplateSetRow[]>([defaultSetRow()]);
  const [useRepRange, setUseRepRange] = useState(false);

  useEffect(() => {
    if (visible) {
      loadExercises();
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
  }, [visible]);

  const loadExercises = async () => {
    try {
      const list = await exerciseService.getAll();
      setExercises(list);
    } catch {
      // Will be empty
    }
  };

  const resetAndClose = () => {
    setSelectedExercise(null);
    setShowExercisePicker(false);
    setShowCreateExercise(false);
    setTemplateSets([defaultSetRow()]);
    setUseRepRange(false);
    setNewExerciseName('');
    onClose();
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  const handleConfirm = () => {
    if (!selectedExercise) return;
    if (useRepRange && !validateRepRange(templateSets)) return;
    const setsPayload = buildSetsPayload(templateSets, weightUnit, useRepRange);
    onConfirm(selectedExercise, setsPayload);
    resetAndClose();
  };

  const handleCreateExercise = async () => {
    if (!user || !newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    const duplicate = exercises.find(
      (ex) =>
        ex.name.toLowerCase() === newExerciseName.trim().toLowerCase() &&
        ex.muscle_group === newExerciseMuscle &&
        ex.equipment === newExerciseEquipment,
    );
    if (duplicate) {
      Alert.alert('Duplicate', 'An exercise with the same name, muscle group, and equipment already exists.');
      return;
    }
    try {
      const exercise = await exerciseService.create({
        user_id: user.id,
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscle,
        equipment: newExerciseEquipment,
      });
      setNewExerciseName('');
      setShowCreateExercise(false);
      setExercises((prev) => [...prev, exercise]);
      setSelectedExercise(exercise);
      setShowExercisePicker(false);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title={showCreateExercise ? 'Create New Exercise' : (editingEntry ? 'Edit Exercise' : 'Add Exercise')}
      fullHeight
    >
      {!showCreateExercise && (
        <>
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
            />
          </View>

          <View style={styles.actionButtons}>
            <Button
              title={editingEntry ? 'Save' : 'Add'}
              onPress={handleConfirm}
              disabled={!selectedExercise}
              style={styles.addConfirmBtn}
            />
            <Button
              title="Close"
              variant="ghost"
              onPress={resetAndClose}
            />
          </View>
        </>
      )}

      {showCreateExercise && (
        <>
          <View style={styles.formBody}>
            <Input
              label="Exercise Name"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="e.g. Bench Press"
            />

            <Text style={styles.fieldLabel}>Muscle Group</Text>
            <ChipPicker
              items={Object.values(MuscleGroup).map((mg) => ({ key: mg, label: mg, value: mg }))}
              selected={newExerciseMuscle}
              onChange={(v) => setNewExerciseMuscle(v as MuscleGroup)}
              allowDeselect={false}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Equipment</Text>
            <ChipPicker
              items={Object.values(Equipment).map((eq) => ({ key: eq, label: eq, value: eq }))}
              selected={newExerciseEquipment}
              onChange={(v) => setNewExerciseEquipment(v as Equipment)}
              allowDeselect={false}
            />
          </View>

          <View style={styles.actionButtons}>
            <View style={styles.createExActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setShowCreateExercise(false);
                  setNewExerciseName('');
                }}
                style={styles.createExCancelBtn}
              />
              <Button
                title="Save Exercise"
                onPress={handleCreateExercise}
                style={styles.createExSaveBtn}
              />
            </View>
          </View>
        </>
      )}

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleSelectExercise}
        onDeleteExercise={onDeleteExercise}
        onCreateNew={() => {
          setShowExercisePicker(false);
          setShowCreateExercise(true);
        }}
        selectedExerciseId={selectedExercise?.id}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
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
  addConfirmBtn: {
    marginBottom: 8,
  },
  createExActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createExCancelBtn: {
    flex: 1,
  },
  createExSaveBtn: {
    flex: 3,
  },
});
