import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { DashboardData, ExerciseProgression } from '../../services';
import { Card } from '../ui';
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
const CHART_WIDTH = SCREEN_WIDTH - 80;
const TIME_RANGES = [
  { label: '4W', value: 4 },
  { label: '8W', value: 8 },
  { label: '12W', value: 12 },
  { label: 'All', value: 0 },
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

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function Dashboard({ data, onRefresh, refreshing, onChangeWeeks }: DashboardProps) {
  const [selectedRange, setSelectedRange] = useState(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

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
      <TimeRangePicker selected={selectedRange} onChange={handleRangeChange} />
      <ContributionGrid workoutDays={data.workoutDays} streakWeeks={data.weeklyStreak} />
      <WorkoutFrequencySection data={data.weeklyFrequency} />
      <VolumeSection data={data.volumeOverTime} />
      {activeExercise && (
        <ExerciseSpotlightSection
          progressions={data.exerciseProgressions}
          active={activeExercise}
          onSelect={setSelectedExerciseId}
        />
      )}
      <MuscleGroupSection data={data.muscleGroupSplit} />
      <PersonalRecordsSection data={data.personalRecords} />
      <DurationTrendSection data={data.durationTrend} />
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
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

/* ── Time Range Picker ── */

function TimeRangePicker({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.rangeRow}>
      {TIME_RANGES.map((r) => (
        <TouchableOpacity
          key={r.value}
          style={[styles.rangeChip, selected === r.value && styles.rangeChipActive]}
          onPress={() => onChange(r.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.rangeChipText, selected === r.value && styles.rangeChipTextActive]}
          >
            {r.label}
          </Text>
        </TouchableOpacity>
      ))}
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
    label: d.label.replace(' ', '\n'),
    frontColor: '#4ECDC4',
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Workout Frequency" />
      <Text style={styles.chartSubtitle}>Workouts per week</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={cloneData(barData)}
          width={CHART_WIDTH}
          height={150}
          barWidth={18}
          spacing={12}
          noOfSections={4}
          barBorderRadius={4}
          yAxisTextStyle={styles.chartAxisLabel}
          xAxisLabelTextStyle={styles.chartAxisLabel}
          yAxisColor="transparent"
          xAxisColor={colors.border}
          hideRules
          isAnimated
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
    label: data.length > 10 ? '' : d.label.replace(' ', '\n'),
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Total Volume" />
      <Text style={styles.chartSubtitle}>Weight x reps per session</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={cloneData(lineData)}
          width={CHART_WIDTH}
          height={150}
          color="#FF6B6B"
          thickness={2}
          noOfSections={4}
          areaChart
          startFillColor="rgba(255,107,107,0.3)"
          endFillColor="rgba(255,107,107,0.01)"
          yAxisTextStyle={styles.chartAxisLabel}
          xAxisLabelTextStyle={styles.chartAxisLabel}
          yAxisColor="transparent"
          xAxisColor={colors.border}
          hideRules
          hideDataPoints={data.length > 12}
          dataPointsColor="#FF6B6B"
          curved
          isAnimated
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#FF6B6B',
            radius: 5,
            pointerLabelWidth: 120,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
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
  progressions,
  active,
  onSelect,
}: {
  progressions: ExerciseProgression[];
  active: ExerciseProgression;
  onSelect: (id: string) => void;
}) {
  const lineData = active.points.map((p) => ({
    value: p.value,
    label: active.points.length > 10 ? '' : p.label.replace(' ', '\n'),
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Exercise Spotlight" />
      <Text style={styles.chartSubtitle}>Max weight per session</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exerciseChipScroll}
        contentContainerStyle={styles.exerciseChipRow}
      >
        {progressions.map((ex) => (
          <TouchableOpacity
            key={ex.exerciseId}
            style={[
              styles.exerciseChip,
              ex.exerciseId === active.exerciseId && styles.exerciseChipActive,
            ]}
            onPress={() => onSelect(ex.exerciseId)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.exerciseChipText,
                ex.exerciseId === active.exerciseId && styles.exerciseChipTextActive,
              ]}
              numberOfLines={1}
            >
              {ex.exerciseName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chartContainer}>
        <LineChart
          data={cloneData(lineData)}
          width={CHART_WIDTH}
          height={150}
          color="#FFEAA7"
          thickness={2}
          noOfSections={4}
          areaChart
          startFillColor="rgba(255,234,167,0.25)"
          endFillColor="rgba(255,234,167,0.01)"
          yAxisTextStyle={styles.chartAxisLabel}
          xAxisLabelTextStyle={styles.chartAxisLabel}
          yAxisColor="transparent"
          xAxisColor={colors.border}
          hideRules
          dataPointsColor="#FFEAA7"
          curved
          isAnimated
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#FFEAA7',
            radius: 5,
            pointerLabelWidth: 100,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
            pointerLabelComponent: (items: { value: number }[]) => (
              <View style={TOOLTIP_STYLE}>
                <Text style={styles.tooltipText}>{items[0]?.value ?? 0} lbs</Text>
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
}: {
  data: DashboardData['muscleGroupSplit'];
}) {
  if (data.length === 0) return null;

  const pieData = data.map((d) => ({
    value: d.value,
    color: d.color,
    text: `${d.value}%`,
    textColor: '#fff',
    textSize: 10,
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
    label: d.label.replace(' ', '\n'),
  }));

  return (
    <Card style={styles.card}>
      <SectionTitle title="Workout Duration" />
      <Text style={styles.chartSubtitle}>Avg minutes per week</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={cloneData(lineData)}
          width={CHART_WIDTH}
          height={150}
          color="#45B7D1"
          thickness={2}
          noOfSections={4}
          areaChart
          startFillColor="rgba(69,183,209,0.3)"
          endFillColor="rgba(69,183,209,0.01)"
          yAxisTextStyle={styles.chartAxisLabel}
          xAxisLabelTextStyle={styles.chartAxisLabel}
          yAxisColor="transparent"
          xAxisColor={colors.border}
          hideRules
          dataPointsColor="#45B7D1"
          curved
          isAnimated
          pointerConfig={{
            pointerStripColor: 'rgba(255,255,255,0.15)',
            pointerStripWidth: 1,
            pointerColor: '#45B7D1',
            radius: 5,
            pointerLabelWidth: 100,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  chartAxisLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fonts.light,
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Hero stats
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

  // Time range picker
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rangeChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  rangeChipText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  rangeChipTextActive: {
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
  exerciseChipScroll: {
    marginBottom: spacing.md,
    maxHeight: 36,
  },
  exerciseChipRow: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  exerciseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseChipActive: {
    backgroundColor: '#FFEAA7',
    borderColor: '#FFEAA7',
  },
  exerciseChipText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  exerciseChipTextActive: {
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
