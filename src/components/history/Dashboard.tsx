import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Svg, {
  Polygon as SvgPolygon,
  Circle as SvgDot,
  Line as SvgLine,
  Text as SvgText,
  G as SvgG,
  Rect as SvgRect,
} from 'react-native-svg';
import { DashboardData, ExerciseProgression, TimeSeriesPoint, exerciseDetailService, ExerciseDetailData } from '../../services';
import { Card, ExercisePickerModal } from '../ui';
import { BODY_MEASUREMENT_METRICS, Exercise, MeasurementMetricKey } from '../../models';
import { PremiumFeatureKey } from '../../models/subscription';
import { useProfileStore } from '../../stores/profile.store';
import { useAuthStore } from '../../stores/auth.store';
import { useSubscriptionStore } from '../../stores/subscription.store';
import { usePaywall } from '../../contexts/PaywallContext';
import { getMeasurementGoalFromProfile, measurementGoalToDisplay } from '../../utils/measurementGoals';
import { weightUnitLabel, distanceUnitLabel } from '../../utils/units';
import { formatDurationValue } from '../../utils/duration';
import { fonts, spacing } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { isLightTheme } from '../../constants/themes';
import type { ThemeColors } from '../../constants/themes';

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

const RADAR_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Back',      keys: ['back', 'upper_back', 'lower_back', 'traps', 'trapezius'] },
  { label: 'Chest',     keys: ['chest', 'upper_chest'] },
  { label: 'Core',      keys: ['abs', 'obliques'] },
  { label: 'Shoulders', keys: ['shoulders', 'deltoids'] },
  { label: 'Arms',      keys: ['biceps', 'triceps', 'forearms', 'forearm'] },
  { label: 'Legs',      keys: ['quads', 'quadriceps', 'hamstrings', 'hamstring', 'glutes', 'gluteal', 'calves', 'tibialis', 'adductors'] },
];

// Flat-top hexagon: Back=upper-left, Chest=upper-right, Core=right, Shoulders=lower-right, Arms=lower-left, Legs=left
const RADAR_AXES: { label: string; angle: number }[] = [
  { label: 'Back',      angle: 240 },
  { label: 'Chest',     angle: 300 },
  { label: 'Core',      angle: 0   },
  { label: 'Shoulders', angle: 60  },
  { label: 'Arms',      angle: 120 },
  { label: 'Legs',      angle: 180 },
];

