-- workout_rows: add duration / distance columns
ALTER TABLE workout_rows ADD COLUMN duration text NOT NULL DEFAULT '';
ALTER TABLE workout_rows ADD COLUMN distance text NOT NULL DEFAULT '';
ALTER TABLE workout_rows ADD COLUMN target_duration real NOT NULL DEFAULT 0;
ALTER TABLE workout_rows ADD COLUMN target_distance real NOT NULL DEFAULT 0;

-- set_logs: add duration / distance columns
ALTER TABLE set_logs ADD COLUMN duration real NOT NULL DEFAULT 0;
ALTER TABLE set_logs ADD COLUMN distance real NOT NULL DEFAULT 0;

-- routine_day_exercise_sets: add target duration / distance
ALTER TABLE routine_day_exercise_sets ADD COLUMN target_duration real NOT NULL DEFAULT 0;
ALTER TABLE routine_day_exercise_sets ADD COLUMN target_distance real NOT NULL DEFAULT 0;
