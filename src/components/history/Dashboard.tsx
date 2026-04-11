import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { PieChart } from 'react-native-gifted-charts';
import { DashboardData, ExerciseProgression, TimeSeriesPoint } from '../../services';
import { Card, ExercisePickerModal } from '../ui';
import { BODY_MEASUREMENT_METRICS, Exercise, MeasurementMetricKey } from '../../models';
import { useProfileStore } from '../../stores/profile.store';
import { weightUnitLabel } from '../../utils/units';
import { colors, fonts, spacing } from '../../constants';

import {
  SimpleLineChart,
  SimpleScrollableChart,
  TimeRangeDropdown,
  GranularityPicker,
  ChartModeToggle,
  MetricChips,
  useChartInteraction,
  GranularityMode,
  ChartMode,
  formatVolume,
} from '../charts';
import { MuscleHeatmap } from './MuscleHeatmap';
import {
  MonthCalendarGrid,
  buildFilledDaySet,
  buildMonthCalendars,
  getActivityRangeStartDate,
} from './ActivityCalendar';

export type { GranularityMode, ChartMode } from '../charts';

function cloneData<T extends Record<string, unknown>>(arr: T[]): T[] {
  return arr.map((item) => ({ ...item }));
}

interface Dashboard2Props {
  data: DashboardData;
  onRefresh?: () => void;
  refreshing?: boolean;
  onChangeWeeks?: (weeks: number) => void;
  onChangeGranularityMode?: (mode: GranularityMode) => void;
  chartMode?: ChartMode;
  onChangeChartMode?: (mode: ChartMode) => void;
}

interface ChartConfigProps {
  mode: GranularityMode;
  weeks: number;
  chartMode: ChartMode;
}

interface ChartSectionProps extends ChartConfigProps {
  data: TimeSeriesPoint[];
}

type SpotlightMetric = 'weight' | 'volume' | 'reps' | '1rm';
const METRIC_OPTIONS: { key: SpotlightMetric; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' },
  { key: '1rm', label: '1RM' },
];

const MEASUREMENT_OPTIONS = BODY_MEASUREMENT_METRICS.map((m) => ({
  key: m.key,
  label: m.label,
}));

/* ── Main Dashboard ── */

