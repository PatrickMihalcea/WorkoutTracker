import { supabase } from './supabase';
import { MuscleGroup } from '../models';

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

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  weightPoints: { label: string; value: number }[];
  volumePoints: { label: string; value: number }[];
  repsPoints: { label: string; value: number }[];
  oneRMPoints: { label: string; value: number }[];
}

export type Granularity = 'week' | 'month';

export interface DashboardData {
  summaryStats: SummaryStats;
  granularity: Granularity;
  weeklyFrequency: { label: string; value: number }[];
  volumeOverTime: { label: string; value: number; date: Date }[];
  muscleGroupSplit: { label: string; value: number; color: string }[];
  muscleGroupExercises: Record<string, { label: string; value: number; color: string }[]>;
  personalRecords: PRRecord[];
  durationTrend: { label: string; value: number; date: Date }[];
  weeklyStreak: { weekLabel: string; completed: boolean }[];
  workoutDays: string[];
  exerciseProgressions: ExerciseProgression[];
}

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
  d.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = d.getUTCDay();
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

function getMonthKey(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatWeekLabel(weekKey: string): string {
  const [y, m, day] = weekKey.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, day));
  const end = new Date(Date.UTC(y, m - 1, day + 6));
  const sMonth = MONTH_NAMES[start.getUTCMonth()];
  const eMonth = MONTH_NAMES[end.getUTCMonth()];
  if (sMonth === eMonth) {
    return `${sMonth} ${start.getUTCDate()}-${end.getUTCDate()}`;
  }
  return `${sMonth} ${start.getUTCDate()}-${eMonth} ${end.getUTCDate()}`;
}

function formatMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number);
  return MONTH_NAMES[month - 1];
}

function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function resolveGranularity(weeks: number): Granularity {
  return weeks >= 26 || weeks === 0 ? 'month' : 'week';
}

function maxPeriods(weeks: number, granularity: Granularity): number {
  if (weeks === 0) return 52;
  if (granularity === 'month') return Math.ceil(weeks / 4) + 1;
  return weeks + 2;
}

export const dashboardService = {
  async getDashboardData(userId: string, weeks: number = 0): Promise<DashboardData> {
    let query = supabase
      .from('workout_sessions')
      .select('id, started_at, completed_at, status, sets:set_logs(weight, reps_performed, rir, exercise_id, exercise:exercises(name, muscle_group))')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true });

    if (weeks > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - weeks * 7);
      query = query.gte('started_at', cutoff.toISOString());
    }

    const { data: sessions, error } = await query;

    if (error) throw error;
    if (!sessions || sessions.length === 0) return emptyDashboard();

    const granularity = resolveGranularity(weeks);
    const limit = maxPeriods(weeks, granularity);

    return {
      summaryStats: computeSummaryStats(sessions),
      granularity,
      weeklyFrequency: granularity === 'month'
        ? computeMonthlyFrequency(sessions, limit)
        : computeWeeklyFrequency(sessions, limit),
      volumeOverTime: granularity === 'month'
        ? computeMonthlyVolume(sessions, limit)
        : computeVolumeOverTime(sessions, limit),
      muscleGroupSplit: computeMuscleGroupSplit(sessions),
      muscleGroupExercises: computeMuscleGroupExercises(sessions),
      personalRecords: computePersonalRecords(sessions),
      durationTrend: granularity === 'month'
        ? computeMonthlyDuration(sessions, limit)
        : computeDurationTrend(sessions, limit),
      weeklyStreak: computeWeeklyStreak(sessions),
      workoutDays: computeWorkoutDays(sessions),
      exerciseProgressions: computeExerciseProgressions(sessions, granularity, limit),
    };
  },
};

