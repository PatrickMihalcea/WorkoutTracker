-- Add exercise intelligence columns for routine generation

ALTER TABLE exercises
ADD COLUMN movement_pattern text,
ADD COLUMN is_compound boolean,
ADD COLUMN difficulty_tier text,
ADD COLUMN fatigue_score smallint,
ADD COLUMN is_cardio boolean NOT NULL DEFAULT false;

-- Optional safety constraints
ALTER TABLE exercises
ADD CONSTRAINT exercises_difficulty_tier_check
CHECK (
  difficulty_tier IS NULL OR
  difficulty_tier IN ('beginner', 'intermediate', 'advanced')
);

ALTER TABLE exercises
ADD CONSTRAINT exercises_fatigue_score_check
CHECK (
  fatigue_score IS NULL OR
  fatigue_score BETWEEN 1 AND 5
);

-- Helpful indexes for generator filtering
CREATE INDEX IF NOT EXISTS exercises_movement_pattern_idx
  ON exercises (movement_pattern);

CREATE INDEX IF NOT EXISTS exercises_is_compound_idx
  ON exercises (is_compound);

CREATE INDEX IF NOT EXISTS exercises_difficulty_tier_idx
  ON exercises (difficulty_tier);

CREATE INDEX IF NOT EXISTS exercises_fatigue_score_idx
  ON exercises (fatigue_score);

CREATE INDEX IF NOT EXISTS exercises_is_cardio_idx
  ON exercises (is_cardio);