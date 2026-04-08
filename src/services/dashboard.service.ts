import { supabase } from './supabase';
import { MuscleGroup, WeightUnit } from '../models';
import { kgToLbs } from '../utils/units';

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
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  weightPoints: TimeSeriesPoint[];
  volumePoints: TimeSeriesPoint[];
  repsPoints: TimeSeriesPoint[];
  oneRMPoints: TimeSeriesPoint[];
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
  [MuscleGroup.Back]: '#4ECDC4',
  [MuscleGroup.Shoulders]: '#45B7D1',
  [MuscleGroup.Biceps]: '#96CEB4',
  [MuscleGroup.Triceps]: '#FFEAA7',
  [MuscleGroup.Quads]: '#DDA0DD',
  [MuscleGroup.Hamstrings]: '#98D8C8',
  [MuscleGroup.Glutes]: '#F7DC6F',
  [MuscleGroup.Calves]: '#BB8FCE',
  [MuscleGroup.Abs]: '#F0B27A',
  [MuscleGroup.Forearms]: '#AED6F1',
  [MuscleGroup.Traps]: '#D5DBDB',
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

function stampValuesAvg(skeleton: TimeSeriesPoint[], dataMap: Map<string, { total: number; count: number }>): TimeSeriesPoint[] {
  if (dataMap.size === 0) return skeleton;
  return skeleton.map((pt) => {
    const entry = dataMap.get(pt.key);
    return entry ? { ...pt, value: Math.round(entry.total / entry.count) } : pt;
  });
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

function mapToPointsAvg(dataMap: Map<string, { total: number; count: number }>, granularity: Granularity): TimeSeriesPoint[] {
  return [...dataMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, entry]) => ({
      key,
      label: keyToLabel(key, granularity),
      value: Math.round(entry.total / entry.count),
      date: keyToDate(key, granularity),
    }));
}

const SESSION_SELECT = 'id, started_at, completed_at, status, sets:set_logs(weight, reps_performed, rir, exercise_id, exercise:exercises(name, muscle_group))';

export const dashboardService = {
  async getDashboardData(userId: string, weeks: number = 0, granularity: Granularity = 'week', wUnit: WeightUnit = 'kg'): Promise<DashboardData> {
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

    const { data: rawData, error } = await query;

    if (error) throw error;
    if (!rawData || rawData.length === 0) return emptyDashboard(granularity);

    const sessions = convertSessionWeights(rawData as unknown as RawSession[], wUnit);

    const skeleton = weeks > 0 ? generateSkeleton(granularity, weeks) : null;

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
    };
  },

  async getDashboardDataRaw(userId: string, weeks: number = 0, wUnit: WeightUnit = 'kg'): Promise<DashboardData> {
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

    const { data: rawData, error } = await query;

    if (error) throw error;
    if (!rawData || rawData.length === 0) return emptyDashboard('day');

    const sessions = convertSessionWeights(rawData as unknown as RawSession[], wUnit);

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
    if (!rawData || rawData.length === 0) return { volume: [], reps: [], duration: [] };

    const sessions = convertSessionWeights(rawData as unknown as RawSession[], wUnit);

    if (raw) {
      return {
        volume: computeVolumeRaw(sessions),
        reps: computeRepsRaw(sessions),
        duration: computeDurationRaw(sessions),
      };
    }

    const skeleton = weeks > 0 ? generateSkeleton(granularity, weeks) : null;
    return {
      volume: computeVolume(sessions, granularity, skeleton),
      reps: computeReps(sessions, granularity, skeleton),
      duration: computeDuration(sessions, granularity, skeleton),
    };
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
    const safeSessions = sessions ?? [];

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
  started_at: string;
  completed_at: string | null;
  status: string;
  sets: {
    weight: number;
    reps_performed: number;
    rir: number | null;
    exercise_id: string;
    exercise: { name: string; muscle_group: string } | null;
  }[];
};

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

