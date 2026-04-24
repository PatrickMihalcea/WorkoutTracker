import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  ScrollView,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Equipment, Exercise, ExerciseType, MuscleGroup } from '../../models';
import { exerciseMediaService, exerciseService } from '../../services';
import { useAuthStore } from '../../stores/auth.store';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { Input } from './Input';
import { ChipPicker, MultiChipPicker } from './ChipPicker';
import { FieldDropdown } from './FieldDropdown';
import { ExerciseIconPreview } from './ExerciseIconPreview';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { confirmDeleteExercise } from '../../utils/confirmDeleteExercise';
import { EXERCISE_TYPE_ITEMS } from '../../utils/exerciseType';
import { getExercisePreviewUrl, getExerciseThumbnailUrl } from '../../utils/exerciseMedia';

const chartIcon = require('../../../assets/icons/chart.png');
const exerciseThumbPlaceholder = require('../../../assets/Setora-black-and-white.png');
const UPLOAD_ICON_MAX_DIMENSION = 480;
const UPLOAD_ICON_COMPRESSION_QUALITY = 0.72;

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

const EXERCISE_TYPE_DROPDOWN_ITEMS = EXERCISE_TYPE_ITEMS.map((item) => ({
  key: item.key,
  label: item.label,
  value: item.value as ExerciseType,
  description: item.description,
}));

const ALPHABET_INDEX = ['#', ...Array.from({ length: 26 }, (_v, i) => String.fromCharCode(65 + i))];
type ExerciseSection = { key: string; title: string; data: Exercise[] };

function getExerciseIndexLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

