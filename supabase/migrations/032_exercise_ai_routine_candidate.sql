-- Flag curated public exercises that are eligible for AI routine generation.
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS is_ai_routine_candidate boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS exercises_ai_routine_candidate_idx
  ON exercises (is_ai_routine_candidate)
  WHERE user_id IS NULL;