export function Dashboard({
  data,
  onRefresh,
  refreshing,
  onChangeWeeks,
  onChangeGranularityMode,
  chartMode = 'abs',
  onChangeChartMode,
}: Dashboard2Props) {
  const router = useRouter();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';
  const [selectedRange, setSelectedRange] = useState(12);
  const [granularityMode, setGranularityMode] = useState<GranularityMode>('W');
  const [measurementMetric, setMeasurementMetric] = useState<MeasurementMetricKey>('body_weight');
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const pendingPickerReopenRef = useRef(false);

  useFocusEffect(useCallback(() => {
    if (pendingPickerReopenRef.current) {
      pendingPickerReopenRef.current = false;
      setShowExercisePicker(true);
    }
  }, []));

  const navigateToExerciseDetail = useCallback((exerciseId: string) => {
    pendingPickerReopenRef.current = true;
    setShowExercisePicker(false);
    setTimeout(() => router.push(`/exercise/${exerciseId}`), 280);
  }, [router]);
  const [spotlightMetric, setSpotlightMetric] = useState<SpotlightMetric>('weight');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const filterAnim = useRef(new Animated.Value(1)).current;
  const FILTER_BAR_HEIGHT = 40;

  const { scrollEnabled } = useChartInteraction();

  const hasData =
    data.volume.length > 0 ||
    data.muscleGroupSplit.length > 0 ||
    Object.values(data.measurementSeries ?? {}).some((series) => series.length > 0);

  const activeExercise = useMemo(() => {
    if (selectedExercise) {
      const matched = data.exerciseProgressions.find((e) => e.exerciseId === selectedExercise.id);
      if (matched) return matched;
      return {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        weightPoints: [],
        volumePoints: [],
        repsPoints: [],
        oneRMPoints: [],
      };
    }
    if (data.exerciseProgressions.length === 0) return null;
    return data.exerciseProgressions[0];
  }, [data.exerciseProgressions, selectedExercise]);

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
    setSelectedExercise({ id: exercise.id, name: exercise.name });
  };

  const chartConfig: ChartConfigProps = {
    mode: granularityMode,
    weeks: selectedRange,
    chartMode,
  };

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
        <ContributionGrid
          workoutDays={data.workoutDays}
          streakWeeks={data.weeklyStreak}
          selectedRange={selectedRange}
          onOpenActivity={() => router.push(`/(tabs)/history/activity?initialRange=${selectedRange}`)}
        />
        <MeasurementsSection
          measurementSeries={data.measurementSeries}
          metric={measurementMetric}
          onMetricChange={setMeasurementMetric}
          weightUnit={wUnit}
          heightUnit={hUnit}
          {...chartConfig}
        />
        <VolumeSection data={data.volume} {...chartConfig} />
        <DurationTrendSection data={data.duration} {...chartConfig} />
        {activeExercise && (
          <ExerciseSpotlightSection
            active={activeExercise}
            metric={spotlightMetric}
            onMetricChange={setSpotlightMetric}
            onPickExercise={() => setShowExercisePicker(true)}
            {...chartConfig}
          />
        )}
        <MuscleGroupSection
          data={data.muscleGroupSplit}
          exerciseBreakdown={data.muscleGroupExercises}
        />
        <MuscleHeatmap data={data.muscleGroupSplit} />
        <PersonalRecordsSection data={data.personalRecords} />

        <ExercisePickerModal
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={handleExerciseSelect}
          onExerciseDetails={navigateToExerciseDetail}
          selectedExerciseId={selectedExercise?.id}
        />
      </ScrollView>
      <Animated.View style={[styles.filterBarOuter, { height: filterBarHeight }]}>
        <BlurView intensity={60} tint="dark" style={styles.filterBar}>
          <TimeRangeDropdown selected={selectedRange} onChange={handleRangeChange} />
          <ChartModeToggle selected={chartMode} onChange={(m) => onChangeChartMode?.(m)} />
          {chartMode === 'abs' && (
            <GranularityPicker selected={granularityMode} onChange={handleGranularityChange} isAll={selectedRange === 0} />
          )}
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

/* ── Contribution Grid ── */

function ContributionGrid({
  workoutDays,
  streakWeeks,
  selectedRange,
  onOpenActivity,
}: {
  workoutDays: string[];
  streakWeeks: DashboardData['weeklyStreak'];
  selectedRange: number;
  onOpenActivity: () => void;
}) {
  const daySet = useMemo(() => buildFilledDaySet(workoutDays), [workoutDays]);

  const currentStreak = useMemo(() => {
    let count = 0;
    for (let i = streakWeeks.length - 1; i >= 0; i--) {
      if (streakWeeks[i].completed) count++;
      else break;
    }
    return count;
  }, [streakWeeks]);

  const months = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = getActivityRangeStartDate(selectedRange);
    return buildMonthCalendars(start, end);
  }, [selectedRange]);

  return (
    <Card style={styles.card}>
      <View style={styles.streakHeader}>
        <TouchableOpacity onPress={onOpenActivity} activeOpacity={0.7} style={styles.activityTitleButton}>
          <Text style={styles.activityTitleText}>Activity</Text>
          <Text style={styles.activityChevron}>▸</Text>
        </TouchableOpacity>
        <Text style={styles.streakBadge}>
          {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}
        </Text>
      </View>
      <View style={styles.activityPreviewWrap}>
        <MonthCalendarGrid
          months={months}
          filledDays={daySet}
          numColumns={2}
          compact
          tallCells
          scrollEnabled
          virtualized={false}
          style={styles.activityPreviewList}
        />
      </View>
    </Card>
  );
}

