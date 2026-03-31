export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  created_at: string;
}

export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at'>;

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
  FullBody = 'full_body',
}

export enum Equipment {
  Barbell = 'barbell',
  Dumbbell = 'dumbbell',
  Cable = 'cable',
  Machine = 'machine',
  Bodyweight = 'bodyweight',
  Band = 'band',
  Kettlebell = 'kettlebell',
  Other = 'other',
}
