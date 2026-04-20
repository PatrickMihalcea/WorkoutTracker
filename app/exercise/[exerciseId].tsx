import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useProfileStore } from '../../src/stores/profile.store';
import {
  exerciseDetailService,
  exerciseMediaService,
  ExerciseDetailData,
} from '../../src/services';
import { updateCustomExercise } from '../../src/services/exerciseMutation.service';
import { fonts, spacing } from '../../src/constants';
import {
  SimpleLineChart,
  MetricChips,
  RecordsBarChart,
  formatVolume,
} from '../../src/components/charts';
import type { BarDataItem } from '../../src/components/charts';
import { BottomSheetModal, Button, ChipPicker, FieldDropdown, Input, MultiChipPicker, OverflowMenu } from '../../src/components/ui';
import type { OverflowMenuItem } from '../../src/components/ui';
import { getExerciseTypeConfig } from '../../src/utils/exerciseType';
import { EXERCISE_TYPE_ITEMS } from '../../src/utils/exerciseType';
import { formatDurationValue } from '../../src/utils/duration';
import { distanceUnitLabel } from '../../src/utils/units';
import { ChartInteractionProvider, useChartInteraction } from '../../src/components/charts';
import { confirmDeleteExercise } from '../../src/utils/confirmDeleteExercise';
import { Equipment, ExerciseType, MuscleGroup } from '../../src/models';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../src/constants/themes';

type MetricKey = string;

interface MetricOption {
  key: MetricKey;
  label: string;
}

const EXERCISE_DETAIL_ACCENT_COLORS = [
  '#FF6B6B',
  '#FFEAA7',
  '#96CEB4',
  '#45B7D1',
  '#DDA0DD',
  '#F7DC6F',
  '#98D8C8',
  '#4ECDC4',
  '#F0B27A',
  '#5DADE2',
  '#F5B041',
  '#A569BD',
  '#EC7063',
  '#48C9B0',
  '#7EC8E3',
  '#82E0AA',
  '#BB8FCE',
];

const MUSCLE_GROUP_CHIPS = Object.values(MuscleGroup).map((mg) => ({
  key: mg,
  label: mg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  value: mg,
})).sort((a, b) => a.label.localeCompare(b.label));

const EQUIPMENT_CHIPS = Object.values(Equipment).map((eq) => ({
  key: eq,
  label: eq.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  value: eq,
}));

const EXERCISE_TYPE_DROPDOWN_ITEMS = EXERCISE_TYPE_ITEMS.map((item) => ({
  key: item.key,
  label: item.label,
  value: item.value as ExerciseType,
  description: item.description,
}));

const UPLOAD_ICON_MAX_DIMENSION = 480;
const UPLOAD_ICON_COMPRESSION_QUALITY = 0.72;

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

function getMetricOptions(exerciseType: string): MetricOption[] {
  switch (exerciseType) {
    case 'weight_reps':
    case 'weighted_bodyweight':
      return [
        { key: 'heaviestWeight', label: 'Weight' },
        { key: 'est1RM', label: '1RM' },
        { key: 'bestSetVolume', label: 'Set Vol' },
        { key: 'sessionVolume', label: 'Session Vol' },
        { key: 'totalReps', label: 'Reps' },
      ];
    case 'bodyweight_reps':
      return [
        { key: 'maxReps', label: 'Max Reps' },
        { key: 'sessionReps', label: 'Session' },
        { key: 'totalReps', label: 'Total' },
      ];
    case 'assisted_bodyweight':
      return [
        { key: 'lightestAssist', label: 'Lightest' },
        { key: 'maxReps', label: 'Max Reps' },
        { key: 'totalReps', label: 'Total' },
      ];
    case 'duration':
      return [
        { key: 'longestDuration', label: 'Longest' },
        { key: 'sessionDuration', label: 'Session' },
      ];
    case 'duration_weight':
      return [
        { key: 'heaviestWeight', label: 'Weight' },
        { key: 'longestDuration', label: 'Longest' },
      ];
    case 'distance_duration':
      return [
        { key: 'farthestDistance', label: 'Distance' },
        { key: 'longestDuration', label: 'Duration' },
        { key: 'bestPace', label: 'Pace' },
      ];
    case 'weight_distance':
      return [
        { key: 'heaviestWeight', label: 'Weight' },
        { key: 'farthestDistance', label: 'Distance' },
      ];
    default:
      return [
        { key: 'heaviestWeight', label: 'Weight' },
        { key: 'est1RM', label: '1RM' },
        { key: 'sessionVolume', label: 'Volume' },
        { key: 'totalReps', label: 'Reps' },
      ];
  }
}

