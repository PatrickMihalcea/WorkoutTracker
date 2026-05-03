import { supabase } from './supabase';
import {
  BodyMeasurement,
  HeightUnit,
  MeasurementMetricKey,
  MeasurementValueColumn,
  MuscleGroup,
  WeightUnit,
  BODY_MEASUREMENT_METRICS,
} from '../models';
import { cmToIn, kgToLbs } from '../utils/units';
import { targetRepsForVolume } from '../utils/routineTargets';

export interface PRRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface SummaryStats {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  avgDuration: number;
}

export type Granularity = 'day' | 'week' | 'month';

export interface TimeSeriesPoint {
  key: string;
  label: string;
  value: number;
  date: number;
  target?: number;
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string | null;
  weightPoints: TimeSeriesPoint[];
  volumePoints: TimeSeriesPoint[];
  repsPoints: TimeSeriesPoint[];
  oneRMPoints: TimeSeriesPoint[];
  durationPoints: TimeSeriesPoint[];
  distancePoints: TimeSeriesPoint[];
  pacePoints: TimeSeriesPoint[];
}

export interface DashboardData {
  summaryStats: SummaryStats;
  granularity: Granularity;
  frequency: TimeSeriesPoint[];
  volume: TimeSeriesPoint[];
  muscleGroupSplit: { label: string; value: number; color: string }[];
  muscleGroupExercises: Record<string, { label: string; value: number; color: string }[]>;
  personalRecords: PRRecord[];
  duration: TimeSeriesPoint[];
  weeklyStreak: { weekLabel: string; completed: boolean }[];
  workoutDays: string[];
  exerciseProgressions: ExerciseProgression[];
  measurementSeries: Record<MeasurementMetricKey, TimeSeriesPoint[]>;
}

export interface SummaryData {
  summaryStats: SummaryStats;
  muscleGroupSplit: { label: string; value: number; color: string }[];
  muscleGroupExercises: Record<string, { label: string; value: number; color: string }[]>;
  personalRecords: PRRecord[];
  weeklyStreak: { weekLabel: string; completed: boolean }[];
  workoutDays: string[];
}

export interface TimeSeriesWindowData {
  frequency: TimeSeriesPoint[];
  volume: TimeSeriesPoint[];
  duration: TimeSeriesPoint[];
  exerciseProgressions: ExerciseProgression[];
}

export interface RoutineChartData {
  volume: TimeSeriesPoint[];
  reps: TimeSeriesPoint[];
  duration: TimeSeriesPoint[];
}

export const EARLIEST_DATE = '2016-01-01';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  [MuscleGroup.Chest]: '#FF6B6B',
  [MuscleGroup.UpperChest]: '#FF8787',
  [MuscleGroup.Back]: '#4ECDC4',
  [MuscleGroup.UpperBack]: '#58B9B0',
  [MuscleGroup.LowerBack]: '#3E9D95',
  [MuscleGroup.Shoulders]: '#45B7D1',
  deltoids: '#5AC4DE',
  [MuscleGroup.Biceps]: '#96CEB4',
  [MuscleGroup.Triceps]: '#FFEAA7',
  [MuscleGroup.Quads]: '#DDA0DD',
  quadriceps: '#CC8BCF',
  [MuscleGroup.Hamstrings]: '#98D8C8',
  hamstring: '#86C7B7',
  [MuscleGroup.Glutes]: '#F7DC6F',
  gluteal: '#E9CD5E',
  [MuscleGroup.Calves]: '#BB8FCE',
  [MuscleGroup.Abs]: '#F0B27A',
  [MuscleGroup.Obliques]: '#E1A269',
  [MuscleGroup.Forearms]: '#AED6F1',
  forearm: '#9EC5E1',
  [MuscleGroup.Traps]: '#D5DBDB',
  trapezius: '#BCC3C3',
  [MuscleGroup.Tibialis]: '#BDB76B',
  [MuscleGroup.Adductors]: '#C7B299',
  [MuscleGroup.Neck]: '#A9A9A9',
  [MuscleGroup.Head]: '#C0C0C0',
  [MuscleGroup.Knees]: '#8E9AAF',
  [MuscleGroup.Hands]: '#C9A66B',
  [MuscleGroup.Feet]: '#8FA8A1',
  [MuscleGroup.Ankles]: '#95A5A6',
  [MuscleGroup.Cardio]: '#7EC8E3',
  [MuscleGroup.FullBody]: '#82E0AA',
};

const EXERCISE_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F0B27A',
  '#AED6F1', '#D5DBDB', '#82E0AA', '#F1948A', '#AED581',
];

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  d.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  return getDayKey(d);
}

function getMonthKey(date: Date): string {
  const d = new Date(date);
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatWeekLabel(weekKey: string): string {
  const [y, m, day] = weekKey.split('-').map(Number);
  const start = new Date(y, m - 1, day);
  const end = new Date(y, m - 1, day + 6);
  const sMonth = MONTH_NAMES[start.getMonth()];
  const eMonth = MONTH_NAMES[end.getMonth()];
  if (sMonth === eMonth) {
    return `${sMonth} ${start.getDate()}-${end.getDate()}`;
  }
  return `${sMonth} ${start.getDate()}-${eMonth} ${end.getDate()}`;
}

function getDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
}

function getBucketKey(date: Date, granularity: Granularity): string {
  if (granularity === 'day') return getDayKey(date);
  if (granularity === 'month') return getMonthKey(date);
  return getWeekKey(date);
}