function MeasurementMetricDropdown({
  selected,
  onChange,
}: {
  selected: MeasurementMetricKey;
  onChange: (next: MeasurementMetricKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = MEASUREMENT_OPTIONS.find((m) => m.key === selected)?.label ?? 'Metric';

  return (
    <View>
      <TouchableOpacity
        style={styles.metricDropdownTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.metricDropdownText}>{selectedLabel}</Text>
        <Text style={styles.metricDropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.metricDropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.metricDropdownMenu}>
            <ScrollView
              style={styles.metricDropdownScroll}
              contentContainerStyle={styles.metricDropdownScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {MEASUREMENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.metricDropdownItem,
                    option.key === selected && styles.metricDropdownItemActive,
                  ]}
                  onPress={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.metricDropdownItemText,
                      option.key === selected && styles.metricDropdownItemTextActive,
                    ]}
                  >
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

const MeasurementsSection = React.memo(function MeasurementsSection({
  measurementSeries,
  metric,
  onMetricChange,
  weightUnit,
  heightUnit,
  mode,
  weeks,
  chartMode,
}: ChartConfigProps & {
  measurementSeries: DashboardData['measurementSeries'];
  metric: MeasurementMetricKey;
  onMetricChange: (m: MeasurementMetricKey) => void;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'in';
}) {
  const metricDef = BODY_MEASUREMENT_METRICS.find((m) => m.key === metric);
  const points = measurementSeries[metric] ?? [];
  const wLabel = weightUnit === 'lbs' ? 'lbs' : 'kg';
  const hLabel = heightUnit === 'in' ? 'in' : 'cm';

  const subtitle = chartMode === 'rel'
    ? `${metricDef?.label ?? 'Measurement'} per log`
    : `${metricDef?.label ?? 'Measurement'} average by period`;

  const formatTooltip = useCallback((v: number) => {
    const rounded = Math.round(v * 10) / 10;
    if (metricDef?.unitKind === 'weight') return `${rounded} ${wLabel}`;
    if (metricDef?.unitKind === 'circumference') return `${rounded} ${hLabel}`;
    return `${rounded}%`;
  }, [metricDef?.unitKind, wLabel, hLabel]);

  const minStep = metricDef?.unitKind === 'percent' ? 1 : 0.5;
  const frontColor = metricDef?.color ?? '#4ECDC4';
  const header = (
    <MeasurementMetricDropdown selected={metric} onChange={onMetricChange} />
  );

  if (points.length === 0) {
    return (
      <Card style={styles.card}>
        <SectionTitle title="Measurements" rightElement={header} />
        <Text style={styles.chartSubtitle}>{subtitle}</Text>
        <Text style={styles.chartEmptyText}>
          No measurement data for this metric in the selected range.
        </Text>
      </Card>
    );
  }

  if (chartMode === 'rel') {
    return (
      <SimpleLineChart
        data={points}
        title="Measurements"
        subtitle={subtitle}
        headerContent={header}
        frontColor={frontColor}
        formatTooltipValue={formatTooltip}
        minYStep={minStep}
      />
    );
  }

  return (
    <SimpleScrollableChart
      data={points}
      mode={mode}
      weeks={weeks}
      title="Measurements"
      subtitle={subtitle}
      headerContent={header}
      frontColor={frontColor}
      formatTooltipValue={formatTooltip}
      minYStep={minStep}
    />
  );
});

/* ── Volume Over Time ── */

const VolumeSection = React.memo(function VolumeSection({
  data,
  mode,
  weeks,
  chartMode,
}: ChartSectionProps) {
  if (data.length === 0) return null;

  const fmtTooltip = useCallback((v: number) => `${formatVolume(v)} vol`, []);

  if (chartMode === 'rel') {
    return (
      <SimpleLineChart
        data={data}
        title="Total Volume"
        subtitle="Weight x reps per session"
        frontColor="#FF6B6B"
        formatTooltipValue={fmtTooltip}
        minYStep={500}
      />
    );
  }

  return (
    <SimpleScrollableChart
      data={data}
      mode={mode}
      weeks={weeks}
      title="Total Volume"
      subtitle="Weight x reps per period"
      frontColor="#FF6B6B"
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
  chartMode,
}: ChartConfigProps & {
  active: ExerciseProgression;
  metric: SpotlightMetric;
  onMetricChange: (m: SpotlightMetric) => void;
  onPickExercise: () => void;
}) {
  const { profile: spotProfile } = useProfileStore();
  const spotWLabel = spotProfile?.weight_unit === 'lbs' ? 'lbs' : 'kg';

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
    '1rm': 'Estimated 1 Rep Max per session',
  };

  const tooltipSuffix: Record<SpotlightMetric, string> = {
    weight: ` ${spotWLabel}`,
    volume: ' vol',
    reps: ' reps',
    '1rm': ` ${spotWLabel}`,
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
      <MetricChips
        options={METRIC_OPTIONS}
        selected={metric}
        onChange={onMetricChange}
      />
    </>
  );

  if (points.length === 0) {
    return (
      <Card style={styles.card}>
        <SectionTitle title="Exercise Spotlight" />
        {header}
        <Text style={styles.chartSubtitle}>{subtitleMap[metric]}</Text>
        <Text style={styles.chartEmptyText}>
          No logged sessions for this exercise in the selected range.
        </Text>
      </Card>
    );
  }

  if (chartMode === 'rel') {
    return (
      <SimpleLineChart
        data={points}
        title="Exercise Spotlight"
        subtitle={subtitleMap[metric]}
        headerContent={header}
        frontColor="#FFEAA7"
        formatTooltipValue={fmtTooltip}
        minYStep={minStepMap[metric]}
      />
    );
  }

  return (
    <SimpleScrollableChart
      data={points}
      mode={mode}
      weeks={weeks}
      title="Exercise Spotlight"
      subtitle={subtitleMap[metric]}
      headerContent={header}
      frontColor="#FFEAA7"
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
  const { profile: prProfile } = useProfileStore();
  const prWUnit = prProfile?.weight_unit ?? 'kg';

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
              {Math.round(pr.weight * 10) / 10} {weightUnitLabel(prWUnit).toLowerCase()} x {pr.reps} reps
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
  chartMode,
}: ChartSectionProps) {
  if (data.length === 0) return null;

  const fmtTooltip = useCallback((v: number) => `${v} min`, []);

  if (chartMode === 'rel') {
    return (
      <SimpleLineChart
        data={data}
        title="Workout Duration"
        subtitle="Minutes per session"
        frontColor="#45B7D1"
        formatTooltipValue={fmtTooltip}
        minYStep={10}
      />
    );
  }

  return (
    <SimpleScrollableChart
      data={data}
      mode={mode}
      weeks={weeks}
      title="Workout Duration"
      subtitle="Avg minutes per period"
      frontColor="#45B7D1"
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
  chartSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  chartEmptyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
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
  activityTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTitleText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  activityChevron: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  activityPreviewWrap: {
    maxHeight: 230,
  },
  activityPreviewList: {
    flexGrow: 0,
  },
  metricDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.xs,
  },
  metricDropdownText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 6,
  },
  metricDropdownChevron: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metricDropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  metricDropdownMenu: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 420,
    minWidth: 220,
    overflow: 'hidden',
  },
  metricDropdownScroll: {
    maxHeight: 420,
  },
  metricDropdownScrollContent: {
    paddingVertical: 6,
  },
  metricDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricDropdownItemActive: {
    backgroundColor: colors.text,
  },
  metricDropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  metricDropdownItemTextActive: {
    color: colors.background,
    fontFamily: fonts.semiBold,
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
