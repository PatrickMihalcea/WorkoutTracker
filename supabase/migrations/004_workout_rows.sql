-- Live workout state: stores every row's typed values and completion status
CREATE TABLE workout_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight TEXT NOT NULL DEFAULT '',
  reps TEXT NOT NULL DEFAULT '',
  rir TEXT NOT NULL DEFAULT '',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(session_id, exercise_id, set_number)
);

ALTER TABLE workout_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout rows"
  ON workout_rows FOR ALL
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));
