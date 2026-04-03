-- =============================================================
-- Workout Tracker Seed Data
-- Simulates ~3 months of consistent PPL training with
-- progressive overload, realistic reps, and some variation.
--
-- USAGE:
--   1. Open Supabase Dashboard > SQL Editor
--   2. Replace the user_uuid on line 16 with your actual user ID
--      (find it in Authentication > Users)
--   3. Run this entire script
--   4. Refresh the app
-- =============================================================

DO $$
DECLARE
  user_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS

  -- Exercise IDs
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
  base_date TIMESTAMPTZ := '2026-01-05 07:00:00+00'; -- Monday of week 1
  duration_mins INT;
  w_mult REAL; -- weight multiplier for progressive overload

BEGIN

  -- =========================================================
  -- 1. EXERCISES
  -- =========================================================
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Barbell Bench Press', 'chest', 'barbell')
    RETURNING id INTO ex_bench;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Incline Dumbbell Press', 'chest', 'dumbbell')
    RETURNING id INTO ex_incline_db;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Cable Fly', 'chest', 'cable')
    RETURNING id INTO ex_cable_fly;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Overhead Press', 'shoulders', 'barbell')
    RETURNING id INTO ex_ohp;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Lateral Raise', 'shoulders', 'dumbbell')
    RETURNING id INTO ex_lat_raise;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Tricep Pushdown', 'triceps', 'cable')
    RETURNING id INTO ex_tri_push;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Overhead Tricep Extension', 'triceps', 'cable')
    RETURNING id INTO ex_tri_oh;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Barbell Row', 'back', 'barbell')
    RETURNING id INTO ex_bb_row;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Lat Pulldown', 'back', 'cable')
    RETURNING id INTO ex_lat_pull;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Seated Cable Row', 'back', 'cable')
    RETURNING id INTO ex_cable_row;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Face Pull', 'shoulders', 'cable')
    RETURNING id INTO ex_face_pull;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Barbell Curl', 'biceps', 'barbell')
    RETURNING id INTO ex_bb_curl;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Dumbbell Hammer Curl', 'biceps', 'dumbbell')
    RETURNING id INTO ex_hammer;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Barbell Squat', 'quads', 'barbell')
    RETURNING id INTO ex_squat;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Leg Press', 'quads', 'machine')
    RETURNING id INTO ex_leg_press;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Leg Extension', 'quads', 'machine')
    RETURNING id INTO ex_leg_ext;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Romanian Deadlift', 'hamstrings', 'barbell')
    RETURNING id INTO ex_rdl;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Leg Curl', 'hamstrings', 'machine')
    RETURNING id INTO ex_leg_curl;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Hip Thrust', 'glutes', 'barbell')
    RETURNING id INTO ex_hip_thrust;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Cable Crunch', 'abs', 'cable')
    RETURNING id INTO ex_cable_crunch;
  INSERT INTO exercises (user_id, name, muscle_group, equipment)
    VALUES (user_uuid, 'Calf Raise', 'calves', 'machine')
    RETURNING id INTO ex_calf_raise;

  -- =========================================================
  -- 2. ROUTINE
  -- =========================================================
  INSERT INTO routines (user_id, name, is_active)
    VALUES (user_uuid, 'Push / Pull / Legs', true)
    RETURNING id INTO r_ppl;

  -- =========================================================
  -- 3. ROUTINE DAYS
  -- =========================================================
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 1, 'Push Day')
    RETURNING id INTO d_push;
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 3, 'Pull Day')
    RETURNING id INTO d_pull;
  INSERT INTO routine_days (routine_id, day_of_week, label)
    VALUES (r_ppl, 5, 'Leg Day')
    RETURNING id INTO d_legs;

  -- =========================================================
  -- 4. ROUTINE DAY EXERCISES
  -- =========================================================

  -- Push Day (6 exercises)
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_bench, 0, 4, 10) RETURNING id INTO rde_bench;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_incline_db, 1, 3, 10) RETURNING id INTO rde_incline;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_ohp, 2, 3, 10) RETURNING id INTO rde_ohp;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_lat_raise, 3, 3, 12) RETURNING id INTO rde_lat_raise;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_tri_push, 4, 3, 12) RETURNING id INTO rde_tri_push;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_push, ex_tri_oh, 5, 3, 12) RETURNING id INTO rde_tri_oh;

  -- Pull Day (6 exercises)
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_bb_row, 0, 4, 10) RETURNING id INTO rde_row;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_lat_pull, 1, 3, 10) RETURNING id INTO rde_lat_pull;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_cable_row, 2, 3, 10) RETURNING id INTO rde_cable_row;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_face_pull, 3, 3, 15) RETURNING id INTO rde_face_pull;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_bb_curl, 4, 3, 10) RETURNING id INTO rde_curl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_pull, ex_hammer, 5, 3, 10) RETURNING id INTO rde_hammer;

  -- Leg Day (6 exercises)
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_squat, 0, 4, 8) RETURNING id INTO rde_squat;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_leg_press, 1, 3, 10) RETURNING id INTO rde_leg_press;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_rdl, 2, 3, 10) RETURNING id INTO rde_rdl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_leg_curl, 3, 3, 12) RETURNING id INTO rde_leg_curl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_hip_thrust, 4, 3, 10) RETURNING id INTO rde_hip_thrust;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
    VALUES (d_legs, ex_calf_raise, 5, 4, 15) RETURNING id INTO rde_calf;

  -- =========================================================
  -- 5. ROUTINE DAY EXERCISE SETS (per-set targets)
  -- =========================================================

  -- Push: Bench 4x10 @ 135
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_bench, 1, 135, 8, 10), (rde_bench, 2, 135, 8, 10),
    (rde_bench, 3, 135, 8, 10), (rde_bench, 4, 135, 8, 10);
  -- Push: Incline DB 3x10 @ 50
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_incline, 1, 50, 8, 12), (rde_incline, 2, 50, 8, 12), (rde_incline, 3, 50, 8, 12);
  -- Push: OHP 3x10 @ 95
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_ohp, 1, 95, 8, 10), (rde_ohp, 2, 95, 8, 10), (rde_ohp, 3, 95, 8, 10);
  -- Push: Lateral Raise 3x12 @ 20
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_lat_raise, 1, 20, 10, 15), (rde_lat_raise, 2, 20, 10, 15), (rde_lat_raise, 3, 20, 10, 15);
  -- Push: Tricep Pushdown 3x12 @ 50
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_tri_push, 1, 50, 10, 15), (rde_tri_push, 2, 50, 10, 15), (rde_tri_push, 3, 50, 10, 15);
  -- Push: OH Tricep Ext 3x12 @ 40
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_tri_oh, 1, 40, 10, 15), (rde_tri_oh, 2, 40, 10, 15), (rde_tri_oh, 3, 40, 10, 15);

  -- Pull: BB Row 4x10 @ 135
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_row, 1, 135, 8, 10), (rde_row, 2, 135, 8, 10),
    (rde_row, 3, 135, 8, 10), (rde_row, 4, 135, 8, 10);
  -- Pull: Lat Pulldown 3x10 @ 120
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_lat_pull, 1, 120, 8, 12), (rde_lat_pull, 2, 120, 8, 12), (rde_lat_pull, 3, 120, 8, 12);
  -- Pull: Cable Row 3x10 @ 110
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_cable_row, 1, 110, 8, 12), (rde_cable_row, 2, 110, 8, 12), (rde_cable_row, 3, 110, 8, 12);
  -- Pull: Face Pull 3x15 @ 40
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_face_pull, 1, 40, 12, 15), (rde_face_pull, 2, 40, 12, 15), (rde_face_pull, 3, 40, 12, 15);
  -- Pull: BB Curl 3x10 @ 65
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_curl, 1, 65, 8, 12), (rde_curl, 2, 65, 8, 12), (rde_curl, 3, 65, 8, 12);
  -- Pull: Hammer Curl 3x10 @ 30
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_hammer, 1, 30, 8, 12), (rde_hammer, 2, 30, 8, 12), (rde_hammer, 3, 30, 8, 12);

  -- Legs: Squat 4x8 @ 185
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_squat, 1, 185, 6, 8), (rde_squat, 2, 185, 6, 8),
    (rde_squat, 3, 185, 6, 8), (rde_squat, 4, 185, 6, 8);
  -- Legs: Leg Press 3x10 @ 270
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_leg_press, 1, 270, 8, 12), (rde_leg_press, 2, 270, 8, 12), (rde_leg_press, 3, 270, 8, 12);
  -- Legs: RDL 3x10 @ 155
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_rdl, 1, 155, 8, 10), (rde_rdl, 2, 155, 8, 10), (rde_rdl, 3, 155, 8, 10);
  -- Legs: Leg Curl 3x12 @ 90
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_leg_curl, 1, 90, 10, 12), (rde_leg_curl, 2, 90, 10, 12), (rde_leg_curl, 3, 90, 10, 12);
  -- Legs: Hip Thrust 3x10 @ 185
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_hip_thrust, 1, 185, 8, 10), (rde_hip_thrust, 2, 185, 8, 10), (rde_hip_thrust, 3, 185, 8, 10);
  -- Legs: Calf Raise 4x15 @ 150
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max) VALUES
    (rde_calf, 1, 150, 12, 15), (rde_calf, 2, 150, 12, 15),
    (rde_calf, 3, 150, 12, 15), (rde_calf, 4, 150, 12, 15);

  -- =========================================================
  -- 6. WORKOUT SESSIONS + SET LOGS
  --    12 weeks of PPL, ~4 sessions/week
  --    Progressive overload: +2.5% per week on compounds
  -- =========================================================

  FOR week IN 0..11 LOOP
    -- Weight multiplier: starts at 1.0, adds ~2.5% per week
    w_mult := 1.0 + (week * 0.025);

    -- Skip some sessions in weeks 5 and 9 for realism
    -- Week 5: only push + pull (no second cycle)
    -- Week 9: only push + legs (no pull)

    -- ==== PUSH DAY (every week) ====
    duration_mins := 55 + (random() * 20)::INT;
    sess_start := base_date + (week * 7 || ' days')::INTERVAL
                  + ((random() * 30)::INT || ' minutes')::INTERVAL;
    sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

    INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_push, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

    -- Bench Press 4 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_bench, 1, ROUND((135 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 0),
      (sess, ex_bench, 2, ROUND((135 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.5)::INT,  2, false, 0),
      (sess, ex_bench, 3, ROUND((135 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.6)::INT,  1, false, 0),
      (sess, ex_bench, 4, ROUND((135 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT,  0, false, 0);
    -- Incline DB 3 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_incline_db, 1, ROUND((50 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
      (sess, ex_incline_db, 2, ROUND((50 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 1),
      (sess, ex_incline_db, 3, ROUND((50 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  1, false, 1);
    -- OHP 3 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_ohp, 1, ROUND((95 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
      (sess, ex_ohp, 2, ROUND((95 * w_mult)::numeric / 5) * 5, 9 - (random() < 0.3)::INT,  1, false, 2),
      (sess, ex_ohp, 3, ROUND((95 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.4)::INT,  0, false, 2);
    -- Lateral Raise 3 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_lat_raise, 1, ROUND((20 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.5)::INT, 2, false, 3),
      (sess, ex_lat_raise, 2, ROUND((20 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 3),
      (sess, ex_lat_raise, 3, ROUND((20 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.6)::INT, 1, false, 3);
    -- Tricep Pushdown 3 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_tri_push, 1, ROUND((50 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 2, false, 4),
      (sess, ex_tri_push, 2, ROUND((50 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.5)::INT, 1, false, 4),
      (sess, ex_tri_push, 3, ROUND((50 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.4)::INT, 0, false, 4);
    -- OH Tricep Ext 3 sets
    INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
      (sess, ex_tri_oh, 1, ROUND((40 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.3)::INT, 2, false, 5),
      (sess, ex_tri_oh, 2, ROUND((40 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 5),
      (sess, ex_tri_oh, 3, ROUND((40 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 0, false, 5);

    -- ==== PULL DAY (skip on week 9) ====
    IF week <> 9 THEN
      duration_mins := 50 + (random() * 25)::INT;
      sess_start := base_date + (week * 7 + 2 || ' days')::INTERVAL
                    + ((random() * 30)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_pull, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      -- BB Row 4 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_bb_row, 1, ROUND((135 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 0),
        (sess, ex_bb_row, 2, ROUND((135 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 0),
        (sess, ex_bb_row, 3, ROUND((135 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  1, false, 0),
        (sess, ex_bb_row, 4, ROUND((135 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT,  0, false, 0);
      -- Lat Pulldown 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_lat_pull, 1, ROUND((120 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
        (sess, ex_lat_pull, 2, ROUND((120 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.5)::INT,  1, false, 1),
        (sess, ex_lat_pull, 3, ROUND((120 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.6)::INT,  1, false, 1);
      -- Cable Row 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_cable_row, 1, ROUND((110 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
        (sess, ex_cable_row, 2, ROUND((110 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 2),
        (sess, ex_cable_row, 3, ROUND((110 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  1, false, 2);
      -- Face Pull 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_face_pull, 1, ROUND((40 * w_mult)::numeric / 5) * 5, 14 + (random() < 0.5)::INT, 2, false, 3),
        (sess, ex_face_pull, 2, ROUND((40 * w_mult)::numeric / 5) * 5, 13 + (random() < 0.5)::INT, 1, false, 3),
        (sess, ex_face_pull, 3, ROUND((40 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 1, false, 3);
      -- BB Curl 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_bb_curl, 1, ROUND((65 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 4),
        (sess, ex_bb_curl, 2, ROUND((65 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 4),
        (sess, ex_bb_curl, 3, ROUND((65 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  0, false, 4);
      -- Hammer Curl 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_hammer, 1, ROUND((30 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 2, false, 5),
        (sess, ex_hammer, 2, ROUND((30 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 5),
        (sess, ex_hammer, 3, ROUND((30 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  0, false, 5);
    END IF;

    -- ==== LEG DAY (skip on week 5) ====
    IF week <> 5 THEN
      duration_mins := 55 + (random() * 25)::INT;
      sess_start := base_date + (week * 7 + 4 || ' days')::INTERVAL
                    + ((random() * 30)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_legs, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      -- Squat 4 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_squat, 1, ROUND((185 * w_mult)::numeric / 5) * 5, 8 - (random() < 0.3)::INT, 2, false, 0),
        (sess, ex_squat, 2, ROUND((185 * w_mult)::numeric / 5) * 5, 7 + (random() < 0.5)::INT, 1, false, 0),
        (sess, ex_squat, 3, ROUND((185 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.6)::INT, 1, false, 0),
        (sess, ex_squat, 4, ROUND((185 * w_mult)::numeric / 5) * 5, 6 + (random() < 0.4)::INT, 0, false, 0);
      -- Leg Press 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_leg_press, 1, ROUND((270 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 1),
        (sess, ex_leg_press, 2, ROUND((270 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.5)::INT, 1, false, 1),
        (sess, ex_leg_press, 3, ROUND((270 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT, 1, false, 1);
      -- RDL 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_rdl, 1, ROUND((155 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 2),
        (sess, ex_rdl, 2, ROUND((155 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT,  1, false, 2),
        (sess, ex_rdl, 3, ROUND((155 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  1, false, 2);
      -- Leg Curl 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_leg_curl, 1, ROUND((90 * w_mult)::numeric / 5) * 5, 12 - (random() < 0.2)::INT, 2, false, 3),
        (sess, ex_leg_curl, 2, ROUND((90 * w_mult)::numeric / 5) * 5, 11 + (random() < 0.4)::INT, 1, false, 3),
        (sess, ex_leg_curl, 3, ROUND((90 * w_mult)::numeric / 5) * 5, 10 + (random() < 0.5)::INT, 0, false, 3);
      -- Hip Thrust 3 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_hip_thrust, 1, ROUND((185 * w_mult)::numeric / 5) * 5, 10 - (random() < 0.2)::INT, 2, false, 4),
        (sess, ex_hip_thrust, 2, ROUND((185 * w_mult)::numeric / 5) * 5, 9 + (random() < 0.5)::INT,  1, false, 4),
        (sess, ex_hip_thrust, 3, ROUND((185 * w_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT,  0, false, 4);
      -- Calf Raise 4 sets
      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order) VALUES
        (sess, ex_calf_raise, 1, ROUND((150 * w_mult)::numeric / 5) * 5, 15 - (random() < 0.3)::INT, 2, false, 5),
        (sess, ex_calf_raise, 2, ROUND((150 * w_mult)::numeric / 5) * 5, 14 + (random() < 0.4)::INT, 1, false, 5),
        (sess, ex_calf_raise, 3, ROUND((150 * w_mult)::numeric / 5) * 5, 13 + (random() < 0.5)::INT, 1, false, 5),
        (sess, ex_calf_raise, 4, ROUND((150 * w_mult)::numeric / 5) * 5, 12 + (random() < 0.4)::INT, 0, false, 5);
    END IF;

    -- ==== SECOND PUSH (Sat) on most weeks for 4x/week ====
    -- Skip on weeks 5, 9 for fewer sessions those weeks
    IF week NOT IN (5, 9) THEN
      duration_mins := 50 + (random() * 20)::INT;
      sess_start := base_date + (week * 7 + 5 || ' days')::INTERVAL
                    + ((random() * 45)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (duration_mins || ' minutes')::INTERVAL;

      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
        VALUES (user_uuid, d_push, sess_start, sess_end, 'completed')
        RETURNING id INTO sess;

      -- Slightly higher weights on second push day (heavier singles feel)
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

  RAISE NOTICE 'Seed data inserted successfully for user %', user_uuid;
END $$;
