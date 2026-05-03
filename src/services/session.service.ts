import {
  WorkoutSession,
  WorkoutSessionInsert,
  WorkoutSessionWithRoutine,
  SetLog,
  SetLogInsert,
  SessionWithSets,
  SessionWithSetsAndExercises,
} from '../models';
import { supabase } from './supabase';

export type SessionRecordMetric =
  | 'heaviest_weight'
  | 'best_est_1rm'
  | 'best_set_volume'
  | 'best_session_volume'
  | 'max_reps'
  | 'best_session_reps'
  | 'lightest_assist'
  | 'longest_duration'
  | 'best_session_duration'
  | 'farthest_distance'
  | 'best_pace';

export interface SessionRecordAchieved {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string;
  metric: SessionRecordMetric;
  value: number;
}

interface PriorSetRow {
  session_id: string;
  exercise_id: string;
  weight: number;
  reps_performed: number;
  rir: number | null;
  duration: number;
  distance: number;
}

function epley1RM(weight: number, reps: number, rir: number | null): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + (reps + (rir ?? 0)) / 30);
}

export const sessionService = {
  async getAll(): Promise<WorkoutSessionWithRoutine[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, routine_day:routine_days(label, week_index, routine:routines(id, name))')
      .order('started_at', { ascending: false });
    if (error) throw error;
    return data as WorkoutSessionWithRoutine[];
  },

  async getById(id: string): Promise<SessionWithSets> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, routine_day:routine_days(label, week_index, routine:routines(id, name)), sets:set_logs(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const session = data as SessionWithSets;
    session.sets.sort((a, b) => {
      const orderA = a.exercise_order ?? -1;
      const orderB = b.exercise_order ?? -1;
      if (orderA !== orderB) return orderA - orderB;
      if (a.exercise_id !== b.exercise_id) return a.exercise_id.localeCompare(b.exercise_id);
      return a.set_number - b.set_number;
    });
    return session;
  },

  async getByIdWithExercises(id: string): Promise<SessionWithSetsAndExercises> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, routine_day:routine_days(label, week_index, routine:routines(id, name)), sets:set_logs(*, exercise:exercises(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    const session = data as SessionWithSetsAndExercises;
    session.sets.sort((a, b) => {
      const orderA = a.exercise_order ?? -1;
      const orderB = b.exercise_order ?? -1;
      if (orderA !== orderB) return orderA - orderB;
      if (a.exercise_id !== b.exercise_id) return a.exercise_id.localeCompare(b.exercise_id);
      return a.set_number - b.set_number;
    });
    return session;
  },

  async create(session: WorkoutSessionInsert): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(session)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async complete(id: string): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async updateSession(
    id: string,
    updates: { started_at: string; completed_at: string },
  ): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Set Logs
  async addSet(setLog: SetLogInsert): Promise<SetLog> {
    const { data, error } = await supabase
      .from('set_logs')
      .insert(setLog)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSet(id: string, updates: Partial<SetLogInsert>): Promise<SetLog> {
    const { data, error } = await supabase
      .from('set_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('set_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateSetsByIds(ids: string[], updates: Partial<SetLogInsert>): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('set_logs')
      .update(updates)
      .in('id', ids);
    if (error) throw error;
  },

  async deleteSetsByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('set_logs')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },

  async getActiveSession(userId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getSetsBySession(sessionId: string): Promise<SetLog[]> {
    const { data, error } = await supabase
      .from('set_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise_id')
      .order('set_number');
    if (error) throw error;
    return data ?? [];
  },

  async getCompletedDayIdsSince(userId: string, dayIds: string[], sinceIso: string): Promise<string[]> {
    if (dayIds.length === 0) return [];
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('routine_day_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('routine_day_id', dayIds)
      .gte('completed_at', sinceIso);
    if (error) throw error;

    return [...new Set((data ?? [])
      .map((row) => row.routine_day_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0))];
  },

  async getLastSessionSets(exerciseId: string, userId: string): Promise<SetLog[]> {
    const { data, error } = await supabase
      .from('set_logs')
      .select('*, session:workout_sessions!inner(*)')
      .eq('exercise_id', exerciseId)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .order('session(started_at)', { ascending: false })
      .limit(10);
    if (error) throw error;

    if (!data || data.length === 0) return [];
    const lastSessionId = (data[0] as SetLog & { session: { id: string } }).session.id;
    return data
      .filter((s: SetLog & { session: { id: string } }) => s.session.id === lastSessionId)
      .sort((a, b) => a.set_number - b.set_number);
  },

  async getRecordsAchievedInSession(session: SessionWithSetsAndExercises): Promise<SessionRecordAchieved[]> {
    const sessionSets = session.sets.filter((set) => !set.is_warmup);
    if (sessionSets.length === 0) return [];

    const exerciseIds = [...new Set(sessionSets.map((set) => set.exercise_id))];
    const { data, error } = await supabase
      .from('set_logs')
      .select('session_id, exercise_id, weight, reps_performed, rir, duration, distance, session:workout_sessions!inner(started_at)')
      .in('exercise_id', exerciseIds)
      .eq('is_warmup', false)
      .eq('session.user_id', session.user_id)
      .eq('session.status', 'completed')
      .lt('session.started_at', session.started_at);
    if (error) throw error;

    const priorSets = (data ?? []) as PriorSetRow[];
    const priorByExercise = new Map<string, PriorSetRow[]>();
    const priorSessionsByExercise = new Map<string, Map<string, PriorSetRow[]>>();

    for (const set of priorSets) {
      const arr = priorByExercise.get(set.exercise_id) ?? [];
      arr.push(set);
      priorByExercise.set(set.exercise_id, arr);

      const bySession = priorSessionsByExercise.get(set.exercise_id) ?? new Map<string, PriorSetRow[]>();
      const sessionRows = bySession.get(set.session_id) ?? [];
      sessionRows.push(set);
      bySession.set(set.session_id, sessionRows);
      priorSessionsByExercise.set(set.exercise_id, bySession);
    }

    const currentByExercise = new Map<string, typeof sessionSets>();
    for (const set of sessionSets) {
      const arr = currentByExercise.get(set.exercise_id) ?? [];
      arr.push(set);
      currentByExercise.set(set.exercise_id, arr);
    }

    const exerciseOrder = new Map<string, number>();
    for (let i = 0; i < sessionSets.length; i++) {
      const set = sessionSets[i];
      const order = set.exercise_order ?? i;
      if (!exerciseOrder.has(set.exercise_id)) exerciseOrder.set(set.exercise_id, order);
    }

    const pushIfNewMax = (
      records: SessionRecordAchieved[],
      exerciseId: string,
      exerciseName: string,
      exerciseType: string,
      metric: SessionRecordMetric,
      currentValue: number,
      priorBest: number,
    ) => {
      if (currentValue <= 0) return;
      if (currentValue > priorBest) {
        records.push({
          exerciseId,
          exerciseName,
          exerciseType,
          metric,
          value: currentValue,
        });
      }
    };

    const pushIfNewMin = (
      records: SessionRecordAchieved[],
      exerciseId: string,
      exerciseName: string,
      exerciseType: string,
      metric: SessionRecordMetric,
      currentValue: number,
      priorBest: number,
    ) => {
      if (currentValue <= 0) return;
      if (currentValue < priorBest) {
        records.push({
          exerciseId,
          exerciseName,
          exerciseType,
          metric,
          value: currentValue,
        });
      }
    };

    const metricOrder: Record<SessionRecordMetric, number> = {
      heaviest_weight: 1,
      best_est_1rm: 2,
      best_set_volume: 3,
      best_session_volume: 4,
      max_reps: 5,
      best_session_reps: 6,
      lightest_assist: 7,
      longest_duration: 8,
      best_session_duration: 9,
      farthest_distance: 10,
      best_pace: 11,
    };

    const records: SessionRecordAchieved[] = [];

    for (const [exerciseId, currentSets] of currentByExercise.entries()) {
      const exerciseName = currentSets[0]?.exercise?.name ?? 'Exercise';
      const exerciseType = currentSets[0]?.exercise?.exercise_type ?? 'weight_reps';
      const priorExerciseSets = priorByExercise.get(exerciseId) ?? [];
      const priorSessionMap = priorSessionsByExercise.get(exerciseId) ?? new Map<string, PriorSetRow[]>();
      const priorSessions = [...priorSessionMap.values()];

      const currentHeaviest = Math.max(0, ...currentSets.map((set) => set.weight));
      const priorHeaviest = priorExerciseSets.length > 0 ? Math.max(0, ...priorExerciseSets.map((set) => set.weight)) : 0;

      const currentEst1RM = Math.max(0, ...currentSets.map((set) => epley1RM(set.weight, set.reps_performed, set.rir)));
      const priorEst1RM = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => epley1RM(set.weight, set.reps_performed, set.rir)))
        : 0;

      const currentBestSetVolume = Math.max(0, ...currentSets.map((set) => set.weight * set.reps_performed));
      const priorBestSetVolume = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => set.weight * set.reps_performed))
        : 0;

      const currentMaxReps = Math.max(0, ...currentSets.map((set) => set.reps_performed));
      const priorMaxReps = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => set.reps_performed))
        : 0;

      const currentLongestDuration = Math.max(0, ...currentSets.map((set) => set.duration));
      const priorLongestDuration = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => set.duration))
        : 0;

      const currentFarthestDistance = Math.max(0, ...currentSets.map((set) => set.distance));
      const priorFarthestDistance = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => set.distance))
        : 0;

      const currentBestPace = Math.max(0, ...currentSets.map((set) => (
        set.duration > 0 && set.distance > 0 ? set.distance / (set.duration / 60) : 0
      )));
      const priorBestPace = priorExerciseSets.length > 0
        ? Math.max(0, ...priorExerciseSets.map((set) => (
            set.duration > 0 && set.distance > 0 ? set.distance / (set.duration / 60) : 0
          )))
        : 0;

      const currentSessionVolume = currentSets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0);
      const priorBestSessionVolume = priorSessions.length > 0
        ? Math.max(
            0,
            ...priorSessions.map((sets) => sets.reduce((sum, set) => sum + set.weight * set.reps_performed, 0)),
          )
        : 0;

      const currentSessionReps = currentSets.reduce((sum, set) => sum + set.reps_performed, 0);
      const priorBestSessionReps = priorSessions.length > 0
        ? Math.max(0, ...priorSessions.map((sets) => sets.reduce((sum, set) => sum + set.reps_performed, 0)))
        : 0;

      const currentSessionDuration = currentSets.reduce((sum, set) => sum + set.duration, 0);
      const priorBestSessionDuration = priorSessions.length > 0
        ? Math.max(0, ...priorSessions.map((sets) => sets.reduce((sum, set) => sum + set.duration, 0)))
        : 0;

      const currentLightestAssist = currentSets
        .map((set) => set.weight)
        .filter((weight) => weight > 0)
        .reduce((min, weight) => Math.min(min, weight), Infinity);
      const priorLightestAssist = priorExerciseSets
        .map((set) => set.weight)
        .filter((weight) => weight > 0)
        .reduce((min, weight) => Math.min(min, weight), Infinity);

      switch (exerciseType) {
        case 'weight_reps':
        case 'weighted_bodyweight':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'heaviest_weight', currentHeaviest, priorHeaviest);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_est_1rm', currentEst1RM, priorEst1RM);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_set_volume', currentBestSetVolume, priorBestSetVolume);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_volume', currentSessionVolume, priorBestSessionVolume);
          break;
        case 'bodyweight_reps':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'max_reps', currentMaxReps, priorMaxReps);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_reps', currentSessionReps, priorBestSessionReps);
          break;
        case 'assisted_bodyweight':
          pushIfNewMin(records, exerciseId, exerciseName, exerciseType, 'lightest_assist', currentLightestAssist, priorLightestAssist);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'max_reps', currentMaxReps, priorMaxReps);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_reps', currentSessionReps, priorBestSessionReps);
          break;
        case 'duration':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'longest_duration', currentLongestDuration, priorLongestDuration);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_duration', currentSessionDuration, priorBestSessionDuration);
          break;
        case 'duration_weight':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'heaviest_weight', currentHeaviest, priorHeaviest);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'longest_duration', currentLongestDuration, priorLongestDuration);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_duration', currentSessionDuration, priorBestSessionDuration);
          break;
        case 'distance_duration':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'farthest_distance', currentFarthestDistance, priorFarthestDistance);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'longest_duration', currentLongestDuration, priorLongestDuration);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_pace', currentBestPace, priorBestPace);
          break;
        case 'weight_distance':
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'heaviest_weight', currentHeaviest, priorHeaviest);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'farthest_distance', currentFarthestDistance, priorFarthestDistance);
          break;
        default:
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'heaviest_weight', currentHeaviest, priorHeaviest);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_est_1rm', currentEst1RM, priorEst1RM);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_set_volume', currentBestSetVolume, priorBestSetVolume);
          pushIfNewMax(records, exerciseId, exerciseName, exerciseType, 'best_session_volume', currentSessionVolume, priorBestSessionVolume);
          break;
      }
    }

    records.sort((a, b) => {
      const orderA = exerciseOrder.get(a.exerciseId) ?? 999;
      const orderB = exerciseOrder.get(b.exerciseId) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (metricOrder[a.metric] ?? 999) - (metricOrder[b.metric] ?? 999);
    });

    return records;
  },

  async getRecordsAchievedCount(sessionId: string): Promise<number> {
    const session = await this.getByIdWithExercises(sessionId);
    const records = await this.getRecordsAchievedInSession(session);
    return records.length;
  },
};
