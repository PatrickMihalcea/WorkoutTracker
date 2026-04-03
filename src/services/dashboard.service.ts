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
  points: { label: string; value: number }[];
}

export interface DashboardData {
  summaryStats: SummaryStats;
  weeklyFrequency: { label: string; value: number }[];
  volumeOverTime: { label: string; value: number; date: Date }[];
  muscleGroupSplit: { label: string; value: number; color: string }[];
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

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekKey: string): string {
  const d = new Date(weekKey);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const dashboardService = {
  async getDashboardData(userId: string, weeks: number = 0): Promise<DashboardData> {
    let query = supabase
      .from('workout_sessions')
      .select('id, started_at, completed_at, status, sets:set_logs(weight, reps_performed, exercise_id, exercise:exercises(name, muscle_group))')
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

    return {
      summaryStats: computeSummaryStats(sessions),
      weeklyFrequency: computeWeeklyFrequency(sessions),
      volumeOverTime: computeVolumeOverTime(sessions),
      muscleGroupSplit: computeMuscleGroupSplit(sessions),
      personalRecords: computePersonalRecords(sessions),
      durationTrend: computeDurationTrend(sessions),
      weeklyStreak: computeWeeklyStreak(sessions),
      workoutDays: computeWorkoutDays(sessions),
      exerciseProgressions: computeExerciseProgressions(sessions),
    };
  },
};

function emptyDashboard(): DashboardData {
  return {
    summaryStats: { totalWorkouts: 0, currentStreak: 0, totalVolume: 0, avgDuration: 0 },
    weeklyFrequency: [],
    volumeOverTime: [],
    muscleGroupSplit: [],
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

  const sessionWeeks = new Set(sessions.map((s) => getWeekKey(new Date(s.started_at))));
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

function computeWeeklyFrequency(sessions: RawSession[]) {
  const weekMap = new Map<string, number>();
  for (const s of sessions) {
    const week = getWeekKey(new Date(s.started_at));
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ label: formatWeekLabel(week), value: count }));
}

function computeVolumeOverTime(sessions: RawSession[]) {
  const recent = sessions.slice(-20);
  return recent.map((s) => {
    const volume = s.sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
    const d = new Date(s.started_at);
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(volume),
      date: d,
    };
  });
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

function computeDurationTrend(sessions: RawSession[]) {
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
    .slice(-12)
    .map(([week, { total, count }]) => ({
      label: formatWeekLabel(week),
      value: Math.round(total / count),
      date: new Date(week),
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

function computeExerciseProgressions(sessions: RawSession[]): ExerciseProgression[] {
  const exerciseMap = new Map<string, { name: string; points: Map<string, number> }>();

  for (const s of sessions) {
    const sessionLabel = new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sessionKey = s.started_at;

    for (const set of s.sets) {
      if (!set.exercise || set.weight <= 0) continue;
      const id = set.exercise_id;
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, { name: set.exercise.name, points: new Map() });
      }
      const entry = exerciseMap.get(id)!;
      const existing = entry.points.get(sessionKey) ?? 0;
      if (set.weight > existing) {
        entry.points.set(sessionKey, set.weight);
      }
    }
  }

  return [...exerciseMap.entries()]
    .filter(([, v]) => v.points.size >= 2)
    .map(([exerciseId, { name, points }]) => ({
      exerciseId,
      exerciseName: name,
      points: [...points.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-20)
        .map(([key, weight]) => ({
          label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: weight,
        })),
    }))
    .sort((a, b) => {
      const maxA = Math.max(...a.points.map((p) => p.value));
      const maxB = Math.max(...b.points.map((p) => p.value));
      return maxB - maxA;
    });
}
