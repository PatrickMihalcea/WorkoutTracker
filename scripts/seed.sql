-- =============================================================
-- Workout Tracker – Full Reset & Seed
--
-- Nukes ALL data, inserts the complete public exercise library,
-- then seeds ~3 months of PPL training with progressive overload.
--
-- USAGE:
--   1. Open Supabase Dashboard > SQL Editor
--   2. Replace the user_uuid on the DECLARE line below
--      (Authentication > Users to find your ID)
--   3. Run this entire script
--   4. Refresh the app
-- =============================================================

-- =========================================================
-- 0. NUKE EVERYTHING
-- =========================================================
TRUNCATE set_logs CASCADE;
TRUNCATE workout_rows CASCADE;
TRUNCATE workout_sessions CASCADE;
TRUNCATE routine_day_exercise_sets CASCADE;
TRUNCATE routine_day_exercises CASCADE;
TRUNCATE routine_days CASCADE;
TRUNCATE routines CASCADE;
TRUNCATE exercises CASCADE;

-- =========================================================
-- 1. PUBLIC EXERCISE LIBRARY  (user_id = NULL)
--    Every entry has: exercise_type, equipment, muscle_group,
--    secondary_muscles fully populated.
-- =========================================================
INSERT INTO exercises (user_id, name, muscle_group, equipment, exercise_type, secondary_muscles) VALUES
-- ── WEIGHT & REPS: Chest ──────────────────────────────────
(NULL, 'Barbell Bench Press',        'chest',      'barbell',   'weight_reps', '{triceps,shoulders}'),
(NULL, 'Incline Barbell Bench Press','chest',      'barbell',   'weight_reps', '{triceps,shoulders}'),
(NULL, 'Decline Barbell Bench Press','chest',      'barbell',   'weight_reps', '{triceps}'),
(NULL, 'Dumbbell Bench Press',       'chest',      'dumbbell',  'weight_reps', '{triceps,shoulders}'),
(NULL, 'Incline Dumbbell Press',     'chest',      'dumbbell',  'weight_reps', '{triceps,shoulders}'),
(NULL, 'Decline Dumbbell Press',     'chest',      'dumbbell',  'weight_reps', '{triceps}'),
(NULL, 'Dumbbell Fly',               'chest',      'dumbbell',  'weight_reps', '{shoulders}'),
(NULL, 'Cable Fly',                  'chest',      'cable',     'weight_reps', '{shoulders}'),
(NULL, 'Machine Chest Press',        'chest',      'machine',   'weight_reps', '{triceps,shoulders}'),
(NULL, 'Pec Deck',                   'chest',      'machine',   'weight_reps', '{}'),
(NULL, 'Machine Fly',                'chest',      'machine',   'weight_reps', '{}'),

-- ── WEIGHT & REPS: Back ──────────────────────────────────
(NULL, 'Barbell Row',                'back',       'barbell',   'weight_reps', '{biceps,forearms}'),
(NULL, 'Pendlay Row',                'back',       'barbell',   'weight_reps', '{biceps,forearms}'),
(NULL, 'Dumbbell Row',               'back',       'dumbbell',  'weight_reps', '{biceps,forearms}'),
(NULL, 'Lat Pulldown',               'back',       'cable',     'weight_reps', '{biceps}'),
(NULL, 'Seated Cable Row',           'back',       'cable',     'weight_reps', '{biceps}'),
(NULL, 'T-Bar Row',                  'back',       'barbell',   'weight_reps', '{biceps,forearms}'),
(NULL, 'Machine Row',                'back',       'machine',   'weight_reps', '{biceps}'),
(NULL, 'Straight-Arm Pulldown',      'back',       'cable',     'weight_reps', '{}'),

