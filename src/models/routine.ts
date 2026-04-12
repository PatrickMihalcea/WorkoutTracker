import { Exercise } from './exercise';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  week_count: number;
  current_week: number;
  current_week_started_at: string;
  created_at: string;
}

export interface RoutineInsert {
  user_id: string;
  name: string;
  is_active: boolean;
  week_count?: number;
  current_week?: number;
  current_week_started_at?: string;
}

export interface RoutineDay {
  id: string;
  routine_id: string;
  day_of_week: DayOfWeek | null;
  label: string;
  week_index: number;
}

export interface RoutineDayInsert {
  routine_id: string;
  day_of_week: DayOfWeek | null;
  label: string;
  week_index?: number;
}

export interface RoutineDayExerciseSet {
  id: string;
  routine_day_exercise_id: string;
  set_number: number;
  target_weight: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rir: number | null;
  target_duration: number;
  target_distance: number;
  is_warmup: boolean;
}

export type RoutineDayExerciseSetInsert = Omit<RoutineDayExerciseSet, 'id'>;

export interface RoutineDayExercise {
  id: string;
  routine_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  superset_group: string | null;
  exercise?: Exercise;
  sets?: RoutineDayExerciseSet[];
}

export type RoutineDayExerciseInsert = Omit<RoutineDayExercise, 'id' | 'exercise' | 'sets' | 'superset_group'>;

export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Monday',
  [DayOfWeek.Tuesday]: 'Tuesday',
  [DayOfWeek.Wednesday]: 'Wednesday',
  [DayOfWeek.Thursday]: 'Thursday',
  [DayOfWeek.Friday]: 'Friday',
  [DayOfWeek.Saturday]: 'Saturday',
  [DayOfWeek.Sunday]: 'Sunday',
};

export interface RoutineDayWithExercises extends RoutineDay {
  exercises: RoutineDayExercise[];
}

export interface RoutineWithDays extends Routine {
  days: RoutineDayWithExercises[];
}
