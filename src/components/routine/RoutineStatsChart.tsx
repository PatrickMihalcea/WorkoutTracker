import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { useProfileStore } from '../../stores/profile.store';
import { dashboardService, RoutineChartData } from '../../services';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ChartFilterBar,
  MetricChips,
  SimpleLineChart,
  SimpleScrollableChart,
  GranularityMode,
  ChartMode,
  SVG_HEIGHT,
  formatVolume,
  TimeSeriesPoint,
} from '../charts';

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

interface RoutineStatsChartProps {
  routineId: string;
}

export function RoutineStatsChart({ routineId }: RoutineStatsChartProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [selectedRange, setSelectedRange] = useState(12);
  const [granularityMode, setGranularityMode] = useState<GranularityMode>('W');
  const [chartMode, setChartMode] = useState<ChartMode>('rel');
  const [metric, setMetric] = useState<RoutineMetric>('volume');

  const [chartData, setChartData] = useState<RoutineChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const [renderedMode, setRenderedMode] = useState<ChartMode>('rel');
  const [renderedGranularity, setRenderedGranularity] = useState<GranularityMode>('W');
  const [renderedRange, setRenderedRange] = useState(12);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const raw = chartMode === 'rel';
      const granularity = granularityToBackend(granularityMode);
      const data = await dashboardService.getRoutineChartData(
        user.id,
        routineId,
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
      setLoading(false);
    }
  }, [user?.id, routineId, selectedRange, granularityMode, chartMode, wUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRangeChange = useCallback((weeks: number) => {
    setSelectedRange(weeks);
    if (weeks === 0 && granularityMode === 'W') {
      setGranularityMode('M');
    }
  }, [granularityMode]);

  const handleGranularityChange = useCallback((mode: GranularityMode) => {
    setGranularityMode(mode);
  }, []);

  const handleChartModeChange = useCallback((mode: ChartMode) => {
    setChartMode(mode);
  }, []);

  const points: TimeSeriesPoint[] = chartData
    ? (metric === 'volume' ? chartData.volume : metric === 'reps' ? chartData.reps : chartData.duration)
    : [];

  const hasData = points.length > 0;

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

  const renderChart = (dimmed: boolean) => {
    if (!hasData) return null;

    const chartProps = {
      data: points,
      title: '',
      subtitle: subtitleMap[metric],
      frontColor: colorMap[metric],
      formatTooltipValue: fmtTooltip,
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

  const showInitialPlaceholder = !chartData;

  const styles = useMemo(() => StyleSheet.create({
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
    emptyText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <View>
      <ChartFilterBar
        selectedRange={selectedRange}
        onChangeRange={handleRangeChange}
        chartMode={chartMode}
        onChangeChartMode={handleChartModeChange}
        granularityMode={granularityMode}
        onChangeGranularity={handleGranularityChange}
      />
      <MetricChips
        options={ROUTINE_METRIC_OPTIONS}
        selected={metric}
        onChange={setMetric}
        activeColor={colorMap[metric]}
      />
      <View style={styles.chartArea}>
        {showInitialPlaceholder ? (
          <View style={styles.placeholder}>
            <ActivityIndicator color={colors.textMuted} />
          </View>
        ) : (
          <>
            <View style={loading ? styles.dimmed : undefined} pointerEvents={loading ? 'none' : 'auto'}>
              {renderChart(loading)}
            </View>
            {loading && (
              <View style={styles.spinnerOverlay}>
                <ActivityIndicator color={colors.textMuted} />
              </View>
            )}
            {!loading && !hasData && (
              <View style={styles.placeholder}>
                <Text style={styles.emptyText}>No workout data yet for this routine.</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