-- ── WEIGHT & REPS: Shoulders ─────────────────────────────
(NULL, 'Overhead Press',             'shoulders',  'barbell',   'weight_reps', '{triceps}'),
(NULL, 'Dumbbell Shoulder Press',    'shoulders',  'dumbbell',  'weight_reps', '{triceps}'),
(NULL, 'Machine Shoulder Press',     'shoulders',  'machine',   'weight_reps', '{triceps}'),
(NULL, 'Lateral Raise',              'shoulders',  'dumbbell',  'weight_reps', '{}'),
(NULL, 'Cable Lateral Raise',        'shoulders',  'cable',     'weight_reps', '{}'),
(NULL, 'Front Raise',                'shoulders',  'dumbbell',  'weight_reps', '{}'),
(NULL, 'Face Pull',                  'shoulders',  'cable',     'weight_reps', '{traps}'),
(NULL, 'Reverse Fly',                'shoulders',  'dumbbell',  'weight_reps', '{back}'),
(NULL, 'Arnold Press',               'shoulders',  'dumbbell',  'weight_reps', '{triceps}'),
(NULL, 'Upright Row',                'shoulders',  'barbell',   'weight_reps', '{traps}'),

-- ── WEIGHT & REPS: Biceps ────────────────────────────────
(NULL, 'Barbell Curl',               'biceps',     'barbell',   'weight_reps', '{forearms}'),
(NULL, 'EZ-Bar Curl',                'biceps',     'barbell',   'weight_reps', '{forearms}'),
(NULL, 'Dumbbell Curl',              'biceps',     'dumbbell',  'weight_reps', '{forearms}'),
(NULL, 'Hammer Curl',                'biceps',     'dumbbell',  'weight_reps', '{forearms}'),
(NULL, 'Dumbbell Hammer Curl',       'biceps',     'dumbbell',  'weight_reps', '{forearms}'),
(NULL, 'Preacher Curl',              'biceps',     'barbell',   'weight_reps', '{}'),
(NULL, 'Cable Curl',                 'biceps',     'cable',     'weight_reps', '{}'),
(NULL, 'Incline Dumbbell Curl',      'biceps',     'dumbbell',  'weight_reps', '{}'),
(NULL, 'Concentration Curl',         'biceps',     'dumbbell',  'weight_reps', '{}'),

-- ── WEIGHT & REPS: Triceps ───────────────────────────────
(NULL, 'Close-Grip Bench Press',     'triceps',    'barbell',   'weight_reps', '{chest}'),
(NULL, 'Skull Crusher',              'triceps',    'barbell',   'weight_reps', '{}'),
(NULL, 'Tricep Pushdown',            'triceps',    'cable',     'weight_reps', '{}'),
(NULL, 'Overhead Tricep Extension',  'triceps',    'cable',     'weight_reps', '{}'),
(NULL, 'Dumbbell Kickback',          'triceps',    'dumbbell',  'weight_reps', '{}'),

-- ── WEIGHT & REPS: Quads ─────────────────────────────────
(NULL, 'Barbell Squat',              'quads',      'barbell',   'weight_reps', '{glutes,hamstrings}'),
(NULL, 'Front Squat',                'quads',      'barbell',   'weight_reps', '{glutes,abs}'),
(NULL, 'Goblet Squat',               'quads',      'dumbbell',  'weight_reps', '{glutes}'),
(NULL, 'Leg Press',                   'quads',      'machine',   'weight_reps', '{glutes}'),
(NULL, 'Leg Extension',              'quads',      'machine',   'weight_reps', '{}'),
(NULL, 'Hack Squat',                 'quads',      'machine',   'weight_reps', '{glutes}'),
(NULL, 'Bulgarian Split Squat',      'quads',      'dumbbell',  'weight_reps', '{glutes}'),

-- ── WEIGHT & REPS: Hamstrings ────────────────────────────
(NULL, 'Romanian Deadlift',          'hamstrings', 'barbell',   'weight_reps', '{glutes,back}'),
(NULL, 'Stiff-Leg Deadlift',         'hamstrings', 'barbell',   'weight_reps', '{glutes,back}'),
(NULL, 'Leg Curl',                   'hamstrings', 'machine',   'weight_reps', '{}'),
(NULL, 'Seated Leg Curl',            'hamstrings', 'machine',   'weight_reps', '{}'),
(NULL, 'Nordic Hamstring Curl',      'hamstrings', 'none',      'weight_reps', '{}'),

-- ── WEIGHT & REPS: Glutes ────────────────────────────────
(NULL, 'Hip Thrust',                 'glutes',     'barbell',   'weight_reps', '{hamstrings}'),
(NULL, 'Cable Kickback',             'glutes',     'cable',     'weight_reps', '{}'),
(NULL, 'Hip Abduction Machine',      'glutes',     'machine',   'weight_reps', '{}'),