function isDurationMetric(metricKey: string): boolean {
  return metricKey.includes('Duration') || metricKey === 'longestDuration' || metricKey === 'sessionDuration' || metricKey === 'totalDuration';
}

function getTooltipFormatter(metricKey: string, wUnit: string, dUnit: string): (v: number) => string {
  const wLabel = wUnit === 'lbs' ? 'lbs' : 'kg';
  const dLabel = dUnit === 'miles' ? 'mi' : 'km';
  if (metricKey.includes('Volume') || metricKey === 'bestSetVolume' || metricKey === 'sessionVolume')
    return (v) => `${formatVolume(v)} vol`;
  if (isDurationMetric(metricKey))
    return (v) => formatDurationValue(v);
  if (metricKey.includes('Reps') || metricKey === 'maxReps' || metricKey === 'totalReps' || metricKey === 'sessionReps')
    return (v) => `${v} reps`;
  if (metricKey.includes('Pace') || metricKey === 'bestPace')
    return (v) => `${v.toFixed(2)} ${dLabel}/min`;
  if (metricKey.includes('Distance') || metricKey === 'farthestDistance')
    return (v) => `${Math.round(v * 10) / 10} ${dLabel}`;
  return (v) => `${v} ${wLabel}`;
}

function getMinYStep(metricKey: string): number {
  if (metricKey.includes('Volume') || metricKey === 'bestSetVolume' || metricKey === 'sessionVolume') return 500;
  if (metricKey.includes('Reps') || metricKey === 'maxReps' || metricKey === 'totalReps' || metricKey === 'sessionReps') return 2;
  if (metricKey.includes('Pace') || metricKey === 'bestPace') return 0.5;
  return 10;
}

