-- Multi-week routine progression support

-- Routine-level cycle metadata
ALTER TABLE routines
  ADD COLUMN week_count integer NOT NULL DEFAULT 1;

ALTER TABLE routines
  ADD COLUMN current_week integer NOT NULL DEFAULT 1;

ALTER TABLE routines
  ADD COLUMN current_week_started_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE routines
  ADD CONSTRAINT routines_week_count_check
  CHECK (week_count >= 1);

ALTER TABLE routines
  ADD CONSTRAINT routines_current_week_check
  CHECK (current_week >= 1 AND current_week <= week_count);

-- Day templates are now week-scoped
ALTER TABLE routine_days
  ADD COLUMN week_index integer NOT NULL DEFAULT 1;

ALTER TABLE routine_days
  ADD CONSTRAINT routine_days_week_index_check
  CHECK (week_index >= 1);

CREATE INDEX idx_routine_days_routine_week ON routine_days(routine_id, week_index);

-- Snapshot routine week when a workout starts
ALTER TABLE workout_sessions
  ADD COLUMN routine_week_index integer;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_routine_week_index_check
  CHECK (routine_week_index IS NULL OR routine_week_index >= 1);

UPDATE workout_sessions ws
SET routine_week_index = rd.week_index
FROM routine_days rd
WHERE ws.routine_day_id = rd.id
  AND ws.routine_week_index IS NULL;