-- ── WEIGHT & REPS: Calves ────────────────────────────────
(NULL, 'Calf Raise',                 'calves',     'machine',   'weight_reps', '{}'),
(NULL, 'Seated Calf Raise',          'calves',     'machine',   'weight_reps', '{}'),

-- ── WEIGHT & REPS: Compound / Full Body ──────────────────
(NULL, 'Deadlift',                   'back',       'barbell',   'weight_reps', '{hamstrings,glutes,forearms,traps}'),
(NULL, 'Sumo Deadlift',              'back',       'barbell',   'weight_reps', '{quads,glutes}'),
(NULL, 'Power Clean',                'full_body',  'barbell',   'weight_reps', '{shoulders,traps,quads}'),
(NULL, 'Clean & Press',              'full_body',  'barbell',   'weight_reps', '{shoulders,quads,traps}'),

-- ── WEIGHT & REPS: Traps / Forearms / Abs ────────────────
(NULL, 'Barbell Shrug',              'traps',      'barbell',   'weight_reps', '{forearms}'),
(NULL, 'Dumbbell Shrug',             'traps',      'dumbbell',  'weight_reps', '{}'),
(NULL, 'Wrist Curl',                 'forearms',   'barbell',   'weight_reps', '{}'),
(NULL, 'Reverse Wrist Curl',         'forearms',   'barbell',   'weight_reps', '{}'),
(NULL, 'Cable Crunch',               'abs',        'cable',     'weight_reps', '{}'),
(NULL, 'Weighted Sit-Up',            'abs',        'plate',     'weight_reps', '{}'),

-- ── BODYWEIGHT REPS ──────────────────────────────────────
(NULL, 'Push-Up',                    'chest',      'none',      'bodyweight_reps', '{triceps,shoulders}'),
(NULL, 'Pull-Up',                    'back',       'none',      'bodyweight_reps', '{biceps}'),
(NULL, 'Chin-Up',                    'back',       'none',      'bodyweight_reps', '{biceps}'),
(NULL, 'Dip',                        'triceps',    'none',      'bodyweight_reps', '{chest,shoulders}'),
(NULL, 'Bodyweight Squat',           'quads',      'none',      'bodyweight_reps', '{glutes}'),
(NULL, 'Lunge',                      'quads',      'none',      'bodyweight_reps', '{glutes}'),
(NULL, 'Sit-Up',                     'abs',        'none',      'bodyweight_reps', '{}'),
(NULL, 'Crunch',                     'abs',        'none',      'bodyweight_reps', '{}'),
(NULL, 'Leg Raise',                  'abs',        'none',      'bodyweight_reps', '{}'),
(NULL, 'Inverted Row',               'back',       'none',      'bodyweight_reps', '{biceps}'),
(NULL, 'Pike Push-Up',               'shoulders',  'none',      'bodyweight_reps', '{triceps}'),
(NULL, 'Mountain Climber',           'abs',        'none',      'bodyweight_reps', '{quads,shoulders}'),
(NULL, 'Burpee',                     'full_body',  'none',      'bodyweight_reps', '{}'),

-- ── WEIGHTED BODYWEIGHT ──────────────────────────────────
(NULL, 'Weighted Pull-Up',           'back',       'none',      'weighted_bodyweight', '{biceps}'),
(NULL, 'Weighted Dip',               'triceps',    'none',      'weighted_bodyweight', '{chest,shoulders}'),
(NULL, 'Weighted Push-Up',           'chest',      'none',      'weighted_bodyweight', '{triceps}'),
(NULL, 'Weighted Lunge',             'quads',      'dumbbell',  'weighted_bodyweight', '{glutes}'),

-- ── ASSISTED BODYWEIGHT ──────────────────────────────────
(NULL, 'Assisted Pull-Up',           'back',       'machine',   'assisted_bodyweight', '{biceps}'),
(NULL, 'Assisted Dip',               'triceps',    'machine',   'assisted_bodyweight', '{chest}'),

-- ── DURATION ─────────────────────────────────────────────
(NULL, 'Plank',                      'abs',        'none',      'duration', '{shoulders}'),
(NULL, 'Side Plank',                 'abs',        'none',      'duration', '{}'),
(NULL, 'Wall Sit',                   'quads',      'none',      'duration', '{}'),
(NULL, 'Dead Hang',                  'forearms',   'none',      'duration', '{back}'),
(NULL, 'L-Sit Hold',                 'abs',        'none',      'duration', '{quads}'),

