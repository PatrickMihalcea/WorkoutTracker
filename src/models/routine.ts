import { Exercise } from './exercise';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export type RoutineInsert = Omit<Routine, 'id' | 'created_at'>;

export interface RoutineDay {
  id: string;
  routine_id: string;
  day_of_week: DayOfWeek;
  label: string;
}

export type RoutineDayInsert = Omit<RoutineDay, 'id'>;

export interface RoutineDayExercise {
  id: string;
  routine_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  exercise?: Exercise;
}

export type RoutineDayExerciseInsert = Omit<RoutineDayExercise, 'id' | 'exercise'>;

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
