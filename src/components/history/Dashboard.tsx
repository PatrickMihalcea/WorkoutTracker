import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { PieChart } from 'react-native-gifted-charts';
import { DashboardData, ExerciseProgression, TimeSeriesPoint } from '../../services';
import { Card, ExercisePickerModal } from '../ui';
import { Exercise } from '../../models';
import { colors, fonts, spacing } from '../../constants';

function cloneData<T extends Record<string, unknown>>(arr: T[]): T[] {
  return arr.map((item) => ({ ...item }));
}

export type GranularityMode = 'W' | 'M' | '3M' | '6M' | 'Y';

interface Dashboard2Props {
  data: DashboardData;
  onRefresh?: () => void;
  refreshing?: boolean;
  onChangeWeeks?: (weeks: number) => void;
  onChangeGranularityMode?: (mode: GranularityMode) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const TIME_RANGES = [
  { label: '4W', value: 4 },
  { label: '8W', value: 8 },
  { label: '3M', value: 12 },
  { label: '6M', value: 26 },
  { label: '1Y', value: 52 },
  { label: '2Y', value: 104 },
  { label: 'All', value: 0 },
];

const GRANULARITY_MODES: { key: GranularityMode; label: string }[] = [
  { key: 'W', label: 'W' },
  { key: 'M', label: 'M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'Y', label: 'Y' },
];

function viewportPoints(mode: GranularityMode): number {
  if (mode === 'W') return 7;
  if (mode === 'M') return 31;
  if (mode === '3M') return 13;
  if (mode === '6M') return 26;
  return 12;
}

interface ChartInteractionProps {
  mode: GranularityMode;
  weeks: number;
  scrollEnabled: boolean;
  onChartTouchStart: () => void;
  onChartTouchEnd: () => void;
  pointerActiveRef: React.MutableRefObject<boolean>;
}

interface ChartSectionProps extends ChartInteractionProps {
  data: TimeSeriesPoint[];
}

type SpotlightMetric = 'weight' | 'volume' | 'reps' | '1rm';
const METRIC_OPTIONS: { key: SpotlightMetric; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' },
  { key: '1rm', label: '1RM' },
];

const LONG_PRESS_MS = 500;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatKeyDate(key: string, mode: GranularityMode): string {
  if (mode === 'Y') {
    return `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
  }
  if (mode === '6M' || mode === '3M') {
    const dt = new Date(key + 'T00:00:00Z');
    const endDt = new Date(dt);
    endDt.setUTCDate(endDt.getUTCDate() + 6);
    const sM = MONTH_NAMES[dt.getUTCMonth()];
    const eM = MONTH_NAMES[endDt.getUTCMonth()];
    if (dt.getUTCFullYear() === endDt.getUTCFullYear()) {
      if (sM === eM) return `${sM} ${dt.getUTCDate()} – ${endDt.getUTCDate()}, ${dt.getUTCFullYear()}`;
      return `${sM} ${dt.getUTCDate()} – ${eM} ${endDt.getUTCDate()}, ${dt.getUTCFullYear()}`;
    }
    return `${sM} ${dt.getUTCDate()}, ${dt.getUTCFullYear()} – ${eM} ${endDt.getUTCDate()}, ${endDt.getUTCFullYear()}`;
  }
  const m = Number(key.slice(5, 7)) - 1;
  const d = Number(key.slice(8));
  return `${MONTH_NAMES[m]} ${d}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function computePointSpacing(mode: GranularityMode, chartWidth: number): number {
  return chartWidth / viewportPoints(mode);
}

function formatDateRange(points: TimeSeriesPoint[], firstIdx: number, lastIdx: number, mode: GranularityMode): string {
  if (points.length === 0) return '';
  const clampFirst = Math.max(0, Math.min(firstIdx, points.length - 1));
  const clampLast = Math.max(0, Math.min(lastIdx, points.length - 1));
  const startDate = new Date(points[clampFirst].date);
  const endDate = new Date(points[clampLast].date);

  if (mode === 'W') {
    const sMonth = MONTH_NAMES[startDate.getUTCMonth()];
    const eMonth = MONTH_NAMES[endDate.getUTCMonth()];
    if (sMonth === eMonth && startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
      return `${sMonth} ${startDate.getUTCDate()} – ${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;
    }
    if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
      return `${sMonth} ${startDate.getUTCDate()} – ${eMonth} ${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;
    }
    return `${sMonth} ${startDate.getUTCDate()}, ${startDate.getUTCFullYear()} – ${eMonth} ${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`;
  }

  if (mode === 'M') {
    const sMonth = MONTH_NAMES[startDate.getUTCMonth()];
    const eMonth = MONTH_NAMES[endDate.getUTCMonth()];
    if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
      return `${sMonth} ${startDate.getUTCDate()} – ${eMonth} ${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;
    }
    return `${sMonth} ${startDate.getUTCDate()}, ${startDate.getUTCFullYear()} – ${eMonth} ${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`;
  }

  const sMonth = MONTH_NAMES[startDate.getUTCMonth()];
  const eMonth = MONTH_NAMES[endDate.getUTCMonth()];
  if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
    return `${sMonth} – ${eMonth} ${endDate.getUTCFullYear()}`;
  }
  return `${sMonth} ${startDate.getUTCFullYear()} – ${eMonth} ${endDate.getUTCFullYear()}`;
}

interface YAxisInfo {
  labels: string[];
  sections: number;
  maxValue: number;
  yAxisWidth: number;
}

function formatYValue(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

function computeYAxisInfo(data: TimeSeriesPoint[], minStep: number = 1): YAxisInfo {
  let maxVal = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].value > maxVal) maxVal = data[i].value;
  }
  maxVal *= 1.1;

  let step: number;
  let sections: number;

  if (maxVal <= 0) {
    step = minStep;
    sections = 2;
  } else {
    step = Math.max(minStep, Math.ceil(maxVal / 4 / minStep) * minStep);
    sections = Math.max(2, Math.min(4, Math.ceil(maxVal / step)));
  }

  const labels: string[] = [];
  let longestLen = 1;
  for (let i = 0; i <= sections; i++) {
    const lbl = formatYValue(step * i);
    labels.push(lbl);
    if (lbl.length > longestLen) longestLen = lbl.length;
  }

  const yAxisWidth = Math.max(16, longestLen * 7 + 4);

  return { labels, sections, maxValue: step * sections, yAxisWidth };
}

function totalSlotsForRange(weeks: number, mode: GranularityMode): number {
  if (weeks === 0) {
    if (mode === 'Y') return 10 * 12;
    if (mode === '6M' || mode === '3M') return 10 * 52;
    if (mode === 'M') return 10 * 365;
    return 10 * 365;
  }
  const days = weeks * 7;
  if (mode === 'Y') return Math.ceil(days / 30);
  if (mode === '6M' || mode === '3M') return Math.ceil(days / 7);
  return days;
}

function slotIndexForPoint(point: TimeSeriesPoint, rangeEndMs: number, totalSlots: number, mode: GranularityMode): number {
  const msPerDay = 86400000;
  if (mode === 'Y') {
    const endDate = new Date(rangeEndMs);
    const ptDate = new Date(point.date);
    const monthDiff =
      (endDate.getUTCFullYear() - ptDate.getUTCFullYear()) * 12 +
      (endDate.getUTCMonth() - ptDate.getUTCMonth());
    return totalSlots - 1 - monthDiff;
  }
  if (mode === '6M' || mode === '3M') {
    const daysDiff = Math.round((rangeEndMs - point.date) / msPerDay);
    const weeksDiff = Math.round(daysDiff / 7);
    return totalSlots - 1 - weeksDiff;
  }
  const daysDiff = Math.round((rangeEndMs - point.date) / msPerDay);
  return totalSlots - 1 - daysDiff;
}

const CHART_HEIGHT = 150;
const X_LABEL_HEIGHT = 20;
const SVG_HEIGHT = CHART_HEIGHT + X_LABEL_HEIGHT;

function xLabelInterval(mode: GranularityMode): number {
  if (mode === 'W') return 1;
  if (mode === 'M') return 1;
  if (mode === '6M') return 1;
  return 1;
}

function slotToXLabel(slotIdx: number, totalSlots: number, nowMs: number, mode: GranularityMode): string {
  const msPerDay = 86400000;
  if (mode === 'Y') {
    const end = new Date(nowMs);
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (totalSlots - 1 - slotIdx), 1));
    return MONTH_INITIALS[d.getUTCMonth()];
  }
  if (mode === '3M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * 7 * msPerDay;
    const d = new Date(ts);
    const prevTs = nowMs - (totalSlots - slotIdx) * 7 * msPerDay;
    const prev = new Date(prevTs);
    if (slotIdx === 0 || prev.getUTCMonth() !== d.getUTCMonth()) {
      return MONTH_NAMES[d.getUTCMonth()];
    }
    return '';
  }
  if (mode === '6M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * 7 * msPerDay;
    const d = new Date(ts);
    const prevTs = nowMs - (totalSlots - slotIdx) * 7 * msPerDay;
    const prev = new Date(prevTs);
    if (prev.getUTCMonth() !== d.getUTCMonth()) return MONTH_NAMES[d.getUTCMonth()];
    return '';
  }
  if (mode === 'M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * msPerDay;
    const d = new Date(ts);
    if (d.getUTCDay() === 1) return String(d.getUTCDate());
    return '';
  }
  const ts = nowMs - (totalSlots - 1 - slotIdx) * msPerDay;
  const d = new Date(ts);
  return DAY_INITIALS[d.getUTCDay()];
}

/* ── Main Dashboard2 ── */

export function Dashboard({
  data,
  onRefresh,
  refreshing,
  onChangeWeeks,
  onChangeGranularityMode,
}: Dashboard2Props) {
  const [selectedRange, setSelectedRange] = useState(12);
  const [granularityMode, setGranularityMode] = useState<GranularityMode>('W');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [spotlightMetric, setSpotlightMetric] = useState<SpotlightMetric>('weight');

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const pointerActiveRef = useRef(false);

  const onChartTouchStart = useCallback(() => {
    pointerActiveRef.current = true;
    setScrollEnabled(false);
  }, []);

  const onChartTouchEnd = useCallback(() => {
    pointerActiveRef.current = false;
    setScrollEnabled(true);
  }, []);

  const hasData =
    data.frequency.length > 0 ||
    data.volume.length > 0 ||
    data.muscleGroupSplit.length > 0;

  const activeExercise = useMemo(() => {
    if (data.exerciseProgressions.length === 0) return null;
    if (selectedExerciseId) {
      return data.exerciseProgressions.find((e) => e.exerciseId === selectedExerciseId) ?? data.exerciseProgressions[0];
    }
    return data.exerciseProgressions[0];
  }, [data.exerciseProgressions, selectedExerciseId]);

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Data Yet</Text>
        <Text style={styles.emptyMsg}>Complete workouts to see your stats here.</Text>
      </View>
    );
  }

  const handleRangeChange = (weeks: number) => {
    setSelectedRange(weeks);
    onChangeWeeks?.(weeks);
    if (weeks === 0 && granularityMode === 'W') {
      setGranularityMode('M');
      onChangeGranularityMode?.('M');
    }
  };

  const handleGranularityChange = (mode: GranularityMode) => {
    setGranularityMode(mode);
    onChangeGranularityMode?.(mode);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
  };

  const interactionProps: ChartInteractionProps = {
    mode: granularityMode,
    weeks: selectedRange,
    scrollEnabled,
    onChartTouchStart,
    onChartTouchEnd,
    pointerActiveRef,
  };

  const [filtersOpen, setFiltersOpen] = useState(true);
  const filterAnim = useRef(new Animated.Value(1)).current;
  const FILTER_BAR_HEIGHT = 40;

  const toggleFilters = useCallback(() => {
    const toValue = filtersOpen ? 0 : 1;
    setFiltersOpen(!filtersOpen);
    Animated.timing(filterAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [filtersOpen, filterAnim]);

  const filterBarHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FILTER_BAR_HEIGHT],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: FILTER_BAR_HEIGHT + spacing.xs }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          ) : undefined
        }
      >
        <HeroStatsRow stats={data.summaryStats} />
        <ContributionGrid workoutDays={data.workoutDays} streakWeeks={data.weeklyStreak} />
        <WorkoutFrequencySection data={data.frequency} {...interactionProps} />
        <VolumeSection data={data.volume} {...interactionProps} />
        {activeExercise && (
          <ExerciseSpotlightSection
            active={activeExercise}
            metric={spotlightMetric}
            onMetricChange={setSpotlightMetric}
            onPickExercise={() => setShowExercisePicker(true)}
            {...interactionProps}
          />
        )}
        <MuscleGroupSection
          data={data.muscleGroupSplit}
          exerciseBreakdown={data.muscleGroupExercises}
        />
        <PersonalRecordsSection data={data.personalRecords} />
        <DurationTrendSection data={data.duration} {...interactionProps} />

        <ExercisePickerModal
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={handleExerciseSelect}
          selectedExerciseId={selectedExerciseId}
        />
      </ScrollView>
      <Animated.View style={[styles.filterBarOuter, { height: filterBarHeight }]}>
        <BlurView intensity={60} tint="dark" style={styles.filterBar}>
          <TimeRangeDropdown selected={selectedRange} onChange={handleRangeChange} />
          <GranularityPicker selected={granularityMode} onChange={handleGranularityChange} isAll={selectedRange === 0} />
        </BlurView>
      </Animated.View>
      <TouchableOpacity
        onPress={toggleFilters}
        style={styles.chevronBox}
        activeOpacity={0.7}
      >
        <BlurView intensity={60} tint="dark" style={styles.chevronBlur}>
          <Text style={styles.chevronText}>{filtersOpen ? '▴' : '▾'}</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

/* ── Section Title ── */

function SectionTitle({ title, rightElement }: { title: string; rightElement?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
    </View>
  );
}

/* ── Hero Stats ── */

function HeroStatsRow({ stats }: { stats: DashboardData['summaryStats'] }) {
  return (
    <View style={styles.heroGrid}>
      <View style={styles.heroTile}>
        <Text style={styles.heroValue}>{stats.totalWorkouts}</Text>
        <Text style={styles.heroLabel}>Workouts</Text>
      </View>
      <View style={styles.heroTile}>
        <Text style={[styles.heroValue, { color: '#4ECDC4' }]}>
          {stats.currentStreak}
        </Text>
        <Text style={styles.heroLabel}>Week Streak</Text>
      </View>
      <View style={styles.heroTile}>
        <Text style={styles.heroValue}>{formatVolume(stats.totalVolume)}</Text>
        <Text style={styles.heroLabel}>Total Volume</Text>
      </View>
      <View style={styles.heroTile}>
        <Text style={styles.heroValue}>{stats.avgDuration}m</Text>
        <Text style={styles.heroLabel}>Avg Duration</Text>
      </View>
    </View>
  );
}

/* ── Time Range Dropdown ── */

function TimeRangeDropdown({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = TIME_RANGES.find((r) => r.value === selected)?.label ?? 'All';

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTriggerText}>{currentLabel}</Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {TIME_RANGES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.dropdownItem,
                  selected === r.value && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onChange(r.value);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selected === r.value && styles.dropdownItemTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ── Granularity Picker ── */

function GranularityPicker({
  selected,
  onChange,
  isAll,
}: {
  selected: GranularityMode;
  onChange: (m: GranularityMode) => void;
  isAll?: boolean;
}) {
  const modes = isAll ? GRANULARITY_MODES.filter((m) => m.key !== 'W') : GRANULARITY_MODES;
  return (
    <View style={styles.granularityRow}>
      {modes.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.granularityChip, selected === m.key && styles.granularityChipActive]}
          onPress={() => onChange(m.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.granularityChipText, selected === m.key && styles.granularityChipTextActive]}
          >
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ── Simple Scrollable Chart (SVG-based, no windowing) ── */

function SimpleScrollableChart({
  data,
  mode,
  weeks,
  title,
  subtitle,
  headerContent,
  frontColor,
  scrollEnabled = true,
  onChartTouchStart,
  onChartTouchEnd,
  pointerActiveRef,
  formatTooltipValue,
  minYStep,
}: {
  data: TimeSeriesPoint[];
  mode: GranularityMode;
  weeks: number;
  title: string;
  subtitle: string;
  headerContent?: React.ReactNode;
  frontColor: string;
  scrollEnabled?: boolean;
  onChartTouchStart: () => void;
  onChartTouchEnd: () => void;
  pointerActiveRef: React.MutableRefObject<boolean>;
  formatTooltipValue: (value: number) => string;
  minYStep?: number;
}) {
  const vp = viewportPoints(mode);
  const yMinStep = minYStep ?? 1;
  const slots = totalSlotsForRange(weeks, mode);

  const [yAxis, setYAxis] = useState<YAxisInfo>(() =>
    computeYAxisInfo(data.slice(Math.max(0, data.length - vp)), yMinStep),
  );
  const [dateRange, setDateRange] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<{ date: string; value: string; slotX: number } | null>(null);
  const tooltipWidthRef = useRef(0);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const fixedYAxisWidth = 40;
  const estimatedWidth = SCREEN_WIDTH - 2 * spacing.sm - fixedYAxisWidth;
  const chartWidth = measuredWidth ?? estimatedWidth;
  const slotWidth = computePointSpacing(mode, chartWidth);
  const barWidth = Math.max(4, slotWidth - 4);
  const totalContentWidth = slots * slotWidth;

  const scrollOffsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const rightmostKeyRef = useRef<string | null>(null);
  const prevDataRef = useRef(data);
  const prevModeRef = useRef(mode);
  const mountedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = useMemo(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const slotIndices = useMemo(
    () => data.map((pt) => slotIndexForPoint(pt, now, slots, mode)),
    [data, now, slots, mode],
  );

  const slotToDateStr = useCallback(
    (slotIdx: number): string => {
      const msPerDay = 86400000;
      let ts: number;
      if (mode === 'Y') {
        const end = new Date(now);
        const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (slots - 1 - slotIdx), 1));
        ts = d.getTime();
      } else if (mode === '6M' || mode === '3M') {
        ts = now - (slots - 1 - slotIdx) * 7 * msPerDay;
      } else {
        ts = now - (slots - 1 - slotIdx) * msPerDay;
      }
      const d = new Date(ts);
      return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    },
    [now, slots, mode],
  );

  const slotToDate = useCallback(
    (slotIdx: number): Date => {
      const msPerDay = 86400000;
      if (mode === 'Y') {
        const end = new Date(now);
        return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (slots - 1 - slotIdx), 1));
      } else if (mode === '6M' || mode === '3M') {
        return new Date(now - (slots - 1 - slotIdx) * 7 * msPerDay);
      }
      return new Date(now - (slots - 1 - slotIdx) * msPerDay);
    },
    [now, slots, mode],
  );

  const updateHeaderForOffset = useCallback(
    (ox: number) => {
      const startSlot = Math.max(0, Math.min(slots - 1, Math.round(ox / slotWidth)));
      const visibleSlots = Math.floor(chartWidth / slotWidth);
      const endSlot = Math.min(slots - 1, startSlot + visibleSlots - 1);

      const startDate = slotToDate(startSlot);
      const endDate = slotToDate(endSlot);

      const sDay = startDate.getUTCDate();
      const sMonth = startDate.getUTCMonth();
      const sYear = startDate.getUTCFullYear();
      const eDay = endDate.getUTCDate();
      const eMonth = endDate.getUTCMonth();
      const eYear = endDate.getUTCFullYear();

      const lastDayOfMonth = new Date(Date.UTC(sYear, sMonth + 1, 0)).getUTCDate();
      if (sDay === 1 && eDay === lastDayOfMonth && sMonth === eMonth && sYear === eYear) {
        setDateRange(`${MONTH_NAMES[sMonth]} ${sYear}`);
      } else {
        setDateRange(`${slotToDateStr(startSlot)} – ${slotToDateStr(endSlot)}`);
      }
    },
    [slots, slotWidth, chartWidth, slotToDate, slotToDateStr],
  );

  const handleChartLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setMeasuredWidth((prev) => {
      if (prev !== null && Math.abs(prev - w) < 1) return prev;
      return w;
    });
  }, []);

  const scrollToPresent = useCallback(() => {
    const scrollX = Math.max(0, totalContentWidth - chartWidth);
    scrollOffsetRef.current = scrollX;
    scrollRef.current?.scrollTo({ x: scrollX, animated: false });
    updateHeaderForOffset(scrollX);
    const startSlot = Math.max(0, Math.floor(scrollX / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
  }, [totalContentWidth, chartWidth, updateHeaderForOffset, slotWidth, slots, vp, data, slotIndices, yMinStep]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      scrollToPresent();
      return;
    }
    const dataChanged = data !== prevDataRef.current;
    const modeChanged = mode !== prevModeRef.current;
    prevDataRef.current = data;
    prevModeRef.current = mode;

    if (!dataChanged && !modeChanged) return;

    const anchor = rightmostKeyRef.current;
    let scrollX: number;
    if (anchor && data.length > 0) {
      const found = data.findIndex((d) => d.key >= anchor);
      const anchorIdx = found !== -1 ? found : data.length - 1;
      const anchorSlot = slotIndices[anchorIdx] ?? (slots - 1);
      scrollX = Math.max(0, (anchorSlot - vp + 1) * slotWidth);
    } else {
      scrollX = Math.max(0, totalContentWidth - chartWidth);
    }

    scrollOffsetRef.current = scrollX;
    scrollRef.current?.scrollTo({ x: scrollX, animated: false });
    updateHeaderForOffset(scrollX);

    const startSlot = Math.max(0, Math.floor(scrollX / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode]);

  useEffect(() => {
    if (measuredWidth !== null && mountedRef.current) {
      scrollToPresent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredWidth]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const ox = e.nativeEvent.contentOffset.x;
      scrollOffsetRef.current = ox;
      const endSlot = Math.min(slots - 1, Math.floor(ox / slotWidth) + vp - 1);
      if (data.length > 0) {
        let nearestIdx = data.length - 1;
        for (let i = data.length - 1; i >= 0; i--) {
          if (slotIndices[i] <= endSlot) { nearestIdx = i; break; }
        }
        rightmostKeyRef.current = data[nearestIdx]?.key ?? null;
      }
      updateHeaderForOffset(ox);
    },
    [data, slotIndices, slots, slotWidth, vp, updateHeaderForOffset],
  );

  const handleScrollEnd = useCallback(() => {
    if (!flingActiveRef.current) flingPageIdx.current = -1;
    const ox = scrollOffsetRef.current;
    const startSlot = Math.max(0, Math.floor(ox / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
  }, [data, slotIndices, slots, slotWidth, vp, yMinStep]);

  const MOVE_THRESHOLD = 10;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchXRef = useRef(0);
  const flingActiveRef = useRef(false);
  const flingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flingPageIdx = useRef(-1);
  const [snapInterval, setSnapInterval] = useState(slotWidth);

  useEffect(() => {
    if (!flingActiveRef.current) setSnapInterval(slotWidth);
  }, [slotWidth]);

  const findNearestBar = useCallback(
    (pageX: number) => {
      const ox = scrollOffsetRef.current;
      const touchSlot = Math.round((ox + pageX - spacing.sm - fixedYAxisWidth) / slotWidth);
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < slotIndices.length; i++) {
        const dist = Math.abs(slotIndices[i] - touchSlot);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      if (bestIdx >= 0 && bestDist <= 2) return bestIdx;
      return -1;
    },
    [slotIndices, slotWidth, fixedYAxisWidth],
  );

  const showTooltipAt = useCallback(
    (pageX: number) => {
      const idx = findNearestBar(pageX);
      if (idx >= 0) {
        const pt = data[idx];
        const si = slotIndices[idx];
        setActiveTooltip({
          date: formatKeyDate(pt.key, mode),
          value: formatTooltipValue(pt.value),
          slotX: si * slotWidth + slotWidth / 2,
        });
      }
    },
    [findNearestBar, data, slotIndices, slotWidth, mode, formatTooltipValue],
  );

  const activateTooltipMode = useCallback(
    (pageX: number) => {
      pointerActiveRef.current = true;
      onChartTouchStart();
      showTooltipAt(pageX);
    },
    [pointerActiveRef, onChartTouchStart, showTooltipAt],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      touchStartRef.current = { x: pageX, y: pageY, time: Date.now() };
      lastTouchXRef.current = pageX;
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) activateTooltipMode(pageX);
      }, LONG_PRESS_MS);
    },
    [activateTooltipMode],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      lastTouchXRef.current = pageX;

      if (pointerActiveRef.current) {
        showTooltipAt(pageX);
        return;
      }

      if (touchStartRef.current && longPressTimerRef.current) {
        const dx = Math.abs(pageX - touchStartRef.current.x);
        const dy = Math.abs(pageY - touchStartRef.current.y);
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    [pointerActiveRef, showTooltipAt],
  );

  const pageBoundarySlots = useMemo(() => {
    const boundaries: number[] = [];
    const msPerDay = 86400000;
    for (let s = 0; s < slots; s++) {
      if (mode === 'W') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getUTCDay() === 1) boundaries.push(s);
      } else if (mode === 'M') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getUTCDate() === 1) boundaries.push(s);
      } else if (mode === '3M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getUTCMonth() !== d.getUTCMonth()) boundaries.push(s);
      } else if (mode === '6M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const m = d.getUTCMonth();
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getUTCMonth() !== m && (m === 0 || m === 6)) boundaries.push(s);
      } else {
        const end = new Date(now);
        const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (slots - 1 - s), 1));
        if (d.getUTCMonth() === 0) boundaries.push(s);
      }
    }
    if (boundaries.length === 0 || boundaries[0] !== 0) boundaries.unshift(0);
    return boundaries;
  }, [slots, now, mode]);

  const handleFling = useCallback(
    (dx: number, pages: number) => {
      if (pageBoundarySlots.length === 0) return;
      const ox = scrollOffsetRef.current;
      const currentStartSlot = Math.round(ox / slotWidth);

      let baseIdx = -1;
      if (dx < 0) {
        for (let i = 0; i < pageBoundarySlots.length; i++) {
          if (pageBoundarySlots[i] > currentStartSlot + 1) { baseIdx = i; break; }
        }
        if (baseIdx < 0) baseIdx = pageBoundarySlots.length - 1;
        baseIdx = Math.min(pageBoundarySlots.length - 1, baseIdx + pages - 1);
      } else {
        for (let i = pageBoundarySlots.length - 1; i >= 0; i--) {
          if (pageBoundarySlots[i] < currentStartSlot - 1) { baseIdx = i; break; }
        }
        if (baseIdx < 0) baseIdx = 0;
        baseIdx = Math.max(0, baseIdx - (pages - 1));
      }

      const targetSlot = pageBoundarySlots[baseIdx];
      const targetX = Math.max(0, Math.min(totalContentWidth - chartWidth, targetSlot * slotWidth));

      flingActiveRef.current = true;
      setSnapInterval(0);
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
      scrollOffsetRef.current = targetX;
      updateHeaderForOffset(targetX);

      const startSlot = Math.max(0, Math.floor(targetX / slotWidth));
      const endSlot = Math.min(slots - 1, startSlot + vp - 1);
      const visible = data.filter((_, i) => {
        const s = slotIndices[i];
        return s >= startSlot && s <= endSlot;
      });
      if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));

      if (flingTimerRef.current) clearTimeout(flingTimerRef.current);
      flingTimerRef.current = setTimeout(() => {
        flingActiveRef.current = false;
        setSnapInterval(slotWidth);
        scrollRef.current?.scrollTo({ x: targetX, animated: false });
      }, 400);
    },
    [pageBoundarySlots, slotWidth, totalContentWidth, chartWidth, updateHeaderForOffset, slots, vp, data, slotIndices, yMinStep],
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      if (pointerActiveRef.current) {
        pointerActiveRef.current = false;
        onChartTouchEnd();
        setActiveTooltip(null);
        tooltipWidthRef.current = 0;
        setTooltipReady(false);
        return;
      }

      if (start) {
        const endX = e.nativeEvent?.pageX ?? lastTouchXRef.current;
        const dx = endX - start.x;
        const absDx = Math.abs(dx);
        const dt = Date.now() - start.time;
        if (absDx > 30 && dt < 200) {
          const pages = absDx >= 90 ? 2 : 1;
          handleFling(dx, pages);
        }
      }
    },
    [pointerActiveRef, onChartTouchEnd, handleFling],
  );

  const labelInterval = xLabelInterval(mode);

  const xLabels = useMemo(() => {
    const labels: { x: number; text: string }[] = [];
    for (let s = 0; s < slots; s += labelInterval) {
      const text = slotToXLabel(s, slots, now, mode);
      if (text) labels.push({ x: s * slotWidth + slotWidth / 2, text });
    }
    return labels;
  }, [slots, labelInterval, slotWidth, now, mode]);

  const verticalGridLines = useMemo(() => {
    const lines: number[] = [];
    const msPerDay = 86400000;
    for (let s = 0; s < slots; s++) {
      if (mode === 'W') {
        lines.push(s * slotWidth);
      } else if (mode === 'M') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getUTCDay() === 1) lines.push(s * slotWidth);
      } else if (mode === '3M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getUTCMonth() !== d.getUTCMonth()) lines.push(s * slotWidth);
      } else if (mode === '6M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getUTCMonth() !== d.getUTCMonth()) lines.push(s * slotWidth);
      } else {
        lines.push(s * slotWidth);
      }
    }
    return lines;
  }, [slots, slotWidth, now, mode]);

  const horizontalGridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 1; i <= yAxis.sections; i++) {
      lines.push(CHART_HEIGHT - (i / yAxis.sections) * CHART_HEIGHT);
    }
    return lines;
  }, [yAxis.sections]);

  const pageBoundaryXSet = useMemo(
    () => new Set(pageBoundarySlots.map((s) => s * slotWidth)),
    [pageBoundarySlots, slotWidth],
  );

  const pageBoundaryLines = useMemo(
    () => pageBoundarySlots.map((s) => s * slotWidth),
    [pageBoundarySlots, slotWidth],
  );

  const filteredVerticalGridLines = useMemo(
    () => verticalGridLines.filter((x) => !pageBoundaryXSet.has(x)),
    [verticalGridLines, pageBoundaryXSet],
  );

  const bars = useMemo(() => {
    if (yAxis.maxValue <= 0) return [];
    return data.map((pt, i) => {
      const si = slotIndices[i];
      const barH = Math.max(0, (pt.value / yAxis.maxValue) * CHART_HEIGHT);
      const x = si * slotWidth + (slotWidth - barWidth) / 2;
      return { x, y: CHART_HEIGHT - barH, width: barWidth, height: barH, key: pt.key };
    });
  }, [data, slotIndices, slotWidth, barWidth, yAxis.maxValue]);

  return (
    <View style={styles.chartSection}>
      <SectionTitle title={title} />
      {headerContent}
      <View style={styles.chartHeaderArea}>
        <View style={{ opacity: (activeTooltip && tooltipReady) ? 0 : 1 }}>
          <Text style={styles.dateRangeText}>{dateRange}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        {activeTooltip && (() => {
          const tw = tooltipWidthRef.current;
          const screenX = activeTooltip.slotX - scrollOffsetRef.current + fixedYAxisWidth;
          const sectionWidth = chartWidth + fixedYAxisWidth;
          const clampedLeft = tw > 0
            ? Math.max(0, Math.min(sectionWidth - tw, screenX - tw / 2))
            : 0;
          return (
            <View
              style={[styles.tooltipBubble, { left: clampedLeft, opacity: tooltipReady ? 1 : 0 }]}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (Math.abs(w - tooltipWidthRef.current) > 1) {
                  tooltipWidthRef.current = w;
                  setTooltipReady(true);
                } else if (!tooltipReady) {
                  setTooltipReady(true);
                }
              }}
            >
              <Text style={styles.tooltipValue} numberOfLines={1}>{activeTooltip.value}</Text>
              <Text style={styles.tooltipDate} numberOfLines={1}>{activeTooltip.date}</Text>
            </View>
          );
        })()}
      </View>
      <View style={styles.chartRow}>
          <View style={[styles.yAxisColumn, { width: fixedYAxisWidth, height: CHART_HEIGHT }]}>
            {[...yAxis.labels].reverse().map((label, i) => (
              <Text key={i} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            snapToInterval={snapInterval || undefined}
            decelerationRate="fast"
            scrollEnabled={scrollEnabled}
            onLayout={handleChartLayout}
            style={styles.chartScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <Svg width={totalContentWidth} height={SVG_HEIGHT}>
              <Line
                x1={0} y1={CHART_HEIGHT} x2={totalContentWidth} y2={CHART_HEIGHT}
                stroke={colors.border} strokeWidth={1}
              />
              {horizontalGridLines.map((y, i) => (
                <Line
                  key={`hg-${i}`}
                  x1={0} y1={y} x2={totalContentWidth} y2={y}
                  stroke={colors.border} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7}
                />
              ))}
              {filteredVerticalGridLines.map((x, i) => (
                <Line
                  key={`vg-${i}`}
                  x1={x} y1={0} x2={x} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7}
                />
              ))}
              {pageBoundaryLines.map((x, i) => (
                <Line
                  key={`pb-${i}`}
                  x1={x} y1={0} x2={x} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={1} opacity={0.9}
                />
              ))}
              {bars.map((b) => (
                <Rect
                  key={b.key}
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={frontColor}
                  rx={3}
                  ry={3}
                />
              ))}
              {activeTooltip && (
                <Line
                  x1={activeTooltip.slotX} y1={0}
                  x2={activeTooltip.slotX} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={1}
                />
              )}
              {xLabels.map((lbl, i) => (
                <SvgText
                  key={i}
                  x={lbl.x}
                  y={CHART_HEIGHT + 14}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="middle"
                  fontFamily={fonts.regular}
                >
                  {lbl.text}
                </SvgText>
              ))}
            </Svg>
          </ScrollView>
        </View>
    </View>
  );
}

/* ── Contribution Grid ── */

function ContributionGrid({
  workoutDays,
  streakWeeks,
}: {
  workoutDays: string[];
  streakWeeks: DashboardData['weeklyStreak'];
}) {
  const daySet = useMemo(() => new Set(workoutDays), [workoutDays]);

  const currentStreak = useMemo(() => {
    let count = 0;
    for (let i = streakWeeks.length - 1; i >= 0; i--) {
      if (streakWeeks[i].completed) count++;
      else break;
    }
    return count;
  }, [streakWeeks]);

  const grid = useMemo(() => {
    const rows: { key: string; filled: boolean }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDay = today.getDay();
    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);

    const startMonday = new Date(thisMonday);
    startMonday.setDate(thisMonday.getDate() - 11 * 7);

    for (let dow = 0; dow < 7; dow++) {
      const row: { key: string; filled: boolean }[] = [];
      for (let week = 0; week < 12; week++) {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() + week * 7 + dow);
        const key = d.toISOString().split('T')[0];
        row.push({ key, filled: daySet.has(key) });
      }
      rows.push(row);
    }
    return rows;
  }, [daySet]);

  const dayLabels = ['M', '', 'W', '', 'F', '', 'S'];

  return (
    <Card style={styles.card}>
      <View style={styles.streakHeader}>
        <SectionTitle title="Activity" />
        <Text style={styles.streakBadge}>
          {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}
        </Text>
      </View>
      <View style={styles.gridContainer}>
        <View style={styles.gridDayLabels}>
          {dayLabels.map((l, i) => (
            <Text key={i} style={styles.gridDayLabel}>{l}</Text>
          ))}
        </View>
        <View style={styles.gridBody}>
          {grid.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((cell) => (
                <View
                  key={cell.key}
                  style={[styles.gridCell, cell.filled && styles.gridCellFilled]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/* ── Workout Frequency ── */

const WorkoutFrequencySection = React.memo(function WorkoutFrequencySection({
  data,
  mode,
  weeks,
  scrollEnabled,
  onChartTouchStart,
  onChartTouchEnd,
  pointerActiveRef,
}: ChartSectionProps) {
  if (data.length === 0) return null;

  const fmtTooltip = useCallback((v: number) => `${v} workouts`, []);

  return (
    <SimpleScrollableChart
      data={data}
      mode={mode}
      weeks={weeks}
      title="Workout Frequency"
      subtitle="Workouts per period"
      frontColor="#4ECDC4"
      scrollEnabled={scrollEnabled}
      onChartTouchStart={onChartTouchStart}
      onChartTouchEnd={onChartTouchEnd}
      pointerActiveRef={pointerActiveRef}
      formatTooltipValue={fmtTooltip}
      minYStep={1}
    />
  );
});

/* ── Volume Over Time ── */

const VolumeSection = React.memo(function VolumeSection({
  data,
  mode,
  weeks,
  scrollEnabled,
  onChartTouchStart,
  onChartTouchEnd,
  pointerActiveRef,
}: ChartSectionProps) {
  if (data.length === 0) return null;

  const fmtTooltip = useCallback((v: number) => `${formatVolume(v)} vol`, []);

  return (
    <SimpleScrollableChart
      data={data}
      mode={mode}
      weeks={weeks}
      title="Total Volume"
      subtitle="Weight x reps per period"
      frontColor="#FF6B6B"
      scrollEnabled={scrollEnabled}
      onChartTouchStart={onChartTouchStart}
      onChartTouchEnd={onChartTouchEnd}
      pointerActiveRef={pointerActiveRef}
      formatTooltipValue={fmtTooltip}
      minYStep={500}
    />
  );
});

/* ── Exercise Spotlight ── */

const ExerciseSpotlightSection = React.memo(function ExerciseSpotlightSection({
  active,
  metric,
  onMetricChange,
  onPickExercise,
  mode,
  weeks,
  scrollEnabled,
  onChartTouchStart,
  onChartTouchEnd,
  pointerActiveRef,
}: ChartInteractionProps & {
  active: ExerciseProgression;
  metric: SpotlightMetric;
  onMetricChange: (m: SpotlightMetric) => void;
  onPickExercise: () => void;
}) {
  const pointsMap: Record<SpotlightMetric, TimeSeriesPoint[]> = {
    weight: active.weightPoints,
    volume: active.volumePoints,
    reps: active.repsPoints,
    '1rm': active.oneRMPoints,
  };
  const points = pointsMap[metric] ?? active.weightPoints;

  const subtitleMap: Record<SpotlightMetric, string> = {
    weight: 'Max weight per session',
    volume: 'Total volume per session',
    reps: 'Total reps per session',
    '1rm': 'Estimated 1RM per session',
  };

  const tooltipSuffix: Record<SpotlightMetric, string> = {
    weight: ' lbs',
    volume: ' vol',
    reps: ' reps',
    '1rm': ' 1RM',
  };

  const minStepMap: Record<SpotlightMetric, number> = {
    weight: 10,
    volume: 500,
    reps: 2,
    '1rm': 10,
  };

  const fmtTooltip = useCallback(
    (v: number) => {
      const val = metric === 'volume' ? formatVolume(v) : String(v);
      return val + tooltipSuffix[metric];
    },
    [metric, tooltipSuffix],
  );

  const header = (
    <>
      <TouchableOpacity
        style={styles.exerciseSelectBtn}
        onPress={onPickExercise}
        activeOpacity={0.7}
      >
        <Text style={styles.exerciseSelectText}>{active.exerciseName}</Text>
        <Text style={styles.exerciseSelectArrow}>▾</Text>
      </TouchableOpacity>
      <View style={styles.metricRow}>
        {METRIC_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.metricChip, metric === opt.key && styles.metricChipActive]}
            onPress={() => onMetricChange(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.metricChipText, metric === opt.key && styles.metricChipTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <SimpleScrollableChart
      data={points}
      mode={mode}
      weeks={weeks}
      title="Exercise Spotlight"
      subtitle={subtitleMap[metric]}
      headerContent={header}
      frontColor="#FFEAA7"
      scrollEnabled={scrollEnabled}
      onChartTouchStart={onChartTouchStart}
      onChartTouchEnd={onChartTouchEnd}
      pointerActiveRef={pointerActiveRef}
      formatTooltipValue={fmtTooltip}
      minYStep={minStepMap[metric]}
    />
  );
});

/* ── Muscle Group Split ── */

function MuscleGroupSection({
  data,
  exerciseBreakdown,
}: {
  data: DashboardData['muscleGroupSplit'];
  exerciseBreakdown: DashboardData['muscleGroupExercises'];
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (data.length === 0) return null;

  const drillData = selectedGroup ? exerciseBreakdown[selectedGroup] ?? [] : [];

  if (selectedGroup && drillData.length > 0) {
    const drillPieData = drillData.map((d) => ({
      value: d.value,
      color: d.color,
      text: `${d.value}%`,
      textColor: '#fff',
      textSize: 10,
    }));

    return (
      <Card style={styles.card}>
        <SectionTitle
          title={selectedGroup}
          rightElement={
            <TouchableOpacity onPress={() => setSelectedGroup(null)} activeOpacity={0.7}>
              <Text style={styles.drillBackText}>← Back</Text>
            </TouchableOpacity>
          }
        />
        <Text style={styles.chartSubtitle}>% of sets by exercise</Text>
        <View style={styles.pieContainer}>
          <PieChart
            data={cloneData(drillPieData)}
            donut
            radius={80}
            innerRadius={50}
            innerCircleColor={colors.surface}
            centerLabelComponent={() => (
              <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                <Text style={styles.pieCenter}>
                  {drillData.length}
                  {'\n'}
                  exercises
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.legendContainer}>
          {drillData.map((d, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendText}>
                {d.label} ({d.value}%)
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  }

  const pieData = data.map((d) => ({
    value: d.value,
    color: d.color,
    text: `${d.value}%`,
    textColor: '#fff',
    textSize: 10,
    onPress: () => setSelectedGroup(d.label),
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Muscle Group Split" />
      <Text style={styles.chartSubtitle}>% of total sets by muscle</Text>
      <View style={styles.pieContainer}>
        <PieChart
          data={cloneData(pieData)}
          donut
          radius={80}
          innerRadius={50}
          innerCircleColor={colors.surface}
          centerLabelComponent={() => (
            <Text style={styles.pieCenter}>
              {data.length}
              {'\n'}
              groups
            </Text>
          )}
        />
      </View>
      <View style={styles.legendContainer}>
        {data.slice(0, 8).map((d, i) => (
          <TouchableOpacity
            key={i}
            style={styles.legendItem}
            onPress={() => setSelectedGroup(d.label)}
            activeOpacity={0.7}
          >
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>
              {d.label} ({d.value}%)
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

/* ── Personal Records ── */

function PersonalRecordsSection({
  data,
}: {
  data: DashboardData['personalRecords'];
}) {
  if (data.length === 0) return null;

  return (
    <Card style={styles.card}>
      <SectionTitle title="Personal Records" />
      <Text style={styles.chartSubtitle}>Heaviest lifts</Text>
      {data.map((pr, i) => (
        <View key={i} style={styles.prRow}>
          <View style={styles.prRank}>
            <Text style={styles.prRankText}>{i + 1}</Text>
          </View>
          <View style={styles.prInfo}>
            <Text style={styles.prName}>{pr.exerciseName}</Text>
            <Text style={styles.prDetail}>
              {pr.weight} lbs x {pr.reps} reps
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

/* ── Duration Trend ── */

const DurationTrendSection = React.memo(function DurationTrendSection({
  data,
  mode,
  weeks,
  scrollEnabled,
  onChartTouchStart,
  onChartTouchEnd,
  pointerActiveRef,
}: ChartSectionProps) {
  if (data.length === 0) return null;

  const fmtTooltip = useCallback((v: number) => `${v} min`, []);

  return (
    <SimpleScrollableChart
      data={data}
      mode={mode}
      weeks={weeks}
      title="Workout Duration"
      subtitle="Avg minutes per period"
      frontColor="#45B7D1"
      scrollEnabled={scrollEnabled}
      onChartTouchStart={onChartTouchStart}
      onChartTouchEnd={onChartTouchEnd}
      pointerActiveRef={pointerActiveRef}
      formatTooltipValue={fmtTooltip}
      minYStep={10}
    />
  );
});

/* ── Styles ── */

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyMsg: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chartSection: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  chartHeaderArea: {
    minHeight: 34,
    marginBottom: spacing.xs,
    position: 'relative',
  },
  dateRangeText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  tooltipBubble: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tooltipValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  tooltipDate: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  filterBarOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    overflow: 'hidden',
  },
  filterBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.sm,
  },
  chevronBox: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    height: 40,
    overflow: 'hidden',
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  chevronBlur: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chevronText: {
    color: colors.textMuted,
    fontSize: 12,
  },

  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginRight: 6,
  },
  dropdownChevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: colors.text,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: colors.background,
  },

  granularityRow: {
    flexDirection: 'row',
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  granularityChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  granularityChipActive: {
    backgroundColor: colors.text,
  },
  granularityChipText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },
  granularityChipTextActive: {
    color: colors.background,
  },

  chartRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: -4,
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 2,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: fonts.light,
    color: colors.textMuted,
    textAlign: 'right',
    paddingRight: 2,
  },
  chartScroll: {
    flex: 1,
  },

  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streakBadge: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#4ECDC4',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  gridDayLabels: {
    marginRight: 6,
    justifyContent: 'space-between',
  },
  gridDayLabel: {
    fontSize: 9,
    fontFamily: fonts.light,
    color: colors.textMuted,
    height: 14,
    lineHeight: 14,
  },
  gridBody: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 14,
    maxHeight: 14,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: 1,
  },
  gridCellFilled: {
    backgroundColor: '#4ECDC4',
  },

  exerciseSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  exerciseSelectText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 6,
  },
  exerciseSelectArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  metricChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricChipActive: {
    backgroundColor: '#FFEAA7',
    borderColor: '#FFEAA7',
  },
  metricChipText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  metricChipTextActive: {
    color: '#000',
  },

  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  pieCenter: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  drillBackText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prRankText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  prDetail: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
