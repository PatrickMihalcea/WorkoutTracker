import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { exerciseService } from '../../services';
import { Button, Input, ChipPicker, BottomSheetModal } from '../ui';
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
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
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
        setSelectedExerciseId(editingEntry.exercise_id);
        const { rows, hasRepRange } = setsToTemplateRows(
          editingEntry.sets ?? [],
          editingEntry.target_reps,
          weightUnit,
        );
        setTemplateSets(rows);
        setUseRepRange(hasRepRange);
      } else {
        setSelectedExerciseId(null);
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
    setSelectedExerciseId(null);
    setShowExercisePicker(false);
    setShowCreateExercise(false);
    setTemplateSets([defaultSetRow()]);
    setUseRepRange(false);
    setNewExerciseName('');
    onClose();
  };

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setShowExercisePicker(false);
  };

  const handleConfirm = () => {
    if (!selectedExerciseId) return;
    if (useRepRange && !validateRepRange(templateSets)) return;
    const setsPayload = buildSetsPayload(templateSets, weightUnit, useRepRange);
    const exercise = exercises.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;
    onConfirm(exercise, setsPayload);
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
      setSelectedExerciseId(exercise.id);
      setShowExercisePicker(false);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title={showExercisePicker ? 'Select Exercise' : showCreateExercise ? 'Create New Exercise' : (editingEntry ? 'Edit Exercise' : 'Add Exercise')}
    >
          {!showExercisePicker && !showCreateExercise && (
            <>

              <Text style={styles.fieldLabel}>Exercise</Text>
              <TouchableOpacity
                style={styles.exercisePickerRow}
                onPress={() => setShowExercisePicker(true)}
              >
                <Text style={selectedExerciseId ? styles.exercisePickerText : styles.exercisePickerPlaceholder}>
                  {selectedExerciseId
                    ? exercises.find((e) => e.id === selectedExerciseId)?.name ?? 'Select Exercise...'
                    : 'Select Exercise...'}
                </Text>
                <Text style={styles.exercisePickerArrow}>▸</Text>
              </TouchableOpacity>

              <SetsTableEditor
                rows={templateSets}
                setRows={setTemplateSets}
                repRange={useRepRange}
                setRepRange={setUseRepRange}
                wUnit={weightUnit}
              />

              <Button
                title={editingEntry ? 'Save' : 'Add'}
                onPress={handleConfirm}
                disabled={!selectedExerciseId}
                style={styles.addConfirmBtn}
              />

              <Button
                title="Close"
                variant="ghost"
                onPress={resetAndClose}
                style={styles.closeBtn}
              />
            </>
          )}

          {showExercisePicker && !showCreateExercise && (
            <>
              <ScrollView style={styles.exerciseList}>
                {exercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[
                      styles.exercisePickItem,
                      selectedExerciseId === ex.id && styles.exercisePickItemSelected,
                    ]}
                    onPress={() => handleSelectExercise(ex.id)}
                    onLongPress={onDeleteExercise ? () => onDeleteExercise(ex) : undefined}
                  >
                    <Text style={styles.exercisePickName}>{ex.name}</Text>
                    <Text style={styles.exercisePickMeta}>
                      {ex.muscle_group} · {ex.equipment}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Button
                title="+ Create New Exercise"
                variant="secondary"
                onPress={() => setShowCreateExercise(true)}
                style={styles.createExBtn}
              />

              <Button
                title="Back"
                variant="ghost"
                onPress={() => setShowExercisePicker(false)}
                style={styles.closeBtn}
              />
            </>
          )}

          {showCreateExercise && (
            <>
              <View style={styles.createExForm}>
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
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
  closeBtn: {
    marginTop: 4,
    marginBottom: 20,
  },
  exerciseList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  exercisePickItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exercisePickItemSelected: {
    backgroundColor: colors.surfaceLight,
  },
  exercisePickName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  exercisePickMeta: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  createExBtn: {
    marginBottom: 12,
  },
  createExForm: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginBottom: 12,
  },
  createExActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  createExCancelBtn: {
    flex: 1,
  },
  createExSaveBtn: {
    flex: 3,
  },
});
