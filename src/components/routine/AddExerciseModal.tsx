import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { exerciseService } from '../../services';
import { Button, Input, ChipPicker, MultiChipPicker, BottomSheetModal, ExercisePickerModal } from '../ui';
import { colors, fonts } from '../../constants';
import {
  Exercise,
  ExerciseType,
  MuscleGroup,
  Equipment,
  WeightUnit,
  DistanceUnit,
  RoutineDayExercise,
} from '../../models';
import { EXERCISE_TYPE_ITEMS } from '../../utils/exerciseType';
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

const MUSCLE_GROUP_CHIPS = Object.values(MuscleGroup).map((mg) => ({
  key: mg,
  label: mg.replace('_', ' '),
  value: mg,
}));

const EQUIPMENT_CHIPS = Object.values(Equipment).map((eq) => ({
  key: eq,
  label: eq.replace('_', ' '),
  value: eq,
}));

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (exercise: Exercise, setsPayload: SetsPayloadItem[]) => void;
  weightUnit: WeightUnit;
  distanceUnit?: DistanceUnit;
  editingEntry?: RoutineDayExercise | null;
  onDeleteExercise?: (exercise: Exercise) => void;
  onExerciseDetails?: (exerciseId: string) => void;
  autoOpenPicker?: boolean;
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
}: AddExerciseModalProps) {
  const { user } = useAuthStore();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>(ExerciseType.WeightReps);
  const [newSecondaryMuscles, setNewSecondaryMuscles] = useState<string[]>([]);

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
      if (autoOpenPicker) {
        setShowExercisePicker(true);
      }
    }
  }, [visible]);

  const handleExerciseDetails = useCallback((exerciseId: string) => {
    setShowExercisePicker(false);
    setTimeout(() => onExerciseDetails?.(exerciseId), 250);
  }, [onExerciseDetails]);

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
    setNewSecondaryMuscles([]);
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
        exercise_type: newExerciseType,
        secondary_muscles: newSecondaryMuscles,
      });
      setNewExerciseName('');
      setNewSecondaryMuscles([]);
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
            onPress={handleConfirm}
            disabled={!selectedExercise}
          />
        </View>

        <ExercisePickerModal
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={handleSelectExercise}
          onDeleteExercise={onDeleteExercise}
          onExerciseDetails={handleExerciseDetails}
          onCreateNew={() => {
            setShowExercisePicker(false);
            setTimeout(() => setShowCreateExercise(true), 300);
          }}
          selectedExerciseId={selectedExercise?.id}
        />

        <BottomSheetModal
          visible={showCreateExercise}
          title="Create New Exercise"
          fullHeight
          onClose={() => {
            setShowCreateExercise(false);
            setNewExerciseName('');
            setNewSecondaryMuscles([]);
          }}
        >
          <View style={styles.formBody}>
            <Input
              label="Exercise Name"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="e.g. Bench Press"
            />

            <Text style={styles.fieldLabel}>Exercise Type</Text>
            <ChipPicker
              items={EXERCISE_TYPE_ITEMS}
              selected={newExerciseType}
              onChange={(v) => setNewExerciseType((v as ExerciseType) ?? ExerciseType.WeightReps)}
              allowDeselect={false}
            />

            <Text style={styles.fieldLabel}>Primary Muscle Group</Text>
            <ChipPicker
              items={MUSCLE_GROUP_CHIPS}
              selected={newExerciseMuscle}
              onChange={(v) => setNewExerciseMuscle(v as MuscleGroup)}
              allowDeselect={false}
            />

            <Text style={styles.fieldLabel}>Secondary Muscles (optional)</Text>
            <MultiChipPicker
              items={MUSCLE_GROUP_CHIPS}
              selected={newSecondaryMuscles}
              onChange={setNewSecondaryMuscles}
            />

            <Text style={styles.fieldLabel}>Equipment</Text>
            <ChipPicker
              items={EQUIPMENT_CHIPS}
              selected={newExerciseEquipment}
              onChange={(v) => setNewExerciseEquipment(v as Equipment)}
              allowDeselect={false}
            />
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="Save Exercise"
              onPress={handleCreateExercise}
            />
          </View>
        </BottomSheetModal>
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
});
