import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutineStore } from '../../../../src/stores/routine.store';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { useProfileStore } from '../../../../src/stores/profile.store';
import { routineService, exerciseService } from '../../../../src/services';
import { Button, Input, Card, KeyboardDismiss } from '../../../../src/components/ui';
import { colors, fonts } from '../../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayExercise,
  RoutineDayWithExercises,
  Exercise,
  MuscleGroup,
  Equipment,
  WeightUnit,
} from '../../../../src/models';
import { formatWeight } from '../../../../src/utils/units';
import {
  TemplateSetRow,
  defaultSetRow,
  getSuggestion,
  resolveValue,
  buildSetsPayload,
  SetsTableEditor,
} from '../../../../src/components/routine/SetsTableEditor';

function SwipeableExerciseRow({
  ex,
  wUnit,
  isExpanded,
  onToggle,
  onDelete,
  children,
}: {
  ex: RoutineDayExercise;
  wUnit: WeightUnit;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;

  const animateDelete = () => {
    swipeRef.current?.close();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => onDelete());
  };

  const maxHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] });

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' }}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={(progress) => {
          const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [70, 0],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View style={[styles.swipeDeleteAction, { transform: [{ translateX }] }]}>
              <Text style={styles.swipeDeleteText}>X</Text>
            </Animated.View>
          );
        }}
        onSwipeableOpen={animateDelete}
        rightThreshold={70}
        overshootRight={false}
      >
        <TouchableOpacity style={styles.exerciseRow} onPress={onToggle} activeOpacity={0.7}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
            <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group} · {ex.exercise?.equipment}</Text>
          </View>
          <Text style={styles.exerciseTarget}>{setsLabel}</Text>
          <Text style={styles.expandArrow}>{isExpanded ? '▾' : '▸'}</Text>
        </TouchableOpacity>
      </Swipeable>
      {isExpanded && children}
    </Animated.View>
  );
}

