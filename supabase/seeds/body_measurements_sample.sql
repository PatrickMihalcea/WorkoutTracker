-- Body measurements sample seed data (manual/dev use only)
--
-- Usage:
-- 1) Replace the UUID below with your test user's auth.users.id
-- 2) Run this file in Supabase SQL Editor
-- Helper to find your user id:
--   SELECT id, email FROM auth.users ORDER BY created_at DESC;
--
-- Notes:
-- - Idempotent: rerunning updates existing same-day rows.
-- - Generates one log every 5 days for the last ~8 months.
-- - Includes partial logs on some dates (null values) to mimic real usage.

WITH target_user AS (
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid AS user_id
),
series AS (
  SELECT
    (current_date - INTERVAL '240 days' + make_interval(days => d))::date AS logged_on,
    d::int AS day_offset
  FROM generate_series(0, 240, 5) AS g(d)
),
seed AS (
  SELECT
    tu.user_id,
    s.logged_on,
    ROUND((92.0 - s.day_offset * 0.045 + SIN(s.day_offset / 11.0) * 0.4)::numeric, 1)::real AS body_weight_kg,
    ROUND((97.0 - s.day_offset * 0.030 + COS(s.day_offset / 9.0) * 0.5)::numeric, 1)::real AS waist_cm,
    CASE
      WHEN s.day_offset % 10 = 0 THEN ROUND((24.0 - s.day_offset * 0.020 + COS(s.day_offset / 13.0) * 0.3)::numeric, 1)::real
      ELSE NULL
    END AS body_fat_pct,
    CASE
      WHEN s.day_offset % 10 = 0 THEN ROUND((69.0 + s.day_offset * 0.010 + SIN(s.day_offset / 17.0) * 0.3)::numeric, 1)::real
      ELSE NULL
    END AS lean_body_mass_kg,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((39.0 - s.day_offset * 0.004 + SIN(s.day_offset / 15.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS neck_cm,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((123.0 + s.day_offset * 0.006 + COS(s.day_offset / 18.0) * 0.3)::numeric, 1)::real
      ELSE NULL
    END AS shoulder_cm,
    ROUND((111.0 - s.day_offset * 0.010 + SIN(s.day_offset / 16.0) * 0.4)::numeric, 1)::real AS chest_cm,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((36.0 + s.day_offset * 0.005 + SIN(s.day_offset / 12.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS left_bicep_cm,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((36.3 + s.day_offset * 0.005 + COS(s.day_offset / 12.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS right_bicep_cm,
    CASE
      WHEN s.day_offset % 20 = 0 THEN ROUND((31.0 + s.day_offset * 0.003 + SIN(s.day_offset / 14.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS left_forearm_cm,
    CASE
      WHEN s.day_offset % 20 = 0 THEN ROUND((31.2 + s.day_offset * 0.003 + COS(s.day_offset / 14.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS right_forearm_cm,
    ROUND((101.0 - s.day_offset * 0.020 + SIN(s.day_offset / 10.0) * 0.4)::numeric, 1)::real AS abdomen_cm,
    ROUND((105.0 - s.day_offset * 0.015 + COS(s.day_offset / 11.0) * 0.4)::numeric, 1)::real AS hips_cm,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((60.0 - s.day_offset * 0.006 + SIN(s.day_offset / 13.0) * 0.3)::numeric, 1)::real
      ELSE NULL
    END AS left_thigh_cm,
    CASE
      WHEN s.day_offset % 15 = 0 THEN ROUND((60.4 - s.day_offset * 0.006 + COS(s.day_offset / 13.0) * 0.3)::numeric, 1)::real
      ELSE NULL
    END AS right_thigh_cm,
    CASE
      WHEN s.day_offset % 20 = 0 THEN ROUND((39.0 - s.day_offset * 0.003 + SIN(s.day_offset / 9.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS left_calf_cm,
    CASE
      WHEN s.day_offset % 20 = 0 THEN ROUND((39.3 - s.day_offset * 0.003 + COS(s.day_offset / 9.0) * 0.2)::numeric, 1)::real
      ELSE NULL
    END AS right_calf_cm
  FROM series s
  CROSS JOIN target_user tu
)
INSERT INTO body_measurements (
  user_id,
  logged_on,
  body_weight_kg,
  waist_cm,
  body_fat_pct,
  lean_body_mass_kg,
  neck_cm,
  shoulder_cm,
  chest_cm,
  left_bicep_cm,
  right_bicep_cm,
  left_forearm_cm,
  right_forearm_cm,
  abdomen_cm,
  hips_cm,
  left_thigh_cm,
  right_thigh_cm,
  left_calf_cm,
  right_calf_cm
)
SELECT
  user_id,
  logged_on,
  body_weight_kg,
  waist_cm,
  body_fat_pct,
  lean_body_mass_kg,
  neck_cm,
  shoulder_cm,
  chest_cm,
  left_bicep_cm,
  right_bicep_cm,
  left_forearm_cm,
  right_forearm_cm,
  abdomen_cm,
  hips_cm,
  left_thigh_cm,
  right_thigh_cm,
  left_calf_cm,
  right_calf_cm
FROM seed
ON CONFLICT (user_id, logged_on) DO UPDATE SET
  body_weight_kg = EXCLUDED.body_weight_kg,
  waist_cm = EXCLUDED.waist_cm,
  body_fat_pct = EXCLUDED.body_fat_pct,
  lean_body_mass_kg = EXCLUDED.lean_body_mass_kg,
  neck_cm = EXCLUDED.neck_cm,
  shoulder_cm = EXCLUDED.shoulder_cm,
  chest_cm = EXCLUDED.chest_cm,
  left_bicep_cm = EXCLUDED.left_bicep_cm,
  right_bicep_cm = EXCLUDED.right_bicep_cm,
  left_forearm_cm = EXCLUDED.left_forearm_cm,
  right_forearm_cm = EXCLUDED.right_forearm_cm,
  abdomen_cm = EXCLUDED.abdomen_cm,
  hips_cm = EXCLUDED.hips_cm,
  left_thigh_cm = EXCLUDED.left_thigh_cm,
  right_thigh_cm = EXCLUDED.right_thigh_cm,
  left_calf_cm = EXCLUDED.left_calf_cm,
  right_calf_cm = EXCLUDED.right_calf_cm,
  updated_at = now();

-- Optional profile sync for quick manual testing:
-- UPDATE user_profiles up
-- SET weight_kg = latest.body_weight_kg
-- FROM (
--   SELECT bm.user_id, bm.body_weight_kg
--   FROM body_measurements bm
--   JOIN target_user tu ON tu.user_id = bm.user_id
--   WHERE bm.body_weight_kg IS NOT NULL
--   ORDER BY bm.logged_on DESC, bm.created_at DESC
--   LIMIT 1
-- ) latest
-- WHERE up.id = latest.user_id;
