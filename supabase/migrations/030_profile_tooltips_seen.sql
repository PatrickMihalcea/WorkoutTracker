ALTER TABLE user_profiles
  ADD COLUMN tooltips_seen JSONB DEFAULT '{}' NOT NULL;