async function optimizeExercisePhotoForUpload(
  asset: ImagePicker.ImagePickerAsset,
): Promise<{ uri: string; contentType: string }> {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const actions: Array<{ resize: { width?: number; height?: number } }> = [];

  if (width > 0 && height > 0) {
    if (width >= height && width > UPLOAD_ICON_MAX_DIMENSION) {
      actions.push({ resize: { width: UPLOAD_ICON_MAX_DIMENSION } });
    } else if (height > width && height > UPLOAD_ICON_MAX_DIMENSION) {
      actions.push({ resize: { height: UPLOAD_ICON_MAX_DIMENSION } });
    }
  }

  const optimized = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    {
      compress: UPLOAD_ICON_COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: optimized.uri,
    contentType: 'image/jpeg',
  };
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
      color: colors.textSecondary,
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
  const [highlightedExerciseId, setHighlightedExerciseId] = useState<string | null>(selectedExerciseId ?? null);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>(Equipment.Barbell);
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>(ExerciseType.WeightReps);
  const [newSecondaryMuscles, setNewSecondaryMuscles] = useState<string[]>([]);
  const [newExerciseMediaUri, setNewExerciseMediaUri] = useState<string | null>(null);
  const [newExerciseMediaMimeType, setNewExerciseMediaMimeType] = useState<string>('image/jpeg');
  const [savingCreateExercise, setSavingCreateExercise] = useState(false);
  const [pendingDeletedSelection, setPendingDeletedSelection] = useState<Exercise | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [sectionWindow, setSectionWindow] = useState<{ start: number; end: number } | null>(null);
  const sectionListRef = useRef<SectionList<Exercise>>(null);
  const railHeightRef = useRef(0);
  const lastRailLetterRef = useRef<string | null>(null);
  const pendingRailLetterRef = useRef<string | null>(null);
  const railScrollRetryCountRef = useRef(0);
  const railScrollRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      color: colors.textSecondary,
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
    exercisePreview: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    exercisePreviewImage: {
      width: '100%',
      height: '100%',
      borderRadius: 22,
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
    formBody: { paddingBottom: 8 },
    formFieldLabel: {
      color: colors.accent,
      fontSize: 15,
      fontFamily: fonts.semiBold,
      marginBottom: 8,
      marginTop: 0,
    },
    mediaPickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    mediaPickerButtonTextWrap: {
      flex: 1,
      gap: 2,
    },
    mediaPickerButtonTitle: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    mediaPickerButtonHint: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    selectedMediaPreview: {
      width: 52,
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
  }), [colors]);

  useEffect(() => {
    if (visible) {
      loadExercises();
      setSearch('');
      setMuscleFilter(null);
      setEquipmentFilter(null);
      setSectionWindow(null);
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
      setNewExerciseMediaUri(null);
      setNewExerciseMediaMimeType('image/jpeg');
      setSavingCreateExercise(false);
      setSectionWindow(null);
      setPendingDeletedSelection(null);
      suppressCloseWarningRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setSectionWindow(null);
    pendingRailLetterRef.current = null;
    railScrollRetryCountRef.current = 0;
    if (railScrollRetryTimerRef.current) {
      clearTimeout(railScrollRetryTimerRef.current);
      railScrollRetryTimerRef.current = null;
    }
  }, [equipmentFilter, muscleFilter, search, visible]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) setIsKeyboardVisible(false);
  }, [visible]);

  useEffect(() => {
    setNewSecondaryMuscles((prev) => prev.filter((muscle) => muscle !== newExerciseMuscle));
  }, [newExerciseMuscle]);

  useEffect(() => () => {
    if (railScrollRetryTimerRef.current) {
      clearTimeout(railScrollRetryTimerRef.current);
      railScrollRetryTimerRef.current = null;
    }
  }, []);

  const secondaryMuscleItems = useMemo(
    () => MUSCLE_GROUP_ITEMS.filter((item) => item.value !== newExerciseMuscle),
    [newExerciseMuscle],
  );

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

  const allExerciseSections = useMemo<ExerciseSection[]>(
    () => ALPHABET_INDEX
      .filter((letter) => allExercisesByLetter[letter]?.length)
      .map((letter) => ({
        key: letter,
        title: letter,
        data: allExercisesByLetter[letter],
      })),
    [allExercisesByLetter],
  );

  const sectionIndexByLetter = useMemo(() => {
    const map: Record<string, number> = {};
    allExerciseSections.forEach((section, index) => {
      map[section.title] = index;
    });
    return map;
  }, [allExerciseSections]);

  const availableLetters = useMemo(
    () => new Set(allExerciseSections.map((section) => section.title)),
    [allExerciseSections],
  );

  const WINDOW_SECTION_RADIUS = 1;

  const getSectionWindowForIndex = (sectionIndex: number) => {
    const start = Math.max(0, sectionIndex - WINDOW_SECTION_RADIUS);
    const end = Math.min(allExerciseSections.length - 1, sectionIndex + WINDOW_SECTION_RADIUS);
    return { start, end };
  };

  const visibleExerciseSections = useMemo(() => {
    if (!sectionWindow) return allExerciseSections;
    return allExerciseSections.slice(sectionWindow.start, sectionWindow.end + 1);
  }, [allExerciseSections, sectionWindow]);

  const scheduleLetterScroll = (letter: string, delayMs: number, windowStart: number) => {
    if (railScrollRetryTimerRef.current) {
      clearTimeout(railScrollRetryTimerRef.current);
      railScrollRetryTimerRef.current = null;
    }
    railScrollRetryTimerRef.current = setTimeout(() => {
      const globalSectionIndex = sectionIndexByLetter[letter];
      railScrollRetryTimerRef.current = null;
      if (globalSectionIndex == null) return;
      const localSectionIndex = Math.max(0, globalSectionIndex - windowStart);
      sectionListRef.current?.scrollToLocation({
        sectionIndex: localSectionIndex,
        itemIndex: 0,
        viewOffset: 6,
        animated: true,
      });
    }, delayMs);
  };

  const handlePressIndexLetter = (letter: string) => {
    if (!availableLetters.has(letter)) return;
    const globalSectionIndex = sectionIndexByLetter[letter];
    if (globalSectionIndex == null) return;
    const nextWindow = getSectionWindowForIndex(globalSectionIndex);
    pendingRailLetterRef.current = letter;
    setSectionWindow((prev) => {
      if (prev && prev.start === nextWindow.start && prev.end === nextWindow.end) return prev;
      return nextWindow;
    });
    scheduleLetterScroll(letter, 50, nextWindow.start);
  };

  const handleRailDragAt = (locationY: number) => {
    const railHeight = railHeightRef.current;
    if (railHeight <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationY / railHeight));
    const idx = Math.max(0, Math.min(ALPHABET_INDEX.length - 1, Math.floor(ratio * ALPHABET_INDEX.length)));
    const letter = ALPHABET_INDEX[idx];
    if (!availableLetters.has(letter)) return;
    if (!letter || letter === lastRailLetterRef.current) return;
    lastRailLetterRef.current = letter;
    handlePressIndexLetter(letter);
  };

  const handlePickExerciseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to attach an exercise image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const optimized = await optimizeExercisePhotoForUpload(asset);
      setNewExerciseMediaUri(optimized.uri);
      setNewExerciseMediaMimeType(optimized.contentType);
    } catch {
      setNewExerciseMediaUri(asset.uri);
      setNewExerciseMediaMimeType(asset.mimeType ?? 'image/jpeg');
    }
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

  const renderRow = (item: Exercise) => {
    const previewUrl = getExercisePreviewUrl(item);
    const thumbnailUrl = getExerciseThumbnailUrl(item);

    return (
      <View key={item.id} style={[styles.exerciseRow, highlightedExerciseId === item.id && styles.exerciseRowSelected]}>
        <ExerciseIconPreview
          imageSource={thumbnailUrl ? { uri: thumbnailUrl } : exerciseThumbPlaceholder}
          previewUri={previewUrl}
          touchableStyle={styles.exercisePreview}
          imageStyle={styles.exercisePreviewImage}
        />

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
  };

  const handleCreateExercise = async () => {
    if (!user || !newExerciseName.trim()) { Alert.alert('Error', 'Please enter an exercise name'); return; }
    if (newSecondaryMuscles.includes(newExerciseMuscle)) {
      Alert.alert('Invalid selection', 'Primary muscle group cannot also be selected as a secondary muscle.');
      return;
    }
    const duplicate = exercises.find(
      (exercise) =>
        exercise.name.toLowerCase() === newExerciseName.trim().toLowerCase() &&
        exercise.muscle_group === newExerciseMuscle &&
        exercise.equipment === newExerciseEquipment,
    );
    if (duplicate) { Alert.alert('Duplicate', 'An exercise with the same name, muscle group, and equipment already exists.'); return; }
    try {
      setSavingCreateExercise(true);
      const exercise = await exerciseService.create({
        user_id: user.id,
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscle,
        equipment: newExerciseEquipment,
        exercise_type: newExerciseType,
        secondary_muscles: newSecondaryMuscles,
      });

      let nextExercise = exercise;
      if (newExerciseMediaUri) {
        const uploadTarget = await exerciseMediaService.createUploadUrl({
          exerciseId: exercise.id,
          slot: 'media',
          contentType: newExerciseMediaMimeType,
        });

        await exerciseMediaService.uploadFileToSignedUrl({
          fileUri: newExerciseMediaUri,
          uploadUrl: uploadTarget.uploadUrl,
          contentType: newExerciseMediaMimeType,
        });

        nextExercise = await exerciseService.update(exercise.id, {
          media_type: 'image',
          media_url: uploadTarget.publicUrl,
          thumbnail_url: uploadTarget.publicUrl,
        });
      }

      setExercises((prev) => [...prev, nextExercise]);
      setSearch(''); setMuscleFilter(null); setEquipmentFilter(null);
      setHighlightedExerciseId(nextExercise.id);
      setShowCreateExercise(false); setNewExerciseName(''); setNewSecondaryMuscles([]);
      setNewExerciseMuscle(MuscleGroup.Chest); setNewExerciseEquipment(Equipment.Barbell);
      setNewExerciseType(ExerciseType.WeightReps);
      setNewExerciseMediaUri(null); setNewExerciseMediaMimeType('image/jpeg');
    } catch (error: unknown) { Alert.alert('Error', (error as Error).message); }
    finally { setSavingCreateExercise(false); }
  };

  const resetCreateForm = () => {
    setNewExerciseName(''); setNewSecondaryMuscles([]);
    setNewExerciseMuscle(MuscleGroup.Chest); setNewExerciseEquipment(Equipment.Barbell);
    setNewExerciseType(ExerciseType.WeightReps);
    setNewExerciseMediaUri(null); setNewExerciseMediaMimeType('image/jpeg');
    setSavingCreateExercise(false);
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
        scrollable={showCreateExercise}
        contentPaddingHorizontal={10}
        onClose={() => {
          if (showCreateExercise) { setShowCreateExercise(false); resetCreateForm(); return; }
          handleRequestClose();
        }}
      >
        {showCreateExercise ? (
          <>
            <View style={styles.formBody}>
              <Text style={styles.formFieldLabel}>Exercise Name</Text>
              <Input value={newExerciseName} onChangeText={setNewExerciseName} placeholder="e.g. Bench Press" />
              <Text style={styles.formFieldLabel}>Exercise Type</Text>
              <FieldDropdown
                selected={newExerciseType}
                options={EXERCISE_TYPE_DROPDOWN_ITEMS}
                onChange={setNewExerciseType}
                placeholder="Select exercise type"
              />
              <Text style={styles.formFieldLabel}>Primary Muscle Group</Text>
              <FieldDropdown
                selected={newExerciseMuscle}
                options={MUSCLE_GROUP_ITEMS}
                onChange={setNewExerciseMuscle}
                placeholder="Select primary muscle"
              />
              <Text style={styles.formFieldLabel}>Secondary Muscles (optional)</Text>
              <MultiChipPicker items={secondaryMuscleItems} selected={newSecondaryMuscles} onChange={setNewSecondaryMuscles} horizontal={false} maxHeight={150} />
              <Text style={styles.formFieldLabel}>Equipment</Text>
              <FieldDropdown
                selected={newExerciseEquipment}
                options={EQUIPMENT_ITEMS}
                onChange={setNewExerciseEquipment}
                placeholder="Select equipment"
              />
              <Text style={styles.formFieldLabel}>Exercise Photo (optional)</Text>
              <TouchableOpacity style={styles.mediaPickerButton} onPress={() => { void handlePickExerciseImage(); }} activeOpacity={0.8}>
                {newExerciseMediaUri ? (
                  <Image source={{ uri: newExerciseMediaUri }} style={styles.selectedMediaPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.selectedMediaPreview} />
                )}
                <View style={styles.mediaPickerButtonTextWrap}>
                  <Text style={styles.mediaPickerButtonTitle}>{newExerciseMediaUri ? 'Change photo' : 'Add photo'}</Text>
                  <Text style={styles.mediaPickerButtonHint}>
                    {newExerciseMediaUri ? 'Photo is optimized to a max 480px icon before upload.' : 'Pick an image from your photo library.'}
                  </Text>
                </View>
              </TouchableOpacity>
              {newExerciseMediaUri && (
                <Button
                  title="Remove Photo"
                  variant="ghost"
                  size="sm"
                  onPress={() => { setNewExerciseMediaUri(null); setNewExerciseMediaMimeType('image/jpeg'); }}
                />
              )}
            </View>
            <View style={styles.footer}><Button title="Save Exercise" variant="accent" onPress={handleCreateExercise} loading={savingCreateExercise} /></View>
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
              <SectionList
                ref={sectionListRef}
                style={styles.list}
                sections={visibleExerciseSections}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                initialNumToRender={24}
                maxToRenderPerBatch={24}
                windowSize={11}
                removeClippedSubviews
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderRow(item)}
                onScrollToIndexFailed={() => {
                  const letter = pendingRailLetterRef.current;
                  if (!letter) return;
                  if (railScrollRetryTimerRef.current) {
                    clearTimeout(railScrollRetryTimerRef.current);
                    railScrollRetryTimerRef.current = null;
                  }
                  if (railScrollRetryCountRef.current >= 5) {
                    railScrollRetryCountRef.current = 0;
                    return;
                  }
                  const globalSectionIndex = sectionIndexByLetter[letter];
                  if (globalSectionIndex != null) {
                    const nextWindow = getSectionWindowForIndex(globalSectionIndex);
                    setSectionWindow((prev) => {
                      if (prev && prev.start === nextWindow.start && prev.end === nextWindow.end) return prev;
                      return nextWindow;
                    });
                    scheduleLetterScroll(letter, 70, nextWindow.start);
                  }
                  railScrollRetryCountRef.current += 1;
                }}
                onMomentumScrollEnd={() => {
                  railScrollRetryCountRef.current = 0;
                }}
                renderSectionHeader={({ section }) => (
                  <Text style={styles.letterHeader}>{section.title}</Text>
                )}
                ListHeaderComponent={(
                  <>
                    {customExercises.length > 0 && (
                      <>
                        <Text style={styles.sectionHeader}>Custom</Text>
                        {customExercises.map(renderRow)}
                      </>
                    )}
                    <Text style={styles.sectionHeader}>All Exercises</Text>
                    {allExerciseSections.length === 0 && (
                      <Text style={styles.emptyText}>No exercises found.</Text>
                    )}
                  </>
                )}
              />
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
            {!(Platform.OS === 'android' && isKeyboardVisible) && (
              <View style={styles.footer}>
                <Button title="+ Create New Exercise" variant="secondary" onPress={() => setShowCreateExercise(true)} />
              </View>
            )}
          </>
        )}
      </BottomSheetModal>
  );
}