function emptyDashboard(): DashboardData {
  return {
    summaryStats: { totalWorkouts: 0, currentStreak: 0, totalVolume: 0, avgDuration: 0 },
    granularity: 'week',
    weeklyFrequency: [],
    volumeOverTime: [],
    muscleGroupSplit: [],
    muscleGroupExercises: {},
    personalRecords: [],
    durationTrend: [],
    weeklyStreak: [],
    workoutDays: [],
    exerciseProgressions: [],
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

function computeWeeklyFrequency(sessions: RawSession[], limit: number) {
  const weekMap = new Map<string, number>();
  for (const s of sessions) {
    const week = getWeekKey(new Date(s.started_at));
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([week, count]) => ({ label: formatWeekLabel(week), value: count }));
}

function computeMonthlyFrequency(sessions: RawSession[], limit: number) {
  const monthMap = new Map<string, number>();
  for (const s of sessions) {
    const month = getMonthKey(new Date(s.started_at));
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }
  return [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([month, count]) => ({ label: formatMonthLabel(month), value: count }));
}

function computeVolumeOverTime(sessions: RawSession[], limit: number) {
  const weekMap = new Map<string, { total: number; date: Date }>();
  for (const s of sessions) {
    const vol = s.sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
    const weekKey = getWeekKey(new Date(s.started_at));
    const entry = weekMap.get(weekKey);
    if (entry) {
      entry.total += vol;
    } else {
      weekMap.set(weekKey, { total: vol, date: new Date(s.started_at) });
    }
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([week, { total, date }]) => ({
      label: formatWeekLabel(week),
      value: Math.round(total),
      date,
    }));
}

function computeMonthlyVolume(sessions: RawSession[], limit: number) {
  const monthMap = new Map<string, { total: number; date: Date }>();
  for (const s of sessions) {
    const vol = s.sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
    const monthKey = getMonthKey(new Date(s.started_at));
    const entry = monthMap.get(monthKey);
    if (entry) {
      entry.total += vol;
    } else {
      monthMap.set(monthKey, { total: vol, date: new Date(s.started_at) });
    }
  }
  return [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([month, { total, date }]) => ({
      label: formatMonthLabel(month),
      value: Math.round(total),
      date,
    }));
}

function computeMuscleGroupSplit(sessions: RawSession[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const set of s.sets) {
      const group = set.exercise?.muscle_group ?? 'unknown';
      if (group === 'unknown') continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
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

function computeDurationTrend(sessions: RawSession[], limit: number) {
  const weekMap = new Map<string, { total: number; count: number }>();
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const mins = (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    if (mins <= 0 || mins > 300) continue;
    const week = getWeekKey(new Date(s.started_at));
    const entry = weekMap.get(week) ?? { total: 0, count: 0 };
    entry.total += mins;
    entry.count += 1;
    weekMap.set(week, entry);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([week, { total, count }]) => ({
      label: formatWeekLabel(week),
      value: Math.round(total / count),
      date: new Date(week),
    }));
}

function computeMonthlyDuration(sessions: RawSession[], limit: number) {
  const monthMap = new Map<string, { total: number; count: number; date: Date }>();
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const mins = (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    if (mins <= 0 || mins > 300) continue;
    const monthKey = getMonthKey(new Date(s.started_at));
    const entry = monthMap.get(monthKey) ?? { total: 0, count: 0, date: new Date(s.started_at) };
    entry.total += mins;
    entry.count += 1;
    monthMap.set(monthKey, entry);
  }
  return [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([, { total, count, date }]) => ({
      label: formatMonthLabel(getMonthKey(date)),
      value: Math.round(total / count),
      date,
    }));
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

function computeExerciseProgressions(sessions: RawSession[], granularity: Granularity, limit: number): ExerciseProgression[] {
  const useMonth = granularity === 'month';
  const getBucketKey = useMonth
    ? (date: Date) => getMonthKey(date)
    : (date: Date) => getWeekKey(date);
  const formatBucket = useMonth ? formatMonthLabel : formatWeekLabel;

  const exerciseMap = new Map<string, {
    name: string;
    weight: Map<string, number>;
    volume: Map<string, number>;
    reps: Map<string, number>;
    oneRM: Map<string, number>;
  }>();

  for (const s of sessions) {
    const bucketKey = getBucketKey(new Date(s.started_at));

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

      const existingWeight = entry.weight.get(bucketKey) ?? 0;
      if (set.weight > existingWeight) {
        entry.weight.set(bucketKey, set.weight);
      }

      const existingVol = entry.volume.get(bucketKey) ?? 0;
      entry.volume.set(bucketKey, existingVol + set.weight * set.reps_performed);

      const existingReps = entry.reps.get(bucketKey) ?? 0;
      entry.reps.set(bucketKey, existingReps + set.reps_performed);

      const effectiveReps = set.reps_performed + (set.rir ?? 0);
      const estimated1RM = Math.round(set.weight * (1 + effectiveReps / 30));
      const existing1RM = entry.oneRM.get(bucketKey) ?? 0;
      if (estimated1RM > existing1RM) {
        entry.oneRM.set(bucketKey, estimated1RM);
      }
    }
  }

  function mapToPoints(m: Map<string, number>): { label: string; value: number }[] {
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([key, val]) => ({
        label: formatBucket(key),
        value: Math.round(val),
      }));
  }

  return [...exerciseMap.entries()]
    .filter(([, v]) => v.weight.size >= 2)
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.name,
      weightPoints: mapToPoints(data.weight),
      volumePoints: mapToPoints(data.volume),
      repsPoints: mapToPoints(data.reps),
      oneRMPoints: mapToPoints(data.oneRM),
    }))
    .sort((a, b) => {
      const maxA = Math.max(...a.weightPoints.map((p) => p.value));
      const maxB = Math.max(...b.weightPoints.map((p) => p.value));
      return maxB - maxA;
    });
}
