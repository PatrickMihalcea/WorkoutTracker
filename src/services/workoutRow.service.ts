import { WorkoutRow } from '../models';
import { RoutineDayExercise } from '../models';
import { supabase } from './supabase';

export const workoutRowService = {
  async createInitialRows(
    sessionId: string,
    exercises: RoutineDayExercise[],
  ): Promise<WorkoutRow[]> {
    const rows: Omit<WorkoutRow, 'id'>[] = [];
    for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
      const ex = exercises[exIdx];
      const sets = ex.sets ?? [];
      for (let i = 1; i <= ex.target_sets; i++) {
        const tpl = sets.find((s) => s.set_number === i);
        rows.push({
          session_id: sessionId,
          exercise_id: ex.exercise_id,
          routine_day_exercise_id: ex.id,
          set_number: i,
          weight: '',
          reps: '',
          rir: '',
          is_completed: false,
          is_warmup: tpl?.is_warmup ?? false,
          target_weight: tpl?.target_weight ?? 0,
          target_reps_min: tpl?.target_reps_min ?? 0,
          target_reps_max: tpl?.target_reps_max ?? 0,
          exercise_order: exIdx,
        });
      }
    }
    if (rows.length === 0) return [];
    const { data, error } = await supabase
      .from('workout_rows')
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  async getBySession(sessionId: string): Promise<WorkoutRow[]> {
    const { data, error } = await supabase
      .from('workout_rows')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise_order')
      .order('set_number');
    if (error) throw error;
    return data ?? [];
  },

  async updateRow(
    id: string,
    updates: Partial<Pick<WorkoutRow, 'weight' | 'reps' | 'rir' | 'is_completed'>>,
  ): Promise<WorkoutRow> {
    const { data, error } = await supabase
      .from('workout_rows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addRow(
    sessionId: string,
    exerciseId: string,
    entryId: string,
    setNumber: number,
    targets?: { target_weight: number; target_reps_min: number; target_reps_max: number },
    exerciseOrder?: number,
    isWarmup?: boolean,
  ): Promise<WorkoutRow> {
    const { data, error } = await supabase
      .from('workout_rows')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        routine_day_exercise_id: entryId,
        set_number: setNumber,
        weight: '',
        reps: '',
        rir: '',
        is_completed: false,
        is_warmup: isWarmup ?? false,
        target_weight: targets?.target_weight ?? 0,
        target_reps_min: targets?.target_reps_min ?? 0,
        target_reps_max: targets?.target_reps_max ?? 0,
        exercise_order: exerciseOrder ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateWarmup(id: string, isWarmup: boolean): Promise<void> {
    const { error } = await supabase
      .from('workout_rows')
      .update({ is_warmup: isWarmup })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteAndRenumber(
    id: string,
    sessionId: string,
    entryId: string,
    deletedSetNumber: number,
  ): Promise<void> {
    const { error: delError } = await supabase
      .from('workout_rows')
      .delete()
      .eq('id', id);
    if (delError) throw delError;

    const { data: remaining, error: fetchError } = await supabase
      .from('workout_rows')
      .select('*')
      .eq('session_id', sessionId)
      .eq('routine_day_exercise_id', entryId)
      .gt('set_number', deletedSetNumber)
      .order('set_number');
    if (fetchError) throw fetchError;

    for (const row of remaining ?? []) {
      const { error } = await supabase
        .from('workout_rows')
        .update({ set_number: row.set_number - 1 })
        .eq('id', row.id);
      if (error) throw error;
    }
  },

  async deleteByEntry(sessionId: string, entryId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_rows')
      .delete()
      .eq('session_id', sessionId)
      .eq('routine_day_exercise_id', entryId);
    if (error) throw error;
  },

  async deleteBySession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_rows')
      .delete()
      .eq('session_id', sessionId);
    if (error) throw error;
  },

  async updateExerciseOrder(sessionId: string, entryId: string, order: number): Promise<void> {
    const { error } = await supabase
      .from('workout_rows')
      .update({ exercise_order: order })
      .eq('session_id', sessionId)
      .eq('routine_day_exercise_id', entryId);
    if (error) throw error;
  },
};
