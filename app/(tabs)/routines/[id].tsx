import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { routineService, exerciseService } from '../../../src/services';
import { Button, Input, Card } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  Exercise,
  MuscleGroup,
  Equipment,
} from '../../../src/models';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [dayLabel, setDayLabel] = useState('');

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);

  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');

  useEffect(() => {
    if (id) fetchRoutineDetail(id);
  }, [id, fetchRoutineDetail]);

  const loadExercises = async () => {
    try {
      const list = await exerciseService.getAll();
      setExercises(list);
    } catch {
      // Will be empty
    }
  };

  const handleAddDay = async () => {
    if (!id || !dayLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for this day');
      return;
    }
    try {
      await routineService.addDay({
        routine_id: id,
        day_of_week: selectedDay,
        label: dayLabel.trim(),
      });
      setShowAddDay(false);
      setDayLabel('');
      fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteDay = (dayId: string, label: string) => {
    Alert.alert('Delete Day', `Remove "${label}" from this routine?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await routineService.deleteDay(dayId);
          if (id) fetchRoutineDetail(id);
        },
      },
    ]);
  };

  const openAddExercise = async (dayId: string) => {
    setAddExerciseDayId(dayId);
    await loadExercises();
    setShowAddExercise(true);
  };

  const handlePickExercise = async (exerciseId: string) => {
    if (!addExerciseDayId) return;
    const dayExercises = currentRoutine?.days.find(
      (d) => d.id === addExerciseDayId,
    )?.exercises ?? [];

    try {
      await routineService.addExerciseToDay({
        routine_day_id: addExerciseDayId,
        exercise_id: exerciseId,
        sort_order: dayExercises.length,
        target_sets: parseInt(targetSets, 10) || 3,
        target_reps: parseInt(targetReps, 10) || 10,
      });
      setShowAddExercise(false);
      setTargetSets('3');
      setTargetReps('10');
      if (id) fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
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
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    let hasLogs = false;
    try {
      const sets = await import('../../../src/services').then(
        (m) => m.sessionService.getLastSessionSets(exercise.id, user?.id ?? ''),
      );
      hasLogs = sets.length > 0;
    } catch {
      // Assume no logs on error
    }

    const message = hasLogs
      ? `Permanently delete "${exercise.name}"?\n\nWARNING: This exercise has logged workout history. All sets logged for this exercise will be permanently deleted.`
      : `Permanently delete "${exercise.name}"? This will also remove it from any routine days using it.`;

    Alert.alert('Delete Exercise', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: hasLogs ? 'Delete Everything' : 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await exerciseService.delete(exercise.id);
            setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
            if (id) fetchRoutineDetail(id);
          } catch {
            Alert.alert('Error', 'Could not delete exercise.');
          }
        },
      },
    ]);
  };

  const handleRemoveExercise = (entryId: string) => {
    Alert.alert('Remove Exercise', 'Remove this exercise from the day?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await routineService.removeDayExercise(entryId);
          if (id) fetchRoutineDetail(id);
        },
      },
    ]);
  };

  const handleStartEditName = () => {
    if (!currentRoutine) return;
    setNameDraft(currentRoutine.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!id || !nameDraft.trim()) {
      Alert.alert('Error', 'Routine name cannot be empty');
      return;
    }
    try {
      await routineService.update(id, { name: nameDraft.trim() });
      fetchRoutineDetail(id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
    setEditingName(false);
  };

  if (!currentRoutine) return null;

  const usedDays = new Set(currentRoutine.days.map((d) => d.day_of_week));

  const renderDay = (day: RoutineDayWithExercises) => (
    <Card key={day.id} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Text style={styles.dayOfWeek}>
            {DAY_LABELS[day.day_of_week as DayOfWeek]}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteDay(day.id, day.label)}>
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </View>

      {day.exercises.map((ex) => (
        <TouchableOpacity
          key={ex.id}
          style={styles.exerciseRow}
          onLongPress={() => handleRemoveExercise(ex.id)}
        >
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>
              {ex.exercise?.name ?? 'Exercise'}
            </Text>
            <Text style={styles.exerciseMeta}>
              {ex.exercise?.muscle_group} · {ex.exercise?.equipment}
            </Text>
          </View>
          <Text style={styles.exerciseTarget}>
            {ex.target_sets}×{ex.target_reps}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.addExerciseBtn}
        onPress={() => openAddExercise(day.id)}
      >
        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets>
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              onSubmitEditing={handleSaveName}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.nameEditBtn}>
              <Text style={styles.nameEditBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingName(false)} style={styles.nameEditBtn}>
              <Text style={styles.nameEditCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleStartEditName} style={styles.titleRow}>
            <Text style={styles.title}>{currentRoutine.name}</Text>
            <Image source={require('../../../assets/icons/edit.png')} style={styles.editHintIcon} />
          </TouchableOpacity>
        )}

        {currentRoutine.days.map(renderDay)}

        <Button
          title="+ Add Day"
          variant="secondary"
          onPress={() => setShowAddDay(true)}
        />
      </ScrollView>

      {/* Add Day Modal */}
      <Modal visible={showAddDay} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Training Day</Text>

            <Text style={styles.fieldLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dayPicker}>
                {Object.entries(DAY_LABELS)
                  .filter(([key]) => !usedDays.has(Number(key)))
                  .map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.dayChip,
                        selectedDay === Number(key) && styles.dayChipSelected,
                      ]}
                      onPress={() => setSelectedDay(Number(key) as DayOfWeek)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          selectedDay === Number(key) && styles.dayChipTextSelected,
                        ]}
                      >
                        {label.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>

            <Input
              label="Label"
              value={dayLabel}
              onChangeText={setDayLabel}
              placeholder='e.g. "Push Day" or "Upper Body"'
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowAddDay(false)}
              />
              <Button title="Add Day" onPress={handleAddDay} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {showCreateExercise ? 'Create New Exercise' : 'Add Exercise'}
            </Text>

            {!showCreateExercise && (
              <>
                <View style={styles.targetRow}>
                  <Input
                    label="Target Sets"
                    value={targetSets}
                    onChangeText={setTargetSets}
                    keyboardType="number-pad"
                    containerStyle={styles.halfInput}
                  />
                  <Input
                    label="Target Reps"
                    value={targetReps}
                    onChangeText={setTargetReps}
                    keyboardType="number-pad"
                    containerStyle={styles.halfInput}
                  />
                </View>

                <Text style={styles.fieldLabel}>Your Exercises</Text>
                <ScrollView style={styles.exerciseList}>
                  {exercises.map((ex) => (
                    <TouchableOpacity
                      key={ex.id}
                      style={styles.exercisePickItem}
                      onPress={() => handlePickExercise(ex.id)}
                      onLongPress={() => handleDeleteExercise(ex)}
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
              </>
            )}

            {showCreateExercise && (
              <View style={styles.createExForm}>
                <Input
                  label="Exercise Name"
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="e.g. Bench Press"
                />

                <Text style={styles.fieldLabel}>Muscle Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dayPicker}>
                    {Object.values(MuscleGroup).map((mg) => (
                      <TouchableOpacity
                        key={mg}
                        style={[
                          styles.dayChip,
                          newExerciseMuscle === mg && styles.dayChipSelected,
                        ]}
                        onPress={() => setNewExerciseMuscle(mg)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            newExerciseMuscle === mg && styles.dayChipTextSelected,
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
                  <View style={styles.dayPicker}>
                    {Object.values(Equipment).map((eq) => (
                      <TouchableOpacity
                        key={eq}
                        style={[
                          styles.dayChip,
                          newExerciseEquipment === eq && styles.dayChipSelected,
                        ]}
                        onPress={() => setNewExerciseEquipment(eq)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            newExerciseEquipment === eq && styles.dayChipTextSelected,
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
                    style={styles.createExActionBtn}
                  />
                  <Button
                    title="Save Exercise"
                    onPress={handleCreateExercise}
                    style={styles.createExActionBtn}
                  />
                </View>
              </View>
            )}

            <Button
              title="Close"
              variant="ghost"
              onPress={() => {
                setShowAddExercise(false);
                setShowCreateExercise(false);
              }}
              style={styles.closeBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  editHintIcon: {
    width: 18,
    height: 18,
    tintColor: colors.textMuted,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  nameEditBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nameEditBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  nameEditCancelText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  dayCard: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  dayOfWeek: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  exerciseTarget: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  addExerciseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  addExerciseText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },

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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  dayPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
  },
  dayChipSelected: {
    backgroundColor: colors.text,
  },
  dayChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
  },
  dayChipTextSelected: {
    color: colors.background,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  createExActionBtn: {
    flex: 1,
  },
  closeBtn: {
    marginTop: 4,
  },
});