-- ── DURATION & WEIGHT ────────────────────────────────────
(NULL, 'Farmer''s Hold',             'forearms',   'dumbbell',  'duration_weight', '{traps}'),
(NULL, 'Weighted Plank',             'abs',        'plate',     'duration_weight', '{}'),

-- ── DISTANCE & DURATION ──────────────────────────────────
(NULL, 'Running',                    'full_body',  'none',      'distance_duration', '{}'),
(NULL, 'Cycling',                    'quads',      'machine',   'distance_duration', '{hamstrings,calves}'),
(NULL, 'Rowing (Cardio)',            'full_body',  'machine',   'distance_duration', '{}'),
(NULL, 'Swimming',                   'full_body',  'none',      'distance_duration', '{}'),
(NULL, 'Walking',                    'full_body',  'none',      'distance_duration', '{}'),
(NULL, 'Elliptical',                 'full_body',  'machine',   'distance_duration', '{}'),
(NULL, 'Stair Climber',              'quads',      'machine',   'distance_duration', '{glutes,calves}'),

-- ── WEIGHT & DISTANCE ────────────────────────────────────
(NULL, 'Farmer''s Carry',            'forearms',   'dumbbell',  'weight_distance', '{traps}'),
(NULL, 'Sled Push',                  'quads',      'other',     'weight_distance', '{glutes,calves}'),
(NULL, 'Sled Pull',                  'back',       'other',     'weight_distance', '{hamstrings}');


-- =========================================================
-- 2. USER SEED DATA
--    Push / Pull / Legs routine + 12 weeks of history
-- =========================================================
DO $$
DECLARE
  user_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS

  -- Exercise IDs (looked up from the public library)
  ex_bench UUID;
  ex_incline_db UUID;
  ex_cable_fly UUID;
  ex_ohp UUID;
  ex_lat_raise UUID;
  ex_tri_push UUID;
  ex_tri_oh UUID;
  ex_bb_row UUID;
  ex_lat_pull UUID;
  ex_cable_row UUID;
  ex_face_pull UUID;
  ex_bb_curl UUID;
  ex_hammer UUID;
  ex_squat UUID;
  ex_leg_press UUID;
  ex_leg_ext UUID;
  ex_rdl UUID;
  ex_leg_curl UUID;
  ex_hip_thrust UUID;
  ex_cable_crunch UUID;
  ex_calf_raise UUID;

  -- Routine / day IDs
  r_ppl UUID;
  d_push UUID;
  d_pull UUID;
  d_legs UUID;

  -- Routine day exercise IDs (push)
  rde_bench UUID;
  rde_incline UUID;
  rde_ohp UUID;
  rde_lat_raise UUID;
  rde_tri_push UUID;
  rde_tri_oh UUID;

  -- Routine day exercise IDs (pull)
  rde_row UUID;
  rde_lat_pull UUID;
  rde_cable_row UUID;
  rde_face_pull UUID;
  rde_curl UUID;
  rde_hammer UUID;

  -- Routine day exercise IDs (legs)
  rde_squat UUID;
  rde_leg_press UUID;
  rde_rdl UUID;
  rde_leg_curl UUID;
  rde_hip_thrust UUID;
  rde_calf UUID;

  -- Loop variables
  week INT;
  sess UUID;
  sess_start TIMESTAMPTZ;
  sess_end TIMESTAMPTZ;
  base_date TIMESTAMPTZ := '2026-01-05 07:00:00+00';
  duration_mins INT;
  w_mult REAL;

