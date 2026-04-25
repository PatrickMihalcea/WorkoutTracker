import { UserFeedback, UserFeedbackInsert } from '../models/feedback';
import { supabase } from './supabase';

export const feedbackService = {
  async create(feedback: UserFeedbackInsert): Promise<UserFeedback> {
    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedback)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
