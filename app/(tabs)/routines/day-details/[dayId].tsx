import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { useProfileStore } from '../../../../src/stores/profile.store';
import { useRoutineStore } from '../../../../src/stores/routine.store';
import { dashboardService, routineService, RoutineChartData } from '../../../../src/services';
import { colors, fonts, spacing } from '../../../../src/constants';
import {
  ChartFilterBar,
  MetricChips,
  SimpleLineChart,
  SimpleScrollableChart,
  ChartInteractionProvider,
  useChartInteraction,
  GranularityMode,
  ChartMode,
  SVG_HEIGHT,
  formatVolume,
  TimeSeriesPoint,
} from '../../../../src/components/charts';
import { DayOfWeek, DAY_LABELS, RoutineDayWithExercises } from '../../../../src/models';
import { MuscleHeatmap } from '../../../../src/components/history/MuscleHeatmap';
import { DayViewHeaderDropdown } from '../../../../src/components/routine/DayViewHeaderDropdown';

type RoutineMetric = 'volume' | 'reps' | 'duration';

const ROUTINE_METRIC_OPTIONS: { key: RoutineMetric; label: string }[] = [
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' },
  { key: 'duration', label: 'Duration' },
];

const granularityToBackend = (mode: GranularityMode) => {
  if (mode === 'W' || mode === 'M') return 'day' as const;
  if (mode === '3M' || mode === '6M') return 'week' as const;
  return 'month' as const;
};

