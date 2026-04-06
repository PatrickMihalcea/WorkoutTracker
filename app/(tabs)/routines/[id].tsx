import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useWorkoutStore } from '../../../src/stores/workout.store';
import { routineService } from '../../../src/services';
import { confirmDeleteExercise } from '../../../src/utils/confirmDeleteExercise';
import { Button, Input, Card, DayOfWeekPicker, SwipeToDeleteRow, BottomSheetModal, AddRowButton, InlineEditRow, OverflowMenu, Toast } from '../../../src/components/ui';
import type { OverflowMenuItem } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import {
  DayOfWeek,
  DAY_LABELS,
  RoutineDayWithExercises,
  RoutineDayExercise,
  Exercise,
} from '../../../src/models';
import { AddExerciseModal, SetsPayloadItem } from '../../../src/components/routine/AddExerciseModal';
import { RoutineStatsChart } from '../../../src/components/routine/RoutineStatsChart';
import { useChartInteraction } from '../../../src/components/charts';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

function SwipeableExerciseRow({
  ex,
  onEdit,
  onDelete,
  onLongPress,
}: {
  ex: RoutineDayExercise;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
}) {
  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;

  return (
    <SwipeToDeleteRow onDelete={onDelete} expandedHeight={80}>
      <TouchableOpacity
        style={styles.exerciseRow}
        onPress={onEdit}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
          <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group} · {ex.exercise?.equipment}</Text>
        </View>
        <Text style={styles.exerciseTarget}>{setsLabel}</Text>
      </TouchableOpacity>
    </SwipeToDeleteRow>
  );
}

export default function RoutineDetailScreen() {
  const { scrollEnabled } = useChartInteraction();
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
  const [toastMessage, setToastMessage] = useState('');

  const { session: activeSession, startWorkout } = useWorkoutStore();

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

  const handleDeleteDay = useCallback((dayId: string, label: string) => {
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
  }, [id, fetchRoutineDetail]);

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

  const handleDeleteExercise = (exercise: Exercise) =>
    confirmDeleteExercise(exercise, user?.id ?? '', () => { if (id) fetchRoutineDetail(id); });

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

  const handleReorderExercises = async (reordered: RoutineDayExercise[]) => {
    try {
      await Promise.all(
        reordered.map((ex, i) =>
          routineService.updateDayExercise(ex.id, { sort_order: i })
        )
      );
      if (id) fetchRoutineDetail(id);
    } catch {
      Alert.alert('Error', 'Could not reorder exercises.');
    }
  };

  const handleOpenExerciseEdit = (entry: RoutineDayExercise, dayId: string) => {
    setEditingEntry(entry);
    setAddExerciseDayId(dayId);
    setShowAddExercise(true);
  };

  const handleStartDay = useCallback(async (day: RoutineDayWithExercises) => {
    if (activeSession) {
      setToastMessage('Cannot start during active workout.');
      return;
    }
    if (!user) return;
    try {
      await startWorkout(user.id, day.id, day.exercises);
      router.push('/(tabs)/today/workout');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [activeSession, user, startWorkout, router]);

  const handleDuplicateDay = useCallback(async (day: RoutineDayWithExercises) => {
    try {
      const newDay = await routineService.duplicateDay(day.id);
      if (id) fetchRoutineDetail(id);
      router.push(`/(tabs)/routines/day/${newDay.id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [id, fetchRoutineDetail, router]);

  if (!currentRoutine) return null;

  const buildDayMenuItems = useCallback((day: RoutineDayWithExercises): OverflowMenuItem[] => [
    {
      label: 'Start Day',
      onPress: () => handleStartDay(day),
      disabled: !!activeSession,
    },
    {
      label: 'Duplicate',
      onPress: () => handleDuplicateDay(day),
    },
    {
      label: 'Remove',
      onPress: () => handleDeleteDay(day.id, day.label),
      destructive: true,
    },
  ], [activeSession, handleStartDay, handleDuplicateDay, handleDeleteDay]);

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
        <OverflowMenu items={buildDayMenuItems(day)} />
      </View>

      <DraggableFlatList
        data={day.exercises}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        onDragEnd={({ data }) => handleReorderExercises(data)}
        renderItem={({ item, drag, isActive }: RenderItemParams<RoutineDayExercise>) => (
          <ScaleDecorator>
            <SwipeableExerciseRow
              ex={item}
              onEdit={() => handleOpenExerciseEdit(item, day.id)}
              onDelete={() => handleRemoveExercise(item.id)}
              onLongPress={drag}
            />
          </ScaleDecorator>
        )}
      />

      <AddRowButton label="+ Add Exercise" onPress={() => openAddExercise(day.id)} borderTop />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Toast message={toastMessage} visible={!!toastMessage} onDismiss={() => setToastMessage('')} />
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets scrollEnabled={scrollEnabled}>
        {editingName ? (
          <InlineEditRow
            value={nameDraft}
            onChangeText={setNameDraft}
            onSave={handleSaveName}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <TouchableOpacity onPress={handleStartEditName} style={styles.titleRow}>
            <Text style={styles.title}>{currentRoutine.name}</Text>
            <Image source={require('../../../assets/icons/edit.png')} style={styles.editHintIcon} />
          </TouchableOpacity>
        )}

        <Text style={styles.subHeader}>Performance</Text>
        {id && <RoutineStatsChart routineId={id} />}

        <Text style={styles.subHeader}>Routine</Text>

        {currentRoutine.days.map(renderDay)}

        <Button
          title="+ Add Day"
          variant="secondary"
          onPress={() => setShowAddDay(true)}
        />
      </ScrollView>

      {/* Add Day Modal */}
      <BottomSheetModal visible={showAddDay} title="Add Training Day">
            <Text style={styles.fieldLabel}>Day of Week (optional)</Text>
            <DayOfWeekPicker selected={selectedDay} onChange={setSelectedDay} />

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
      </BottomSheetModal>

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
  subHeader: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
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
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
