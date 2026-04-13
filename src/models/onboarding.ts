export type OnboardingRoutineGenerationMode = 'template' | 'ai';

export type OnboardingGoal =
  | 'muscle_gain'
  | 'strength'
  | 'fat_loss'
  | 'general_fitness';

export type OnboardingExperience = 'beginner' | 'intermediate' | 'advanced';

export type OnboardingEquipmentPreference =
  | 'full_gym'
  | 'dumbbells_bench'
  | 'bodyweight_minimal';

export type OnboardingFocusMuscle =
  | 'none'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'core';

export interface OnboardingRoutineAnswers {
  days_per_week: 3 | 4 | 5;
  session_minutes: 30 | 45 | 60;
  goal: OnboardingGoal;
  experience: OnboardingExperience;
  equipment: OnboardingEquipmentPreference;
  focus_muscle: OnboardingFocusMuscle;
}

export interface GenerateOnboardingRoutineRequest {
  mode: OnboardingRoutineGenerationMode;
  answers: OnboardingRoutineAnswers;
}

export interface GenerateOnboardingRoutineResponse {
  routine_id: string;
  routine_name: string;
  generation_mode_used: 'template' | 'ai' | 'fallback_template';
}
