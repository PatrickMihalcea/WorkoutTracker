import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Exercise, MuscleGroup } from '../../models';
import { exerciseService } from '../../services';
import { useAuthStore } from '../../stores/auth.store';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { ChipPicker } from './ChipPicker';
import { colors, fonts } from '../../constants';

const chartIcon = require('../../../assets/icons/chart.png');

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
  onExerciseDetails?: (exerciseId: string) => void;
  selectedExerciseId?: string | null;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  onDeleteExercise,
  onCreateNew,
  onExerciseDetails,
  selectedExerciseId,
}: ExercisePickerModalProps) {
  const { user } = useAuthStore();
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

  const applyFilters = (list: Exercise[]) => {
    let result = list;
    if (muscleFilter) {
      result = result.filter((e) => e.muscle_group === muscleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  };

  const customExercises = useMemo(() => {
    if (!user) return [];
    return applyFilters(exercises.filter((e) => e.user_id === user.id));
  }, [exercises, muscleFilter, search, user]);

  const allExercises = useMemo(() => {
    return applyFilters(exercises);
  }, [exercises, muscleFilter, search]);

  const renderRow = (item: Exercise) => (
    <View key={item.id} style={[styles.exerciseRow, selectedExerciseId === item.id && styles.exerciseRowSelected]}>
      <TouchableOpacity
        style={styles.exerciseRowContent}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        onLongPress={onDeleteExercise && item.user_id ? () => onDeleteExercise(item) : undefined}
        activeOpacity={0.7}
      >
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscle_group.replace(/_/g, ' ')} · {item.equipment.replace(/_/g, ' ')}
        </Text>
      </TouchableOpacity>
      {onExerciseDetails && (
        <TouchableOpacity
          style={styles.chartIconBtn}
          onPress={() => onExerciseDetails(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image source={chartIcon} style={styles.chartIcon} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <BottomSheetModal visible={visible} title="Select Exercise" fullHeight onClose={onClose}>
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
        {customExercises.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Custom</Text>
            {customExercises.map(renderRow)}
          </>
        )}

        <Text style={styles.sectionHeader}>All Exercises</Text>
        {allExercises.length === 0 ? (
          <Text style={styles.emptyText}>No exercises found.</Text>
        ) : (
          allExercises.map(renderRow)
        )}
      </ScrollView>

      <View style={styles.footer}>
        {onCreateNew && (
          <Button
            title="+ Create New Exercise"
            variant="secondary"
            onPress={onCreateNew}
          />
        )}
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
  sectionHeader: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseRowContent: {
    flex: 1,
  },
  exerciseRowSelected: {
    backgroundColor: colors.surfaceLight,
  },
  chartIconBtn: {
    paddingLeft: 12,
  },
  chartIcon: {
    width: 20,
    height: 20,
    tintColor: colors.textMuted,
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
    paddingBottom: 16,
  },
});