function ExerciseSetsEditor({
  entry,
  wUnit,
  onSave,
}: {
  entry: RoutineDayExercise;
  wUnit: WeightUnit;
  onSave: () => void;
}) {
  const existing = entry.sets ?? [];
  const hasRange = existing.some((s) => s.target_reps_min !== s.target_reps_max);
  const [useRepRange, setUseRepRange] = useState(hasRange);
  const [dirty, setDirty] = useState(false);

  const [rows, setRows] = useState<TemplateSetRow[]>(() => {
    if (existing.length > 0) {
      return existing.map((s) => ({
        weight: s.target_weight > 0
          ? String(wUnit === 'lbs'
              ? Math.round(s.target_weight * 2.20462 * 10) / 10
              : Math.round(s.target_weight * 10) / 10)
          : '',
        repsMin: String(s.target_reps_min),
        repsMax: String(s.target_reps_max),
        editedFields: new Set(['weight', 'repsMin', 'repsMax']),
      }));
    }
    return [{
      weight: '',
      repsMin: String(entry.target_reps),
      repsMax: String(entry.target_reps),
      editedFields: new Set(['repsMin', 'repsMax']),
    }];
  });

  const handleSetRows = (updated: TemplateSetRow[]) => {
    setRows(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    if (useRepRange) {
      const badRow = rows.find((_, i) => {
        const min = parseInt(resolveValue(rows, i, 'repsMin'), 10) || 0;
        const max = parseInt(resolveValue(rows, i, 'repsMax'), 10) || 0;
        return min > max;
      });
      if (badRow !== undefined) {
        Alert.alert('Invalid Range', 'The minimum reps cannot be greater than the maximum reps.');
        return;
      }
    }
    const payload = buildSetsPayload(rows, wUnit, useRepRange);
    try {
      await routineService.updateExerciseSets(entry.id, payload);
      await routineService.updateDayExercise(entry.id, {
        routine_day_id: entry.routine_day_id,
        exercise_id: entry.exercise_id,
        sort_order: entry.sort_order,
        target_sets: payload.length,
        target_reps: payload[0]?.target_reps_min ?? 10,
      });
      setDirty(false);
      onSave();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={styles.setsEditorContainer}>
      <SetsTableEditor
        rows={rows}
        setRows={handleSetRows}
        repRange={useRepRange}
        setRepRange={(v) => { setUseRepRange(v); setDirty(true); }}
        wUnit={wUnit}
      />
      {dirty && (
        <TouchableOpacity style={styles.saveExBtn} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveExText}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DayEditorScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [day, setDay] = useState<RoutineDayWithExercises | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<DayOfWeek | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);
  const [templateSets, setTemplateSets] = useState<TemplateSetRow[]>([defaultSetRow()]);
  const [useRepRange, setUseRepRange] = useState(false);

  const loadDay = useCallback(() => {
    if (!currentRoutine || !dayId) return;
    const found = currentRoutine.days.find((d) => d.id === dayId);
    if (found) {
      setDay(found);
      setSelectedDayOfWeek(found.day_of_week);
    }
  }, [currentRoutine, dayId]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const refresh = () => {
    if (currentRoutine) fetchRoutineDetail(currentRoutine.id);
  };

  useEffect(() => { loadDay(); }, [currentRoutine]);

  const handleSaveLabel = async () => {
    if (!dayId || !labelDraft.trim()) {
      Alert.alert('Error', 'Label cannot be empty');
      return;
    }
    try {
      await routineService.updateDay(dayId, { label: labelDraft.trim() });
      setEditingLabel(false);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDayOfWeekChange = async (dow: DayOfWeek) => {
    if (!dayId) return;
    const newValue = selectedDayOfWeek === dow ? null : dow;
    setSelectedDayOfWeek(newValue);
    try {
      await routineService.updateDay(dayId, { day_of_week: newValue });
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleRemoveExercise = async (entryId: string) => {
    await routineService.removeDayExercise(entryId);
    refresh();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadExercises = async () => {
    try {
      const list = await exerciseService.getAll();
      setExerciseList(list);
    } catch {
      // empty
    }
  };

  const openAddExercise = async () => {
    setSelectedExerciseId(null);
    setTemplateSets([defaultSetRow()]);
    setUseRepRange(false);
    await loadExercises();
    setShowAddExercise(true);
  };

  const handleAddExerciseConfirm = async () => {
    if (!dayId || !selectedExerciseId) return;
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
    const setsPayload = buildSetsPayload(templateSets, wUnit, useRepRange);
    try {
      const dayExercises = day?.exercises ?? [];
      await routineService.addExerciseToDay(
        {
          routine_day_id: dayId,
          exercise_id: selectedExerciseId,
          sort_order: dayExercises.length,
          target_sets: setsPayload.length,
          target_reps: parseInt(templateSets[0]?.repsMin, 10) || 10,
        },
        setsPayload,
      );
      setShowAddExercise(false);
      setSelectedExerciseId(null);
      setTemplateSets([defaultSetRow()]);
      setUseRepRange(false);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleCreateExercise = async () => {
    if (!user || !newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    const duplicate = exerciseList.find(
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
      setExerciseList((prev) => [...prev, exercise]);
      setSelectedExerciseId(exercise.id);
      setShowExercisePicker(false);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    let hasLogs = false;
    try {
      const { sessionService } = await import('../../../../src/services');
      const sets = await sessionService.getLastSessionSets(exercise.id, user?.id ?? '');
      hasLogs = sets.length > 0;
    } catch {
      // no logs
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
            setExerciseList((prev) => prev.filter((e) => e.id !== exercise.id));
            refresh();
          } catch {
            Alert.alert('Error', 'Could not delete exercise.');
          }
        },
      },
    ]);
  };

  if (!day) return null;


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {editingLabel ? (
          <View style={styles.labelEditRow}>
            <TextInput
              style={styles.labelInput}
              value={labelDraft}
              onChangeText={setLabelDraft}
              autoFocus
              onSubmitEditing={handleSaveLabel}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleSaveLabel} style={styles.labelEditBtn}>
              <Text style={styles.labelEditBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingLabel(false)} style={styles.labelEditBtn}>
              <Text style={styles.labelEditCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setLabelDraft(day.label); setEditingLabel(true); }}
            style={styles.labelRow}
          >
            <Text style={styles.labelTitle}>{day.label}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Day of Week (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPickerScroll}>
          <View style={styles.dayPicker}>
            {Object.entries(DAY_LABELS).map(([key, label]) => {
              const dow = Number(key) as DayOfWeek;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayChip,
                    selectedDayOfWeek === dow && styles.dayChipSelected,
                  ]}
                  onPress={() => handleDayOfWeekChange(dow)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDayOfWeek === dow && styles.dayChipTextSelected,
                    ]}
                  >
                    {label.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Exercises</Text>

        {day.exercises.map((ex) => (
          <SwipeableExerciseRow
            key={ex.id}
            ex={ex}
            wUnit={wUnit}
            isExpanded={expandedIds.has(ex.id)}
            onToggle={() => toggleExpand(ex.id)}
            onDelete={() => handleRemoveExercise(ex.id)}
          >
            <ExerciseSetsEditor entry={ex} wUnit={wUnit} onSave={refresh} />
          </SwipeableExerciseRow>
        ))}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={openAddExercise}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAddExercise} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            {!showExercisePicker && !showCreateExercise && (
              <>
                <Text style={styles.modalTitle}>Add Exercise</Text>

                <Text style={styles.fieldLabel}>Exercise</Text>
                <TouchableOpacity
                  style={styles.exercisePickerRow}
                  onPress={() => setShowExercisePicker(true)}
                >
                  <Text style={selectedExerciseId ? styles.exercisePickerText : styles.exercisePickerPlaceholder}>
                    {selectedExerciseId
                      ? exerciseList.find((e) => e.id === selectedExerciseId)?.name ?? 'Select Exercise...'
                      : 'Select Exercise...'}
                  </Text>
                  <Text style={styles.exercisePickerArrow}>▸</Text>
                </TouchableOpacity>

                <SetsTableEditor
                  rows={templateSets}
                  setRows={setTemplateSets}
                  repRange={useRepRange}
                  setRepRange={setUseRepRange}
                  wUnit={wUnit}
                />

                <Button
                  title="Add"
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
                <ScrollView style={styles.exerciseListScroll}>
                  {exerciseList.map((ex) => (
                    <TouchableOpacity
                      key={ex.id}
                      style={[
                        styles.exercisePickItem,
                        selectedExerciseId === ex.id && styles.exercisePickItemSelected,
                      ]}
                      onPress={() => { setSelectedExerciseId(ex.id); setShowExercisePicker(false); }}
                      onLongPress={() => handleDeleteExercise(ex)}
                    >
                      <Text style={styles.exercisePickName}>{ex.name}</Text>
                      <Text style={styles.exercisePickMeta}>{ex.muscle_group} · {ex.equipment}</Text>
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
                          style={[styles.dayChip, newExerciseMuscle === mg && styles.dayChipSelected]}
                          onPress={() => setNewExerciseMuscle(mg)}
                        >
                          <Text style={[styles.dayChipText, newExerciseMuscle === mg && styles.dayChipTextSelected]}>
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
                          style={[styles.dayChip, newExerciseEquipment === eq && styles.dayChipSelected]}
                          onPress={() => setNewExerciseEquipment(eq)}
                        >
                          <Text style={[styles.dayChipText, newExerciseEquipment === eq && styles.dayChipTextSelected]}>
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
                      onPress={() => { setShowCreateExercise(false); setNewExerciseName(''); }}
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
  labelRow: {
    marginBottom: 20,
  },
  labelTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  labelEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  labelInput: {
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
  labelEditBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  labelEditBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  labelEditCancelText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dayPickerScroll: {
    marginBottom: 20,
  },
  dayPicker: {
    flexDirection: 'row',
    gap: 8,
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
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
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
    marginRight: 8,
  },
  expandArrow: {
    fontSize: 14,
    color: colors.textMuted,
  },
  swipeDeleteAction: {
    width: 70,
    backgroundColor: '#cc3333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  setsEditorContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saveExBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  saveExText: {
    color: colors.background,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  addExerciseBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
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
  exerciseListScroll: {
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
