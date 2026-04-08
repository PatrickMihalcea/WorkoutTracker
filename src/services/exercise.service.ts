import { Exercise, ExerciseInsert } from '../models';
import { supabase } from './supabase';

export const exerciseService = {
  async getAll(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async getLibrary(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .is('user_id', null)
      .order('name');
    if (error) throw error;
    return data;
  },

  async getUserExercises(userId: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(exercise: ExerciseInsert): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ExerciseInsert>): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
