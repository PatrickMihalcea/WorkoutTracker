-- Allow routine_day_exercise_id to hold ad-hoc UUIDs for exercises added
-- mid-workout that don't exist in routine_day_exercises.
ALTER TABLE workout_rows
  DROP CONSTRAINT workout_rows_routine_day_exercise_id_fkey;
