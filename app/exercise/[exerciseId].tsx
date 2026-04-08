import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  exerciseDetailService,
  ExerciseDetailData,
} from '../../src/services';
import { colors, fonts, spacing } from '../../src/constants';
import { Card } from '../../src/components/ui/Card';
import {
  SimpleLineChart,
  MetricChips,
  RecordsBarChart,
  formatVolume,
} from '../../src/components/charts';
import type { BarDataItem } from '../../src/components/charts';
import { getExerciseTypeConfig } from '../../src/utils/exerciseType';
import { formatDurationValue } from '../../src/utils/duration';
import { ChartInteractionProvider, useChartInteraction } from '../../src/components/charts';

type MetricKey = string;

interface MetricOption {
  key: MetricKey;
  label: string;
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

function getTooltipFormatter(metricKey: string): (v: number) => string {
  if (metricKey.includes('Volume') || metricKey === 'bestSetVolume' || metricKey === 'sessionVolume')
    return (v) => `${formatVolume(v)} vol`;
  if (metricKey.includes('Duration') || metricKey === 'longestDuration' || metricKey === 'sessionDuration' || metricKey === 'totalDuration')
    return (v) => formatDurationValue(v);
  if (metricKey.includes('Reps') || metricKey === 'maxReps' || metricKey === 'totalReps' || metricKey === 'sessionReps')
    return (v) => `${v} reps`;
  if (metricKey.includes('Pace') || metricKey === 'bestPace')
    return (v) => `${v.toFixed(2)} km/min`;
  if (metricKey.includes('Distance') || metricKey === 'farthestDistance')
    return (v) => `${v} km`;
  return (v) => `${v} lbs`;
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
  const { user } = useAuthStore();
  const { scrollEnabled } = useChartInteraction();

  const [data, setData] = useState<ExerciseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('');
  const [durationToggle, setDurationToggle] = useState<'left' | 'right'>('left');

  const loadData = useCallback(async () => {
    if (!user?.id || !exerciseId) return;
    try {
      const result = await exerciseDetailService.getData(user.id, exerciseId);
      setData(result);
      if (!selectedMetric) {
        const options = getMetricOptions(result.exercise.exercise_type);
        if (options.length > 0) setSelectedMetric(options[0].key);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, exerciseId, selectedMetric]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const exerciseType = data?.exercise?.exercise_type ?? 'weight_reps';
  const config = getExerciseTypeConfig(exerciseType);
  const metricOptions = useMemo(() => getMetricOptions(exerciseType), [exerciseType]);

  const points = data?.timeSeries?.[selectedMetric] ?? [];

  const barChartData = useMemo((): BarDataItem[] => {
    if (!data) return [];

    switch (exerciseType) {
      case 'weight_reps':
      case 'weighted_bodyweight':
      case 'assisted_bodyweight':
        return data.setRecords.map((r) => ({
          label: `${r.reps}`,
          value: r.bestWeight,
          formattedValue: `${r.bestWeight}`,
        }));

      case 'duration_weight':
        return data.weightDurationRecords.map((r) => ({
          label: `${r.weight}`,
          value: durationToggle === 'left' ? r.bestDuration : r.worstDuration,
          formattedValue: formatDurationValue(durationToggle === 'left' ? r.bestDuration : r.worstDuration),
        }));

      case 'distance_duration':
        return data.distanceRecords.map((r) => ({
          label: `${r.distance}`,
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
  }, [data, exerciseType, durationToggle]);

  const barChartConfig = useMemo(() => {
    switch (exerciseType) {
      case 'weight_reps':
      case 'weighted_bodyweight':
      case 'assisted_bodyweight':
        return { title: 'Set Records', subtitle: 'Best weight at each rep count', color: '#FF6B6B' };
      case 'duration_weight':
        return { title: 'Weight Records', subtitle: 'Duration at each weight', color: '#DDA0DD' };
      case 'distance_duration':
        return { title: 'Distance Records', subtitle: 'Best time at each distance', color: '#F7DC6F' };
      case 'bodyweight_reps':
        return { title: 'Rep Records', subtitle: 'Max reps per session (recent)', color: '#45B7D1' };
      default:
        return null;
    }
  }, [exerciseType]);

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
        <Text style={styles.exerciseName}>{data.exercise.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{config.label}</Text>
          </View>
          <Text style={styles.metaText}>
            {data.exercise.muscle_group.replace('_', ' ')} · {data.exercise.equipment.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Progression Chart */}
      <Card style={styles.chartCard}>
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
            formatTooltipValue={getTooltipFormatter(selectedMetric)}
            minYStep={getMinYStep(selectedMetric)}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No data yet for this metric.</Text>
          </View>
        )}
      </Card>

      {/* Personal Records */}
      {data.personalRecords.length > 0 && (
        <Card style={styles.prCard}>
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
        </Card>
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
        />
      )}
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
  exerciseName: {
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
  chartCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  prCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
});
