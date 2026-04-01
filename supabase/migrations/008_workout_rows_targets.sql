ALTER TABLE workout_rows
  ADD COLUMN target_weight REAL DEFAULT 0,
  ADD COLUMN target_reps_min INT DEFAULT 0,
  ADD COLUMN target_reps_max INT DEFAULT 0;
