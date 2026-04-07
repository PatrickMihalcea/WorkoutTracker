ALTER TABLE routine_day_exercises
  ADD COLUMN superset_group text DEFAULT NULL;

ALTER TABLE workout_rows
  ADD COLUMN superset_group text DEFAULT NULL;