interface Dashboard2Props {
  data: DashboardData;
  hasPremium?: boolean;
  weeks?: number;
  onPressUpgrade?: (feature: PremiumFeatureKey) => void;
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


function getSpotlightMetricOptions(exerciseType: string): { key: string; label: string }[] {
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

function isSpotlightDurationMetric(key: string): boolean {
  return key.includes('Duration') || key === 'longestDuration' || key === 'sessionDuration';
}

function getSpotlightTooltipFormatter(key: string, wUnit: string, dUnit: string): (v: number) => string {
  const wLabel = wUnit === 'lbs' ? 'lbs' : 'kg';
  const dLabel = dUnit === 'miles' ? 'mi' : 'km';
  if (key.includes('Volume') || key === 'bestSetVolume' || key === 'sessionVolume')
    return (v) => `${formatVolume(v)} vol`;
  if (isSpotlightDurationMetric(key))
    return (v) => formatDurationValue(v);
  if (key.includes('Reps') || key === 'maxReps' || key === 'totalReps' || key === 'sessionReps')
    return (v) => `${v} reps`;
  if (key.includes('Pace') || key === 'bestPace')
    return (v) => `${v.toFixed(2)} ${dLabel}/min`;
  if (key.includes('Distance') || key === 'farthestDistance')
    return (v) => `${Math.round(v * 10) / 10} ${dLabel}`;
  return (v) => `${v} ${wLabel}`;
}

function getSpotlightMinYStep(key: string): number {
  if (key.includes('Volume') || key === 'bestSetVolume' || key === 'sessionVolume') return 500;
  if (key.includes('Reps') || key === 'maxReps' || key === 'totalReps' || key === 'sessionReps') return 2;
  if (key.includes('Pace') || key === 'bestPace') return 0.5;
  return 10;
}

const crownIcon = require('../../../assets/icons/crown.png') as number;

const BASIC_MEASUREMENT_KEYS: MeasurementMetricKey[] = ['body_weight', 'body_fat_pct', 'waist'];

const MEASUREMENT_OPTIONS = BODY_MEASUREMENT_METRICS.map((m) => ({
  key: m.key,
  label: m.label,
}));

function useDashboardStyles() {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return { colors, styles, isLight: isLightTheme(theme) };
}

/* ── Main Dashboard ── */

export function Dashboard({
  data,
  hasPremium = false,
  weeks: weeksProp,
  onPressUpgrade,
  onRefresh,
  refreshing,
  onChangeWeeks,
  onChangeGranularityMode,
  chartMode = 'abs',
  onChangeChartMode,
}: Dashboard2Props) {
  const { colors, styles, isLight } = useDashboardStyles();
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';
  const [selectedRange, setSelectedRange] = useState(weeksProp ?? 4);

  // Keep local selection in sync when the parent overrides weeks (e.g. free-tier guard).
  useEffect(() => {
    if (weeksProp !== undefined && weeksProp !== selectedRange) {
      setSelectedRange(weeksProp);
    }
  // weeksProp changes are the only signal we care about
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeksProp]);
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

  const openExerciseDetail = useCallback((exerciseId: string) => {
    const href = `/exercise/${exerciseId}` as const;
    if (pathname.startsWith('/exercise/')) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, [pathname, router]);

  const navigateToExerciseDetail = useCallback((exerciseId: string) => {
    pendingPickerReopenRef.current = true;
    setShowExercisePicker(false);
    setTimeout(() => openExerciseDetail(exerciseId), 280);
  }, [openExerciseDetail]);
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
        exerciseType: null,
        weightPoints: [],
        volumePoints: [],
        repsPoints: [],
        oneRMPoints: [],
        durationPoints: [],
        distancePoints: [],
        pacePoints: [],
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
    if (!hasPremium && weeks !== 4) {
      onPressUpgrade?.('advanced_analytics');
      return;
    }

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

  const handleChartModePress = (mode: ChartMode) => {
    if (!hasPremium && mode === 'abs') {
      onPressUpgrade?.('advanced_analytics');
      return;
    }
    onChangeChartMode?.(mode);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise({ id: exercise.id, name: exercise.name });
  };

  const chartConfig: ChartConfigProps = {
    mode: granularityMode,
    weeks: selectedRange,
    chartMode,
  };

  const selectedMeasurementGoal = useMemo(() => {
    const storedGoal = getMeasurementGoalFromProfile(profile, measurementMetric);
    if (storedGoal == null) return null;
    return measurementGoalToDisplay(measurementMetric, storedGoal, wUnit, hUnit);
  }, [profile, measurementMetric, wUnit, hUnit]);

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
  const filterBlurTint = isLight ? 'light' : 'dark';
  const filterBlurIntensity = isLight ? 40 : 60;

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
          selectedRange={selectedRange}
          onOpenActivity={() => router.push(`/(tabs)/history/activity?initialRange=${selectedRange}`)}
        />
        <MeasurementsSection
          measurementSeries={data.measurementSeries}
          metric={measurementMetric}
          onMetricChange={setMeasurementMetric}
          weightUnit={wUnit}
          heightUnit={hUnit}
          goalValue={selectedMeasurementGoal}
          {...chartConfig}
        />
        <VolumeSection data={data.volume} {...chartConfig} />
        <DurationTrendSection data={data.duration} {...chartConfig} />
        {activeExercise ? (
          <ExerciseSpotlightSection
            active={activeExercise}
            onPickExercise={() => setShowExercisePicker(true)}
            {...chartConfig}
          />
        ) : (
          <Card style={styles.card}>
            <SectionTitle title="Exercise Spotlight" />
            <TouchableOpacity
              style={styles.exerciseSelectBtn}
              onPress={() => setShowExercisePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseSelectText}>Select exercise</Text>
              <Text style={styles.exerciseSelectArrow}>▾</Text>
            </TouchableOpacity>
            <Text style={styles.chartEmptyText}>
              No exercise data available in the selected range.
            </Text>
          </Card>
        )}
        <MuscleRadarSection data={data.muscleGroupSplit} />
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
        <BlurView
          intensity={filterBlurIntensity}
          tint={filterBlurTint}
          style={[styles.filterBar, isLight && styles.filterBarLight]}
        >
          <TimeRangeDropdown selected={selectedRange} onChange={handleRangeChange} />
          <ChartModeToggle selected={chartMode} onChange={handleChartModePress} />
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
        <BlurView
          intensity={filterBlurIntensity}
          tint={filterBlurTint}
          style={[styles.chevronBlur, isLight && styles.filterBarLight]}
        >
          <Text style={styles.chevronText}>{filtersOpen ? '▴' : '▾'}</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

/* ── Section Title ── */

function SectionTitle({ title, rightElement }: { title: string; rightElement?: React.ReactNode }) {
  const { styles } = useDashboardStyles();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
    </View>
  );
}

/* ── Info Tooltip ── */

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 18 }}>ⓘ</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            maxWidth: 280,
            marginHorizontal: 24,
          }}>
            <Text style={{ color: colors.text, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 }}>
              {text}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ── Hero Stats ── */

