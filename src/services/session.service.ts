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

export const sessionService = {
  async getAll(): Promise<WorkoutSessionWithRoutine[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, routine_day:routine_days(label, routine:routines(name))')
      .order('started_at', { ascending: false });
    if (error) throw error;
    return data as WorkoutSessionWithRoutine[];
  },

  async getById(id: string): Promise<SessionWithSets> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, sets:set_logs(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const session = data as SessionWithSets;
    session.sets.sort((a, b) => {
      if (a.exercise_id !== b.exercise_id) return a.exercise_id.localeCompare(b.exercise_id);
      return a.set_number - b.set_number;
    });
    return session;
  },

  async getByIdWithExercises(id: string): Promise<SessionWithSetsAndExercises> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, sets:set_logs(*, exercise:exercises(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    const session = data as SessionWithSetsAndExercises;
    session.sets.sort((a, b) => {
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
};
