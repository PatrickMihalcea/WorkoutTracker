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
import { useProfileStore } from '../../../src/stores/profile.store';
import { routineService, exerciseService } from '../../../src/services';
import { Button, Input, Card, KeyboardDismiss } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { weightUnitLabel, parseWeightToKg } from '../../../src/utils/units';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  RoutineDayExercise,
  Exercise,
  MuscleGroup,
  Equipment,
} from '../../../src/models';

interface TemplateSetRow {
  weight: string;
  repsMin: string;
  repsMax: string;
  editedFields: Set<string>;
}

const defaultSetRow = (): TemplateSetRow => ({
  weight: '',
  repsMin: '',
  repsMax: '',
  editedFields: new Set(),
});

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [dayLabel, setDayLabel] = useState('');

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);

  const [templateSets, setTemplateSets] = useState<TemplateSetRow[]>([defaultSetRow()]);
  const [useRepRange, setUseRepRange] = useState(false);

  const [editingEntry, setEditingEntry] = useState<RoutineDayExercise | null>(null);

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
    setEditingEntry(null);
    setSelectedExerciseId(null);
    setTemplateSets([defaultSetRow()]);
    setUseRepRange(false);
    await loadExercises();
    setShowAddExercise(true);
  };

  const getSuggestion = (
    rows: TemplateSetRow[],
    index: number,
    field: 'weight' | 'repsMin' | 'repsMax',
  ): string => {
    if (field === 'repsMax') {
      const row = rows[index];
      const minVal = row.editedFields.has('repsMin') ? row.repsMin : getSuggestion(rows, index, 'repsMin');
      if (minVal) {
        const n = parseInt(minVal, 10);
        if (!isNaN(n)) return String(n + 2);
      }
    }
    for (let i = index - 1; i >= 0; i--) {
      if (rows[i].editedFields.has(field) && rows[i][field] !== '') {
        return rows[i][field];
      }
    }
    return '';
  };

  const resolveValue = (
    rows: TemplateSetRow[],
    index: number,
    field: 'weight' | 'repsMin' | 'repsMax',
  ): string => {
    const row = rows[index];
    if (row.editedFields.has(field)) return row[field];
    return getSuggestion(rows, index, field);
  };

  const buildSetsPayload = (rows: TemplateSetRow[]) =>
    rows.map((r, i) => ({
      set_number: i + 1,
      target_weight: parseWeightToKg(parseFloat(resolveValue(rows, i, 'weight')) || 0, wUnit),
      target_reps_min: parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10,
      target_reps_max: parseInt(resolveValue(rows, i, 'repsMax'), 10)
        || parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10,
    }));

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setShowExercisePicker(false);
  };

  const handleAddExerciseConfirm = async () => {
    if (!addExerciseDayId || !selectedExerciseId) return;
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

    const setsPayload = buildSetsPayload(templateSets);

    try {
      if (editingEntry) {
        if (editingEntry.exercise_id !== selectedExerciseId) {
          await routineService.changeExercise(editingEntry.id, selectedExerciseId);
        }
        await routineService.updateExerciseSets(editingEntry.id, setsPayload);
        await routineService.updateDayExercise(editingEntry.id, {
          routine_day_id: editingEntry.routine_day_id,
          exercise_id: selectedExerciseId,
          sort_order: editingEntry.sort_order,
          target_sets: setsPayload.length,
          target_reps: setsPayload[0]?.target_reps_min ?? 10,
        });
      } else {
        const dayExercises = currentRoutine?.days.find(
          (d) => d.id === addExerciseDayId,
        )?.exercises ?? [];
        await routineService.addExerciseToDay(
          {
            routine_day_id: addExerciseDayId,
            exercise_id: selectedExerciseId,
            sort_order: dayExercises.length,
            target_sets: setsPayload.length,
            target_reps: parseInt(templateSets[0]?.repsMin, 10) || 10,
          },
          setsPayload,
        );
      }
      setShowAddExercise(false);
      setSelectedExerciseId(null);
      setEditingEntry(null);
      setTemplateSets([defaultSetRow()]);
      setUseRepRange(false);
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
      setSelectedExerciseId(exercise.id);
      setShowExercisePicker(false);
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

  const handleOpenExerciseEdit = async (entry: RoutineDayExercise, dayId: string) => {
    setEditingEntry(entry);
    setAddExerciseDayId(dayId);
    setSelectedExerciseId(entry.exercise_id);
    await loadExercises();

    const existing = entry.sets ?? [];
    const hasRange = existing.some((s) => s.target_reps_min !== s.target_reps_max);
    setUseRepRange(hasRange);
    if (existing.length > 0) {
      setTemplateSets(
        existing.map((s) => ({
          weight: s.target_weight > 0 ? String(
            wUnit === 'lbs'
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
          repsMin: String(entry.target_reps),
          repsMax: String(entry.target_reps),
          editedFields: new Set(['repsMin', 'repsMax']),
        },
      ]);
    }
    setShowAddExercise(true);
  };

  const updateSetRow = (
    rows: TemplateSetRow[],
    setRows: (r: TemplateSetRow[]) => void,
    index: number,
    field: 'weight' | 'repsMin' | 'repsMax',
    value: string,
  ) => {
    const updated = rows.map((r) => ({ ...r, editedFields: new Set(r.editedFields) }));
    updated[index][field] = value;
    updated[index].editedFields.add(field);
    if (field === 'repsMin' && !useRepRange) {
      updated[index].repsMax = value;
      updated[index].editedFields.add('repsMax');
    }
    setRows(updated);
  };

  const renderSetsTable = (
    rows: TemplateSetRow[],
    setRows: (r: TemplateSetRow[]) => void,
    repRange: boolean,
    setRepRange: (v: boolean) => void,
  ) => (
    <View style={styles.setsTableContainer}>
      <View style={styles.setsTableHeader}>
        <Text style={[styles.setsColHeader, styles.setsColSet]}>SET</Text>
        <Text style={[styles.setsColHeader, styles.setsColWeight]}>{weightUnitLabel(wUnit)}</Text>
        <TouchableOpacity
          style={styles.repsHeaderBtn}
          onPress={() => setRepRange(!repRange)}
        >
          <Text style={styles.setsColHeader}>
            {repRange ? 'REP RANGE' : 'REPS'}
          </Text>
          <Text style={styles.repsToggleArrow}>▾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={rows.length > 9 ? styles.setsRowsScroll : undefined} nestedScrollEnabled>
        {rows.map((row, i) => {
          const weightSugg = getSuggestion(rows, i, 'weight');
          const repsMinSugg = getSuggestion(rows, i, 'repsMin');
          const repsMaxSugg = getSuggestion(rows, i, 'repsMax');
          return (
            <View key={i} style={styles.setsTableRow}>
              <Text style={[styles.setsColCell, styles.setsColSet]}>{i + 1}</Text>
              <TextInput
                style={[styles.setsInput, styles.setsColWeight]}
                value={row.editedFields.has('weight') ? row.weight : ''}
                onChangeText={(v) => updateSetRow(rows, setRows, i, 'weight', v)}
                keyboardType="decimal-pad"
                placeholder={weightSugg || '0'}
                placeholderTextColor={weightSugg ? colors.textMuted : colors.textMuted}
              />
              {repRange ? (
                <View style={styles.repRangeRow}>
                  <TextInput
                    style={[styles.setsInput, styles.repRangeInput]}
                    value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                    onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v)}
                    keyboardType="number-pad"
                    placeholder={repsMinSugg || '8'}
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.repRangeTo}>to</Text>
                  <TextInput
                    style={[styles.setsInput, styles.repRangeInput]}
                    value={row.editedFields.has('repsMax') ? row.repsMax : ''}
                    onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMax', v)}
                    keyboardType="number-pad"
                    placeholder={repsMaxSugg || '12'}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ) : (
                <TextInput
                  style={[styles.setsInput, styles.setsColReps]}
                  value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                  onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v)}
                  keyboardType="number-pad"
                  placeholder={repsMinSugg || '10'}
                  placeholderTextColor={colors.textMuted}
                />
              )}
              {rows.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSetBtn}
                  onPress={() => {
                    const updated = rows.filter((_, idx) => idx !== i);
                    setRows(updated);
                  }}
                >
                  <Text style={styles.removeSetText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.addSetBtn}
        onPress={() => setRows([...rows, defaultSetRow()])}
      >
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );

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

      {day.exercises.map((ex) => {
        const setsCount = ex.sets?.length ?? ex.target_sets;
        const setsLabel = ex.sets && ex.sets.length > 0
          ? `${setsCount} sets`
          : `${ex.target_sets}×${ex.target_reps}`;
        return (
          <TouchableOpacity
            key={ex.id}
            style={styles.exerciseRow}
            onPress={() => handleOpenExerciseEdit(ex, day.id)}
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
            <Text style={styles.exerciseTarget}>{setsLabel}</Text>
          </TouchableOpacity>
        );
      })}

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
          <KeyboardDismiss />
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
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

                {renderSetsTable(templateSets, setTemplateSets, useRepRange, setUseRepRange)}

                <Button
                  title={editingEntry ? 'Save' : 'Add'}
                  onPress={handleAddExerciseConfirm}
                  disabled={!selectedExerciseId}
                  style={styles.addConfirmBtn}
                />

                <Button
                  title="Close"
                  variant="ghost"
                  onPress={() => {
                    setShowAddExercise(false);
                    setSelectedExerciseId(null);
                    setEditingEntry(null);
                    setShowCreateExercise(false);
                    setTemplateSets([defaultSetRow()]);
                    setUseRepRange(false);
                  }}
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
  createExCancelBtn: {
    flex: 1,
  },
  createExSaveBtn: {
    flex: 3,
  },
  closeBtn: {
    marginTop: 4,
    marginBottom: 20,
  },
  addConfirmBtn: {
    marginBottom: 8,
  },

  // Exercise picker row
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
  exercisePickItemSelected: {
    backgroundColor: colors.surfaceLight,
  },

  // Sets table
  setsTableContainer: {
    marginBottom: 16,
  },
  setsRowsScroll: {
    maxHeight: 360,
  },
  setsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  setsColHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  setsColSet: { width: 36 },
  setsColWeight: { flex: 1, textAlign: 'center' },
  setsColReps: { flex: 1, textAlign: 'center' },
  repsHeaderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  repsToggleArrow: {
    fontSize: 10,
    color: colors.textMuted,
  },
  setsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  setsColCell: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setsInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  repRangeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repRangeInput: {
    flex: 1,
  },
  repRangeTo: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  removeSetBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSetText: {
    fontSize: 18,
    color: colors.danger,
    fontFamily: fonts.bold,
  },
  addSetBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

});
