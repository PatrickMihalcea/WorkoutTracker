export enum ExerciseType {
  WeightReps = 'weight_reps',
  BodyweightReps = 'bodyweight_reps',
  WeightedBodyweight = 'weighted_bodyweight',
  AssistedBodyweight = 'assisted_bodyweight',
  Duration = 'duration',
  DurationWeight = 'duration_weight',
  DistanceDuration = 'distance_duration',
  WeightDistance = 'weight_distance',
}

export enum MuscleGroup {
  Chest = 'chest',
  Back = 'back',
  Shoulders = 'shoulders',
  Biceps = 'biceps',
  Triceps = 'triceps',
  Quads = 'quads',
  Hamstrings = 'hamstrings',
  Glutes = 'glutes',
  Calves = 'calves',
  Abs = 'abs',
  Forearms = 'forearms',
  Traps = 'traps',
  Cardio = 'cardio',
  FullBody = 'full_body',
}

export enum Equipment {
  None = 'none',
  Barbell = 'barbell',
  Dumbbell = 'dumbbell',
  Kettlebell = 'kettlebell',
  Cable = 'cable',
  Machine = 'machine',
  Plate = 'plate',
  ResistanceBand = 'resistance_band',
  SuspensionBand = 'suspension_band',
  Other = 'other',
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  exercise_type: ExerciseType;
  secondary_muscles: string[];
  asset_url: string | null;
  created_at: string;
}

export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at' | 'asset_url'> & { asset_url?: string | null };