function generateSkeleton(granularity: Granularity, weeks: number): TimeSeriesPoint[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const points: TimeSeriesPoint[] = [];

  const totalDays = weeks > 0 ? weeks * 7 : 365 * 10;
  const start = new Date(now);
  start.setDate(start.getDate() - totalDays);

  if (granularity === 'day') {
    const cursor = new Date(start);
    const endTime = now.getTime();
    while (cursor.getTime() <= endTime) {
      points.push({
        key: getDayKey(cursor),
        label: String(cursor.getDate()),
        value: 0,
        date: cursor.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (granularity === 'week') {
    const cursor = new Date(start);
    const dow = cursor.getDay();
    cursor.setDate(cursor.getDate() - dow + (dow === 0 ? -6 : 1));
    const endTime = now.getTime();
    while (cursor.getTime() <= endTime) {
      const key = getDayKey(cursor);
      const endDate = new Date(cursor);
      endDate.setDate(endDate.getDate() + 6);
      const sMonth = MONTH_NAMES[cursor.getMonth()];
      const eMonth = MONTH_NAMES[endDate.getMonth()];
      const label = sMonth === eMonth
        ? `${sMonth} ${cursor.getDate()}-${endDate.getDate()}`
        : `${sMonth} ${cursor.getDate()}-${eMonth} ${endDate.getDate()}`;
      points.push({ key, label, value: 0, date: cursor.getTime() });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endYear = now.getFullYear();
    const endMo = now.getMonth();
    while (cursor.getFullYear() < endYear || (cursor.getFullYear() === endYear && cursor.getMonth() <= endMo)) {
      const mo = cursor.getMonth();
      points.push({
        key: `${cursor.getFullYear()}-${mo < 9 ? '0' : ''}${mo + 1}`,
        label: MONTH_NAMES[mo],
        value: 0,
        date: cursor.getTime(),
      });
      cursor.setMonth(mo + 1);
    }
  }
  return points;
}

function generateSkeletonForRange(granularity: Granularity, rangeStart: Date, rangeEnd: Date): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(0, 0, 0, 0);

  if (granularity === 'day') {
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      points.push({
        key: getDayKey(cursor),
        label: String(cursor.getDate()),
        value: 0,
        date: cursor.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (granularity === 'week') {
    const cursor = new Date(start);
    const dow = cursor.getDay();
    cursor.setDate(cursor.getDate() - dow + (dow === 0 ? -6 : 1));
    while (cursor.getTime() <= end.getTime()) {
      const key = getDayKey(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const sMonth = MONTH_NAMES[cursor.getMonth()];
      const eMonth = MONTH_NAMES[weekEnd.getMonth()];
      const label = sMonth === eMonth
        ? `${sMonth} ${cursor.getDate()}-${weekEnd.getDate()}`
        : `${sMonth} ${cursor.getDate()}-${eMonth} ${weekEnd.getDate()}`;
      points.push({ key, label, value: 0, date: cursor.getTime() });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endYear = end.getFullYear();
    const endMo = end.getMonth();
    while (cursor.getFullYear() < endYear || (cursor.getFullYear() === endYear && cursor.getMonth() <= endMo)) {
      const mo = cursor.getMonth();
      points.push({
        key: `${cursor.getFullYear()}-${mo < 9 ? '0' : ''}${mo + 1}`,
        label: MONTH_NAMES[mo],
        value: 0,
        date: cursor.getTime(),
      });
      cursor.setMonth(mo + 1);
    }
  }
  return points;
}

function stampValues(skeleton: TimeSeriesPoint[], dataMap: Map<string, number>): TimeSeriesPoint[] {
  if (dataMap.size === 0) return skeleton;
  return skeleton.map((pt) => {
    const val = dataMap.get(pt.key);
    return val !== undefined ? { ...pt, value: val } : pt;
  });
}

function stampValuesAvg(
  skeleton: TimeSeriesPoint[],
  dataMap: Map<string, { total: number; count: number }>,
  precision: number = 0,
): TimeSeriesPoint[] {
  if (dataMap.size === 0) return skeleton;
  return skeleton.map((pt) => {
    const entry = dataMap.get(pt.key);
    return entry ? { ...pt, value: roundTo(entry.total / entry.count, precision) } : pt;
  });
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function keyToLabel(key: string, granularity: Granularity): string {
  if (granularity === 'day') return String(Number(key.slice(8)));
  if (granularity === 'month') return MONTH_NAMES[Number(key.slice(5, 7)) - 1];
  return formatWeekLabel(key);
}

function keyToDate(key: string, granularity: Granularity): number {
  if (granularity === 'month') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).getTime();
  }
  return new Date(key + 'T00:00:00').getTime();
}

function mapToPoints(dataMap: Map<string, number>, granularity: Granularity): TimeSeriesPoint[] {
  return [...dataMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => ({
      key,
      label: keyToLabel(key, granularity),
      value,
      date: keyToDate(key, granularity),
    }));
}

function mapToPointsAvg(
  dataMap: Map<string, { total: number; count: number }>,
  granularity: Granularity,
  precision: number = 0,
): TimeSeriesPoint[] {
  return [...dataMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, entry]) => ({
      key,
      label: keyToLabel(key, granularity),
      value: roundTo(entry.total / entry.count, precision),
      date: keyToDate(key, granularity),
    }));
}

const SESSION_SELECT = 'id, routine_day_id, started_at, completed_at, status, sets:set_logs(weight, reps_performed, rir, duration, distance, exercise_id, exercise:exercises(name, muscle_group, exercise_type, secondary_muscles))';
const BODY_MEASUREMENT_SELECT = ['logged_on', ...BODY_MEASUREMENT_METRICS.map((m) => m.column)].join(', ');

type RawMeasurement = Pick<BodyMeasurement, 'logged_on' | MeasurementValueColumn>;

function emptyMeasurementSeries(): Record<MeasurementMetricKey, TimeSeriesPoint[]> {
  const out = {} as Record<MeasurementMetricKey, TimeSeriesPoint[]>;
  for (const metric of BODY_MEASUREMENT_METRICS) {
    out[metric.key] = [];
  }
  return out;
}

function convertMeasurementForUnits(
  value: number,
  unitKind: 'weight' | 'circumference' | 'percent',
  wUnit: WeightUnit,
  hUnit: HeightUnit,
): number {
  if (unitKind === 'weight') {
    return wUnit === 'lbs' ? roundTo(kgToLbs(value), 1) : roundTo(value, 1);
  }
  if (unitKind === 'circumference') {
    return hUnit === 'in' ? roundTo(cmToIn(value), 1) : roundTo(value, 1);
  }
  return roundTo(value, 1);
}

function buildMeasurementSeriesRaw(
  rows: RawMeasurement[],
  wUnit: WeightUnit,
  hUnit: HeightUnit,
): Record<MeasurementMetricKey, TimeSeriesPoint[]> {
  const out = emptyMeasurementSeries();

  for (const row of rows) {
    const date = new Date(`${row.logged_on}T00:00:00`);
    const label = `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
    const ts = date.getTime();

    for (const metric of BODY_MEASUREMENT_METRICS) {
      const rawValue = row[metric.column];
      if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue) || rawValue < 0) continue;
      const value = convertMeasurementForUnits(rawValue, metric.unitKind, wUnit, hUnit);
      out[metric.key].push({
        key: row.logged_on,
        label,
        value,
        date: ts,
      });
    }
  }

  return out;
}

function buildMeasurementSeriesAggregated(
  rows: RawMeasurement[],
  granularity: Granularity,
  skeleton: TimeSeriesPoint[] | null,
  wUnit: WeightUnit,
  hUnit: HeightUnit,
): Record<MeasurementMetricKey, TimeSeriesPoint[]> {
  const out = emptyMeasurementSeries();
  const maps = new Map<MeasurementMetricKey, Map<string, { total: number; count: number }>>();

  for (const metric of BODY_MEASUREMENT_METRICS) {
    maps.set(metric.key, new Map());
  }

  for (const row of rows) {
    const date = new Date(`${row.logged_on}T00:00:00`);
    const bucket = getBucketKey(date, granularity);

    for (const metric of BODY_MEASUREMENT_METRICS) {
      const rawValue = row[metric.column];
      if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue) || rawValue < 0) continue;
      const value = convertMeasurementForUnits(rawValue, metric.unitKind, wUnit, hUnit);
      const map = maps.get(metric.key)!;
      const existing = map.get(bucket) ?? { total: 0, count: 0 };
      existing.total += value;
      existing.count += 1;
      map.set(bucket, existing);
    }
  }

  for (const metric of BODY_MEASUREMENT_METRICS) {
    const map = maps.get(metric.key)!;
    out[metric.key] = skeleton
      ? stampValuesAvg(skeleton, map, 1)
      : mapToPointsAvg(map, granularity, 1);
  }

  return out;
}

async function fetchMeasurementRows(userId: string, weeks: number): Promise<RawMeasurement[]> {
  let query = supabase
    .from('body_measurements')
    .select(BODY_MEASUREMENT_SELECT)
    .eq('user_id', userId)
    .order('logged_on', { ascending: true })
    .order('created_at', { ascending: true });

  if (weeks > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    query = query.gte('logged_on', cutoff.toISOString().split('T')[0]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RawMeasurement[];
}

type RoutineMetricTargets = {
  volume: number;
  reps: number;
  duration: number;
};

type RoutineDayTargetRow = {
  id: string;
  exercises: {
    target_sets: number;
    target_reps: number;
    sets: {
      target_weight: number;
      target_reps_min: number;
      target_reps_max: number;
      target_duration: number;
    }[] | null;
  }[] | null;
};

function convertWeightForDisplay(weightKg: number, wUnit: WeightUnit): number {
  if (wUnit === 'lbs') return Math.round(kgToLbs(weightKg) * 10) / 10;
  return weightKg;
}

function computeRoutineDayMetricTargets(day: RoutineDayTargetRow, wUnit: WeightUnit): RoutineMetricTargets {
  let reps = 0;
  let volume = 0;
  let duration = 0;

  for (const ex of day.exercises ?? []) {
    const setTemplates = ex.sets ?? [];

    if (setTemplates.length > 0) {
      for (const set of setTemplates) {
        const targetReps = targetRepsForVolume(set, ex.target_reps);
        reps += targetReps;
        volume += convertWeightForDisplay(set.target_weight ?? 0, wUnit) * targetReps;
        duration += (set.target_duration ?? 0) / 60;
      }
      continue;
    }

    const fallbackReps = ex.target_reps > 0 ? ex.target_reps : 0;
    const fallbackSets = ex.target_sets > 0 ? ex.target_sets : 0;
    reps += fallbackReps * fallbackSets;
  }

  return {
    volume: Math.round(volume),
    reps: Math.round(reps),
    duration: Math.round(duration),
  };
}

async function fetchRoutineDayTargets(dayIds: string[], wUnit: WeightUnit): Promise<Map<string, RoutineMetricTargets>> {
  const uniqueDayIds = [...new Set(dayIds.filter(Boolean))];
  if (uniqueDayIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('routine_days')
    .select(`
      id,
      exercises:routine_day_exercises (
        target_sets,
        target_reps,
        sets:routine_day_exercise_sets (
          target_weight,
          target_reps_min,
          target_reps_max,
          target_duration
        )
      )
    `)
    .in('id', uniqueDayIds);

  if (error) throw error;

  const out = new Map<string, RoutineMetricTargets>();
  for (const day of (data ?? []) as unknown as RoutineDayTargetRow[]) {
    out.set(day.id, computeRoutineDayMetricTargets(day, wUnit));
  }
  return out;
}

function attachRoutineTargets(
  points: TimeSeriesPoint[],
  sessions: RawSession[],
  metric: keyof RoutineMetricTargets,
  granularity: Granularity,
  raw: boolean,
  dayTargetsById: Map<string, RoutineMetricTargets>,
): TimeSeriesPoint[] {
  if (points.length === 0 || sessions.length === 0 || dayTargetsById.size === 0) return points;

  const targetByPointKey = new Map<string, number>();
  for (const session of sessions) {
    if (!session.routine_day_id) continue;

    const dayTargets = dayTargetsById.get(session.routine_day_id);
    if (!dayTargets) continue;

    const target = dayTargets[metric];
    if (target <= 0) continue;

    const key = raw
      ? session.started_at
      : getBucketKey(new Date(session.started_at), granularity);
    targetByPointKey.set(key, (targetByPointKey.get(key) ?? 0) + target);
  }

  return points.map((point) => {
    const target = targetByPointKey.get(point.key);
    if (!target || target <= 0) return point;
    return { ...point, target: Math.round(target) };
  });
}

function buildRoutineChartData(
  rawData: RawSession[] | null,
  weeks: number,
  granularity: Granularity,
  raw: boolean,
  wUnit: WeightUnit,
  dayTargetsById: Map<string, RoutineMetricTargets> = new Map(),
): RoutineChartData {
  if (!rawData || rawData.length === 0) {
    return { volume: [], reps: [], duration: [] };
  }

  const sessions = convertSessionWeights(rawData, wUnit);

  if (raw) {
    const volume = computeVolumeRaw(sessions);
    const reps = computeRepsRaw(sessions);

    return {
      volume: attachRoutineTargets(volume, sessions, 'volume', granularity, true, dayTargetsById),
      reps: attachRoutineTargets(reps, sessions, 'reps', granularity, true, dayTargetsById),
      duration: computeDurationRaw(sessions),
    };
  }

  const skeleton = weeks > 0 ? generateSkeleton(granularity, weeks) : null;
  const volume = computeVolume(sessions, granularity, skeleton);
  const reps = computeReps(sessions, granularity, skeleton);

  return {
    volume: attachRoutineTargets(volume, sessions, 'volume', granularity, false, dayTargetsById),
    reps: attachRoutineTargets(reps, sessions, 'reps', granularity, false, dayTargetsById),
    duration: computeDuration(sessions, granularity, skeleton),
  };
}

export const dashboardService = {
  async getDashboardData(
    userId: string,
    weeks: number = 0,
    granularity: Granularity = 'week',
    wUnit: WeightUnit = 'kg',
    hUnit: HeightUnit = 'cm',
  ): Promise<DashboardData> {
    let query = supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true });

    if (weeks > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - weeks * 7);
      query = query.gte('started_at', cutoff.toISOString());
    }

    const [sessionRes, measurementRows] = await Promise.all([
      query,
      fetchMeasurementRows(userId, weeks),
    ]);

    const { data: rawData, error } = sessionRes;

    if (error) throw error;
    if ((!rawData || rawData.length === 0) && measurementRows.length === 0) return emptyDashboard(granularity);

    const sessions = rawData ? convertSessionWeights(rawData as unknown as RawSession[], wUnit) : [];

    const skeleton = weeks > 0 ? generateSkeleton(granularity, weeks) : null;
    const measurementSeries = buildMeasurementSeriesAggregated(measurementRows, granularity, skeleton, wUnit, hUnit);

    return {
      summaryStats: computeSummaryStats(sessions),
      granularity,
      frequency: computeFrequency(sessions, granularity, skeleton),
      volume: computeVolume(sessions, granularity, skeleton),
      muscleGroupSplit: computeMuscleGroupSplit(sessions),
      muscleGroupExercises: computeMuscleGroupExercises(sessions),
      personalRecords: computePersonalRecords(sessions),
      duration: computeDuration(sessions, granularity, skeleton),
      weeklyStreak: computeWeeklyStreak(sessions),
      workoutDays: computeWorkoutDays(sessions),
      exerciseProgressions: computeExerciseProgressions(sessions, granularity, skeleton),
      measurementSeries,
    };
  },

  async getDashboardDataRaw(
    userId: string,
    weeks: number = 0,
    wUnit: WeightUnit = 'kg',
    hUnit: HeightUnit = 'cm',
  ): Promise<DashboardData> {
    let query = supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true });

    if (weeks > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - weeks * 7);
      query = query.gte('started_at', cutoff.toISOString());
    }

    const [sessionRes, measurementRows] = await Promise.all([
      query,
      fetchMeasurementRows(userId, weeks),
    ]);

    const { data: rawData, error } = sessionRes;

    if (error) throw error;
    if ((!rawData || rawData.length === 0) && measurementRows.length === 0) return emptyDashboard('day');

    const sessions = rawData ? convertSessionWeights(rawData as unknown as RawSession[], wUnit) : [];
    const measurementSeries = buildMeasurementSeriesRaw(measurementRows, wUnit, hUnit);

    return {
      summaryStats: computeSummaryStats(sessions),
      granularity: 'day',
      frequency: [],
      volume: computeVolumeRaw(sessions),
      muscleGroupSplit: computeMuscleGroupSplit(sessions),
      muscleGroupExercises: computeMuscleGroupExercises(sessions),
      personalRecords: computePersonalRecords(sessions),
      duration: computeDurationRaw(sessions),
      weeklyStreak: computeWeeklyStreak(sessions),
      workoutDays: computeWorkoutDays(sessions),
      exerciseProgressions: computeExerciseProgressionsRaw(sessions),
      measurementSeries,
    };
  },

  async getSummaryData(userId: string, wUnit: WeightUnit = 'kg'): Promise<SummaryData> {
    const { data: rawData, error } = await supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true });

    if (error) throw error;
    if (!rawData || rawData.length === 0) return emptySummary();

    const sessions = convertSessionWeights(rawData as unknown as RawSession[], wUnit);

    return {
      summaryStats: computeSummaryStats(sessions),
      muscleGroupSplit: computeMuscleGroupSplit(sessions),
      muscleGroupExercises: computeMuscleGroupExercises(sessions),
      personalRecords: computePersonalRecords(sessions),
      weeklyStreak: computeWeeklyStreak(sessions),
      workoutDays: computeWorkoutDays(sessions),
    };
  },

  async getRoutineChartData(
    userId: string,
    routineId: string,
    weeks: number = 0,
    granularity: Granularity = 'week',
    raw: boolean = false,
    wUnit: WeightUnit = 'kg',
  ): Promise<RoutineChartData> {
    const { data: days, error: dayErr } = await supabase
      .from('routine_days')
      .select('id')
      .eq('routine_id', routineId);

    if (dayErr) throw dayErr;
    if (!days || days.length === 0) return { volume: [], reps: [], duration: [] };

    const dayIds = days.map((d) => d.id);
    let dayTargetsById = new Map<string, RoutineMetricTargets>();
    try {
      dayTargetsById = await fetchRoutineDayTargets(dayIds, wUnit);
    } catch {
      dayTargetsById = new Map();
    }

    let query = supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('routine_day_id', dayIds)
      .order('started_at', { ascending: true });

    if (weeks > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - weeks * 7);
      query = query.gte('started_at', cutoff.toISOString());
    }

    const { data: rawData, error } = await query;

    if (error) throw error;
    return buildRoutineChartData(
      rawData as unknown as RawSession[] | null,
      weeks,
      granularity,
      raw,
      wUnit,
      dayTargetsById,
    );
  },

  async getRoutineDayChartData(
    userId: string,
    dayId: string,
    weeks: number = 0,
    granularity: Granularity = 'week',
    raw: boolean = false,
    wUnit: WeightUnit = 'kg',
  ): Promise<RoutineChartData> {
    let query = supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('routine_day_id', dayId)
      .order('started_at', { ascending: true });

    if (weeks > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - weeks * 7);
      query = query.gte('started_at', cutoff.toISOString());
    }

    const { data: rawData, error } = await query;

    if (error) throw error;
    let dayTargetsById = new Map<string, RoutineMetricTargets>();
    try {
      dayTargetsById = await fetchRoutineDayTargets([dayId], wUnit);
    } catch {
      dayTargetsById = new Map();
    }

    return buildRoutineChartData(
      rawData as unknown as RawSession[] | null,
      weeks,
      granularity,
      raw,
      wUnit,
      dayTargetsById,
    );
  },

  async getTimeSeriesWindow(
    userId: string,
    granularity: Granularity,
    startDate: string,
    endDate: string,
  ): Promise<TimeSeriesWindowData> {
    const clampedStart = startDate < EARLIEST_DATE ? EARLIEST_DATE : startDate;

    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', clampedStart)
      .lte('started_at', endDate)
      .order('started_at', { ascending: true });

    if (error) throw error;

    const skeleton = generateSkeletonForRange(
      granularity,
      new Date(clampedStart),
      new Date(endDate),
    );
    const safeSessions = (sessions ?? []) as unknown as RawSession[];

    return {
      frequency: computeFrequency(safeSessions, granularity, skeleton),
      volume: computeVolume(safeSessions, granularity, skeleton),
      duration: computeDuration(safeSessions, granularity, skeleton),
      exerciseProgressions: computeExerciseProgressions(safeSessions, granularity, skeleton),
    };
  },
};

function emptyDashboard(granularity: Granularity = 'week'): DashboardData {
  return {
    summaryStats: { totalWorkouts: 0, currentStreak: 0, totalVolume: 0, avgDuration: 0 },
    granularity,
    frequency: [],
    volume: [],
    muscleGroupSplit: [],
    muscleGroupExercises: {},
    personalRecords: [],
    duration: [],
    weeklyStreak: [],
    workoutDays: [],
    exerciseProgressions: [],
    measurementSeries: emptyMeasurementSeries(),
  };
}

function emptySummary(): SummaryData {
  return {
    summaryStats: { totalWorkouts: 0, currentStreak: 0, totalVolume: 0, avgDuration: 0 },
    muscleGroupSplit: [],
    muscleGroupExercises: {},
    personalRecords: [],
    weeklyStreak: [],
    workoutDays: [],
  };
}

type RawSession = {
  id: string;
  routine_day_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  sets: {
    weight: number;
    reps_performed: number;
    rir: number | null;
    duration: number;
    distance: number;
    exercise_id: string;
    exercise: { name: string; muscle_group: string; exercise_type?: string } | null;
  }[];
};

function estimateOneRepFromSet(set: RawSession['sets'][number]): number {
  const effectiveReps = set.reps_performed + (set.rir ?? 0);
  if (effectiveReps < 0) return 0;
  // Assisted load is inverse: lower assistance at 1 rep is better.
  if (set.exercise?.exercise_type === 'assisted_bodyweight') {
    return Math.round(set.weight / (1 + effectiveReps / 30));
  }
  return Math.round(set.weight * (1 + effectiveReps / 30));
}

function convertSessionWeights(sessions: RawSession[], wUnit: WeightUnit): RawSession[] {
  if (wUnit === 'kg') return sessions;
  return sessions.map((s) => ({
    ...s,
    sets: s.sets.map((set) => ({
      ...set,
      weight: Math.round(kgToLbs(set.weight) * 10) / 10,
    })),
  }));
}

function computeSummaryStats(sessions: RawSession[]): SummaryStats {
  const totalWorkouts = sessions.length;

  let totalVolume = 0;
  let totalDuration = 0;
  let durationCount = 0;
  for (const s of sessions) {
    for (const set of s.sets) {
      totalVolume += set.weight * set.reps_performed;
    }
    if (s.completed_at) {
      const mins = (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
      if (mins > 0 && mins < 300) {
        totalDuration += mins;
        durationCount++;
      }
    }
  }

  const streak = computeWeeklyStreak(sessions);
  let currentStreak = 0;
  for (let i = streak.length - 1; i >= 0; i--) {
    if (streak[i].completed) currentStreak++;
    else break;
  }

  return {
    totalWorkouts,
    currentStreak,
    totalVolume: Math.round(totalVolume),
    avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
  };
}

function computeFrequency(sessions: RawSession[], granularity: Granularity, skeleton: TimeSeriesPoint[] | null): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = getBucketKey(new Date(s.started_at), granularity);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return skeleton ? stampValues(skeleton, map) : mapToPoints(map, granularity);
}

function computeVolume(sessions: RawSession[], granularity: Granularity, skeleton: TimeSeriesPoint[] | null): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const vol = s.sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
    const key = getBucketKey(new Date(s.started_at), granularity);
    map.set(key, (map.get(key) ?? 0) + vol);
  }
  return skeleton ? stampValues(skeleton, map) : mapToPoints(map, granularity);
}

const EXCLUDED_MUSCLE_GROUPS = new Set(['unknown', 'full_body', 'cardio']);

function computeMuscleGroupSplit(sessions: RawSession[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const set of s.sets) {
      const group = set.exercise?.muscle_group ?? 'unknown';
      if (EXCLUDED_MUSCLE_GROUPS.has(group)) continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
      const secondary: string[] = (set.exercise as Record<string, unknown>)?.secondary_muscles as string[] ?? [];
      for (const sec of secondary) {
        if (EXCLUDED_MUSCLE_GROUPS.has(sec)) continue;
        counts.set(sec, (counts.get(sec) ?? 0) + 0.33);
      }
    }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({
      label: group.replace(/_/g, ' '),
      value: Math.round((count / total) * 100),
      color: MUSCLE_GROUP_COLORS[group] ?? '#888888',
    }));
}

function computeMuscleGroupExercises(sessions: RawSession[]): Record<string, { label: string; value: number; color: string }[]> {
  const groupExerciseCounts = new Map<string, Map<string, number>>();

  for (const s of sessions) {
    for (const set of s.sets) {
      if (!set.exercise) continue;
      const group = set.exercise.muscle_group;
      const name = set.exercise.name;
      if (!groupExerciseCounts.has(group)) {
        groupExerciseCounts.set(group, new Map());
      }
      const exerciseMap = groupExerciseCounts.get(group)!;
      exerciseMap.set(name, (exerciseMap.get(name) ?? 0) + 1);
    }
  }

  const result: Record<string, { label: string; value: number; color: string }[]> = {};
  for (const [group, exerciseMap] of groupExerciseCounts) {
    const total = [...exerciseMap.values()].reduce((a, b) => a + b, 0);
    const key = group.replace('_', ' ');
    result[key] = [...exerciseMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        label: name,
        value: Math.round((count / total) * 100),
        color: EXERCISE_PALETTE[i % EXERCISE_PALETTE.length],
      }));
  }
  return result;
}

function computePersonalRecords(sessions: RawSession[]): PRRecord[] {
  const prMap = new Map<string, PRRecord>();
  for (const s of sessions) {
    for (const set of s.sets) {
      if (!set.exercise) continue;
      const name = set.exercise.name;
      const existing = prMap.get(name);
      if (!existing || set.weight > existing.weight) {
        prMap.set(name, { exerciseName: name, weight: set.weight, reps: set.reps_performed, date: s.started_at });
      }
    }
  }
  return [...prMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 5);
}

function computeDuration(sessions: RawSession[], granularity: Granularity, skeleton: TimeSeriesPoint[] | null): TimeSeriesPoint[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const mins = (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    if (mins <= 0 || mins > 300) continue;
    const key = getBucketKey(new Date(s.started_at), granularity);
    const entry = map.get(key) ?? { total: 0, count: 0 };
    entry.total += mins;
    entry.count += 1;
    map.set(key, entry);
  }
  return skeleton ? stampValuesAvg(skeleton, map) : mapToPointsAvg(map, granularity);
}

function computeWeeklyStreak(sessions: RawSession[]) {
  const now = new Date();
  const weeks: { weekLabel: string; completed: boolean }[] = [];
  const sessionWeeks = new Set(sessions.map((s) => getWeekKey(new Date(s.started_at))));
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekKey = getWeekKey(d);
    weeks.push({ weekLabel: formatWeekLabel(weekKey), completed: sessionWeeks.has(weekKey) });
  }
  return weeks;
}

function computeWorkoutDays(sessions: RawSession[]): string[] {
  const days = new Set<string>();
  for (const s of sessions) {
    days.add(getDayKey(new Date(s.started_at)));
  }
  return [...days].sort();
}

function computeExerciseProgressions(sessions: RawSession[], granularity: Granularity, skeleton: TimeSeriesPoint[] | null): ExerciseProgression[] {
  const exerciseMap = new Map<string, {
    name: string;
    type: string | null;
    weight: Map<string, number>;
    volume: Map<string, number>;
    reps: Map<string, number>;
    oneRM: Map<string, number>;
    duration: Map<string, number>;
    distance: Map<string, number>;
    paceDuration: Map<string, number>;
    paceDistance: Map<string, number>;
  }>();

  for (const s of sessions) {
    const key = getBucketKey(new Date(s.started_at), granularity);

    for (const set of s.sets) {
      if (!set.exercise) continue;
      const id = set.exercise_id;
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, {
          name: set.exercise.name,
          type: set.exercise.exercise_type ?? null,
          weight: new Map(), volume: new Map(), reps: new Map(), oneRM: new Map(),
          duration: new Map(), distance: new Map(),
          paceDuration: new Map(), paceDistance: new Map(),
        });
      }
      const entry = exerciseMap.get(id)!;

      if (set.weight > 0) {
        const existingWeight = entry.weight.get(key) ?? 0;
        if (set.weight > existingWeight) entry.weight.set(key, set.weight);

        const existingVol = entry.volume.get(key) ?? 0;
        entry.volume.set(key, existingVol + set.weight * set.reps_performed);

        const estimated1RM = estimateOneRepFromSet(set);
        const existing1RM = entry.oneRM.get(key);
        if (set.exercise?.exercise_type === 'assisted_bodyweight') {
          if (existing1RM === undefined || estimated1RM < existing1RM) entry.oneRM.set(key, estimated1RM);
        } else if (estimated1RM > (existing1RM ?? 0)) {
          entry.oneRM.set(key, estimated1RM);
        }
      }

      if (set.reps_performed > 0) {
        const existingReps = entry.reps.get(key) ?? 0;
        entry.reps.set(key, existingReps + set.reps_performed);
      }

      if (set.duration > 0) {
        const existingDur = entry.duration.get(key) ?? 0;
        if (set.duration > existingDur) entry.duration.set(key, set.duration);
        entry.paceDuration.set(key, (entry.paceDuration.get(key) ?? 0) + set.duration);
      }

      if (set.distance > 0) {
        const existingDist = entry.distance.get(key) ?? 0;
        if (set.distance > existingDist) entry.distance.set(key, set.distance);
        entry.paceDistance.set(key, (entry.paceDistance.get(key) ?? 0) + set.distance);
      }
    }
  }

  const stamp = (map: Map<string, number>) =>
    skeleton ? stampValues(skeleton, map) : mapToPoints(map, granularity);

  return [...exerciseMap.entries()]
    .filter(([, v]) => {
      const hasWeightData = v.weight.size >= 2;
      const hasDurationData = v.duration.size >= 2;
      const hasDistanceData = v.distance.size >= 2;
      return hasWeightData || hasDurationData || hasDistanceData;
    })
    .map(([exerciseId, data]) => {
      const paceMap = new Map<string, number>();
      for (const [k, dur] of data.paceDuration.entries()) {
        const dist = data.paceDistance.get(k) ?? 0;
        if (dist > 0) paceMap.set(k, Math.round(dur / dist));
      }
      return {
        exerciseId,
        exerciseName: data.name,
        exerciseType: data.type,
        weightPoints: stamp(data.weight),
        volumePoints: stamp(data.volume),
        repsPoints: stamp(data.reps),
        oneRMPoints: stamp(data.oneRM),
        durationPoints: stamp(data.duration),
        distancePoints: stamp(data.distance),
        pacePoints: stamp(paceMap),
      };
    })
    .sort((a, b) => {
      const maxA = Math.max(0, ...a.weightPoints.map((p) => p.value), ...a.durationPoints.map((p) => p.value), ...a.distancePoints.map((p) => p.value));
      const maxB = Math.max(0, ...b.weightPoints.map((p) => p.value), ...b.durationPoints.map((p) => p.value), ...b.distancePoints.map((p) => p.value));
      return maxB - maxA;
    });
}

function sessionDateLabel(startedAt: string): string {
  const d = new Date(startedAt);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function computeReps(sessions: RawSession[], granularity: Granularity, skeleton: TimeSeriesPoint[] | null): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const reps = s.sets.reduce((sum, set) => sum + set.reps_performed, 0);
    const key = getBucketKey(new Date(s.started_at), granularity);
    map.set(key, (map.get(key) ?? 0) + reps);
  }
  return skeleton ? stampValues(skeleton, map) : mapToPoints(map, granularity);
}

function computeRepsRaw(sessions: RawSession[]): TimeSeriesPoint[] {
  return sessions.map((s) => {
    const reps = s.sets.reduce((sum, set) => sum + set.reps_performed, 0);
    const d = new Date(s.started_at);
    return {
      key: s.started_at,
      label: sessionDateLabel(s.started_at),
      value: reps,
      date: d.getTime(),
    };
  }).filter((p) => p.value > 0);
}

function computeVolumeRaw(sessions: RawSession[]): TimeSeriesPoint[] {
  return sessions.map((s) => {
    const vol = s.sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
    const d = new Date(s.started_at);
    return {
      key: s.started_at,
      label: sessionDateLabel(s.started_at),
      value: vol,
      date: d.getTime(),
    };
  }).filter((p) => p.value > 0);
}

function computeDurationRaw(sessions: RawSession[]): TimeSeriesPoint[] {
  return sessions
    .filter((s) => s.completed_at)
    .map((s) => {
      const mins = Math.round(
        (new Date(s.completed_at!).getTime() - new Date(s.started_at).getTime()) / 60000,
      );
      const d = new Date(s.started_at);
      return {
        key: s.started_at,
        label: sessionDateLabel(s.started_at),
        value: mins,
        date: d.getTime(),
      };
    })
    .filter((p) => p.value > 0 && p.value < 300);
}

function computeExerciseProgressionsRaw(sessions: RawSession[]): ExerciseProgression[] {
  const exerciseMap = new Map<string, {
    name: string;
    type: string | null;
    weight: TimeSeriesPoint[];
    volume: TimeSeriesPoint[];
    reps: TimeSeriesPoint[];
    oneRM: TimeSeriesPoint[];
    duration: TimeSeriesPoint[];
    distance: TimeSeriesPoint[];
    pace: TimeSeriesPoint[];
  }>();

  for (const s of sessions) {
    const ts = new Date(s.started_at).getTime();
    const label = sessionDateLabel(s.started_at);

    const sessionExercises = new Map<string, {
      maxWeight: number;
      totalVol: number;
      totalReps: number;
      best1RM: number;
      maxDuration: number;
      maxDistance: number;
      totalDuration: number;
      totalDistance: number;
      name: string;
      type: string | null;
    }>();

    for (const set of s.sets) {
      if (!set.exercise) continue;
      const id = set.exercise_id;
      const existing = sessionExercises.get(id) ?? {
        maxWeight: 0, totalVol: 0, totalReps: 0, best1RM: 0,
        maxDuration: 0, maxDistance: 0, totalDuration: 0, totalDistance: 0,
        name: set.exercise.name, type: set.exercise.exercise_type ?? null,
      };

      if (set.weight > 0) {
        existing.maxWeight = Math.max(existing.maxWeight, set.weight);
        existing.totalVol += set.weight * set.reps_performed;
        const est1RM = estimateOneRepFromSet(set);
        if (set.exercise?.exercise_type === 'assisted_bodyweight') {
          existing.best1RM = existing.best1RM > 0 ? Math.min(existing.best1RM, est1RM) : est1RM;
        } else {
          existing.best1RM = Math.max(existing.best1RM, est1RM);
        }
      }
      if (set.reps_performed > 0) existing.totalReps += set.reps_performed;
      if (set.duration > 0) {
        existing.maxDuration = Math.max(existing.maxDuration, set.duration);
        existing.totalDuration += set.duration;
      }
      if (set.distance > 0) {
        existing.maxDistance = Math.max(existing.maxDistance, set.distance);
        existing.totalDistance += set.distance;
      }
      sessionExercises.set(id, existing);
    }

    for (const [id, ex] of sessionExercises) {
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, { name: ex.name, type: ex.type, weight: [], volume: [], reps: [], oneRM: [], duration: [], distance: [], pace: [] });
      }
      const entry = exerciseMap.get(id)!;
      const pt = (v: number): TimeSeriesPoint => ({ key: s.started_at, label, value: v, date: ts });
      entry.weight.push(pt(ex.maxWeight));
      entry.volume.push(pt(ex.totalVol));
      entry.reps.push(pt(ex.totalReps));
      entry.oneRM.push(pt(ex.best1RM));
      entry.duration.push(pt(ex.maxDuration));
      entry.distance.push(pt(ex.maxDistance));
      const pace = ex.totalDistance > 0 ? Math.round(ex.totalDuration / ex.totalDistance) : 0;
      entry.pace.push(pt(pace));
    }
  }

  return [...exerciseMap.entries()]
    .filter(([, v]) => {
      return v.weight.filter((p) => p.value > 0).length >= 2
        || v.duration.filter((p) => p.value > 0).length >= 2
        || v.distance.filter((p) => p.value > 0).length >= 2;
    })
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.name,
      exerciseType: data.type,
      weightPoints: data.weight,
      volumePoints: data.volume,
      repsPoints: data.reps,
      oneRMPoints: data.oneRM,
      durationPoints: data.duration,
      distancePoints: data.distance,
      pacePoints: data.pace,
    }))
    .sort((a, b) => {
      const maxA = Math.max(0, ...a.weightPoints.map((p) => p.value), ...a.durationPoints.map((p) => p.value), ...a.distancePoints.map((p) => p.value));
      const maxB = Math.max(0, ...b.weightPoints.map((p) => p.value), ...b.durationPoints.map((p) => p.value), ...b.distancePoints.map((p) => p.value));
      return maxB - maxA;
    });
}
