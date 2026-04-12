import { Exercise } from './exercise';

export type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_day_id: string | null;
  routine_week_index: number | null;
  started_at: string;
  completed_at: string | null;
  status: SessionStatus;
  routine_day?: {
    label: string;
    week_index: number;
    routine?: {
      name: string;
    };
  } | null;
}

export interface WorkoutSessionInsert {
  user_id: string;
  routine_day_id: string | null;
  routine_week_index?: number | null;
  started_at: string;
  completed_at: string | null;
  status: SessionStatus;
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps_performed: number;
  rir: number | null;
  is_warmup: boolean;
  exercise_order: number | null;
  superset_group: string | null;
  duration: number;
  distance: number;
}

export type SetLogInsert = Omit<SetLog, 'id'>;

export interface SetLogWithExercise extends SetLog {
  exercise: Exercise;
}

export interface SessionWithSets extends WorkoutSession {
  sets: SetLog[];
}

export interface SessionWithSetsAndExercises extends WorkoutSession {
  sets: SetLogWithExercise[];
}

export interface WorkoutRow {
  id: string;
  session_id: string;
  exercise_id: string;
  routine_day_exercise_id: string;
  set_number: number;
  weight: string;
  reps: string;
  rir: string;
  duration: string;
  distance: string;
  is_completed: boolean;
  is_warmup: boolean;
  target_weight: number;
  target_reps_min: number;
  target_reps_max: number;
  target_duration: number;
  target_distance: number;
  exercise_order: number;
  superset_group: string | null;
}

export interface WorkoutSessionWithRoutine extends WorkoutSession {}
