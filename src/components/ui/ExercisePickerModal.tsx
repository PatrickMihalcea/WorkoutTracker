import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Exercise, MuscleGroup } from '../../models';
import { exerciseService } from '../../services';
import { BottomSheetModal } from './BottomSheetModal';
import { ChipPicker } from './ChipPicker';
import { colors, fonts } from '../../constants';

const MUSCLE_GROUP_ITEMS = Object.values(MuscleGroup).map((mg) => ({
  key: mg,
  label: mg.replace('_', ' '),
  value: mg,
}));

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  onDeleteExercise?: (exercise: Exercise) => void;
  onCreateNew?: () => void;
  selectedExerciseId?: string | null;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  onDeleteExercise,
  onCreateNew,
  selectedExerciseId,
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadExercises();
      setSearch('');
      setMuscleFilter(null);
    }
  }, [visible]);

  const loadExercises = async () => {
    try {
      const list = await exerciseService.getAll();
      setExercises(list);
    } catch {
      // empty
    }
  };

  const filtered = useMemo(() => {
    let list = exercises;
    if (muscleFilter) {
      list = list.filter((e) => e.muscle_group === muscleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, muscleFilter, search]);

  return (
    <BottomSheetModal visible={visible} title="Select Exercise" fullHeight>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercises..."
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
      />

      <ChipPicker
        items={MUSCLE_GROUP_ITEMS}
        selected={muscleFilter}
        onChange={setMuscleFilter}
        style={styles.filterRow}
        keyboardPersistTaps
      />

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No exercises found.</Text>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.exerciseRow,
                selectedExerciseId === item.id && styles.exerciseRowSelected,
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              onLongPress={onDeleteExercise ? () => onDeleteExercise(item) : undefined}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>
                {item.muscle_group} · {item.equipment}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {onCreateNew && (
          <TouchableOpacity style={styles.createBtn} onPress={onCreateNew} activeOpacity={0.7}>
            <Text style={styles.createBtnText}>+ Create New Exercise</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 10,
  },
  filterRow: {
    marginBottom: 10,
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  exerciseRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseRowSelected: {
    backgroundColor: colors.surfaceLight,
  },
  exerciseName: {
    fontSize: 16,
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
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 30,
  },
  footer: {
    gap: 8,
  },
  createBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
});
