import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { DashboardData, ExerciseProgression } from '../../services';
import { Card, ExercisePickerModal } from '../ui';
import { Exercise } from '../../models';
import { colors, fonts, spacing } from '../../constants';

function cloneData<T>(arr: T[]): T[] {
  return JSON.parse(JSON.stringify(arr));
}

interface DashboardProps {
  data: DashboardData;
  onRefresh?: () => void;
  refreshing?: boolean;
  onChangeWeeks?: (weeks: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 120;

const TIME_RANGES = [
  { label: '4W', value: 4 },
  { label: '8W', value: 8 },
  { label: '3M', value: 12 },
  { label: '6M', value: 26 },
  { label: '1Y', value: 52 },
  { label: '2Y', value: 104 },
  { label: 'All', value: 0 },
];

type SpotlightMetric = 'weight' | 'volume' | 'reps' | '1rm';
const METRIC_OPTIONS: { key: SpotlightMetric; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' },
  { key: '1rm', label: '1RM' },
];

const TOOLTIP_STYLE: Record<string, unknown> = {
  backgroundColor: colors.surface,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: 10,
  paddingVertical: 6,
  alignItems: 'center',
};

const X_LABEL_SHIFT = 20;
const X_LABEL_LEFT_OFFSET = -18;
const X_LABEL_WIDTH = 60;
const LABEL_EXTRA_HEIGHT = 60;

const X_LABEL_STYLE = {
  color: colors.textMuted,
  fontSize: 9,
  fontFamily: fonts.light,
  textAlign: 'right' as const,
  width: X_LABEL_WIDTH,
  transform: [{ rotate: '-75deg' }],
  overflow: 'visible' as const,
};

const TIME_AXIS_PROPS = {
  width: CHART_WIDTH,
  height: 150,
  noOfSections: 4,
  yAxisTextStyle: { color: colors.textMuted, fontSize: 8, fontFamily: fonts.light },
  xAxisLabelTextStyle: X_LABEL_STYLE,
  labelsExtraHeight: LABEL_EXTRA_HEIGHT,
  xAxisLabelsVerticalShift: X_LABEL_SHIFT,
  yAxisColor: 'transparent' as const,
  xAxisColor: colors.border,
  hideRules: true,
};

const TIME_BAR_PROPS = {
  ...TIME_AXIS_PROPS,
  xAxisLabelTextStyle: { ...X_LABEL_STYLE, marginLeft: X_LABEL_LEFT_OFFSET },
};

const TIME_LINE_PROPS = {
  ...TIME_AXIS_PROPS,
  spacing: X_LABEL_WIDTH,
  thickness: 2,
  areaChart: true,
  curved: true,
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function Dashboard({ data, onRefresh, refreshing, onChangeWeeks }: DashboardProps) {
  const [selectedRange, setSelectedRange] = useState(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [spotlightMetric, setSpotlightMetric] = useState<SpotlightMetric>('weight');

  const hasData =
    data.weeklyFrequency.length > 0 ||
    data.volumeOverTime.length > 0 ||
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
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
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
      <TimeRangeDropdown selected={selectedRange} onChange={handleRangeChange} />
      <ContributionGrid workoutDays={data.workoutDays} streakWeeks={data.weeklyStreak} />
      <WorkoutFrequencySection data={data.weeklyFrequency} />
      <VolumeSection data={data.volumeOverTime} />
      {activeExercise && (
        <ExerciseSpotlightSection
          active={activeExercise}
          metric={spotlightMetric}
          onMetricChange={setSpotlightMetric}
          onPickExercise={() => setShowExercisePicker(true)}
        />
      )}
      <MuscleGroupSection
        data={data.muscleGroupSplit}
        exerciseBreakdown={data.muscleGroupExercises}
      />
      <PersonalRecordsSection data={data.personalRecords} />
      <DurationTrendSection data={data.durationTrend} />

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleExerciseSelect}
        selectedExerciseId={selectedExerciseId}
      />
    </ScrollView>
  );
}

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
    <View style={styles.dropdownContainer}>
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

/* ── Contribution Grid (streak calendar) ── */

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

function WorkoutFrequencySection({
  data,
}: {
  data: DashboardData['weeklyFrequency'];
}) {
  if (data.length === 0) return null;

  const barData = data.map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: '#4ECDC4',
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Workout Frequency" />
      <Text style={styles.chartSubtitle}>Workouts per period</Text>
      <View style={styles.chartContainer}>
        <BarChart
          {...TIME_BAR_PROPS}
          data={cloneData(barData)}
          barWidth={18}
          spacing={12}
          barBorderRadius={4}
          renderTooltip={(item: { value: number }) => (
            <View style={TOOLTIP_STYLE}>
              <Text style={styles.tooltipText}>{item.value} workouts</Text>
            </View>
          )}
        />
      </View>
    </Card>
  );
}

/* ── Volume Over Time ── */

function VolumeSection({ data }: { data: DashboardData['volumeOverTime'] }) {
  if (data.length === 0) return null;

  const lineData = data.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Total Volume" />
      <Text style={styles.chartSubtitle}>Weight x reps per session</Text>
      <View style={styles.chartContainer}>
        <LineChart
          {...TIME_LINE_PROPS}
          data={cloneData(lineData)}
          color="#FF6B6B"
          startFillColor="rgba(255,107,107,0.3)"
          endFillColor="rgba(255,107,107,0.01)"
          hideDataPoints={data.length > 12}
          dataPointsColor="#FF6B6B"
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#FF6B6B',
            radius: 5,
            pointerLabelWidth: 120,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value: number }[]) => (
              <View style={TOOLTIP_STYLE}>
                <Text style={styles.tooltipText}>{formatVolume(items[0]?.value ?? 0)} vol</Text>
              </View>
            ),
          }}
        />
      </View>
    </Card>
  );
}