function ExerciseDetailContent() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { scrollEnabled } = useChartInteraction();
  const wUnit = profile?.weight_unit ?? 'kg';
  const dUnit = profile?.distance_unit ?? 'km';

  const [data, setData] = useState<ExerciseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('');
  const [durationToggle, setDurationToggle] = useState<'left' | 'right'>('left');
  const [showEditExercise, setShowEditExercise] = useState(false);
  const [editExerciseName, setEditExerciseName] = useState('');
  const [editExerciseType, setEditExerciseType] = useState<ExerciseType>(ExerciseType.WeightReps);
  const [editExerciseMuscle, setEditExerciseMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [editExerciseEquipment, setEditExerciseEquipment] = useState<Equipment>(Equipment.Barbell);
  const [editSecondaryMuscles, setEditSecondaryMuscles] = useState<string[]>([]);
  const [editExerciseNewMediaUri, setEditExerciseNewMediaUri] = useState<string | null>(null);
  const [editExerciseNewMediaMimeType, setEditExerciseNewMediaMimeType] = useState<string>('image/jpeg');
  const [editExerciseRemoveMedia, setEditExerciseRemoveMedia] = useState(false);
  const [savingEditExercise, setSavingEditExercise] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id || !exerciseId) return;
    try {
      const result = await exerciseDetailService.getData(user.id, exerciseId, wUnit, dUnit);
      setData(result);
      const options = getMetricOptions(result.exercise.exercise_type);
      setSelectedMetric((prev) =>
        options.some((opt) => opt.key === prev)
          ? prev
          : (options[0]?.key ?? ''),
      );
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, exerciseId, wUnit, dUnit]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const exerciseType = data?.exercise?.exercise_type ?? 'weight_reps';
  const config = getExerciseTypeConfig(exerciseType);
  const metricOptions = useMemo(() => getMetricOptions(exerciseType), [exerciseType]);
  const isCustomExercise = !!data && data.exercise.user_id === user?.id;
  const detailAccentColor = useMemo(() => {
    const idx = Math.floor(Math.random() * EXERCISE_DETAIL_ACCENT_COLORS.length);
    return EXERCISE_DETAIL_ACCENT_COLORS[idx];
  }, [exerciseId]);

  const openEditExercise = useCallback(() => {
    if (!data) return;
    setEditExerciseName(data.exercise.name);
    setEditExerciseType(data.exercise.exercise_type);
    setEditExerciseMuscle(data.exercise.muscle_group);
    setEditExerciseEquipment(data.exercise.equipment);
    setEditSecondaryMuscles(data.exercise.secondary_muscles ?? []);
    setEditExerciseNewMediaUri(null);
    setEditExerciseNewMediaMimeType('image/jpeg');
    setEditExerciseRemoveMedia(false);
    setShowEditExercise(true);
  }, [data]);

  const editMediaPreviewUri = useMemo(() => {
    if (editExerciseRemoveMedia) return null;
    if (editExerciseNewMediaUri) return editExerciseNewMediaUri;
    return data?.exercise.thumbnail_url ?? data?.exercise.media_url ?? null;
  }, [
    data?.exercise.media_url,
    data?.exercise.thumbnail_url,
    editExerciseNewMediaUri,
    editExerciseRemoveMedia,
  ]);

  const handlePickEditExerciseImage = useCallback(async () => {
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
      setEditExerciseNewMediaUri(optimized.uri);
      setEditExerciseNewMediaMimeType(optimized.contentType);
      setEditExerciseRemoveMedia(false);
    } catch {
      setEditExerciseNewMediaUri(asset.uri);
      setEditExerciseNewMediaMimeType(asset.mimeType ?? 'image/jpeg');
      setEditExerciseRemoveMedia(false);
    }
  }, []);

  const handleSaveEditedExercise = useCallback(async () => {
    if (!data || !isCustomExercise) return;
    const nextName = editExerciseName.trim();
    if (!nextName) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    try {
      setSavingEditExercise(true);
      let mediaUpdates: {
        media_type?: 'none' | 'image' | 'gif' | 'video';
        media_url?: string | null;
        thumbnail_url?: string | null;
      } = {};

      if (editExerciseRemoveMedia) {
        mediaUpdates = {
          media_type: 'none',
          media_url: null,
          thumbnail_url: null,
        };
      } else if (editExerciseNewMediaUri) {
        const uploadTarget = await exerciseMediaService.createUploadUrl({
          exerciseId: data.exercise.id,
          slot: 'media',
          contentType: editExerciseNewMediaMimeType,
        });

        await exerciseMediaService.uploadFileToSignedUrl({
          fileUri: editExerciseNewMediaUri,
          uploadUrl: uploadTarget.uploadUrl,
          contentType: editExerciseNewMediaMimeType,
        });

        mediaUpdates = {
          media_type: 'image',
          media_url: uploadTarget.publicUrl,
          thumbnail_url: uploadTarget.publicUrl,
        };
      }

      const updated = await updateCustomExercise(data.exercise.id, {
        name: nextName,
        exercise_type: editExerciseType,
        muscle_group: editExerciseMuscle,
        equipment: editExerciseEquipment,
        secondary_muscles: editSecondaryMuscles,
        ...mediaUpdates,
      });
      setData((prev) => (prev ? { ...prev, exercise: updated } : prev));
      setShowEditExercise(false);
      await loadData();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSavingEditExercise(false);
    }
  }, [
    data,
    editExerciseEquipment,
    editExerciseMuscle,
    editExerciseName,
    editExerciseNewMediaMimeType,
    editExerciseNewMediaUri,
    editExerciseRemoveMedia,
    editExerciseType,
    editSecondaryMuscles,
    isCustomExercise,
    loadData,
  ]);

  const handleDeleteExercise = useCallback(() => {
    if (!data || !user?.id || !isCustomExercise) return;

    void confirmDeleteExercise(data.exercise, user.id, () => {
      router.back();
    });
  }, [data, isCustomExercise, router, user?.id]);

  const points = data?.timeSeries?.[selectedMetric] ?? [];
  const secondaryMuscles = (data?.exercise.secondary_muscles ?? [])
    .map((m) => m.replace(/_/g, ' '))
    .filter((m) => m && m.toLowerCase() !== 'none');

  const barChartData = useMemo((): BarDataItem[] => {
    if (!data) return [];

    switch (exerciseType) {
      case 'weight_reps':
      case 'weighted_bodyweight':
      case 'assisted_bodyweight':
        return data.setRecords.map((r) => ({
          label: `${r.reps}`,
          value: r.bestWeight,
          formattedValue: `${Math.round(r.bestWeight * 10) / 10}`,
        }));

      case 'duration_weight':
        return data.weightDurationRecords.map((r) => ({
          label: `${Math.round(r.weight * 10) / 10}`,
          value: durationToggle === 'left' ? r.bestDuration : r.worstDuration,
          formattedValue: formatDurationValue(durationToggle === 'left' ? r.bestDuration : r.worstDuration),
        }));

      case 'distance_duration':
        return data.distanceRecords.map((r) => ({
          label: `${Math.round(r.distance * 10) / 10}`,
          value: r.bestDuration,
          formattedValue: formatDurationValue(r.bestDuration),
        }));

      case 'bodyweight_reps':
        return data.repProgressionRecords.slice(-20).map((p) => ({
          label: p.label,
          value: p.value,
          formattedValue: `${p.value}`,
        }));

      default:
        return [];
    }
  }, [data, exerciseType, durationToggle, wUnit, dUnit]);

  const barChartConfig = useMemo(() => {
    const dLabel = distanceUnitLabel(dUnit).toLowerCase();
    switch (exerciseType) {
      case 'weight_reps':
      case 'weighted_bodyweight':
        return { title: 'Set Records', subtitle: 'Best weight at each rep count', color: detailAccentColor, isDuration: false };
      case 'assisted_bodyweight':
        return { title: 'Set Records', subtitle: 'Lightest assist at each rep count', color: detailAccentColor, isDuration: false };
      case 'duration_weight':
        return { title: 'Weight Records', subtitle: 'Duration at each weight', color: detailAccentColor, isDuration: true };
      case 'distance_duration':
        return { title: 'Distance Records', subtitle: `Best time at each distance (${dLabel})`, color: detailAccentColor, isDuration: true };
      case 'bodyweight_reps':
        return null;
      default:
        return null;
    }
  }, [detailAccentColor, exerciseType, dUnit]);

  const yLabelFmt = useMemo(() => {
    if (isDurationMetric(selectedMetric)) return formatDurationValue;
    return undefined;
  }, [selectedMetric]);

  const barYLabelFmt = useMemo(() => {
    if (barChartConfig?.isDuration) return formatDurationValue;
    return undefined;
  }, [barChartConfig]);
  const detailMenuItems = useMemo<OverflowMenuItem[]>(() => ([
    { label: 'Edit', onPress: openEditExercise },
    { label: 'Delete', destructive: true, onPress: handleDeleteExercise },
  ]), [handleDeleteExercise, openEditExercise]);

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Exercise not found.</Text>
      </View>
    );
  }

  const hasChartData = points.length > 0;
  const mediaUrl = data.exercise.media_url ?? null;
  const thumbnailUrl = data.exercise.thumbnail_url ?? mediaUrl;
  const isVideoMedia = data.exercise.media_type === 'video';
  const hasMedia = Boolean(mediaUrl || thumbnailUrl);
  const lastPerformedLabel = data.lastPerformedAt
    ? new Date(data.lastPerformedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        {hasMedia && (
          <View style={styles.mediaSummaryRow}>
            <View style={styles.mediaPreviewPane}>
              <View style={styles.mediaSquare}>
                <Image
                  source={{ uri: mediaUrl ?? thumbnailUrl ?? '' }}
                  style={styles.mediaSquareImage}
                  resizeMode={isVideoMedia ? 'cover' : 'contain'}
                />
                {isVideoMedia ? (
                  <View style={styles.videoBadge}>
                    <Text style={styles.videoBadgeText}>VIDEO</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.mediaStatsColumn}>
              <View style={styles.mediaStatCard}>
                <Text style={styles.mediaStatLabel}>Sets completed</Text>
                <Text style={styles.mediaStatValue}>{data.totalCompletedSets}</Text>
              </View>
              <View style={styles.mediaStatCard}>
                <Text style={styles.mediaStatLabel}>Last performed</Text>
                <Text style={styles.mediaStatValueSmall}>{lastPerformedLabel}</Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.headerTitleRow}>
          <Text style={styles.exerciseName}>{data.exercise.name}</Text>
          {isCustomExercise && (
            <OverflowMenu items={detailMenuItems} />
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{config.label}</Text>
          </View>
          <Text style={styles.metaText}>
            {data.exercise.muscle_group.replace(/_/g, ' ')} · {data.exercise.equipment.replace(/_/g, ' ')}
          </Text>
        </View>
        {secondaryMuscles.length > 0 && (
          <Text style={styles.secondaryText}>
            Also targets: {secondaryMuscles.join(', ')}
          </Text>
        )}
        {!hasMedia && (
          <View style={styles.noMediaStatsRow}>
            <View style={styles.mediaStatCard}>
              <Text style={styles.mediaStatLabel}>Sets completed</Text>
              <Text style={styles.mediaStatValue}>{data.totalCompletedSets}</Text>
            </View>
            <View style={styles.mediaStatCard}>
              <Text style={styles.mediaStatLabel}>Last performed</Text>
              <Text style={styles.mediaStatValueSmall}>{lastPerformedLabel}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Progression Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <MetricChips
          options={metricOptions}
          selected={selectedMetric}
          onChange={setSelectedMetric}
          activeColor={detailAccentColor}
        />
        {hasChartData ? (
          <SimpleLineChart
            data={points}
            title=""
            subtitle={metricOptions.find((o) => o.key === selectedMetric)?.label ?? ''}
            frontColor={detailAccentColor}
            formatTooltipValue={getTooltipFormatter(selectedMetric, wUnit, dUnit)}
            minYStep={getMinYStep(selectedMetric)}
            yLabelFormatter={yLabelFmt}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No data yet for this metric.</Text>
          </View>
        )}
      </View>

      {/* Personal Records */}
      {data.personalRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          <View style={styles.prGrid}>
            {data.personalRecords.map((pr, i) => (
              <View key={i} style={styles.prTile}>
                <Text style={styles.prValue}>{pr.formattedValue}</Text>
                <Text style={styles.prLabel}>{pr.label}</Text>
                <Text style={styles.prDate}>{pr.date}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Records Bar Chart */}
      {barChartConfig && barChartData.length > 0 && (
        <RecordsBarChart
          title={barChartConfig.title}
          subtitle={barChartConfig.subtitle}
          data={barChartData}
          frontColor={barChartConfig.color}
          toggleOptions={exerciseType === 'duration_weight' ? { left: 'Longest', right: 'Shortest' } : undefined}
          toggleValue={durationToggle}
          onToggle={exerciseType === 'duration_weight' ? setDurationToggle : undefined}
          yLabelFormatter={barYLabelFmt}
        />
      )}

      <BottomSheetModal
        visible={showEditExercise}
        title="Edit Exercise"
        scrollable
        fullHeight
        contentPaddingHorizontal={10}
        onClose={() => setShowEditExercise(false)}
      >
        <View style={styles.formBody}>
          <Text style={styles.formFieldLabel}>Exercise Name</Text>
          <Input
            value={editExerciseName}
            onChangeText={setEditExerciseName}
            placeholder="e.g. Bench Press"
          />

          <Text style={styles.formFieldLabel}>Exercise Type</Text>
          <FieldDropdown
            selected={editExerciseType}
            options={EXERCISE_TYPE_DROPDOWN_ITEMS}
            onChange={setEditExerciseType}
            placeholder="Select exercise type"
          />

          <Text style={styles.formFieldLabel}>Primary Muscle Group</Text>
          <FieldDropdown
            selected={editExerciseMuscle}
            options={MUSCLE_GROUP_CHIPS}
            onChange={setEditExerciseMuscle}
            placeholder="Select primary muscle"
          />

          <Text style={styles.formFieldLabel}>Secondary Muscles (optional)</Text>
          <MultiChipPicker
            items={MUSCLE_GROUP_CHIPS}
            selected={editSecondaryMuscles}
            onChange={setEditSecondaryMuscles}
            horizontal={false}
            maxHeight={220}
          />

          <Text style={styles.formFieldLabel}>Equipment</Text>
          <FieldDropdown
            selected={editExerciseEquipment}
            options={EQUIPMENT_CHIPS}
            onChange={setEditExerciseEquipment}
            placeholder="Select equipment"
          />

          <Text style={styles.formFieldLabel}>Exercise Photo (optional)</Text>
          <TouchableOpacity
            style={styles.mediaPickerButton}
            onPress={() => { void handlePickEditExerciseImage(); }}
            activeOpacity={0.8}
          >
            {editMediaPreviewUri ? (
              <Image source={{ uri: editMediaPreviewUri }} style={styles.selectedMediaPreview} resizeMode="cover" />
            ) : (
              <View style={styles.selectedMediaPreview} />
            )}
            <View style={styles.mediaPickerButtonTextWrap}>
              <Text style={styles.mediaPickerButtonTitle}>{editMediaPreviewUri ? 'Change photo' : 'Add photo'}</Text>
              <Text style={styles.mediaPickerButtonHint}>
                {editExerciseNewMediaUri
                  ? 'This image will be uploaded to your media bucket.'
                  : editMediaPreviewUri
                    ? 'Current photo for this exercise.'
                    : 'Pick an image from your photo library.'}
              </Text>
            </View>
          </TouchableOpacity>
          {editMediaPreviewUri && (
            <Button
              title="Remove Photo"
              variant="ghost"
              size="sm"
              onPress={() => {
                setEditExerciseNewMediaUri(null);
                setEditExerciseNewMediaMimeType('image/jpeg');
                setEditExerciseRemoveMedia(true);
              }}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button title="Save Changes" variant="accent" onPress={handleSaveEditedExercise} loading={savingEditExercise} />
        </View>
      </BottomSheetModal>
    </ScrollView>
  );
}

export default function ExerciseDetailScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Exercise Details' }} />
      <ChartInteractionProvider>
        <ExerciseDetailContent />
      </ChartInteractionProvider>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl+50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  header: {
    paddingVertical: spacing.md,
  },
  mediaSummaryRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  mediaPreviewPane: {
    flex: 1.25,
  },
  mediaSquare: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  mediaSquareImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  mediaStatsColumn: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  noMediaStatsRow: {
    marginTop: 10,
    flexDirection: 'row',
    marginBottom: 2,
    gap: 12,
  },
  mediaStatCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  mediaStatLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  mediaStatValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.accent,
    textAlign: 'center',
  },
  mediaStatValueSmall: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.accent,
    textAlign: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  videoBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  exerciseName: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  secondaryText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 6,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  prValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  prLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  prDate: {
    fontSize: 10,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
  formBody: {
    flex: 1,
  },
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
  footer: {
    marginTop: 16,
    paddingBottom: 16,
  },
});
