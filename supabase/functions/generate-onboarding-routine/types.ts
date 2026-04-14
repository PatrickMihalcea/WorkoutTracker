export type GenerationMode = 'template' | 'ai';
export type RoutineWeekCount = 1 | 2 | 3 | 4 | 5 | 6;

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
  | 'biceps'
  | 'triceps'
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
  mode: GenerationMode;
  answers: OnboardingRoutineAnswers;
  week_count?: RoutineWeekCount;
  repair_context?: {
    validation_errors: string[];
    previous_output: unknown;
  };
}

export interface GenerateOnboardingRoutineResponse {
  routine_id: string;
  routine_name: string;
  generation_mode_used: 'template' | 'ai' | 'fallback_template';
}

export interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  exercise_type: string;
  secondary_muscles: string[] | string | null;
  user_id: string | null;
}

export interface UserProfileContext {
  sex: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  height_unit: 'cm' | 'in' | null;
  weight_unit: 'kg' | 'lbs' | null;
  distance_unit: 'km' | 'miles' | null;
}

export interface PlannedSet {
  set_number: number;
  target_weight: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rir: number | null;
  target_duration: number;
  target_distance: number;
  is_warmup: boolean;
}

export interface PlannedExercise {
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  sets: PlannedSet[];
}

export interface PlannedDay {
  day_of_week: number;
  label: string;
  week_index: number;
  exercises: PlannedExercise[];
}

export interface RoutineDraft {
  routine_name: string;
  days: PlannedDay[];
}
