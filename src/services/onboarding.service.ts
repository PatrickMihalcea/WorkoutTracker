import {
  GenerateOnboardingRoutineRequest,
  GenerateOnboardingRoutineResponse,
} from '../models/onboarding';
import { supabase } from './supabase';

export const onboardingService = {
  async generateFirstRoutine(
    payload: GenerateOnboardingRoutineRequest,
  ): Promise<GenerateOnboardingRoutineResponse> {
    const { data, error } = await supabase.functions.invoke('generate-onboarding-routine', {
      body: payload,
    });
    if (error) throw error;
    return data as GenerateOnboardingRoutineResponse;
  },
};