function HeroStatsRow({ stats }: { stats: DashboardData['summaryStats'] }) {
  const { colors, styles } = useDashboardStyles();
  return (
    <View style={styles.heroGrid}>
      <View style={styles.heroRow}>
        <View style={[styles.heroTile, { borderLeftColor: '#FFEAA7' }]}>
          <Text style={styles.heroTileLabel}>WORKOUTS</Text>
          <Text style={styles.heroTileBig}>{stats.totalWorkouts}</Text>
        </View>
        <View style={[styles.heroTile, { borderLeftColor: colors.accent }]}>
          <Text style={styles.heroTileLabel}>STREAK</Text>
          <Text style={[styles.heroTileBig, { color: colors.accent }]}>
            {stats.currentStreak}<Text style={styles.heroTileUnit}> {stats.currentStreak === 1 ? 'week' : 'weeks'}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.heroRow}>
        <View style={[styles.heroTile, { borderLeftColor: '#FF6B6B' }]}>
          <Text style={styles.heroTileLabel}>TOTAL VOLUME</Text>
          <Text style={styles.heroTileValue}>{formatVolume(stats.totalVolume)}</Text>
        </View>
        <View style={[styles.heroTile, { borderLeftColor: '#45B7D1' }]}>
          <Text style={styles.heroTileLabel}>AVG DURATION</Text>
          <Text style={styles.heroTileValue}>
            {stats.avgDuration}<Text style={styles.heroTileUnit}> min</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Contribution Grid ── */

function ContributionGrid({
  workoutDays,
  selectedRange,
  onOpenActivity,
}: {
  workoutDays: string[];
  selectedRange: number;
  onOpenActivity: () => void;
}) {
  const { styles } = useDashboardStyles();
  const daySet = useMemo(() => buildFilledDaySet(workoutDays), [workoutDays]);

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
  const { styles, isLight } = useDashboardStyles();
  const [open, setOpen] = useState(false);
  const { isPremium } = useSubscriptionStore();
  const { showPaywall } = usePaywall();
  const selectedLabel = MEASUREMENT_OPTIONS.find((m) => m.key === selected)?.label ?? 'Metric';

  const basicOptions = BASIC_MEASUREMENT_KEYS.map((k) => MEASUREMENT_OPTIONS.find((m) => m.key === k)!).filter(Boolean);
  const advancedOptions = MEASUREMENT_OPTIONS.filter((m) => !BASIC_MEASUREMENT_KEYS.includes(m.key as MeasurementMetricKey));

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
            {(() => {
              const items = (
                <View style={styles.metricDropdownScrollContent}>
                  {basicOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.metricDropdownItem,
                        option.key === selected && styles.metricDropdownItemActive,
                      ]}
                      onPress={() => { onChange(option.key); setOpen(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.metricDropdownItemText, option.key === selected && styles.metricDropdownItemTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {isPremium ? (
                    advancedOptions.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.metricDropdownItem,
                          option.key === selected && styles.metricDropdownItemActive,
                        ]}
                        onPress={() => { onChange(option.key); setOpen(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.metricDropdownItemText, option.key === selected && styles.metricDropdownItemTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity
                      style={styles.metricDropdownItem}
                      onPress={() => { setOpen(false); showPaywall(); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Image
                          source={crownIcon}
                          style={{ width: 14, height: 14 }}
                          resizeMode="contain"
                          tintColor={isLight ? '#000' : '#fff'}
                        />
                        <Text style={styles.metricDropdownItemText}>Advanced</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );

              return isPremium ? (
                <ScrollView
                  style={styles.metricDropdownScroll}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                >
                  {items}
                </ScrollView>
              ) : items;
            })()}
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
  goalValue,
  mode,
  weeks,
  chartMode,
}: ChartConfigProps & {
  measurementSeries: DashboardData['measurementSeries'];
  metric: MeasurementMetricKey;
  onMetricChange: (m: MeasurementMetricKey) => void;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'in';
  goalValue: number | null;
}) {
  const { colors, styles } = useDashboardStyles();
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
        targetValue={goalValue ?? undefined}
        formatTargetTooltipValue={formatTooltip}
        targetLabel="Goal"
        targetLineColor={colors.textSecondary}
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
  onPickExercise,
  mode,
  weeks,
  chartMode,
}: ChartConfigProps & {
  active: ExerciseProgression;
  onPickExercise: () => void;
}) {
  const { styles, isLight } = useDashboardStyles();
  const spotlightColor = isLight ? '#F59E0B' : '#FFEAA7';
  const { profile: spotProfile } = useProfileStore();
  const { user } = useAuthStore();
  const wUnit = spotProfile?.weight_unit ?? 'kg';
  const dUnit = spotProfile?.distance_unit ?? 'km';

  const [detailData, setDetailData] = useState<ExerciseDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  useEffect(() => {
    if (!user?.id || !active.exerciseId) return;
    setDetailData(null);
    setLoadingDetail(true);
    exerciseDetailService.getData(user.id, active.exerciseId, wUnit, dUnit)
      .then((d) => {
        setDetailData(d);
        const options = getSpotlightMetricOptions(d.exercise.exercise_type ?? 'weight_reps');
        setSelectedMetric((prev) => options.find((o) => o.key === prev) ? prev : options[0].key);
      })
      .catch(() => setDetailData(null))
      .finally(() => setLoadingDetail(false));
  // wUnit/dUnit intentionally excluded — avoid refetch on unit change mid-session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, active.exerciseId]);

  const exerciseType = detailData?.exercise.exercise_type ?? active.exerciseType ?? 'weight_reps';
  const metricOptions = getSpotlightMetricOptions(exerciseType);
  const activeMetric = metricOptions.find((o) => o.key === selectedMetric) ? selectedMetric : metricOptions[0]?.key ?? '';

  const points = useMemo(() => {
    if (!detailData) return [];
    return (detailData.timeSeries[activeMetric] ?? []).filter((p) => p.value > 0);
  }, [detailData, activeMetric]);

  const fmtTooltip = useCallback(
    (v: number) => getSpotlightTooltipFormatter(activeMetric, wUnit, dUnit)(v),
    [activeMetric, wUnit, dUnit],
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
        options={metricOptions}
        selected={activeMetric}
        onChange={setSelectedMetric}
        activeColor={spotlightColor}
      />
    </>
  );

  if (loadingDetail) {
    return (
      <View style={{ marginBottom: spacing.md, paddingVertical: spacing.sm }}>
        <SectionTitle title="Exercise Spotlight" />
        {header}
        <ActivityIndicator style={{ marginVertical: 24 }} color={spotlightColor} />
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={{ marginBottom: spacing.md, paddingVertical: spacing.sm }}>
        <SectionTitle title="Exercise Spotlight" />
        {header}
        <Text style={styles.chartEmptyText}>
          No logged sessions for this exercise in the selected range.
        </Text>
      </View>
    );
  }

  if (chartMode === 'rel') {
    return (
      <SimpleLineChart
        data={points}
        title="Exercise Spotlight"
        subtitle={metricOptions.find((o) => o.key === activeMetric)?.label ?? ''}
        headerContent={header}
        frontColor={spotlightColor}
        formatTooltipValue={fmtTooltip}
        minYStep={getSpotlightMinYStep(activeMetric)}
      />
    );
  }

  return (
    <SimpleScrollableChart
      data={points}
      mode={mode}
      weeks={weeks}
      title="Exercise Spotlight"
      subtitle={metricOptions.find((o) => o.key === activeMetric)?.label ?? ''}
      headerContent={header}
      frontColor={spotlightColor}
      formatTooltipValue={fmtTooltip}
      minYStep={getSpotlightMinYStep(activeMetric)}
    />
  );
});

/* ── Muscle Radar ── */

type RadarDrillState = { mode: 'radar' } | { mode: 'group'; group: string } | { mode: 'all' };

const RADAR_CHART_HEIGHT = 268;

function MuscleRadarSection({ data }: { data: DashboardData['muscleGroupSplit'] }) {
  const { styles } = useDashboardStyles();
  const [drill, setDrill] = useState<RadarDrillState>({ mode: 'radar' });
  if (data.length === 0) return null;

  const inDrill = drill.mode !== 'radar';
  const drillTitle = drill.mode === 'group' ? drill.group : drill.mode === 'all' ? 'All Muscles' : '';

  return (
    <Card style={[styles.card, { paddingBottom: spacing.xs }]}>
      {inDrill ? (
        <View style={styles.drillHeader}>
          <Text style={styles.drillGroupTitle}>{drillTitle}</Text>
        </View>
      ) : (
        <SectionTitle
          title="Muscle Distribution"
          rightElement={
            <InfoTooltip text="Each set counts 1.0 for the primary muscle and 0.33 for each secondary muscle. Cardio and full-body exercises are excluded. Values show each muscle's share of total weighted sets." />
          }
        />
      )}
      <Text style={styles.chartSubtitle}>
        {inDrill ? 'Sets within group · relative to max' : 'Sets by muscle group'}
      </Text>

      <View style={styles.radarChartArea}>
        {drill.mode === 'radar' && (
          <MuscleRadarChart data={data} onSelectGroup={(g) => setDrill({ mode: 'group', group: g })} />
        )}
        {drill.mode !== 'radar' && (
          <MuscleGroupDrillDown
            groupLabel={drill.mode === 'group' ? drill.group : null}
            data={data}
          />
        )}
      </View>

      <TouchableOpacity
        onPress={() => inDrill ? setDrill({ mode: 'radar' }) : setDrill({ mode: 'all' })}
        style={styles.drillFooterBtn}
        activeOpacity={0.7}
      >
        {inDrill ? (
          <>
            <Text style={styles.drillBackArrow}>‹</Text>
            <Text style={styles.drillFooterBtnText}>Back</Text>
          </>
        ) : (
          <>
            <Text style={styles.drillFooterBtnText}>Drill Down</Text>
            <Text style={[styles.drillBackArrow, { fontSize: 16 }]}>›</Text>
          </>
        )}
      </TouchableOpacity>
    </Card>
  );
}

function MuscleGroupDrillDown({ groupLabel, data }: { groupLabel: string | null; data: DashboardData['muscleGroupSplit'] }) {
  const { colors, styles } = useDashboardStyles();

  const muscles = useMemo(() => {
    if (groupLabel === null) {
      return [...data].sort((a, b) => b.value - a.value);
    }
    const group = RADAR_GROUPS.find((g) => g.label === groupLabel);
    if (!group) return [];
    return data
      .filter((d) => {
        const key = d.label.toLowerCase().replace(/ /g, '_');
        return group.keys.includes(key) || group.keys.includes(d.label.toLowerCase());
      })
      .sort((a, b) => b.value - a.value);
  }, [groupLabel, data]);

  const maxVal = useMemo(() => Math.max(...muscles.map((m) => m.value), 1), [muscles]);

  if (muscles.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.chartEmptyText}>No data for this group in the selected range.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.drillScroll}
      contentContainerStyle={styles.drillScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {muscles.map((m) => (
        <View key={m.label} style={styles.drillRow}>
          <Text style={styles.drillMuscleName}>
            {m.label.replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <View style={styles.drillBarTrack}>
            <View style={[styles.drillBarFill, { width: `${(m.value / maxVal) * 100}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={styles.drillMuscleValue}>{m.value}%</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MuscleRadarChart({ data, onSelectGroup }: { data: DashboardData['muscleGroupSplit']; onSelectGroup?: (label: string) => void }) {
  const { colors } = useTheme();
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const rings = 5;

  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const d of data) {
      for (const group of RADAR_GROUPS) {
        if (group.keys.includes(d.label.toLowerCase()) || group.keys.includes(d.label.toLowerCase().replace(/ /g, '_'))) {
          totals[group.label] = (totals[group.label] ?? 0) + d.value;
          break;
        }
      }
    }
    return totals;
  }, [data]);

  const maxVal = useMemo(
    () => Math.max(...RADAR_AXES.map((a) => groupTotals[a.label] ?? 0), 1),
    [groupTotals],
  );

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const makePolygonPoints = (r: number) =>
    RADAR_AXES.map((a) => { const p = toXY(a.angle, r); return `${p.x},${p.y}`; }).join(' ');

  const dataPolygonPoints = RADAR_AXES.map((a) => {
    const val = groupTotals[a.label] ?? 0;
    const r = (val / maxVal) * maxR;
    const p = toXY(a.angle, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {Array.from({ length: rings }, (_, i) => (i + 1) / rings * maxR).map((r, i) => (
          <SvgPolygon
            key={`ring-${i}`}
            points={makePolygonPoints(r)}
            fill="none"
            stroke={colors.border}
            strokeWidth={0.8}
            opacity={0.7}
          />
        ))}
        {RADAR_AXES.map((a, i) => {
          const end = toXY(a.angle, maxR);
          return (
            <SvgLine key={`ax-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={colors.border} strokeWidth={0.8} />
          );
        })}
        <SvgPolygon
          points={dataPolygonPoints}
          fill={colors.accent}
          fillOpacity={0.18}
          stroke={colors.accent}
          strokeWidth={2}
        />
        {RADAR_AXES.map((a, i) => {
          const val = groupTotals[a.label] ?? 0;
          if (val === 0) return null;
          const p = toXY(a.angle, (val / maxVal) * maxR);
          return <SvgDot key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill={colors.accent} />;
        })}
        {RADAR_AXES.map((a, i) => {
          const p = toXY(a.angle, maxR + 28);
          const hasData = (groupTotals[a.label] ?? 0) > 0;
          return (
            <SvgG key={`lbl-${i}`} onPress={() => hasData && onSelectGroup?.(a.label)}>
              <SvgRect x={p.x - 32} y={p.y - 12} width={64} height={28} fill="transparent" />
              <SvgText
                x={p.x} y={p.y + 4}
                textAnchor="middle"
                fontSize={11}
                fill={hasData ? colors.text : colors.textMuted}
                fontFamily={fonts.semiBold}
              >
                {hasData ? `${a.label} >` : a.label}
              </SvgText>
            </SvgG>
          );
        })}
      </Svg>
    </View>
  );
}

/* ── Personal Records ── */

function PersonalRecordsSection({
  data,
}: {
  data: DashboardData['personalRecords'];
}) {
  const { styles } = useDashboardStyles();
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.bottom,
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
    color: colors.textSecondary,
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
  filterBarLight: {
    backgroundColor: `${colors.surfaceLight}D9`,
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
    gap: 8,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  heroTileLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroTileBig: {
    fontSize: 34,
    fontFamily: fonts.bold,
    color: colors.text,
    lineHeight: 36,
  },
  heroTileSub: {
    fontSize: 11,
    fontFamily: fonts.light,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroTileValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  heroTileUnit: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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

  radarChartArea: {
    height: RADAR_CHART_HEIGHT,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  drillBackArrow: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 20,
  },
  drillGroupTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  drillScroll: {
    flex: 1,
  },
  drillScrollContent: {
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drillMuscleName: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
    width: 90,
  },
  drillBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  drillBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  drillMuscleValue: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    width: 34,
    textAlign: 'right',
  },
  drillFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  drillFooterBtnText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});
