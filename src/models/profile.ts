export type Sex = 'male' | 'female' | 'other';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in';
export type DistanceUnit = 'km' | 'miles';

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
  onboarding_complete: boolean;
  created_at: string;
}

export type UserProfileInsert = Omit<UserProfile, 'created_at'>;
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at'>>;