function computeMuscleGroupSplit(sessions: RawSession[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const set of s.sets) {
      const group = set.exercise?.muscle_group ?? 'unknown';
      if (group === 'unknown' || group === 'full_body') continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
      const secondary: string[] = (set.exercise as Record<string, unknown>)?.secondary_muscles as string[] ?? [];
      for (const sec of secondary) {
        counts.set(sec, (counts.get(sec) ?? 0) + 0.5);
      }
    }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({
      label: group.replace('_', ' '),
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
      if (group === 'full_body') continue;
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
    weight: Map<string, number>;
    volume: Map<string, number>;
    reps: Map<string, number>;
    oneRM: Map<string, number>;
  }>();

  for (const s of sessions) {
    const key = getBucketKey(new Date(s.started_at), granularity);

    for (const set of s.sets) {
      if (!set.exercise || set.weight <= 0) continue;
      const id = set.exercise_id;
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, {
          name: set.exercise.name,
          weight: new Map(),
          volume: new Map(),
          reps: new Map(),
          oneRM: new Map(),
        });
      }
      const entry = exerciseMap.get(id)!;

      const existingWeight = entry.weight.get(key) ?? 0;
      if (set.weight > existingWeight) {
        entry.weight.set(key, set.weight);
      }

      const existingVol = entry.volume.get(key) ?? 0;
      entry.volume.set(key, existingVol + set.weight * set.reps_performed);

      const existingReps = entry.reps.get(key) ?? 0;
      entry.reps.set(key, existingReps + set.reps_performed);

      const effectiveReps = set.reps_performed + (set.rir ?? 0);
      const estimated1RM = Math.round(set.weight * (1 + effectiveReps / 30));
      const existing1RM = entry.oneRM.get(key) ?? 0;
      if (estimated1RM > existing1RM) {
        entry.oneRM.set(key, estimated1RM);
      }
    }
  }

  const stamp = (map: Map<string, number>) =>
    skeleton ? stampValues(skeleton, map) : mapToPoints(map, granularity);

  return [...exerciseMap.entries()]
    .filter(([, v]) => v.weight.size >= 2)
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.name,
      weightPoints: stamp(data.weight),
      volumePoints: stamp(data.volume),
      repsPoints: stamp(data.reps),
      oneRMPoints: stamp(data.oneRM),
    }))
    .sort((a, b) => {
      const maxA = Math.max(...a.weightPoints.map((p) => p.value));
      const maxB = Math.max(...b.weightPoints.map((p) => p.value));
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
  return mapToPoints(map, skeleton, granularity);
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
    weight: TimeSeriesPoint[];
    volume: TimeSeriesPoint[];
    reps: TimeSeriesPoint[];
    oneRM: TimeSeriesPoint[];
  }>();

  for (const s of sessions) {
    const ts = new Date(s.started_at).getTime();
    const label = sessionDateLabel(s.started_at);

    const sessionExercises = new Map<string, {
      maxWeight: number;
      totalVol: number;
      totalReps: number;
      best1RM: number;
      name: string;
    }>();

    for (const set of s.sets) {
      if (!set.exercise || set.weight <= 0) continue;
      const id = set.exercise_id;
      const existing = sessionExercises.get(id) ?? {
        maxWeight: 0, totalVol: 0, totalReps: 0, best1RM: 0, name: set.exercise.name,
      };
      existing.maxWeight = Math.max(existing.maxWeight, set.weight);
      existing.totalVol += set.weight * set.reps_performed;
      existing.totalReps += set.reps_performed;
      const effectiveReps = set.reps_performed + (set.rir ?? 0);
      const est1RM = Math.round(set.weight * (1 + effectiveReps / 30));
      existing.best1RM = Math.max(existing.best1RM, est1RM);
      sessionExercises.set(id, existing);
    }

    for (const [id, ex] of sessionExercises) {
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, { name: ex.name, weight: [], volume: [], reps: [], oneRM: [] });
      }
      const entry = exerciseMap.get(id)!;
      const pt = (v: number): TimeSeriesPoint => ({ key: s.started_at, label, value: v, date: ts });
      entry.weight.push(pt(ex.maxWeight));
      entry.volume.push(pt(ex.totalVol));
      entry.reps.push(pt(ex.totalReps));
      entry.oneRM.push(pt(ex.best1RM));
    }
  }

  return [...exerciseMap.entries()]
    .filter(([, v]) => v.weight.length >= 2)
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.name,
      weightPoints: data.weight,
      volumePoints: data.volume,
      repsPoints: data.reps,
      oneRMPoints: data.oneRM,
    }))
    .sort((a, b) => {
      const maxA = Math.max(...a.weightPoints.map((p) => p.value));
      const maxB = Math.max(...b.weightPoints.map((p) => p.value));
      return maxB - maxA;
    });
}
