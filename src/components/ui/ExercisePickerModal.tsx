import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Equipment, Exercise, ExerciseType, MuscleGroup } from '../../models';
import { exerciseService } from '../../services';
import { useAuthStore } from '../../stores/auth.store';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { Input } from './Input';
import { ChipPicker, MultiChipPicker } from './ChipPicker';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { confirmDeleteExercise } from '../../utils/confirmDeleteExercise';
import { EXERCISE_TYPE_ITEMS } from '../../utils/exerciseType';

const chartIcon = require('../../../assets/icons/chart.png');

const MUSCLE_GROUP_ITEMS = Object.values(MuscleGroup).map((mg) => ({
  key: mg,
  label: mg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  value: mg,
})).sort((a, b) => a.label.localeCompare(b.label));

const EQUIPMENT_ITEMS = Object.values(Equipment).map((equipment) => ({
  key: equipment,
  label: equipment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  value: equipment,
}));

const ALPHABET_INDEX = ['#', ...Array.from({ length: 26 }, (_v, i) => String.fromCharCode(65 + i))];

function getExerciseIndexLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

type FilterOption<T extends string> = { key: T; label: string; value: T };

function FilterDropdown<T extends string>({
  label,
  allLabel,
  selected,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  selected: T | null;
  options: FilterOption<T>[];
  onChange: (value: T | null) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? allLabel;

  const styles = useMemo(() => StyleSheet.create({
    filterGroup: { flex: 1, gap: 4 },
    filterLabel: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    dropdownTrigger: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropdownTriggerText: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
    dropdownChevron: { fontSize: 12, color: colors.textMuted, marginLeft: 6 },
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdownMenu: {
      width: '82%',
      maxHeight: '70%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.surface,
      paddingVertical: 6,
    },
    dropdownScroll: { maxHeight: '100%' },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
    dropdownItemActive: { backgroundColor: colors.surfaceLight },
    dropdownItemText: { fontSize: 15, fontFamily: fonts.regular, color: colors.textSecondary },
    dropdownItemTextActive: { color: colors.text, fontFamily: fonts.semiBold },
  }), [colors]);

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.dropdownTriggerText} numberOfLines={1}>{selectedLabel}</Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdownMenu}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={[styles.dropdownItem, selected === null && styles.dropdownItemActive]}
                onPress={() => { onChange(null); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, selected === null && styles.dropdownItemTextActive]}>{allLabel}</Text>
              </TouchableOpacity>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.dropdownItem, selected === option.value && styles.dropdownItemActive]}
                  onPress={() => { onChange(option.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, selected === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  onDeleteExercise?: (exercise: Exercise, onDeleted?: () => void) => void;
  onExerciseDeleted?: (exercise: Exercise) => void;
  onDeletedSelectedWithoutReplacement?: (exercise: Exercise) => void;
  onExerciseDetails?: (exerciseId: string) => void;
  selectedExerciseId?: string | null;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  onDeleteExercise,
  onExerciseDeleted,
  onDeletedSelectedWithoutReplacement,
  onExerciseDetails,
  selectedExerciseId,
}: ExercisePickerModalProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null);
  const [indexOffsets, setIndexOffsets] = useState<Record<string, number>>({});
  const [highlightedExerciseId, setHighlightedExerciseId] = useState<string | null>(selectedExerciseId ?? null);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>(ExerciseType.WeightReps);
  const [newSecondaryMuscles, setNewSecondaryMuscles] = useState<string[]>([]);
  const [pendingDeletedSelection, setPendingDeletedSelection] = useState<Exercise | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const railHeightRef = useRef(0);
  const lastRailLetterRef = useRef<string | null>(null);
  const suppressCloseWarningRef = useRef(false);

  const styles = useMemo(() => StyleSheet.create({
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
    filterRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
    list: { flex: 1, marginBottom: 12 },
    listWrap: { flex: 1, position: 'relative' },
    listContent: { paddingRight: 24 },
    letterHeader: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 8,
      marginBottom: 2,
    },
    alphaRail: {
      position: 'absolute',
      right: 0,
      top: 10,
      bottom: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
      paddingHorizontal: 2,
      borderRadius: 10,
      backgroundColor: 'rgba(26, 26, 26, 0.75)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    alphaRailItem: { paddingHorizontal: 3, paddingVertical: 1 },
    alphaRailText: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.text, lineHeight: 12 },
    alphaRailTextDisabled: { color: colors.textMuted },
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
      paddingRight: 12,
      paddingLeft: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exerciseRowContent: { flex: 1 },
    exerciseRowSelected: { backgroundColor: colors.surfaceLight },
    chartIconBtn: { paddingLeft: 12 },
    chartIcon: { width: 20, height: 20, tintColor: colors.textMuted },
    exerciseName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
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
    footer: { gap: 8, paddingBottom: 16 },
    formBody: { flex: 1 },
    formFieldLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.regular,
      marginBottom: 8,
      marginTop: 12,
    },
  }), [colors]);

  useEffect(() => {
    if (visible) {
      loadExercises();
      setSearch('');
      setMuscleFilter(null);
      setEquipmentFilter(null);
      setIndexOffsets({});
      setHighlightedExerciseId(selectedExerciseId ?? null);
      setPendingDeletedSelection(null);
      suppressCloseWarningRef.current = false;
    }
  }, [selectedExerciseId, visible]);

  useEffect(() => {
    if (!visible) {
      setShowCreateExercise(false);
      setNewExerciseName('');
      setNewSecondaryMuscles([]);
      setNewExerciseMuscle(MuscleGroup.Chest);
      setNewExerciseEquipment(Equipment.Barbell);
      setNewExerciseType(ExerciseType.WeightReps);
      setPendingDeletedSelection(null);
      suppressCloseWarningRef.current = false;
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
    if (muscleFilter) result = result.filter((e) => e.muscle_group === muscleFilter);
    if (equipmentFilter) result = result.filter((e) => e.equipment === equipmentFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  };

  const customExercises = useMemo(() => {
    if (!user) return [];
    return applyFilters(exercises.filter((e) => e.user_id === user.id));
  }, [equipmentFilter, exercises, muscleFilter, search, user]);

  const allExercises = useMemo(() => applyFilters(exercises), [equipmentFilter, exercises, muscleFilter, search]);

  const allExercisesByLetter = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {};
    for (const exercise of allExercises) {
      const key = getExerciseIndexLetter(exercise.name);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exercise);
    }
    return grouped;
  }, [allExercises]);

  const availableLetters = useMemo(() => new Set(Object.keys(allExercisesByLetter)), [allExercisesByLetter]);

  const handlePressIndexLetter = (letter: string) => {
    const y = indexOffsets[letter];
    if (typeof y !== 'number') return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 6), animated: true });
  };

  const getNearestAvailableLetter = (targetIdx: number): string | null => {
    if (availableLetters.size === 0) return null;
    if (availableLetters.has(ALPHABET_INDEX[targetIdx])) return ALPHABET_INDEX[targetIdx];
    for (let offset = 1; offset < ALPHABET_INDEX.length; offset++) {
      const next = targetIdx + offset;
      const prev = targetIdx - offset;
      if (next < ALPHABET_INDEX.length && availableLetters.has(ALPHABET_INDEX[next])) return ALPHABET_INDEX[next];
      if (prev >= 0 && availableLetters.has(ALPHABET_INDEX[prev])) return ALPHABET_INDEX[prev];
    }
    return null;
  };

  const handleRailDragAt = (locationY: number) => {
    const railHeight = railHeightRef.current;
    if (railHeight <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationY / railHeight));
    const idx = Math.max(0, Math.min(ALPHABET_INDEX.length - 1, Math.floor(ratio * ALPHABET_INDEX.length)));
    const letter = getNearestAvailableLetter(idx);
    if (!letter || letter === lastRailLetterRef.current) return;
    lastRailLetterRef.current = letter;
    handlePressIndexLetter(letter);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    if (!user || exercise.user_id !== user.id) return;
    const afterDeleted = () => {
      const wasSelected = highlightedExerciseId === exercise.id || selectedExerciseId === exercise.id;
      setExercises((prev) => prev.filter((entry) => entry.id !== exercise.id));
      setHighlightedExerciseId((prev) => (prev === exercise.id ? null : prev));
      if (wasSelected) setPendingDeletedSelection(exercise);
      onExerciseDeleted?.(exercise);
    };
    if (onDeleteExercise) { onDeleteExercise(exercise, afterDeleted); return; }
    void confirmDeleteExercise(exercise, user.id, afterDeleted);
  };

  const renderRow = (item: Exercise) => (
    <View key={item.id} style={[styles.exerciseRow, highlightedExerciseId === item.id && styles.exerciseRowSelected]}>
      <TouchableOpacity
        style={styles.exerciseRowContent}
        onPress={() => {
          suppressCloseWarningRef.current = true;
          setPendingDeletedSelection(null);
          onSelect(item);
          onClose();
        }}
        onLongPress={item.user_id === user?.id ? () => handleDeleteExercise(item) : undefined}
        activeOpacity={0.7}
      >
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>{item.muscle_group.replace(/_/g, ' ')} · {item.equipment.replace(/_/g, ' ')}</Text>
      </TouchableOpacity>
      {onExerciseDetails && (
        <TouchableOpacity style={styles.chartIconBtn} onPress={() => onExerciseDetails(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Image source={chartIcon} style={styles.chartIcon} />
        </TouchableOpacity>
      )}
    </View>
  );

  const handleCreateExercise = async () => {
    if (!user || !newExerciseName.trim()) { Alert.alert('Error', 'Please enter an exercise name'); return; }
    const duplicate = exercises.find(
      (exercise) =>
        exercise.name.toLowerCase() === newExerciseName.trim().toLowerCase() &&
        exercise.muscle_group === newExerciseMuscle &&
        exercise.equipment === newExerciseEquipment,
    );
    if (duplicate) { Alert.alert('Duplicate', 'An exercise with the same name, muscle group, and equipment already exists.'); return; }
    try {
      const exercise = await exerciseService.create({
        user_id: user.id,
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscle,
        equipment: newExerciseEquipment,
        exercise_type: newExerciseType,
        secondary_muscles: newSecondaryMuscles,
      });
      setExercises((prev) => [...prev, exercise]);
      setSearch(''); setMuscleFilter(null); setEquipmentFilter(null);
      setHighlightedExerciseId(exercise.id);
      setShowCreateExercise(false); setNewExerciseName(''); setNewSecondaryMuscles([]);
      setNewExerciseMuscle(MuscleGroup.Chest); setNewExerciseEquipment(Equipment.Barbell);
      setNewExerciseType(ExerciseType.WeightReps);
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
  };

  const resetCreateForm = () => {
    setNewExerciseName(''); setNewSecondaryMuscles([]);
    setNewExerciseMuscle(MuscleGroup.Chest); setNewExerciseEquipment(Equipment.Barbell);
    setNewExerciseType(ExerciseType.WeightReps);
  };

  const handleRequestClose = () => {
    if (suppressCloseWarningRef.current) {
      suppressCloseWarningRef.current = false;
      setPendingDeletedSelection(null);
      onClose();
      return;
    }
    if (pendingDeletedSelection && onDeletedSelectedWithoutReplacement) {
      Alert.alert(
        'Exercise Deleted',
        `"${pendingDeletedSelection.name}" was deleted while swapping. Remove this row or go back and choose a replacement.`,
        [
          { text: 'Back', style: 'cancel' },
          {
            text: 'Remove Row',
            style: 'destructive',
            onPress: () => {
              onDeletedSelectedWithoutReplacement(pendingDeletedSelection);
              setPendingDeletedSelection(null);
              onClose();
            },
          },
        ],
      );
      return;
    }
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      title={showCreateExercise ? 'Create New Exercise' : 'Select Exercise'}
      fullHeight
      contentPaddingHorizontal={10}
      onClose={() => {
        if (showCreateExercise) { setShowCreateExercise(false); resetCreateForm(); return; }
        handleRequestClose();
      }}
    >
      {showCreateExercise ? (
        <>
          <View style={styles.formBody}>
            <Input label="Exercise Name" value={newExerciseName} onChangeText={setNewExerciseName} placeholder="e.g. Bench Press" />
            <Text style={styles.formFieldLabel}>Exercise Type</Text>
            <ChipPicker items={EXERCISE_TYPE_ITEMS} selected={newExerciseType} onChange={(value) => setNewExerciseType((value as ExerciseType) ?? ExerciseType.WeightReps)} allowDeselect={false} />
            <Text style={styles.formFieldLabel}>Primary Muscle Group</Text>
            <ChipPicker items={MUSCLE_GROUP_ITEMS} selected={newExerciseMuscle} onChange={(value) => setNewExerciseMuscle(value as MuscleGroup)} allowDeselect={false} horizontal={false} maxHeight={150} />
            <Text style={styles.formFieldLabel}>Secondary Muscles (optional)</Text>
            <MultiChipPicker items={MUSCLE_GROUP_ITEMS} selected={newSecondaryMuscles} onChange={setNewSecondaryMuscles} horizontal={false} maxHeight={150} />
            <Text style={styles.formFieldLabel}>Equipment</Text>
            <ChipPicker items={EQUIPMENT_ITEMS} selected={newExerciseEquipment} onChange={(value) => setNewExerciseEquipment(value as Equipment)} allowDeselect={false} />
          </View>
          <View style={styles.footer}><Button title="Save Exercise" onPress={handleCreateExercise} /></View>
        </>
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />
          <View style={styles.filterRow}>
            <FilterDropdown label="Target Muscle" allLabel="All Muscles" selected={muscleFilter} options={MUSCLE_GROUP_ITEMS} onChange={setMuscleFilter} />
            <FilterDropdown label="Equipment" allLabel="All Equipment" selected={equipmentFilter} options={EQUIPMENT_ITEMS} onChange={setEquipmentFilter} />
          </View>
          <View style={styles.listWrap}>
            <ScrollView
              ref={scrollRef}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
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
                ALPHABET_INDEX.filter((letter) => allExercisesByLetter[letter]?.length).map((letter) => (
                  <View
                    key={letter}
                    onLayout={(event) => {
                      const y = event.nativeEvent.layout.y;
                      setIndexOffsets((prev) => (prev[letter] === y ? prev : { ...prev, [letter]: y }));
                    }}
                  >
                    <Text style={styles.letterHeader}>{letter}</Text>
                    {allExercisesByLetter[letter].map(renderRow)}
                  </View>
                ))
              )}
            </ScrollView>
            {allExercises.length > 0 && (
              <View
                style={styles.alphaRail}
                onLayout={(event) => { railHeightRef.current = event.nativeEvent.layout.height; }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(event) => { handleRailDragAt(event.nativeEvent.locationY); }}
                onResponderMove={(event) => { handleRailDragAt(event.nativeEvent.locationY); }}
                onResponderRelease={() => { lastRailLetterRef.current = null; }}
                onResponderTerminate={() => { lastRailLetterRef.current = null; }}
              >
                {ALPHABET_INDEX.map((letter) => {
                  const enabled = availableLetters.has(letter);
                  return (
                    <TouchableOpacity key={letter} onPress={() => handlePressIndexLetter(letter)} disabled={!enabled} activeOpacity={0.7} style={styles.alphaRailItem}>
                      <Text style={[styles.alphaRailText, !enabled && styles.alphaRailTextDisabled]}>{letter}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          <View style={styles.footer}>
            <Button title="+ Create New Exercise" variant="secondary" onPress={() => setShowCreateExercise(true)} />
          </View>
        </>
      )}
    </BottomSheetModal>
  );
}
