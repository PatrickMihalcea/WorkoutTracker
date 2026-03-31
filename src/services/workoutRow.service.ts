import { WorkoutRow } from '../models';
import { RoutineDayExercise } from '../models';
import { supabase } from './supabase';

export const workoutRowService = {
  async createInitialRows(
    sessionId: string,
    exercises: RoutineDayExercise[],
  ): Promise<WorkoutRow[]> {
    const rows: Omit<WorkoutRow, 'id'>[] = [];
    for (const ex of exercises) {
      for (let i = 1; i <= ex.target_sets; i++) {
        rows.push({
          session_id: sessionId,
          exercise_id: ex.exercise_id,
          set_number: i,
          weight: '',
          reps: '',
          rir: '',
          is_completed: false,
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
      .order('exercise_id')
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

  async addRow(sessionId: string, exerciseId: string, setNumber: number): Promise<WorkoutRow> {
    const { data, error } = await supabase
      .from('workout_rows')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight: '',
        reps: '',
        rir: '',
        is_completed: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAndRenumber(
    id: string,
    sessionId: string,
    exerciseId: string,
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
      .eq('exercise_id', exerciseId)
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

  async deleteBySession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_rows')
      .delete()
      .eq('session_id', sessionId);
    if (error) throw error;
  },
};
