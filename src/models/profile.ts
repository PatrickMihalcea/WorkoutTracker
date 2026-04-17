import type { MeasurementGoalColumn } from './measurement';

export type Sex = 'male' | 'female' | 'other';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in';
export type DistanceUnit = 'km' | 'miles';

export interface ColorPreferences {
  themeId?: string;
  setCompletion?: string;
  accent?: string;
}

export interface TooltipSeenPreferences {
  workout?: {
    overlayWalkthroughCompleted?: boolean;
    [tooltipId: string]: boolean | undefined;
  };
  [category: string]: Record<string, boolean | undefined> | undefined;
}

export interface UserProfile {
  id: string;
  display_name: string;
  name: string | null;
  bio: string | null;
  sex: Sex;
  birthday: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  weight_unit: WeightUnit;
  height_unit: HeightUnit;
  distance_unit: DistanceUnit;
  color_preferences: ColorPreferences;
  tooltips_seen: TooltipSeenPreferences;
  rest_timer_seconds: number;
  notify_rest_timer_enabled: boolean;
  notify_workout_day_enabled: boolean;
  notify_workout_day_time: string;
  notify_workout_rest_days_enabled: boolean;
  show_routine_performance: boolean;
  onboarding_complete: boolean;
  body_weight_kg_goal?: number | null;
  waist_cm_goal?: number | null;
  body_fat_pct_goal?: number | null;
  lean_body_mass_kg_goal?: number | null;
  neck_cm_goal?: number | null;
  shoulder_cm_goal?: number | null;
  chest_cm_goal?: number | null;
  left_bicep_cm_goal?: number | null;
  right_bicep_cm_goal?: number | null;
  left_forearm_cm_goal?: number | null;
  right_forearm_cm_goal?: number | null;
  abdomen_cm_goal?: number | null;
  hips_cm_goal?: number | null;
  left_thigh_cm_goal?: number | null;
  right_thigh_cm_goal?: number | null;
  left_calf_cm_goal?: number | null;
  right_calf_cm_goal?: number | null;
  created_at: string;
}

export type UserProfileInsert = Omit<UserProfile, 'created_at'>;
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at'>>;
export type UserProfileMeasurementGoalField = MeasurementGoalColumn;
