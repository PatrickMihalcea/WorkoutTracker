-- Add routine_day_exercise_id so duplicate exercises in a day each get independent rows
ALTER TABLE workout_rows
  ADD COLUMN routine_day_exercise_id UUID REFERENCES routine_day_exercises(id) ON DELETE SET NULL;

-- Drop the old constraint that collides when the same exercise appears twice
ALTER TABLE workout_rows
  DROP CONSTRAINT workout_rows_session_id_exercise_id_set_number_key;

-- New constraint keyed on the entry, not the raw exercise
ALTER TABLE workout_rows
  ADD CONSTRAINT workout_rows_session_entry_set_key
  UNIQUE(session_id, routine_day_exercise_id, set_number);
