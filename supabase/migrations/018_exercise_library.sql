-- Make user_id nullable so NULL = public library exercise
ALTER TABLE exercises ALTER COLUMN user_id DROP NOT NULL;

-- Add exercise_type, secondary_muscles, asset_url
ALTER TABLE exercises ADD COLUMN exercise_type text NOT NULL DEFAULT 'weight_reps';
ALTER TABLE exercises ADD COLUMN secondary_muscles text[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN asset_url text DEFAULT NULL;

-- Drop the old RLS policy and replace with one that allows reading public exercises
DROP POLICY IF EXISTS "Users manage own exercises" ON exercises;

CREATE POLICY "Users can read own and public exercises"
  ON exercises FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);
