import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { exerciseService } from '../../services';
import { Button, Input, KeyboardDismiss } from '../ui';
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
  getSuggestion,
  resolveValue,
  buildSetsPayload,
  updateSetRow,
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
        const existing = editingEntry.sets ?? [];
        const hasRange = existing.some((s) => s.target_reps_min !== s.target_reps_max);
        setUseRepRange(hasRange);
        if (existing.length > 0) {
          setTemplateSets(
            existing.map((s) => ({
              weight: s.target_weight > 0 ? String(
                weightUnit === 'lbs'
                  ? Math.round(s.target_weight * 2.20462 * 10) / 10
                  : Math.round(s.target_weight * 10) / 10
              ) : '',
              repsMin: String(s.target_reps_min),
              repsMax: String(s.target_reps_max),
              editedFields: new Set(['weight', 'repsMin', 'repsMax']),
            })),
          );
        } else {
          setTemplateSets([
            {
              weight: '',
              repsMin: String(editingEntry.target_reps),
              repsMax: String(editingEntry.target_reps),
              editedFields: new Set(['repsMin', 'repsMax']),
            },
          ]);
        }
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
    if (useRepRange) {
      const badRow = templateSets.find((_, i) => {
        const min = parseInt(resolveValue(templateSets, i, 'repsMin'), 10) || 0;
        const max = parseInt(resolveValue(templateSets, i, 'repsMax'), 10) || 0;
        return min > max;
      });
      if (badRow !== undefined) {
        Alert.alert('Invalid Range', 'The minimum reps cannot be greater than the maximum reps.');
        return;
      }
    }
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
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContent}>
          {!showExercisePicker && !showCreateExercise && (
            <>
              <Text style={styles.modalTitle}>{editingEntry ? 'Edit Exercise' : 'Add Exercise'}</Text>

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
              <Text style={styles.modalTitle}>Select Exercise</Text>

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
              <Text style={styles.modalTitle}>Create New Exercise</Text>

              <View style={styles.createExForm}>
                <Input
                  label="Exercise Name"
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="e.g. Bench Press"
                />

                <Text style={styles.fieldLabel}>Muscle Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {Object.values(MuscleGroup).map((mg) => (
                      <TouchableOpacity
                        key={mg}
                        style={[
                          styles.chip,
                          newExerciseMuscle === mg && styles.chipSelected,
                        ]}
                        onPress={() => setNewExerciseMuscle(mg)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            newExerciseMuscle === mg && styles.chipTextSelected,
                          ]}
                        >
                          {mg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Equipment</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {Object.values(Equipment).map((eq) => (
                      <TouchableOpacity
                        key={eq}
                        style={[
                          styles.chip,
                          newExerciseEquipment === eq && styles.chipSelected,
                        ]}
                        onPress={() => setNewExerciseEquipment(eq)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            newExerciseEquipment === eq && styles.chipTextSelected,
                          ]}
                        >
                          {eq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

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
        </View>
        <KeyboardDismiss />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
  },
  chipSelected: {
    backgroundColor: colors.text,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: colors.background,
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
