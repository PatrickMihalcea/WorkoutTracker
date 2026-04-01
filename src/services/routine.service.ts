import {
  Routine,
  RoutineInsert,
  RoutineDay,
  RoutineDayInsert,
  RoutineDayExercise,
  RoutineDayExerciseInsert,
  RoutineDayExerciseSetInsert,
  RoutineWithDays,
  RoutineDayWithExercises,
} from '../models';
import { supabase } from './supabase';

export const routineService = {
  async getAll(): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getWithDays(id: string): Promise<RoutineWithDays> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        days:routine_days (
          *,
          exercises:routine_day_exercises (
            *,
            exercise:exercises (*),
            sets:routine_day_exercise_sets (*)
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;

    const routine = data as RoutineWithDays;
    routine.days.sort((a, b) => a.day_of_week - b.day_of_week);
    routine.days.forEach((day) => {
      day.exercises.sort((a, b) => a.sort_order - b.sort_order);
      day.exercises.forEach((ex) => {
        ex.sets?.sort((a, b) => a.set_number - b.set_number);
      });
    });
    return routine;
  },

  async getActive(): Promise<RoutineWithDays | null> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        days:routine_days (
          *,
          exercises:routine_day_exercises (
            *,
            exercise:exercises (*),
            sets:routine_day_exercise_sets (*)
          )
        )
      `)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const routine = data as RoutineWithDays;
    routine.days.sort((a, b) => a.day_of_week - b.day_of_week);
    routine.days.forEach((day) => {
      day.exercises.sort((a, b) => a.sort_order - b.sort_order);
      day.exercises.forEach((ex) => {
        ex.sets?.sort((a, b) => a.set_number - b.set_number);
      });
    });
    return routine;
  },

  async getDayWithExercises(dayId: string): Promise<RoutineDayWithExercises> {
    const { data, error } = await supabase
      .from('routine_days')
      .select(`
        *,
        exercises:routine_day_exercises (
          *,
          exercise:exercises (*),
          sets:routine_day_exercise_sets (*)
        )
      `)
      .eq('id', dayId)
      .single();
    if (error) throw error;
    const day = data as RoutineDayWithExercises;
    day.exercises.sort((a, b) => a.sort_order - b.sort_order);
    day.exercises.forEach((ex) => {
      ex.sets?.sort((a, b) => a.set_number - b.set_number);
    });
    return day;
  },

  async create(routine: RoutineInsert): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .insert(routine)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RoutineInsert>): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setActive(id: string, userId: string): Promise<void> {
    await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('routines')
      .update({ is_active: true })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Routine Days
  async addDay(day: RoutineDayInsert): Promise<RoutineDay> {
    const { data, error } = await supabase
      .from('routine_days')
      .insert(day)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDay(id: string, updates: Partial<RoutineDayInsert>): Promise<RoutineDay> {
    const { data, error } = await supabase
      .from('routine_days')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDay(id: string): Promise<void> {
    const { error } = await supabase
      .from('routine_days')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Routine Day Exercises
  async addExerciseToDay(
    entry: RoutineDayExerciseInsert,
    sets?: Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[],
  ): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .insert(entry)
      .select('*, exercise:exercises(*)')
      .single();
    if (error) throw error;

    if (sets && sets.length > 0) {
      const setRows = sets.map((s) => ({
        ...s,
        routine_day_exercise_id: data.id,
      }));
      const { data: setsData, error: setsError } = await supabase
        .from('routine_day_exercise_sets')
        .insert(setRows)
        .select();
      if (setsError) throw setsError;
      data.sets = setsData;
    }

    return data;
  },

  async updateExerciseSets(
    exerciseEntryId: string,
    sets: Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[],
  ): Promise<void> {
    const { error: delError } = await supabase
      .from('routine_day_exercise_sets')
      .delete()
      .eq('routine_day_exercise_id', exerciseEntryId);
    if (delError) throw delError;

    if (sets.length > 0) {
      const setRows = sets.map((s) => ({
        ...s,
        routine_day_exercise_id: exerciseEntryId,
      }));
      const { error: insError } = await supabase
        .from('routine_day_exercise_sets')
        .insert(setRows);
      if (insError) throw insError;
    }
  },

  async changeExercise(entryId: string, newExerciseId: string): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .update({ exercise_id: newExerciseId })
      .eq('id', entryId)
      .select('*, exercise:exercises(*), sets:routine_day_exercise_sets(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async updateDayExercise(
    id: string,
    updates: Partial<RoutineDayExerciseInsert>,
  ): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .update(updates)
      .eq('id', id)
      .select('*, exercise:exercises(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async removeDayExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('routine_day_exercises')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
