import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useProfileStore } from '../../src/stores/profile.store';
import {
  exerciseDetailService,
  ExerciseDetailData,
} from '../../src/services';
import { updateCustomExercise } from '../../src/services/exerciseMutation.service';
import { colors, fonts, spacing } from '../../src/constants';
import {
  SimpleLineChart,
  MetricChips,
  RecordsBarChart,
  formatVolume,
} from '../../src/components/charts';
import type { BarDataItem } from '../../src/components/charts';
import { BottomSheetModal, Button, ChipPicker, Input, MultiChipPicker, OverflowMenu } from '../../src/components/ui';
import type { OverflowMenuItem } from '../../src/components/ui';
import { getExerciseTypeConfig } from '../../src/utils/exerciseType';
import { EXERCISE_TYPE_ITEMS } from '../../src/utils/exerciseType';
import { formatDurationValue } from '../../src/utils/duration';
import { distanceUnitLabel } from '../../src/utils/units';
import { ChartInteractionProvider, useChartInteraction } from '../../src/components/charts';
import { confirmDeleteExercise } from '../../src/utils/confirmDeleteExercise';
import { Equipment, ExerciseType, MuscleGroup } from '../../src/models';

type MetricKey = string;

interface MetricOption {
  key: MetricKey;
  label: string;
}

const MUSCLE_GROUP_CHIPS = Object.values(MuscleGroup).map((mg) => ({
  key: mg,
  label: mg.replace(/_/g, ' '),
  value: mg,
}));

const EQUIPMENT_CHIPS = Object.values(Equipment).map((eq) => ({
  key: eq,
  label: eq.replace(/_/g, ' '),
  value: eq,
}));

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
        { key: 'totalDuration', label: 'Total' },
      ];
    case 'duration_weight':
      return [
        { key: 'heaviestWeight', label: 'Weight' },
        { key: 'longestDuration', label: 'Longest' },
        { key: 'totalDuration', label: 'Total' },
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

function getChartColor(metricKey: string): string {
  if (metricKey.includes('Weight') || metricKey === 'heaviestWeight' || metricKey === 'lightestAssist') return '#FF6B6B';
  if (metricKey.includes('1RM') || metricKey === 'est1RM') return '#FFEAA7';
  if (metricKey.includes('Volume') || metricKey === 'bestSetVolume' || metricKey === 'sessionVolume') return '#96CEB4';
  if (metricKey.includes('Reps') || metricKey === 'maxReps' || metricKey === 'totalReps' || metricKey === 'sessionReps') return '#45B7D1';
  if (metricKey.includes('Duration') || metricKey === 'longestDuration' || metricKey === 'sessionDuration' || metricKey === 'totalDuration') return '#DDA0DD';
  if (metricKey.includes('Distance') || metricKey === 'farthestDistance') return '#F7DC6F';
  if (metricKey.includes('Pace') || metricKey === 'bestPace') return '#98D8C8';
  return '#FFEAA7';
}

function ExerciseDetailContent() {
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

  const openEditExercise = useCallback(() => {
    if (!data) return;
    setEditExerciseName(data.exercise.name);
    setEditExerciseType(data.exercise.exercise_type);
    setEditExerciseMuscle(data.exercise.muscle_group);
    setEditExerciseEquipment(data.exercise.equipment);
    setEditSecondaryMuscles(data.exercise.secondary_muscles ?? []);
    setShowEditExercise(true);
  }, [data]);

  const handleSaveEditedExercise = useCallback(async () => {
    if (!data || !isCustomExercise) return;
    const nextName = editExerciseName.trim();
    if (!nextName) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    try {
      setSavingEditExercise(true);
      const updated = await updateCustomExercise(data.exercise.id, {
        name: nextName,
        exercise_type: editExerciseType,
        muscle_group: editExerciseMuscle,
        equipment: editExerciseEquipment,
        secondary_muscles: editSecondaryMuscles,
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
        return { title: 'Set Records', subtitle: 'Best weight at each rep count', color: '#FF6B6B', isDuration: false };
      case 'assisted_bodyweight':
        return { title: 'Set Records', subtitle: 'Lightest assist at each rep count', color: '#FF6B6B', isDuration: false };
      case 'duration_weight':
        return { title: 'Weight Records', subtitle: 'Duration at each weight', color: '#DDA0DD', isDuration: true };
      case 'distance_duration':
        return { title: 'Distance Records', subtitle: `Best time at each distance (${dLabel})`, color: '#F7DC6F', isDuration: true };
      case 'bodyweight_reps':
        return { title: 'Rep Records', subtitle: 'Max reps per session (recent)', color: '#45B7D1', isDuration: false };
      default:
        return null;
    }
  }, [exerciseType, dUnit]);

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
      </View>

      {/* Progression Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <MetricChips
          options={metricOptions}
          selected={selectedMetric}
          onChange={setSelectedMetric}
          activeColor={getChartColor(selectedMetric)}
        />
        {hasChartData ? (
          <SimpleLineChart
            data={points}
            title=""
            subtitle={metricOptions.find((o) => o.key === selectedMetric)?.label ?? ''}
            frontColor={getChartColor(selectedMetric)}
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
        fullHeight
        onClose={() => setShowEditExercise(false)}
      >
        <View style={styles.formBody}>
          <Input
            label="Exercise Name"
            value={editExerciseName}
            onChangeText={setEditExerciseName}
            placeholder="e.g. Bench Press"
          />

          <Text style={styles.formFieldLabel}>Exercise Type</Text>
          <ChipPicker
            items={EXERCISE_TYPE_ITEMS}
            selected={editExerciseType}
            onChange={(value) => setEditExerciseType((value as ExerciseType) ?? ExerciseType.WeightReps)}
            allowDeselect={false}
          />

          <Text style={styles.formFieldLabel}>Primary Muscle Group</Text>
          <ChipPicker
            items={MUSCLE_GROUP_CHIPS}
            selected={editExerciseMuscle}
            onChange={(value) => setEditExerciseMuscle(value as MuscleGroup)}
            allowDeselect={false}
          />

          <Text style={styles.formFieldLabel}>Secondary Muscles (optional)</Text>
          <MultiChipPicker
            items={MUSCLE_GROUP_CHIPS}
            selected={editSecondaryMuscles}
            onChange={setEditSecondaryMuscles}
          />

          <Text style={styles.formFieldLabel}>Equipment</Text>
          <ChipPicker
            items={EQUIPMENT_CHIPS}
            selected={editExerciseEquipment}
            onChange={(value) => setEditExerciseEquipment(value as Equipment)}
            allowDeselect={false}
          />
        </View>

        <View style={styles.footer}>
          <Button title="Save Changes" onPress={handleSaveEditedExercise} loading={savingEditExercise} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl * 2,
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
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
    marginTop: 12,
  },
  footer: {
    paddingBottom: 16,
  },
});
