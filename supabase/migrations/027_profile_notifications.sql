ALTER TABLE user_profiles
  ADD COLUMN notify_rest_timer_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_workout_day_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_workout_day_time text NOT NULL DEFAULT '08:00',
  ADD COLUMN notify_workout_rest_days_enabled boolean NOT NULL DEFAULT false;