function DayDetailsContent() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { currentRoutine } = useRoutineStore();
  const { scrollEnabled } = useChartInteraction();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [day, setDay] = useState<RoutineDayWithExercises | null>(null);
  const [dayLoading, setDayLoading] = useState(true);

  const [selectedRange, setSelectedRange] = useState(12);
  const [granularityMode, setGranularityMode] = useState<GranularityMode>('W');
  const [chartMode, setChartMode] = useState<ChartMode>('rel');
  const [metric, setMetric] = useState<RoutineMetric>('volume');
  const [chartData, setChartData] = useState<RoutineChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [renderedMode, setRenderedMode] = useState<ChartMode>('rel');
  const [renderedGranularity, setRenderedGranularity] = useState<GranularityMode>('W');
  const [renderedRange, setRenderedRange] = useState(12);

  const loadDay = useCallback(async () => {
    if (!dayId) return;
    setDayLoading(true);
    try {
      const data = await routineService.getDayWithExercises(dayId);
      setDay(data);
    } catch {
      setDay(null);
    } finally {
      setDayLoading(false);
    }
  }, [dayId]);

  const loadChartData = useCallback(async () => {
    if (!user?.id || !dayId) return;
    setChartLoading(true);
    try {
      const raw = chartMode === 'rel';
      const granularity = granularityToBackend(granularityMode);
      const data = await dashboardService.getRoutineDayChartData(
        user.id,
        dayId,
        selectedRange,
        granularity,
        raw,
        wUnit,
      );
      setChartData(data);
      setRenderedMode(chartMode);
      setRenderedGranularity(granularityMode);
      setRenderedRange(selectedRange);
    } catch {
      setChartData({ volume: [], reps: [], duration: [] });
    } finally {
      setChartLoading(false);
    }
  }, [user?.id, dayId, selectedRange, granularityMode, chartMode, wUnit]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const handleRangeChange = useCallback((weeks: number) => {
    setSelectedRange(weeks);
    if (weeks === 0 && granularityMode === 'W') {
      setGranularityMode('M');
    }
  }, [granularityMode]);

  const points: TimeSeriesPoint[] = chartData
    ? (metric === 'volume' ? chartData.volume : metric === 'reps' ? chartData.reps : chartData.duration)
    : [];
  const hasChartData = points.length > 0;
  const showInitialChartPlaceholder = !chartData;
  const isInitialLoading = dayLoading && chartData === null;

  const dayOfWeekLabel = day?.day_of_week
    ? DAY_LABELS[day.day_of_week as DayOfWeek]
    : 'No day assigned';
  const routineName = currentRoutine?.days.some((d) => d.id === day?.id)
    ? currentRoutine.name
    : null;

  const templateMuscleData = useMemo(() => {
    if (!day) return [];
    const counts = new Map<string, number>();
    for (const ex of day.exercises) {
      const group = ex.exercise?.muscle_group;
      if (!group || group === 'full_body') continue;
      counts.set(group, (counts.get(group) ?? 0) + (ex.target_sets ?? 0));
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        value: Math.round((count / total) * 100),
      }));
  }, [day]);

  const subtitleMap: Record<RoutineMetric, string> = {
    volume: 'Total weight x reps',
    reps: 'Total reps per session',
    duration: 'Minutes per session',
  };

  const tooltipSuffixMap: Record<RoutineMetric, string> = {
    volume: ' vol',
    reps: ' reps',
    duration: ' min',
  };

  const minStepMap: Record<RoutineMetric, number> = {
    volume: 500,
    reps: 2,
    duration: 10,
  };

  const colorMap: Record<RoutineMetric, string> = {
    volume: '#FF6B6B',
    reps: '#96CEB4',
    duration: '#45B7D1',
  };

  const fmtTooltip = useCallback(
    (v: number) => {
      const val = metric === 'volume' ? formatVolume(v) : String(v);
      return val + tooltipSuffixMap[metric];
    },
    [metric],
  );

  const targetValue = useMemo(() => {
    if (!day) return 0;

    const repsForSet = (set: { target_reps_min: number; target_reps_max: number }, fallback: number) => {
      const min = set.target_reps_min > 0 ? set.target_reps_min : 0;
      const max = set.target_reps_max > 0 ? set.target_reps_max : 0;
      if (min > 0 && max > 0) return Math.round((min + max) / 2);
      if (min > 0) return min;
      if (max > 0) return max;
      return fallback;
    };

    let totalVolume = 0;
    let totalReps = 0;
    let totalDurationMins = 0;

    for (const ex of day.exercises) {
      const sets = ex.sets ?? [];
      if (sets.length > 0) {
        for (const set of sets) {
          const reps = repsForSet(set, ex.target_reps);
          totalReps += reps;
          totalVolume += (set.target_weight ?? 0) * reps;
          totalDurationMins += (set.target_duration ?? 0) / 60;
        }
      } else {
        const reps = ex.target_reps > 0 ? ex.target_reps : 0;
        totalReps += reps * (ex.target_sets ?? 0);
      }
    }

    if (metric === 'volume') return Math.round(totalVolume);
    if (metric === 'reps') return Math.round(totalReps);
    return Math.round(totalDurationMins);
  }, [day, metric]);

  const renderChart = (dimmed: boolean) => {
    if (!hasChartData) return null;

    const chartProps = {
      data: points,
      title: '',
      subtitle: subtitleMap[metric],
      frontColor: colorMap[metric],
      formatTooltipValue: fmtTooltip,
      targetValue,
      formatTargetTooltipValue: fmtTooltip,
      minYStep: minStepMap[metric],
    };

    const mode = dimmed ? renderedMode : chartMode;

    if (mode === 'rel') {
      return <SimpleLineChart {...chartProps} />;
    }

    return (
      <SimpleScrollableChart
        {...chartProps}
        mode={dimmed ? renderedGranularity : granularityMode}
        weeks={dimmed ? renderedRange : selectedRange}
      />
    );
  };

  if (isInitialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (!day) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Day not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
      <Stack.Screen
        options={{
          headerTitle: () => <DayViewHeaderDropdown dayId={dayId ?? ''} currentView="details" />,
        }}
      />
      <View style={styles.header}>
        <Text style={styles.dayLabel}>{day.label}</Text>
        <Text style={styles.dayMeta}>Week {day.week_index} · {dayOfWeekLabel}</Text>
        {routineName ? <Text style={styles.daySubtle}>Routine: {routineName}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <ChartFilterBar
          selectedRange={selectedRange}
          onChangeRange={handleRangeChange}
          chartMode={chartMode}
          onChangeChartMode={setChartMode}
          granularityMode={granularityMode}
          onChangeGranularity={setGranularityMode}
        />
        <MetricChips
          options={ROUTINE_METRIC_OPTIONS}
          selected={metric}
          onChange={setMetric}
          activeColor={colorMap[metric]}
        />
        <View style={styles.chartArea}>
          {showInitialChartPlaceholder ? (
            <View style={styles.placeholder}>
              <ActivityIndicator color={colors.textMuted} />
            </View>
          ) : (
            <>
              <View style={chartLoading ? styles.dimmed : undefined} pointerEvents={chartLoading ? 'none' : 'auto'}>
                {renderChart(chartLoading)}
              </View>
              {chartLoading && (
                <View style={styles.spinnerOverlay}>
                  <ActivityIndicator color={colors.textMuted} />
                </View>
              )}
              {!chartLoading && !hasChartData && (
                <View style={styles.placeholder}>
                  <Text style={styles.emptyText}>No workout data yet for this day.</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        {templateMuscleData.length > 0 ? (
          <MuscleHeatmap
            data={templateMuscleData}
            title="Targeted Muscles"
            subtitle="Template set distribution by muscle group"
          />
        ) : (
          <View style={styles.emptyDistribution}>
            <Text style={styles.emptyText}>No exercises in this day template yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function DayDetailsScreen() {
  return (
    <ChartInteractionProvider>
      <DayDetailsContent />
    </ChartInteractionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: spacing.md,
  },
  dayLabel: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  dayMeta: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 6,
  },
  daySubtle: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  chartArea: {
    minHeight: SVG_HEIGHT + 50,
  },
  dimmed: {
    opacity: 0.3,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    height: SVG_HEIGHT + 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDistribution: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