BEGIN
  -- ─── Look up exercises from public library ──────────────
  SELECT id INTO ex_bench       FROM exercises WHERE name = 'Barbell Bench Press'        AND user_id IS NULL;
  SELECT id INTO ex_incline_db  FROM exercises WHERE name = 'Incline Dumbbell Press'     AND user_id IS NULL;
  SELECT id INTO ex_cable_fly   FROM exercises WHERE name = 'Cable Fly'                  AND user_id IS NULL;
  SELECT id INTO ex_ohp         FROM exercises WHERE name = 'Overhead Press'             AND user_id IS NULL;
  SELECT id INTO ex_lat_raise   FROM exercises WHERE name = 'Lateral Raise'              AND user_id IS NULL;
  SELECT id INTO ex_tri_push    FROM exercises WHERE name = 'Tricep Pushdown'            AND user_id IS NULL;
  SELECT id INTO ex_tri_oh      FROM exercises WHERE name = 'Overhead Tricep Extension'  AND user_id IS NULL;
  SELECT id INTO ex_bb_row      FROM exercises WHERE name = 'Barbell Row'                AND user_id IS NULL;
  SELECT id INTO ex_lat_pull    FROM exercises WHERE name = 'Lat Pulldown'               AND user_id IS NULL;
  SELECT id INTO ex_cable_row   FROM exercises WHERE name = 'Seated Cable Row'           AND user_id IS NULL;
  SELECT id INTO ex_face_pull   FROM exercises WHERE name = 'Face Pull'                  AND user_id IS NULL;
  SELECT id INTO ex_bb_curl     FROM exercises WHERE name = 'Barbell Curl'               AND user_id IS NULL;
  SELECT id INTO ex_hammer      FROM exercises WHERE name = 'Dumbbell Hammer Curl'       AND user_id IS NULL;
  SELECT id INTO ex_squat       FROM exercises WHERE name = 'Barbell Squat'              AND user_id IS NULL;
  SELECT id INTO ex_leg_press   FROM exercises WHERE name = 'Leg Press'                  AND user_id IS NULL;
  SELECT id INTO ex_leg_ext     FROM exercises WHERE name = 'Leg Extension'              AND user_id IS NULL;
  SELECT id INTO ex_rdl         FROM exercises WHERE name = 'Romanian Deadlift'          AND user_id IS NULL;
  SELECT id INTO ex_leg_curl    FROM exercises WHERE name = 'Leg Curl'                   AND user_id IS NULL;
  SELECT id INTO ex_hip_thrust  FROM exercises WHERE name = 'Hip Thrust'                 AND user_id IS NULL;
  SELECT id INTO ex_cable_crunch FROM exercises WHERE name = 'Cable Crunch'              AND user_id IS NULL;
  SELECT id INTO ex_calf_raise  FROM exercises WHERE name = 'Calf Raise'                 AND user_id IS NULL;

  -- ─── Routine ────────────────────────────────────────────
  INSERT INTO routines (user_id, name, is_active)
    VALUES (user_uuid, 'Push / Pull / Legs', true)
    RETURNING id INTO r_ppl;

  -- ─── Routine Days ───────────────────────────────────────
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 1, 'Push Day')
    RETURNING id INTO d_push;
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 3, 'Pull Day')
    RETURNING id INTO d_pull;
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 5, 'Leg Day')
    RETURNING id INTO d_legs;

  -- ─── Routine Day Exercises ──────────────────────────────
  -- Push Day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_bench,     0, 4, 10) RETURNING id INTO rde_bench;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_incline_db,1, 3, 10) RETURNING id INTO rde_incline;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_ohp,       2, 3, 10) RETURNING id INTO rde_ohp;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_lat_raise, 3, 3, 12) RETURNING id INTO rde_lat_raise;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_tri_push,  4, 3, 12) RETURNING id INTO rde_tri_push;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_tri_oh,    5, 3, 12) RETURNING id INTO rde_tri_oh;

  -- Pull Day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_bb_row,    0, 4, 10) RETURNING id INTO rde_row;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_lat_pull,  1, 3, 10) RETURNING id INTO rde_lat_pull;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_cable_row, 2, 3, 10) RETURNING id INTO rde_cable_row;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_face_pull, 3, 3, 15) RETURNING id INTO rde_face_pull;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_bb_curl,   4, 3, 10) RETURNING id INTO rde_curl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_hammer,    5, 3, 10) RETURNING id INTO rde_hammer;

  -- Leg Day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_squat,     0, 4, 8)  RETURNING id INTO rde_squat;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_leg_press, 1, 3, 10) RETURNING id INTO rde_leg_press;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_rdl,       2, 3, 10) RETURNING id INTO rde_rdl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_leg_curl,  3, 3, 12) RETURNING id INTO rde_leg_curl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_hip_thrust,4, 3, 10) RETURNING id INTO rde_hip_thrust;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_calf_raise,5, 4, 15) RETURNING id INTO rde_calf;

  -- ─── Per-Set Targets ────────────────────────────────────
  -- Push: Bench 4×10 @ 135
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_bench, 1, 135, 8, 10, 2), (rde_bench, 2, 135, 8, 10, 2),
    (rde_bench, 3, 135, 8, 10, 1), (rde_bench, 4, 135, 8, 10, 0);
  -- Push: Incline DB 3×10 @ 50
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_incline, 1, 50, 8, 12, 2), (rde_incline, 2, 50, 8, 12, 1), (rde_incline, 3, 50, 8, 12, 1);
  -- Push: OHP 3×10 @ 95
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_ohp, 1, 95, 8, 10, 2), (rde_ohp, 2, 95, 8, 10, 1), (rde_ohp, 3, 95, 8, 10, 0);
  -- Push: Lateral Raise 3×12 @ 20
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_lat_raise, 1, 20, 10, 15, 2), (rde_lat_raise, 2, 20, 10, 15, 1), (rde_lat_raise, 3, 20, 10, 15, 1);
  -- Push: Tricep Pushdown 3×12 @ 50
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_tri_push, 1, 50, 10, 15, 2), (rde_tri_push, 2, 50, 10, 15, 1), (rde_tri_push, 3, 50, 10, 15, 0);
  -- Push: OH Tricep Ext 3×12 @ 40
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_tri_oh, 1, 40, 10, 15, 2), (rde_tri_oh, 2, 40, 10, 15, 1), (rde_tri_oh, 3, 40, 10, 15, 0);

  -- Pull: BB Row 4×10 @ 135
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_row, 1, 135, 8, 10, 2), (rde_row, 2, 135, 8, 10, 1),
    (rde_row, 3, 135, 8, 10, 1), (rde_row, 4, 135, 8, 10, 0);
  -- Pull: Lat Pulldown 3×10 @ 120
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_lat_pull, 1, 120, 8, 12, 2), (rde_lat_pull, 2, 120, 8, 12, 1), (rde_lat_pull, 3, 120, 8, 12, 1);
  -- Pull: Cable Row 3×10 @ 110
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_cable_row, 1, 110, 8, 12, 2), (rde_cable_row, 2, 110, 8, 12, 1), (rde_cable_row, 3, 110, 8, 12, 1);
  -- Pull: Face Pull 3×15 @ 40
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_face_pull, 1, 40, 12, 15, 2), (rde_face_pull, 2, 40, 12, 15, 1), (rde_face_pull, 3, 40, 12, 15, 1);
  -- Pull: BB Curl 3×10 @ 65
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_curl, 1, 65, 8, 12, 2), (rde_curl, 2, 65, 8, 12, 1), (rde_curl, 3, 65, 8, 12, 0);
  -- Pull: Hammer Curl 3×10 @ 30
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_hammer, 1, 30, 8, 12, 2), (rde_hammer, 2, 30, 8, 12, 1), (rde_hammer, 3, 30, 8, 12, 0);

  -- Legs: Squat 4×8 @ 185
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_squat, 1, 185, 6, 8, 2), (rde_squat, 2, 185, 6, 8, 1),
    (rde_squat, 3, 185, 6, 8, 1), (rde_squat, 4, 185, 6, 8, 0);
  -- Legs: Leg Press 3×10 @ 270
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_leg_press, 1, 270, 8, 12, 2), (rde_leg_press, 2, 270, 8, 12, 1), (rde_leg_press, 3, 270, 8, 12, 1);
  -- Legs: RDL 3×10 @ 155
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_rdl, 1, 155, 8, 10, 2), (rde_rdl, 2, 155, 8, 10, 1), (rde_rdl, 3, 155, 8, 10, 1);
  -- Legs: Leg Curl 3×12 @ 90
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_leg_curl, 1, 90, 10, 12, 2), (rde_leg_curl, 2, 90, 10, 12, 1), (rde_leg_curl, 3, 90, 10, 12, 0);
  -- Legs: Hip Thrust 3×10 @ 185
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_hip_thrust, 1, 185, 8, 10, 2), (rde_hip_thrust, 2, 185, 8, 10, 1), (rde_hip_thrust, 3, 185, 8, 10, 0);
  -- Legs: Calf Raise 4×15 @ 150
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir) VALUES
    (rde_calf, 1, 150, 12, 15, 2), (rde_calf, 2, 150, 12, 15, 1),
    (rde_calf, 3, 150, 12, 15, 1), (rde_calf, 4, 150, 12, 15, 0);

  -- ─── Workout Sessions + Set Logs ────────────────────────
  -- 12 weeks PPL, ~4 sessions/week, progressive overload +2.5%/wk
  FOR week IN 0..11 LOOP
    w_mult := 1.0 + (week * 0.025);

    -- ════ PUSH DAY (every week) ════
    duration_mins := 55 + (random() * 20)::INT;
    sess_start := base_date + (week * 7 || ' days')::INTERVAL
                  + ((random() * 30)::INT || ' minutes')::INTERVAL;
    sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

    INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_push, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_bench, 1, ROUND((135 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 0),
      (sess, ex_bench, 2, ROUND((135 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.5)::INT, 2, false, 0),
      (sess, ex_bench, 3, ROUND((135 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.6)::INT, 1, false, 0),
      (sess, ex_bench, 4, ROUND((135 * w_mult)::numeric / 5) * 5,  7 + (random() < 0.5)::INT, 0, false, 0);
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_incline_db, 1, ROUND((50 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
      (sess, ex_incline_db, 2, ROUND((50 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 1),
      (sess, ex_incline_db, 3, ROUND((50 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 1, false, 1);
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_ohp, 1, ROUND((95 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
      (sess, ex_ohp, 2, ROUND((95 * w_mult)::numeric / 5) * 5,  9 - (random() < 0.3)::INT, 1, false, 2),
      (sess, ex_ohp, 3, ROUND((95 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.4)::INT, 0, false, 2);
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_lat_raise, 1, ROUND((20 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.5)::INT, 2, false, 3),
      (sess, ex_lat_raise, 2, ROUND((20 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 3),
      (sess, ex_lat_raise, 3, ROUND((20 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.6)::INT, 1, false, 3);
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_tri_push, 1, ROUND((50 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 2, false, 4),
      (sess, ex_tri_push, 2, ROUND((50 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.5)::INT, 1, false, 4),
      (sess, ex_tri_push, 3, ROUND((50 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.4)::INT, 0, false, 4);
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_tri_oh, 1, ROUND((40 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.3)::INT, 2, false, 5),
      (sess, ex_tri_oh, 2, ROUND((40 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 5),
      (sess, ex_tri_oh, 3, ROUND((40 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 0, false, 5);

    -- ════ PULL DAY (skip week 9) ════
    IF week <> 9 THEN
      duration_mins := 50 + (random() * 25)::INT;
      sess_start := base_date + (week * 7 + 2 || ' days')::INTERVAL
                    + ((random() * 30)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_pull, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_bb_row, 1, ROUND((135 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 0),
        (sess, ex_bb_row, 2, ROUND((135 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 0),
        (sess, ex_bb_row, 3, ROUND((135 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 1, false, 0),
        (sess, ex_bb_row, 4, ROUND((135 * w_mult)::numeric / 5) * 5,  7 + (random() < 0.5)::INT, 0, false, 0);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_lat_pull, 1, ROUND((120 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
        (sess, ex_lat_pull, 2, ROUND((120 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.5)::INT, 1, false, 1),
        (sess, ex_lat_pull, 3, ROUND((120 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.6)::INT, 1, false, 1);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_cable_row, 1, ROUND((110 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
        (sess, ex_cable_row, 2, ROUND((110 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 2),
        (sess, ex_cable_row, 3, ROUND((110 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 1, false, 2);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_face_pull, 1, ROUND((40 * w_mult)::numeric / 5) * 5, 14 + (random() < 0.5)::INT, 2, false, 3),
        (sess, ex_face_pull, 2, ROUND((40 * w_mult)::numeric / 5) * 5, 13 + (random() < 0.5)::INT, 1, false, 3),
        (sess, ex_face_pull, 3, ROUND((40 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 1, false, 3);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_bb_curl, 1, ROUND((65 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 4),
        (sess, ex_bb_curl, 2, ROUND((65 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 4),
        (sess, ex_bb_curl, 3, ROUND((65 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 0, false, 4);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_hammer, 1, ROUND((30 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 2, false, 5),
        (sess, ex_hammer, 2, ROUND((30 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 5),
        (sess, ex_hammer, 3, ROUND((30 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 0, false, 5);
    END IF;

    -- ════ LEG DAY (skip week 5) ════
    IF week <> 5 THEN
      duration_mins := 55 + (random() * 25)::INT;
      sess_start := base_date + (week * 7 + 4 || ' days')::INTERVAL
                    + ((random() * 30)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_legs, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_squat, 1, ROUND((185 * w_mult)::numeric / 5) * 5, 8 - (random() < 0.3)::INT, 2, false, 0),
        (sess, ex_squat, 2, ROUND((185 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT, 1, false, 0),
        (sess, ex_squat, 3, ROUND((185 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.6)::INT, 1, false, 0),
        (sess, ex_squat, 4, ROUND((185 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.4)::INT, 0, false, 0);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_leg_press, 1, ROUND((270 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
        (sess, ex_leg_press, 2, ROUND((270 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.5)::INT, 1, false, 1),
        (sess, ex_leg_press, 3, ROUND((270 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 1, false, 1);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_rdl, 1, ROUND((155 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
        (sess, ex_rdl, 2, ROUND((155 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.4)::INT, 1, false, 2),
        (sess, ex_rdl, 3, ROUND((155 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 1, false, 2);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_leg_curl, 1, ROUND((90 * w_mult)::numeric / 5) * 5, 12 - (random() < 0.2)::INT, 2, false, 3),
        (sess, ex_leg_curl, 2, ROUND((90 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 3),
        (sess, ex_leg_curl, 3, ROUND((90 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 0, false, 3);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_hip_thrust, 1, ROUND((185 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 4),
        (sess, ex_hip_thrust, 2, ROUND((185 * w_mult)::numeric / 5) * 5,  9 + (random() < 0.5)::INT, 1, false, 4),
        (sess, ex_hip_thrust, 3, ROUND((185 * w_mult)::numeric / 5) * 5,  8 + (random() < 0.5)::INT, 0, false, 4);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_calf_raise, 1, ROUND((150 * w_mult)::numeric / 5) * 5, 15 - (random() < 0.3)::INT, 2, false, 5),
        (sess, ex_calf_raise, 2, ROUND((150 * w_mult)::numeric / 5) * 5, 14 + (random() < 0.4)::INT, 1, false, 5),
        (sess, ex_calf_raise, 3, ROUND((150 * w_mult)::numeric / 5) * 5, 13 + (random() < 0.5)::INT, 1, false, 5),
        (sess, ex_calf_raise, 4, ROUND((150 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 0, false, 5);
    END IF;

    -- ════ SECOND PUSH (Sat) most weeks for ~4×/week ════
    IF week NOT IN (5, 9) THEN
      duration_mins := 50 + (random() * 20)::INT;
      sess_start := base_date + (week * 7 + 5 || ' days')::INTERVAL
                    + ((random() * 45)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_push, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_bench, 1, ROUND((140 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT, 2, false, 0),
        (sess, ex_bench, 2, ROUND((140 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT, 1, false, 0),
        (sess, ex_bench, 3, ROUND((140 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.6)::INT, 0, false, 0);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_incline_db, 1, ROUND((55 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT, 2, false, 1),
        (sess, ex_incline_db, 2, ROUND((55 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT, 1, false, 1),
        (sess, ex_incline_db, 3, ROUND((55 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT, 0, false, 1);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_ohp, 1, ROUND((100 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.4)::INT, 2, false, 2),
        (sess, ex_ohp, 2, ROUND((100 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT, 1, false, 2),
        (sess, ex_ohp, 3, ROUND((100 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.5)::INT, 0, false, 2);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_cable_fly, 1, ROUND((30 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.5)::INT, 2, false, 3),
        (sess, ex_cable_fly, 2, ROUND((30 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 3),
        (sess, ex_cable_fly, 3, ROUND((30 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 0, false, 3);
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_tri_push, 1, ROUND((55 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 2, false, 4),
        (sess, ex_tri_push, 2, ROUND((55 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.5)::INT, 1, false, 4),
        (sess, ex_tri_push, 3, ROUND((55 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.4)::INT, 0, false, 4);
    END IF;

  END LOOP;

  RAISE NOTICE 'Seed complete for user %', user_uuid;
END $$;
