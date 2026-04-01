import React, { useEffect, useRef, useState } from 'react';
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
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { routineService, exerciseService } from '../../../src/services';
import { Button, Input, Card, KeyboardDismiss } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  RoutineDayExercise,
  Exercise,
} from '../../../src/models';
import { AddExerciseModal, SetsPayloadItem } from '../../../src/components/routine/AddExerciseModal';

function SwipeableExerciseRow({
  ex,
  onEdit,
  onDelete,
}: {
  ex: RoutineDayExercise;
  onEdit: () => void;
  onDelete: () => void;
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

  const maxHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });

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
        <TouchableOpacity style={styles.exerciseRow} onPress={onEdit} activeOpacity={0.7}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
            <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group} · {ex.exercise?.equipment}</Text>
          </View>
          <Text style={styles.exerciseTarget}>{setsLabel}</Text>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoutine, fetchRoutineDetail } = useRoutineStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [dayLabel, setDayLabel] = useState('');

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<RoutineDayExercise | null>(null);

  useEffect(() => {
    if (id) fetchRoutineDetail(id);
  }, [id, fetchRoutineDetail]);

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

  const openAddExercise = (dayId: string) => {
    setAddExerciseDayId(dayId);
    setEditingEntry(null);
    setShowAddExercise(true);
  };

  const handleAddExerciseConfirm = async (exercise: Exercise, setsPayload: SetsPayloadItem[]) => {
    if (!addExerciseDayId) return;
    try {
      if (editingEntry) {
        if (editingEntry.exercise_id !== exercise.id) {
          await routineService.changeExercise(editingEntry.id, exercise.id);
        }
        await routineService.updateExerciseSets(editingEntry.id, setsPayload);
        await routineService.updateDayExercise(editingEntry.id, {
          routine_day_id: editingEntry.routine_day_id,
          exercise_id: exercise.id,
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
            exercise_id: exercise.id,
            sort_order: dayExercises.length,
            target_sets: setsPayload.length,
            target_reps: setsPayload[0]?.target_reps_min ?? 10,
          },
          setsPayload,
        );
      }
      setShowAddExercise(false);
      setEditingEntry(null);
      if (id) fetchRoutineDetail(id);
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
            if (id) fetchRoutineDetail(id);
          } catch {
            Alert.alert('Error', 'Could not delete exercise.');
          }
        },
      },
    ]);
  };

  const handleRemoveExercise = async (entryId: string) => {
    await routineService.removeDayExercise(entryId);
    if (id) fetchRoutineDetail(id);
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

  const handleOpenExerciseEdit = (entry: RoutineDayExercise, dayId: string) => {
    setEditingEntry(entry);
    setAddExerciseDayId(dayId);
    setShowAddExercise(true);
  };


  if (!currentRoutine) return null;

  const renderDay = (day: RoutineDayWithExercises) => (
    <Card key={day.id} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/(tabs)/routines/day/${day.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Text style={styles.dayOfWeek}>
            {day.day_of_week ? DAY_LABELS[day.day_of_week as DayOfWeek] : 'No day assigned'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteDay(day.id, day.label)}>
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </View>

      {day.exercises.map((ex) => (
        <SwipeableExerciseRow
          key={ex.id}
          ex={ex}
          onEdit={() => handleOpenExerciseEdit(ex, day.id)}
          onDelete={() => handleRemoveExercise(ex.id)}
        />
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

            <Text style={styles.fieldLabel}>Day of Week (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dayPicker}>
                {Object.entries(DAY_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.dayChip,
                      selectedDay === Number(key) && styles.dayChipSelected,
                    ]}
                    onPress={() =>
                      setSelectedDay((prev) =>
                        prev === Number(key) ? null : (Number(key) as DayOfWeek),
                      )
                    }
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

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => {
          setShowAddExercise(false);
          setEditingEntry(null);
        }}
        onConfirm={handleAddExerciseConfirm}
        weightUnit={wUnit}
        editingEntry={editingEntry}
        onDeleteExercise={handleDeleteExercise}
      />
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
    backgroundColor: colors.surface,
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
});
