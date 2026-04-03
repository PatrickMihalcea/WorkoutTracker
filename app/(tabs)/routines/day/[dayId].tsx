import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRoutineStore } from '../../../../src/stores/routine.store';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { useProfileStore } from '../../../../src/stores/profile.store';
import { routineService } from '../../../../src/services';
import { confirmDeleteExercise } from '../../../../src/utils/confirmDeleteExercise';
import { DayOfWeekPicker, SwipeToDeleteRow, AddRowButton, InlineEditRow } from '../../../../src/components/ui';
import { colors, fonts } from '../../../../src/constants';
import {
  DayOfWeek,
  RoutineDayExercise,
  RoutineDayWithExercises,
  Exercise,
  WeightUnit,
} from '../../../../src/models';
import {
  TemplateSetRow,
  buildSetsPayload,
  setsToTemplateRows,
  validateRepRange,
  SetsTableEditor,
} from '../../../../src/components/routine/SetsTableEditor';
import { AddExerciseModal, SetsPayloadItem } from '../../../../src/components/routine/AddExerciseModal';

function SwipeableExerciseRow({
  ex,
  isExpanded,
  onToggle,
  onDelete,
  children,
}: {
  ex: RoutineDayExercise;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const setsCount = ex.sets?.length ?? ex.target_sets;
  const setsLabel =
    ex.sets && ex.sets.length > 0
      ? `${setsCount} sets`
      : `${ex.target_sets}×${ex.target_reps}`;

  return (
    <SwipeToDeleteRow onDelete={onDelete} expandedHeight={500}>
      <TouchableOpacity style={styles.exerciseRow} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{ex.exercise?.name ?? 'Exercise'}</Text>
          <Text style={styles.exerciseMeta}>{ex.exercise?.muscle_group} · {ex.exercise?.equipment}</Text>
        </View>
        <Text style={styles.exerciseTarget}>{setsLabel}</Text>
        <Text style={styles.expandArrow}>{isExpanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {isExpanded && children}
    </SwipeToDeleteRow>
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
  const initial = setsToTemplateRows(entry.sets ?? [], entry.target_reps, wUnit);
  const [useRepRange, setUseRepRange] = useState(initial.hasRepRange);
  const [dirty, setDirty] = useState(false);
  const [rows, setRows] = useState<TemplateSetRow[]>(initial.rows);

  const handleSetRows = (updated: TemplateSetRow[]) => {
    setRows(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    if (useRepRange && !validateRepRange(rows)) return;
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

  const handleDayOfWeekChange = async (newValue: DayOfWeek | null) => {
    if (!dayId) return;
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

  const handleAddExerciseConfirm = async (exercise: Exercise, setsPayload: SetsPayloadItem[]) => {
    if (!dayId) return;
    try {
      const dayExercises = day?.exercises ?? [];
      await routineService.addExerciseToDay(
        {
          routine_day_id: dayId,
          exercise_id: exercise.id,
          sort_order: dayExercises.length,
          target_sets: setsPayload.length,
          target_reps: setsPayload[0]?.target_reps_min ?? 10,
        },
        setsPayload,
      );
      setShowAddExercise(false);
      refresh();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteExercise = (exercise: Exercise) =>
    confirmDeleteExercise(exercise, user?.id ?? '', refresh);

  if (!day) return null;


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {editingLabel ? (
          <InlineEditRow
            value={labelDraft}
            onChangeText={setLabelDraft}
            onSave={handleSaveLabel}
            onCancel={() => setEditingLabel(false)}
          />
        ) : (
          <TouchableOpacity
            onPress={() => { setLabelDraft(day.label); setEditingLabel(true); }}
            style={styles.labelRow}
          >
            <Text style={styles.labelTitle}>{day.label}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Day of Week (optional)</Text>
        <DayOfWeekPicker selected={selectedDayOfWeek} onChange={handleDayOfWeekChange} />

        <Text style={styles.sectionLabel}>Exercises</Text>

        {day.exercises.map((ex) => (
          <SwipeableExerciseRow
            key={ex.id}
            ex={ex}
            isExpanded={expandedIds.has(ex.id)}
            onToggle={() => toggleExpand(ex.id)}
            onDelete={() => handleRemoveExercise(ex.id)}
          >
            <ExerciseSetsEditor entry={ex} wUnit={wUnit} onSave={refresh} />
          </SwipeableExerciseRow>
        ))}

        <AddRowButton label="+ Add Exercise" onPress={() => setShowAddExercise(true)} />
      </ScrollView>

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onConfirm={handleAddExerciseConfirm}
        weightUnit={wUnit}
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
  labelRow: {
    marginBottom: 20,
  },
  labelTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 8,
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
});
