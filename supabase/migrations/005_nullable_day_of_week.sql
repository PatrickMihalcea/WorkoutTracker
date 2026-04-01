-- Allow day_of_week to be NULL (workout not tied to any weekday)
ALTER TABLE routine_days ALTER COLUMN day_of_week DROP NOT NULL;

-- Drop the unique constraint so multiple days can share the same weekday
ALTER TABLE routine_days DROP CONSTRAINT routine_days_routine_id_day_of_week_key;

-- Update check constraint to allow NULL
ALTER TABLE routine_days DROP CONSTRAINT routine_days_day_of_week_check;
ALTER TABLE routine_days ADD CONSTRAINT routine_days_day_of_week_check
  CHECK (day_of_week IS NULL OR (day_of_week BETWEEN 1 AND 7));