/* ── Exercise Spotlight ── */

function ExerciseSpotlightSection({
  active,
  metric,
  onMetricChange,
  onPickExercise,
}: {
  active: ExerciseProgression;
  metric: SpotlightMetric;
  onMetricChange: (m: SpotlightMetric) => void;
  onPickExercise: () => void;
}) {
  const pointsMap: Record<SpotlightMetric, { label: string; value: number }[]> = {
    weight: active.weightPoints,
    volume: active.volumePoints,
    reps: active.repsPoints,
    '1rm': active.oneRMPoints,
  };
  const points = pointsMap[metric] ?? active.weightPoints;

  const lineData = points.map((p) => ({
    value: p.value,
    label: p.label,
  }));

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

  return (
    <Card style={styles.card}>
      <SectionTitle title="Exercise Spotlight" />

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

      <Text style={styles.chartSubtitle}>{subtitleMap[metric]}</Text>

      <View style={styles.chartContainer}>
        <LineChart
          {...TIME_LINE_PROPS}
          data={cloneData(lineData)}
          color="#FFEAA7"
          startFillColor="rgba(255,234,167,0.25)"
          endFillColor="rgba(255,234,167,0.01)"
          dataPointsColor="#FFEAA7"
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#FFEAA7',
            radius: 5,
            pointerLabelWidth: 120,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value: number }[]) => (
              <View style={TOOLTIP_STYLE}>
                <Text style={styles.tooltipText}>
                  {metric === 'volume'
                    ? formatVolume(items[0]?.value ?? 0)
                    : (items[0]?.value ?? 0)}
                  {tooltipSuffix[metric]}
                </Text>
              </View>
            ),
          }}
        />
      </View>
    </Card>
  );
}

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

  const pieData = data.map((d, idx) => ({
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

function DurationTrendSection({
  data,
}: {
  data: DashboardData['durationTrend'];
}) {
  if (data.length === 0) return null;

  const lineData = data.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Workout Duration" />
      <Text style={styles.chartSubtitle}>Avg minutes per period</Text>
      <View style={styles.chartContainer}>
        <LineChart
          {...TIME_LINE_PROPS}
          data={cloneData(lineData)}
          color="#45B7D1"
          startFillColor="rgba(69,183,209,0.3)"
          endFillColor="rgba(69,183,209,0.01)"
          dataPointsColor="#45B7D1"
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#45B7D1',
            radius: 5,
            pointerLabelWidth: 100,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value: number }[]) => (
              <View style={TOOLTIP_STYLE}>
                <Text style={styles.tooltipText}>{items[0]?.value ?? 0} min</Text>
              </View>
            ),
          }}
        />
      </View>
    </Card>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
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
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
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

  // Dropdown
  dropdownContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
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

  // Contribution grid
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

  // Exercise spotlight
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

  // Pie chart
  pieContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
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

  // PR cards
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
