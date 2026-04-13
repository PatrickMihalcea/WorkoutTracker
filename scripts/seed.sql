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

-- ── CHEST ────────────────────────────────────────────────
(NULL, 'Barbell Bench Press', 'chest', 'barbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Incline Barbell Bench Press', 'chest', 'barbell', 'weight_reps', '{shoulders,triceps}'),
(NULL, 'Decline Barbell Bench Press', 'chest', 'barbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Paused Barbell Bench Press', 'chest', 'barbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Close-Grip Bench Press', 'triceps', 'barbell', 'weight_reps', '{chest,shoulders}'),
(NULL, 'Wide-Grip Bench Press', 'chest', 'barbell', 'weight_reps', '{shoulders,triceps}'),
(NULL, 'Dumbbell Bench Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Incline Dumbbell Press', 'chest', 'dumbbell', 'weight_reps', '{shoulders,triceps}'),
(NULL, 'Decline Dumbbell Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Neutral-Grip Dumbbell Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Single-Arm Dumbbell Floor Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,abs,obliques,shoulders}'),
(NULL, 'Dumbbell Fly', 'chest', 'dumbbell', 'weight_reps', '{shoulders}'),
(NULL, 'Incline Dumbbell Fly', 'chest', 'dumbbell', 'weight_reps', '{shoulders}'),
(NULL, 'Cable Fly', 'chest', 'cable', 'weight_reps', '{shoulders}'),
(NULL, 'Low-to-High Cable Fly', 'chest', 'cable', 'weight_reps', '{shoulders}'),
(NULL, 'High-to-Low Cable Fly', 'chest', 'cable', 'weight_reps', '{shoulders}'),
(NULL, 'Cable Chest Press', 'chest', 'cable', 'weight_reps', '{triceps,shoulders,abs,obliques}'),
(NULL, 'Single-Arm Cable Chest Press', 'chest', 'cable', 'weight_reps', '{triceps,shoulders,abs,obliques}'),
(NULL, 'Machine Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Incline Machine Chest Press', 'chest', 'machine', 'weight_reps', '{shoulders,triceps}'),
(NULL, 'Decline Machine Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}'),
(NULL, 'Pec Deck', 'chest', 'machine', 'weight_reps', '{shoulders}'),
(NULL, 'Machine Fly', 'chest', 'machine', 'weight_reps', '{shoulders}'),
(NULL, 'Plate Press-Out', 'chest', 'plate', 'weight_reps', '{shoulders,triceps}'),
(NULL, 'Resistance Band Chest Press', 'chest', 'resistance_band', 'weight_reps', '{triceps,shoulders,abs,obliques}'),
(NULL, 'Resistance Band Fly', 'chest', 'resistance_band', 'weight_reps', '{shoulders}'),
(NULL, 'Push-Up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}'),
(NULL, 'Wide Push-Up', 'chest', 'none', 'bodyweight_reps', '{shoulders,triceps,abs}'),
(NULL, 'Decline Push-Up', 'chest', 'none', 'bodyweight_reps', '{shoulders,triceps,abs}'),
(NULL, 'Diamond Push-Up', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}'),
(NULL, 'Archer Push-Up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}'),
(NULL, 'Suspension Band Chest Press', 'chest', 'suspension_band', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}'),
(NULL, 'Suspension Band Fly', 'chest', 'suspension_band', 'bodyweight_reps', '{shoulders,abs,obliques}'),
(NULL, 'Weighted Push-Up', 'chest', 'plate', 'weighted_bodyweight', '{triceps,shoulders,abs}'),

-- ── BACK ─────────────────────────────────────────────────
(NULL, 'Deadlift', 'full_body', 'barbell', 'weight_reps', '{lower_back,glutes,hamstrings,upper_back,traps,forearms}'),
(NULL, 'Rack Pull', 'upper_back', 'barbell', 'weight_reps', '{lower_back,traps,glutes,forearms,hamstrings}'),
(NULL, 'Barbell Row', 'upper_back', 'barbell', 'weight_reps', '{lower_back,biceps,forearms,traps}'),
(NULL, 'Pendlay Row', 'upper_back', 'barbell', 'weight_reps', '{lower_back,biceps,forearms,traps}'),
(NULL, 'Yates Row', 'upper_back', 'barbell', 'weight_reps', '{lower_back,biceps,forearms,traps}'),
(NULL, 'Meadows Row', 'upper_back', 'barbell', 'weight_reps', '{biceps,forearms,traps,obliques}'),
(NULL, 'T-Bar Row', 'upper_back', 'barbell', 'weight_reps', '{biceps,forearms,traps,lower_back}'),
(NULL, 'Landmine Row', 'upper_back', 'barbell', 'weight_reps', '{biceps,forearms,traps,lower_back}'),
(NULL, 'Dumbbell Row', 'upper_back', 'dumbbell', 'weight_reps', '{biceps,forearms,traps,obliques}'),
(NULL, 'Chest-Supported Dumbbell Row', 'upper_back', 'dumbbell', 'weight_reps', '{biceps,forearms,traps}'),
(NULL, 'Seal Row', 'upper_back', 'dumbbell', 'weight_reps', '{biceps,forearms,traps}'),
(NULL, 'Renegade Row', 'upper_back', 'dumbbell', 'weight_reps', '{abs,shoulders,biceps,forearms,obliques}'),
(NULL, 'Kettlebell Row', 'upper_back', 'kettlebell', 'weight_reps', '{biceps,forearms,traps,obliques}'),
(NULL, 'Lat Pulldown', 'back', 'cable', 'weight_reps', '{biceps,forearms,upper_back}'),
(NULL, 'Wide-Grip Lat Pulldown', 'back', 'cable', 'weight_reps', '{upper_back,biceps,forearms}'),
(NULL, 'Neutral-Grip Lat Pulldown', 'back', 'cable', 'weight_reps', '{biceps,forearms,upper_back}'),
(NULL, 'Reverse-Grip Lat Pulldown', 'back', 'cable', 'weight_reps', '{biceps,forearms,upper_back}'),
(NULL, 'Seated Cable Row', 'back', 'cable', 'weight_reps', '{upper_back,biceps,forearms}'),
(NULL, 'Close-Grip Seated Cable Row', 'back', 'cable', 'weight_reps', '{upper_back,biceps,forearms}'),
(NULL, 'Straight-Arm Pulldown', 'back', 'cable', 'weight_reps', '{shoulders,upper_back}'),
(NULL, 'Single-Arm Cable Row', 'back', 'cable', 'weight_reps', '{upper_back,biceps,forearms,abs,obliques}'),
(NULL, 'Machine Row', 'upper_back', 'machine', 'weight_reps', '{biceps,forearms,traps}'),
(NULL, 'Chest-Supported Machine Row', 'upper_back', 'machine', 'weight_reps', '{biceps,forearms,traps}'),
(NULL, 'High Row Machine', 'upper_back', 'machine', 'weight_reps', '{back,biceps,shoulders,forearms,traps}'),
(NULL, 'Pull-Up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back,abs}'),
(NULL, 'Wide-Grip Pull-Up', 'back', 'none', 'bodyweight_reps', '{upper_back,biceps,forearms,abs}'),
(NULL, 'Neutral-Grip Pull-Up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back,abs}'),
(NULL, 'Chin-Up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back,abs}'),
(NULL, 'Inverted Row', 'upper_back', 'none', 'bodyweight_reps', '{biceps,forearms,abs}'),
(NULL, 'Suspension Band Row', 'upper_back', 'suspension_band', 'bodyweight_reps', '{biceps,forearms,abs,obliques}'),
(NULL, 'Resistance Band Row', 'upper_back', 'resistance_band', 'weight_reps', '{biceps,forearms,traps}'),
(NULL, 'Resistance Band Pulldown', 'back', 'resistance_band', 'weight_reps', '{biceps,forearms,upper_back}'),
(NULL, 'Assisted Pull-Up', 'back', 'machine', 'assisted_bodyweight', '{biceps,forearms,upper_back,abs}'),
(NULL, 'Weighted Pull-Up', 'back', 'other', 'weighted_bodyweight', '{biceps,forearms,upper_back,abs}'),
(NULL, 'Weighted Chin-Up', 'back', 'other', 'weighted_bodyweight', '{biceps,forearms,upper_back,abs}'),

-- ── SHOULDERS ────────────────────────────────────────────
(NULL, 'Overhead Press', 'shoulders', 'barbell', 'weight_reps', '{triceps,upper_back,abs,obliques}'),
(NULL, 'Push Press', 'shoulders', 'barbell', 'weight_reps', '{triceps,quads,glutes,calves,abs,obliques}'),
(NULL, 'Behind-the-Neck Press', 'shoulders', 'barbell', 'weight_reps', '{triceps,traps,upper_back}'),
(NULL, 'Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,abs,obliques}'),
(NULL, 'Arnold Press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,upper_back,abs,obliques}'),
(NULL, 'Seated Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,abs}'),
(NULL, 'Kettlebell Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,abs,obliques,upper_back}'),
(NULL, 'Machine Shoulder Press', 'shoulders', 'machine', 'weight_reps', '{triceps}'),
(NULL, 'Lateral Raise', 'shoulders', 'dumbbell', 'weight_reps', '{traps}'),
(NULL, 'Seated Lateral Raise', 'shoulders', 'dumbbell', 'weight_reps', '{traps}'),
(NULL, 'Lean-Away Lateral Raise', 'shoulders', 'dumbbell', 'weight_reps', '{obliques,traps}'),
(NULL, 'Cable Lateral Raise', 'shoulders', 'cable', 'weight_reps', '{traps,obliques}'),
(NULL, 'Front Raise', 'shoulders', 'dumbbell', 'weight_reps', '{chest,upper_back}'),
(NULL, 'Plate Front Raise', 'shoulders', 'plate', 'weight_reps', '{chest,upper_back}'),
(NULL, 'Cable Front Raise', 'shoulders', 'cable', 'weight_reps', '{chest,upper_back}'),
(NULL, 'Rear Delt Fly', 'shoulders', 'dumbbell', 'weight_reps', '{upper_back,traps}'),
(NULL, 'Bent-Over Rear Delt Fly', 'shoulders', 'dumbbell', 'weight_reps', '{upper_back,traps,lower_back}'),
(NULL, 'Cable Rear Delt Fly', 'shoulders', 'cable', 'weight_reps', '{upper_back,traps}'),
(NULL, 'Face Pull', 'shoulders', 'cable', 'weight_reps', '{upper_back,traps}'),
(NULL, 'Upright Row', 'traps', 'barbell', 'weight_reps', '{shoulders,biceps,forearms}'),
(NULL, 'Dumbbell Upright Row', 'traps', 'dumbbell', 'weight_reps', '{shoulders,biceps,forearms}'),
(NULL, 'Resistance Band Lateral Raise', 'shoulders', 'resistance_band', 'weight_reps', '{traps}'),
(NULL, 'Resistance Band Face Pull', 'shoulders', 'resistance_band', 'weight_reps', '{upper_back,traps}'),
(NULL, 'Pike Push-Up', 'shoulders', 'none', 'bodyweight_reps', '{triceps,chest,abs}'),
(NULL, 'Handstand Push-Up', 'shoulders', 'none', 'bodyweight_reps', '{triceps,upper_back,abs,obliques}'),
(NULL, 'Suspension Band Y Raise', 'upper_back', 'suspension_band', 'bodyweight_reps', '{shoulders,traps,abs,obliques}'),

-- ── BICEPS ───────────────────────────────────────────────
(NULL, 'Barbell Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}'),
(NULL, 'EZ-Bar Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}'),
(NULL, 'Reverse Curl', 'forearms', 'barbell', 'weight_reps', '{biceps}'),
(NULL, 'Drag Curl', 'biceps', 'barbell', 'weight_reps', '{forearms,shoulders}'),
(NULL, 'Preacher Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}'),
(NULL, 'Dumbbell Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}'),
(NULL, 'Alternating Dumbbell Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms,abs,obliques}'),
(NULL, 'Hammer Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}'),
(NULL, 'Cross-Body Hammer Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms,shoulders}'),
(NULL, 'Incline Dumbbell Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms,shoulders}'),
(NULL, 'Concentration Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}'),
(NULL, 'Zottman Curl', 'forearms', 'dumbbell', 'weight_reps', '{biceps}'),
(NULL, 'Kettlebell Curl', 'biceps', 'kettlebell', 'weight_reps', '{forearms}'),
(NULL, 'Cable Curl', 'biceps', 'cable', 'weight_reps', '{forearms}'),
(NULL, 'Rope Cable Curl', 'biceps', 'cable', 'weight_reps', '{forearms}'),
(NULL, 'Bayesian Cable Curl', 'biceps', 'cable', 'weight_reps', '{shoulders,forearms}'),
(NULL, 'Single-Arm Cable Curl', 'biceps', 'cable', 'weight_reps', '{forearms,abs,obliques}'),
(NULL, 'Machine Preacher Curl', 'biceps', 'machine', 'weight_reps', '{forearms}'),
(NULL, 'Resistance Band Curl', 'biceps', 'resistance_band', 'weight_reps', '{forearms}'),
(NULL, 'Suspension Band Bicep Curl', 'biceps', 'suspension_band', 'bodyweight_reps', '{forearms,abs,obliques}'),

-- ── TRICEPS ──────────────────────────────────────────────
(NULL, 'Skull Crusher', 'triceps', 'barbell', 'weight_reps', '{shoulders}'),
(NULL, 'Close-Grip Bench Press', 'triceps', 'barbell', 'weight_reps', '{chest,shoulders}'),
(NULL, 'JM Press', 'triceps', 'barbell', 'weight_reps', '{shoulders,chest}'),
(NULL, 'Dumbbell Skull Crusher', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}'),
(NULL, 'Overhead Dumbbell Tricep Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,abs}'),
(NULL, 'Single-Arm Dumbbell Overhead Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,abs,obliques}'),
(NULL, 'Dumbbell Kickback', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,upper_back}'),
(NULL, 'Kettlebell Tricep Extension', 'triceps', 'kettlebell', 'weight_reps', '{shoulders,abs}'),
(NULL, 'Tricep Pushdown', 'triceps', 'cable', 'weight_reps', '{forearms}'),
(NULL, 'Rope Pushdown', 'triceps', 'cable', 'weight_reps', '{forearms}'),
(NULL, 'Reverse-Grip Pushdown', 'triceps', 'cable', 'weight_reps', '{forearms}'),
(NULL, 'Overhead Cable Tricep Extension', 'triceps', 'cable', 'weight_reps', '{shoulders,abs}'),
(NULL, 'Single-Arm Cable Pushdown', 'triceps', 'cable', 'weight_reps', '{forearms,abs,obliques}'),
(NULL, 'Machine Dip', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}'),
(NULL, 'Resistance Band Tricep Pushdown', 'triceps', 'resistance_band', 'weight_reps', '{forearms}'),
(NULL, 'Resistance Band Overhead Tricep Extension', 'triceps', 'resistance_band', 'weight_reps', '{shoulders,abs}'),
(NULL, 'Dip', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders}'),
(NULL, 'Bench Dip', 'triceps', 'none', 'bodyweight_reps', '{shoulders,chest}'),
(NULL, 'Assisted Dip', 'triceps', 'machine', 'assisted_bodyweight', '{chest,shoulders}'),
(NULL, 'Weighted Dip', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders}'),

-- ── QUADS ────────────────────────────────────────────────
(NULL, 'Barbell Squat', 'quads', 'barbell', 'weight_reps', '{glutes,hamstrings,abs,lower_back,adductors}'),
(NULL, 'High-Bar Squat', 'quads', 'barbell', 'weight_reps', '{glutes,hamstrings,abs,lower_back,adductors}'),
(NULL, 'Front Squat', 'quads', 'barbell', 'weight_reps', '{glutes,abs,upper_back,lower_back,adductors}'),
(NULL, 'Pause Squat', 'quads', 'barbell', 'weight_reps', '{glutes,hamstrings,abs,lower_back,adductors}'),
(NULL, 'Zercher Squat', 'quads', 'barbell', 'weight_reps', '{glutes,abs,upper_back,lower_back,biceps,adductors}'),
(NULL, 'Landmine Squat', 'quads', 'barbell', 'weight_reps', '{glutes,abs,lower_back,adductors}'),
(NULL, 'Goblet Squat', 'quads', 'dumbbell', 'weight_reps', '{glutes,abs,upper_back,adductors}'),
(NULL, 'Dumbbell Front Squat', 'quads', 'dumbbell', 'weight_reps', '{glutes,abs,upper_back,adductors}'),
(NULL, 'Bulgarian Split Squat', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Walking Dumbbell Lunge', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves,adductors,abs}'),
(NULL, 'Step-Up', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves,abs}'),
(NULL, 'Kettlebell Goblet Squat', 'quads', 'kettlebell', 'weight_reps', '{glutes,abs,upper_back,adductors}'),
(NULL, 'Kettlebell Front Rack Lunge', 'quads', 'kettlebell', 'weight_reps', '{glutes,abs,adductors,calves}'),
(NULL, 'Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors,calves}'),
(NULL, 'Single-Leg Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors,calves}'),
(NULL, 'Hack Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors,calves}'),
(NULL, 'Pendulum Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors,calves}'),
(NULL, 'Belt Squat', 'quads', 'machine', 'weight_reps', '{glutes,adductors,calves}'),
(NULL, 'Leg Extension', 'quads', 'machine', 'weight_reps', '{}'),
(NULL, 'Sissy Squat', 'quads', 'none', 'bodyweight_reps', '{abs,knees}'),
(NULL, 'Bodyweight Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Split Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Reverse Lunge', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Walking Lunge', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves,adductors,abs}'),
(NULL, 'Jump Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}'),
(NULL, 'Resistance Band Squat', 'quads', 'resistance_band', 'weight_reps', '{glutes,hamstrings,adductors,abs}'),
(NULL, 'Resistance Band Lunge', 'quads', 'resistance_band', 'weight_reps', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Weighted Lunge', 'quads', 'dumbbell', 'weighted_bodyweight', '{glutes,hamstrings,adductors,calves,abs}'),
(NULL, 'Wall Sit', 'quads', 'none', 'duration', '{glutes,adductors}'),

-- ── HAMSTRINGS ───────────────────────────────────────────
(NULL, 'Romanian Deadlift', 'hamstrings', 'barbell', 'weight_reps', '{glutes,lower_back,forearms,abs}'),
(NULL, 'Stiff-Leg Deadlift', 'hamstrings', 'barbell', 'weight_reps', '{glutes,lower_back,forearms}'),
(NULL, 'Good Morning', 'hamstrings', 'barbell', 'weight_reps', '{glutes,lower_back,abs}'),
(NULL, 'Snatch-Grip Romanian Deadlift', 'hamstrings', 'barbell', 'weight_reps', '{glutes,lower_back,traps,forearms,upper_back}'),
(NULL, 'Single-Leg Romanian Deadlift', 'hamstrings', 'dumbbell', 'weight_reps', '{glutes,abs,obliques,feet,ankles}'),
(NULL, 'Dumbbell Romanian Deadlift', 'hamstrings', 'dumbbell', 'weight_reps', '{glutes,lower_back,forearms}'),
(NULL, 'Kettlebell Romanian Deadlift', 'hamstrings', 'kettlebell', 'weight_reps', '{glutes,lower_back,forearms}'),
(NULL, 'Kettlebell Swing', 'glutes', 'kettlebell', 'weight_reps', '{hamstrings,lower_back,abs,forearms}'),
(NULL, 'Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}'),
(NULL, 'Seated Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}'),
(NULL, 'Lying Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}'),
(NULL, 'Single-Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}'),
(NULL, 'Nordic Hamstring Curl', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,calves}'),
(NULL, 'Glute-Ham Raise', 'hamstrings', 'other', 'bodyweight_reps', '{glutes,lower_back,calves}'),
(NULL, 'Sliding Leg Curl', 'hamstrings', 'other', 'bodyweight_reps', '{glutes,calves,abs}'),
(NULL, 'Resistance Band Leg Curl', 'hamstrings', 'resistance_band', 'weight_reps', '{calves}'),
(NULL, 'Resistance Band Good Morning', 'hamstrings', 'resistance_band', 'weight_reps', '{glutes,lower_back,abs}'),

-- ── GLUTES ───────────────────────────────────────────────
(NULL, 'Hip Thrust', 'glutes', 'barbell', 'weight_reps', '{hamstrings,abs,adductors}'),
(NULL, 'Barbell Glute Bridge', 'glutes', 'barbell', 'weight_reps', '{hamstrings,abs,adductors}'),
(NULL, 'Single-Leg Hip Thrust', 'glutes', 'dumbbell', 'weight_reps', '{hamstrings,abs,obliques,adductors}'),
(NULL, 'Dumbbell Glute Bridge', 'glutes', 'dumbbell', 'weight_reps', '{hamstrings,abs,adductors}'),
(NULL, 'Kettlebell Swing', 'glutes', 'kettlebell', 'weight_reps', '{hamstrings,lower_back,abs,forearms}'),
(NULL, 'Cable Kickback', 'glutes', 'cable', 'weight_reps', '{hamstrings}'),
(NULL, 'Cable Pull-Through', 'glutes', 'cable', 'weight_reps', '{hamstrings,lower_back,forearms}'),
(NULL, 'Hip Abduction Machine', 'glutes', 'machine', 'weight_reps', '{}'),
(NULL, 'Machine Glute Kickback', 'glutes', 'machine', 'weight_reps', '{hamstrings}'),
(NULL, '45-Degree Back Extension', 'glutes', 'other', 'weight_reps', '{hamstrings,lower_back}'),
(NULL, 'Frog Pump', 'glutes', 'none', 'bodyweight_reps', '{adductors}'),
(NULL, 'Donkey Kick', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}'),
(NULL, 'Fire Hydrant', 'glutes', 'none', 'bodyweight_reps', '{obliques,abs}'),
(NULL, 'Step-Up', 'glutes', 'dumbbell', 'weight_reps', '{quads,hamstrings,calves,abs}'),
(NULL, 'Curtsy Lunge', 'glutes', 'dumbbell', 'weight_reps', '{quads,hamstrings,adductors,calves,abs}'),
(NULL, 'Resistance Band Glute Bridge', 'glutes', 'resistance_band', 'weight_reps', '{hamstrings,abs,adductors}'),
(NULL, 'Resistance Band Lateral Walk', 'glutes', 'resistance_band', 'weight_reps', '{abs}'),
(NULL, 'Resistance Band Clamshell', 'glutes', 'resistance_band', 'weight_reps', '{adductors}'),

-- ── CALVES ───────────────────────────────────────────────
(NULL, 'Standing Calf Raise', 'calves', 'machine', 'weight_reps', '{feet,ankles}'),
(NULL, 'Seated Calf Raise', 'calves', 'machine', 'weight_reps', '{feet,ankles}'),
(NULL, 'Donkey Calf Raise', 'calves', 'machine', 'weight_reps', '{feet,ankles}'),
(NULL, 'Leg Press Calf Raise', 'calves', 'machine', 'weight_reps', '{feet,ankles}'),
(NULL, 'Single-Leg Calf Raise', 'calves', 'none', 'bodyweight_reps', '{feet,ankles}'),
(NULL, 'Bodyweight Calf Raise', 'calves', 'none', 'bodyweight_reps', '{feet,ankles}'),
(NULL, 'Dumbbell Calf Raise', 'calves', 'dumbbell', 'weight_reps', '{feet,ankles,forearms}'),
(NULL, 'Barbell Calf Raise', 'calves', 'barbell', 'weight_reps', '{feet,ankles,lower_back}'),
(NULL, 'Kettlebell Calf Raise', 'calves', 'kettlebell', 'weight_reps', '{feet,ankles,forearms}'),
(NULL, 'Resistance Band Plantar Flexion', 'calves', 'resistance_band', 'weight_reps', '{feet,ankles}'),

-- ── TRAPS ────────────────────────────────────────────────
(NULL, 'Barbell Shrug', 'traps', 'barbell', 'weight_reps', '{forearms,upper_back}'),
(NULL, 'Behind-the-Back Barbell Shrug', 'traps', 'barbell', 'weight_reps', '{forearms,upper_back}'),
(NULL, 'Dumbbell Shrug', 'traps', 'dumbbell', 'weight_reps', '{forearms,upper_back}'),
(NULL, 'Kettlebell Shrug', 'traps', 'kettlebell', 'weight_reps', '{forearms,upper_back}'),
(NULL, 'Cable Shrug', 'traps', 'cable', 'weight_reps', '{forearms,upper_back}'),
(NULL, 'Face Pull', 'shoulders', 'cable', 'weight_reps', '{traps,upper_back}'),
(NULL, 'Farmer''s Carry', 'traps', 'dumbbell', 'weight_distance', '{forearms,abs,obliques,shoulders}'),
(NULL, 'Farmer''s Hold', 'traps', 'dumbbell', 'duration_weight', '{forearms,shoulders}'),

-- ── WEIGHT & REPS: Forearms ──────────────────────────────
(NULL, 'Barbell Wrist Curl', 'forearms', 'barbell', 'weight_reps', '{}'),
(NULL, 'Reverse Barbell Wrist Curl', 'forearms', 'barbell', 'weight_reps', '{}'),
(NULL, 'Dumbbell Wrist Curl', 'forearms', 'dumbbell', 'weight_reps', '{}'),
(NULL, 'Reverse Dumbbell Wrist Curl', 'forearms', 'dumbbell', 'weight_reps', '{}'),
(NULL, 'Hammer Curl Hold', 'forearms', 'dumbbell', 'duration_weight', '{biceps,shoulders}'),
(NULL, 'Plate Pinch Hold', 'hands', 'plate', 'duration', '{forearms}'),
(NULL, 'Towel Grip Dead Hang', 'forearms', 'none', 'duration', '{back,hands,shoulders}'),
(NULL, 'Farmer Carry (Heavy)', 'forearms', 'dumbbell', 'weight_distance', '{traps,abs,obliques,shoulders}'),
(NULL, 'Kettlebell Bottom-Up Hold', 'forearms', 'kettlebell', 'duration_weight', '{shoulders,hands,abs}'),

-- ── WEIGHT & REPS: Abs ───────────────────────────────────
(NULL, 'Plank', 'abs', 'none', 'duration', '{obliques,shoulders}'),
(NULL, 'Hanging Leg Raise', 'abs', 'none', 'bodyweight_reps', '{forearms,hands}'),
(NULL, 'Toes to Bar', 'abs', 'none', 'bodyweight_reps', '{forearms,hands,shoulders}'),
(NULL, 'Cable Woodchopper', 'obliques', 'cable', 'weight_reps', '{abs,shoulders}'),
(NULL, 'Russian Twist', 'obliques', 'plate', 'weight_reps', '{abs}'),
(NULL, 'Decline Sit-Up', 'abs', 'machine', 'weight_reps', '{obliques}'),
(NULL, 'Ab Wheel Rollout', 'abs', 'other', 'bodyweight_reps', '{shoulders,obliques,triceps}'),
(NULL, 'V-Up', 'abs', 'none', 'bodyweight_reps', '{obliques}'),
(NULL, 'Flutter Kick', 'abs', 'none', 'bodyweight_reps', '{}'),
(NULL, 'Scissor Kick', 'abs', 'none', 'bodyweight_reps', '{obliques,adductors}'),
(NULL, 'Dragon Flag', 'abs', 'none', 'bodyweight_reps', '{shoulders,obliques,triceps}'),

-- ── CARDIO (RECLASSIFIED + SPORTS) ───────────────────────
(NULL, 'Running', 'cardio', 'none', 'distance_duration', '{quads,hamstrings,glutes,calves,feet,ankles}'),
(NULL, 'Jogging', 'cardio', 'none', 'distance_duration', '{quads,hamstrings,glutes,calves,feet,ankles}'),
(NULL, 'Sprinting', 'cardio', 'none', 'distance_duration', '{quads,hamstrings,glutes,calves,feet,ankles}'),
(NULL, 'Cycling', 'cardio', 'machine', 'distance_duration', '{quads,hamstrings,glutes,calves}'),
(NULL, 'Outdoor Cycling', 'cardio', 'other', 'distance_duration', '{quads,hamstrings,glutes,calves}'),
(NULL, 'Rowing', 'cardio', 'machine', 'distance_duration', '{back,upper_back,lower_back,biceps,forearms,quads,hamstrings,glutes}'),
(NULL, 'Swimming', 'cardio', 'none', 'distance_duration', '{shoulders,back,upper_back,triceps,calves}'),
(NULL, 'Walking', 'cardio', 'none', 'distance_duration', '{quads,glutes,calves,feet,ankles}'),
(NULL, 'Incline Walking', 'cardio', 'machine', 'distance_duration', '{glutes,calves,quads,hamstrings}'),
(NULL, 'Elliptical', 'cardio', 'machine', 'distance_duration', '{quads,hamstrings,glutes,calves}'),
(NULL, 'Stair Climber', 'cardio', 'machine', 'distance_duration', '{glutes,quads,hamstrings,calves}'),
(NULL, 'Jump Rope (Speed)', 'cardio', 'none', 'duration', '{calves,feet,ankles,shoulders,forearms}'),
(NULL, 'HIIT Intervals', 'cardio', 'none', 'duration', '{full_body}'),
(NULL, 'Battle Ropes', 'cardio', 'other', 'duration', '{shoulders,triceps,biceps,forearms,abs,obliques,traps}'),

-- ── SPORTS (CARDIO CATEGORY) ─────────────────────────────
(NULL, 'Basketball', 'cardio', 'other', 'duration', '{quads,hamstrings,glutes,calves,shoulders,forearms,feet,ankles}'),
(NULL, 'Soccer', 'cardio', 'other', 'duration', '{quads,hamstrings,glutes,calves,feet,ankles}'),
(NULL, 'Tennis', 'cardio', 'other', 'duration', '{shoulders,forearms,obliques,quads,calves,feet,ankles}'),
(NULL, 'Volleyball', 'cardio', 'other', 'duration', '{quads,calves,shoulders,triceps,feet,ankles}'),
(NULL, 'Hockey', 'cardio', 'other', 'duration', '{quads,glutes,hamstrings,abs,obliques,feet,ankles}'),
(NULL, 'Football', 'cardio', 'other', 'duration', '{full_body}'),
(NULL, 'Baseball', 'cardio', 'other', 'duration', '{shoulders,forearms,obliques,abs}'),
(NULL, 'Rugby', 'cardio', 'other', 'duration', '{full_body}'),
(NULL, 'Badminton', 'cardio', 'other', 'duration', '{shoulders,forearms,obliques,quads,calves,feet,ankles}'),
(NULL, 'Table Tennis', 'cardio', 'other', 'duration', '{shoulders,forearms,obliques}'),

-- ── FUNCTIONAL / HYBRID ──────────────────────────────────
(NULL, 'Sled Push (Sprint)', 'cardio', 'other', 'weight_distance', '{quads,glutes,hamstrings,calves,shoulders,triceps}'),
(NULL, 'Sled Pull (Conditioning)', 'cardio', 'other', 'weight_distance', '{back,upper_back,biceps,forearms,quads,hamstrings,glutes}'),
(NULL, 'Farmer Carry (Conditioning)', 'cardio', 'dumbbell', 'weight_distance', '{forearms,traps,abs,obliques,shoulders}'),
(NULL, 'Kettlebell Complex', 'cardio', 'kettlebell', 'duration', '{full_body}'),
(NULL, 'Sandbag Carry', 'cardio', 'other', 'weight_distance', '{full_body}');

-- =========================================================
-- =========================================================
-- 2. USER SEED DATA
--    4-week progressive overload routine repeated 3 cycles
-- =========================================================
DO $$
DECLARE
  user_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS

  -- Library exercise IDs
  ex_bench UUID;
  ex_incline_db UUID;
  ex_ohp UUID;
  ex_tri_push UUID;
  ex_bb_row UUID;
  ex_lat_pull UUID;
  ex_hammer UUID;
  ex_squat UUID;
  ex_leg_press UUID;
  ex_rdl UUID;
  ex_pushup UUID;
  ex_running UUID;
  ex_plank UUID;

  -- Custom exercise IDs
  ex_custom_glute_pulses UUID;
  ex_custom_suitcase_carry UUID;

  -- Routine/day IDs
  r_prog UUID;
  d_push UUID;
  d_pull UUID;
  d_legs UUID;
  d_conditioning UUID;

  -- Routine day exercise IDs
  rde_bench UUID;
  rde_incline UUID;
  rde_ohp UUID;
  rde_tri_push UUID;

  rde_row UUID;
  rde_lat_pull UUID;
  rde_hammer UUID;
  rde_pushup UUID;

  rde_squat UUID;
  rde_leg_press UUID;
  rde_rdl UUID;
  rde_glute_pulses UUID;

  rde_running UUID;
  rde_plank UUID;
  rde_suitcase_carry UUID;

  cycle_index INT;
  cycle_week INT;
  absolute_week INT;
  sess UUID;
  sess_start TIMESTAMPTZ;
  sess_end TIMESTAMPTZ;
  week_start TIMESTAMPTZ;
  base_date TIMESTAMPTZ := '2026-01-06 07:00:00+00';
  load_mult REAL;
  session_mins INT;
BEGIN
  -- Lookup library exercises from the freshly seeded public list
  SELECT id INTO ex_bench      FROM exercises WHERE user_id IS NULL AND name = 'Barbell Bench Press';
  SELECT id INTO ex_incline_db FROM exercises WHERE user_id IS NULL AND name = 'Incline Dumbbell Press';
  SELECT id INTO ex_ohp        FROM exercises WHERE user_id IS NULL AND name = 'Overhead Press';
  SELECT id INTO ex_tri_push   FROM exercises WHERE user_id IS NULL AND name = 'Tricep Pushdown';
  SELECT id INTO ex_bb_row     FROM exercises WHERE user_id IS NULL AND name = 'Barbell Row';
  SELECT id INTO ex_lat_pull   FROM exercises WHERE user_id IS NULL AND name = 'Lat Pulldown';
  SELECT id INTO ex_hammer     FROM exercises WHERE user_id IS NULL AND name = 'Hammer Curl';
  SELECT id INTO ex_squat      FROM exercises WHERE user_id IS NULL AND name = 'Barbell Squat';
  SELECT id INTO ex_leg_press  FROM exercises WHERE user_id IS NULL AND name = 'Leg Press';
  SELECT id INTO ex_rdl        FROM exercises WHERE user_id IS NULL AND name = 'Romanian Deadlift';
  SELECT id INTO ex_pushup     FROM exercises WHERE user_id IS NULL AND name = 'Push-Up';
  SELECT id INTO ex_running    FROM exercises WHERE user_id IS NULL AND name = 'Running';
  SELECT id INTO ex_plank      FROM exercises WHERE user_id IS NULL AND name = 'Plank';

  -- Fail fast with a clear message if any critical lookup is missing
  IF ex_bench IS NULL OR ex_incline_db IS NULL OR ex_ohp IS NULL OR ex_tri_push IS NULL
     OR ex_bb_row IS NULL OR ex_lat_pull IS NULL OR ex_hammer IS NULL OR ex_squat IS NULL
     OR ex_leg_press IS NULL OR ex_rdl IS NULL OR ex_pushup IS NULL OR ex_running IS NULL
     OR ex_plank IS NULL THEN
    RAISE EXCEPTION 'Seed aborted: one or more required public exercises were not found. Verify library names in section 1.';
  END IF;

  -- Add user custom exercises for realism / coverage
  INSERT INTO exercises (user_id, name, muscle_group, equipment, exercise_type, secondary_muscles)
  VALUES (user_uuid, 'Banded Glute Bridge Pulses', 'glutes', 'resistance_band', 'weight_reps', '{hamstrings,abs}')
  RETURNING id INTO ex_custom_glute_pulses;

  INSERT INTO exercises (user_id, name, muscle_group, equipment, exercise_type, secondary_muscles)
  VALUES (user_uuid, 'Suitcase Carry (Custom)', 'forearms', 'dumbbell', 'weight_distance', '{abs,traps}')
  RETURNING id INTO ex_custom_suitcase_carry;

  -- 4-week progression routine
  INSERT INTO routines (user_id, name, is_active, week_count, current_week)
  VALUES (user_uuid, '4-Week Progressive Hybrid PPL', true, 4, 1)
  RETURNING id INTO r_prog;

  INSERT INTO routine_days (routine_id, day_of_week, label) VALUES (r_prog, 1, 'Push Strength') RETURNING id INTO d_push;
  INSERT INTO routine_days (routine_id, day_of_week, label) VALUES (r_prog, 3, 'Pull Strength') RETURNING id INTO d_pull;
  INSERT INTO routine_days (routine_id, day_of_week, label) VALUES (r_prog, 5, 'Legs + Glutes') RETURNING id INTO d_legs;
  INSERT INTO routine_days (routine_id, day_of_week, label) VALUES (r_prog, 6, 'Conditioning + Core') RETURNING id INTO d_conditioning;

  -- Push day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_push, ex_bench, 0, 4, 8) RETURNING id INTO rde_bench;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_push, ex_incline_db, 1, 3, 10) RETURNING id INTO rde_incline;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_push, ex_ohp, 2, 3, 8) RETURNING id INTO rde_ohp;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_push, ex_tri_push, 3, 3, 12) RETURNING id INTO rde_tri_push;

  -- Pull day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_pull, ex_bb_row, 0, 4, 8) RETURNING id INTO rde_row;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_pull, ex_lat_pull, 1, 3, 10) RETURNING id INTO rde_lat_pull;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_pull, ex_hammer, 2, 3, 12) RETURNING id INTO rde_hammer;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_pull, ex_pushup, 3, 2, 15) RETURNING id INTO rde_pushup;

  -- Legs day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_legs, ex_squat, 0, 4, 6) RETURNING id INTO rde_squat;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_legs, ex_leg_press, 1, 3, 10) RETURNING id INTO rde_leg_press;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_legs, ex_rdl, 2, 3, 8) RETURNING id INTO rde_rdl;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_legs, ex_custom_glute_pulses, 3, 3, 20) RETURNING id INTO rde_glute_pulses;

  -- Conditioning day
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_conditioning, ex_running, 0, 1, 1) RETURNING id INTO rde_running;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_conditioning, ex_plank, 1, 3, 1) RETURNING id INTO rde_plank;
  INSERT INTO routine_day_exercises (routine_day_id, exercise_id, sort_order, target_sets, target_reps)
  VALUES (d_conditioning, ex_custom_suitcase_carry, 2, 4, 1) RETURNING id INTO rde_suitcase_carry;

  -- Set targets
  INSERT INTO routine_day_exercise_sets (routine_day_exercise_id, set_number, target_weight, target_reps_min, target_reps_max, target_rir)
  VALUES
    (rde_bench, 1, 155, 6, 8, 3), (rde_bench, 2, 155, 6, 8, 2), (rde_bench, 3, 155, 6, 8, 2), (rde_bench, 4, 155, 6, 8, 1),
    (rde_incline, 1, 55, 8, 10, 2), (rde_incline, 2, 55, 8, 10, 2), (rde_incline, 3, 55, 8, 10, 1),
    (rde_ohp, 1, 95, 6, 8, 3), (rde_ohp, 2, 95, 6, 8, 2), (rde_ohp, 3, 95, 6, 8, 1),
    (rde_tri_push, 1, 55, 10, 12, 2), (rde_tri_push, 2, 55, 10, 12, 1), (rde_tri_push, 3, 55, 10, 12, 1),

    (rde_row, 1, 145, 6, 8, 3), (rde_row, 2, 145, 6, 8, 2), (rde_row, 3, 145, 6, 8, 2), (rde_row, 4, 145, 6, 8, 1),
    (rde_lat_pull, 1, 120, 8, 10, 2), (rde_lat_pull, 2, 120, 8, 10, 1), (rde_lat_pull, 3, 120, 8, 10, 1),
    (rde_hammer, 1, 35, 10, 12, 2), (rde_hammer, 2, 35, 10, 12, 1), (rde_hammer, 3, 35, 10, 12, 1),
    (rde_pushup, 1, 0, 12, 15, 2), (rde_pushup, 2, 0, 12, 15, 1),

    (rde_squat, 1, 205, 5, 6, 3), (rde_squat, 2, 205, 5, 6, 2), (rde_squat, 3, 205, 5, 6, 2), (rde_squat, 4, 205, 5, 6, 1),
    (rde_leg_press, 1, 300, 8, 10, 2), (rde_leg_press, 2, 300, 8, 10, 1), (rde_leg_press, 3, 300, 8, 10, 1),
    (rde_rdl, 1, 175, 6, 8, 2), (rde_rdl, 2, 175, 6, 8, 2), (rde_rdl, 3, 175, 6, 8, 1),
    (rde_glute_pulses, 1, 25, 18, 22, 2), (rde_glute_pulses, 2, 25, 18, 22, 1), (rde_glute_pulses, 3, 25, 18, 22, 1),

    (rde_running, 1, 0, 1, 1, NULL),
    (rde_plank, 1, 0, 1, 1, NULL), (rde_plank, 2, 0, 1, 1, NULL), (rde_plank, 3, 0, 1, 1, NULL),
    (rde_suitcase_carry, 1, 45, 1, 1, NULL), (rde_suitcase_carry, 2, 45, 1, 1, NULL), (rde_suitcase_carry, 3, 45, 1, 1, NULL), (rde_suitcase_carry, 4, 45, 1, 1, NULL);

  -- Duration/distance targets for conditioning blocks
  UPDATE routine_day_exercise_sets
  SET target_duration = 1200, target_distance = 2.8
  WHERE routine_day_exercise_id = rde_running;

  UPDATE routine_day_exercise_sets
  SET target_duration = 60
  WHERE routine_day_exercise_id = rde_plank;

  UPDATE routine_day_exercise_sets
  SET target_duration = 90, target_distance = 0.04
  WHERE routine_day_exercise_id = rde_suitcase_carry;

  -- 12 weeks total = 3 full cycles of 4-week progression
  FOR cycle_index IN 0..2 LOOP
    FOR cycle_week IN 1..4 LOOP
      absolute_week := cycle_index * 4 + (cycle_week - 1);
      week_start := base_date + (absolute_week || ' days')::INTERVAL * 7;

      load_mult := CASE cycle_week
        WHEN 1 THEN 1.00
        WHEN 2 THEN 1.03
        WHEN 3 THEN 1.06
        ELSE 0.88 -- deload week
      END;

      -- PUSH
      session_mins := 58 + (random() * 14)::INT;
      sess_start := week_start + ((random() * 25)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (session_mins || ' minutes')::INTERVAL;
      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_push, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order, duration, distance)
      VALUES
        (sess, ex_bench, 1, ROUND((155 * load_mult)::numeric / 5) * 5, 8 - (random() < 0.35)::INT, 3, false, 0, 0, 0),
        (sess, ex_bench, 2, ROUND((155 * load_mult)::numeric / 5) * 5, 7 + (random() < 0.45)::INT, 2, false, 0, 0, 0),
        (sess, ex_bench, 3, ROUND((155 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.55)::INT, 2, false, 0, 0, 0),
        (sess, ex_bench, 4, ROUND((155 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.35)::INT, 1, false, 0, 0, 0),
        (sess, ex_incline_db, 1, ROUND((55 * load_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 1, 0, 0),
        (sess, ex_incline_db, 2, ROUND((55 * load_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT, 2, false, 1, 0, 0),
        (sess, ex_incline_db, 3, ROUND((55 * load_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT, 1, false, 1, 0, 0),
        (sess, ex_ohp, 1, ROUND((95 * load_mult)::numeric / 5) * 5, 8 - (random() < 0.3)::INT, 3, false, 2, 0, 0),
        (sess, ex_ohp, 2, ROUND((95 * load_mult)::numeric / 5) * 5, 7 + (random() < 0.4)::INT, 2, false, 2, 0, 0),
        (sess, ex_ohp, 3, ROUND((95 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.5)::INT, 1, false, 2, 0, 0),
        (sess, ex_tri_push, 1, ROUND((55 * load_mult)::numeric / 5) * 5, 12 - (random() < 0.25)::INT, 2, false, 3, 0, 0),
        (sess, ex_tri_push, 2, ROUND((55 * load_mult)::numeric / 5) * 5, 11 + (random() < 0.35)::INT, 1, false, 3, 0, 0),
        (sess, ex_tri_push, 3, ROUND((55 * load_mult)::numeric / 5) * 5, 10 + (random() < 0.45)::INT, 1, false, 3, 0, 0);

      -- PULL
      session_mins := 54 + (random() * 16)::INT;
      sess_start := week_start + INTERVAL '2 days' + ((random() * 30)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (session_mins || ' minutes')::INTERVAL;
      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_pull, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order, duration, distance)
      VALUES
        (sess, ex_bb_row, 1, ROUND((145 * load_mult)::numeric / 5) * 5, 8 - (random() < 0.35)::INT, 3, false, 0, 0, 0),
        (sess, ex_bb_row, 2, ROUND((145 * load_mult)::numeric / 5) * 5, 7 + (random() < 0.45)::INT, 2, false, 0, 0, 0),
        (sess, ex_bb_row, 3, ROUND((145 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.55)::INT, 2, false, 0, 0, 0),
        (sess, ex_bb_row, 4, ROUND((145 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.35)::INT, 1, false, 0, 0, 0),
        (sess, ex_lat_pull, 1, ROUND((120 * load_mult)::numeric / 5) * 5, 10 - (random() < 0.3)::INT, 2, false, 1, 0, 0),
        (sess, ex_lat_pull, 2, ROUND((120 * load_mult)::numeric / 5) * 5, 9 + (random() < 0.4)::INT, 1, false, 1, 0, 0),
        (sess, ex_lat_pull, 3, ROUND((120 * load_mult)::numeric / 5) * 5, 8 + (random() < 0.5)::INT, 1, false, 1, 0, 0),
        (sess, ex_hammer, 1, ROUND((35 * load_mult)::numeric / 5) * 5, 12 - (random() < 0.25)::INT, 2, false, 2, 0, 0),
        (sess, ex_hammer, 2, ROUND((35 * load_mult)::numeric / 5) * 5, 11 + (random() < 0.35)::INT, 1, false, 2, 0, 0),
        (sess, ex_hammer, 3, ROUND((35 * load_mult)::numeric / 5) * 5, 10 + (random() < 0.45)::INT, 1, false, 2, 0, 0),
        (sess, ex_pushup, 1, 0, 16 + (random() < 0.5)::INT, 2, false, 3, 0, 0),
        (sess, ex_pushup, 2, 0, 14 + (random() < 0.5)::INT, 1, false, 3, 0, 0);

      -- LEGS + custom glute work
      session_mins := 60 + (random() * 15)::INT;
      sess_start := week_start + INTERVAL '4 days' + ((random() * 25)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (session_mins || ' minutes')::INTERVAL;
      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_legs, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order, duration, distance)
      VALUES
        (sess, ex_squat, 1, ROUND((205 * load_mult)::numeric / 5) * 5, 6 - (random() < 0.3)::INT, 3, false, 0, 0, 0),
        (sess, ex_squat, 2, ROUND((205 * load_mult)::numeric / 5) * 5, 6 - (random() < 0.35)::INT, 2, false, 0, 0, 0),
        (sess, ex_squat, 3, ROUND((205 * load_mult)::numeric / 5) * 5, 5 + (random() < 0.45)::INT, 2, false, 0, 0, 0),
        (sess, ex_squat, 4, ROUND((205 * load_mult)::numeric / 5) * 5, 5 + (random() < 0.35)::INT, 1, false, 0, 0, 0),
        (sess, ex_leg_press, 1, ROUND((300 * load_mult)::numeric / 5) * 5, 10 - (random() < 0.25)::INT, 2, false, 1, 0, 0),
        (sess, ex_leg_press, 2, ROUND((300 * load_mult)::numeric / 5) * 5, 9 + (random() < 0.35)::INT, 1, false, 1, 0, 0),
        (sess, ex_leg_press, 3, ROUND((300 * load_mult)::numeric / 5) * 5, 8 + (random() < 0.45)::INT, 1, false, 1, 0, 0),
        (sess, ex_rdl, 1, ROUND((175 * load_mult)::numeric / 5) * 5, 8 - (random() < 0.3)::INT, 2, false, 2, 0, 0),
        (sess, ex_rdl, 2, ROUND((175 * load_mult)::numeric / 5) * 5, 7 + (random() < 0.4)::INT, 2, false, 2, 0, 0),
        (sess, ex_rdl, 3, ROUND((175 * load_mult)::numeric / 5) * 5, 6 + (random() < 0.45)::INT, 1, false, 2, 0, 0),
        (sess, ex_custom_glute_pulses, 1, ROUND((25 * load_mult)::numeric / 5) * 5, 22 - (random() < 0.35)::INT, 2, false, 3, 0, 0),
        (sess, ex_custom_glute_pulses, 2, ROUND((25 * load_mult)::numeric / 5) * 5, 20 + (random() < 0.45)::INT, 1, false, 3, 0, 0),
        (sess, ex_custom_glute_pulses, 3, ROUND((25 * load_mult)::numeric / 5) * 5, 18 + (random() < 0.5)::INT, 1, false, 3, 0, 0);

      -- CONDITIONING + carry + plank
      session_mins := 40 + (random() * 12)::INT;
      sess_start := week_start + INTERVAL '5 days' + ((random() * 40)::INT || ' minutes')::INTERVAL;
      sess_end := sess_start + (session_mins || ' minutes')::INTERVAL;
      INSERT INTO workout_sessions (user_id, routine_day_id, started_at, completed_at, status)
      VALUES (user_uuid, d_conditioning, sess_start, sess_end, 'completed')
      RETURNING id INTO sess;

      INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps_performed, rir, is_warmup, exercise_order, duration, distance)
      VALUES
        (sess, ex_running, 1, 0, 1, NULL, false, 0, (1200 * load_mult)::INT, ROUND((2.8 * load_mult)::numeric, 2)),
        (sess, ex_plank, 1, 0, 1, NULL, false, 1, (60 * load_mult)::INT, 0),
        (sess, ex_plank, 2, 0, 1, NULL, false, 1, (55 * load_mult)::INT, 0),
        (sess, ex_plank, 3, 0, 1, NULL, false, 1, (50 * load_mult)::INT, 0),
        (sess, ex_custom_suitcase_carry, 1, ROUND((45 * load_mult)::numeric / 5) * 5, 1, NULL, false, 2, 90, ROUND((0.04 * load_mult)::numeric, 2)),
        (sess, ex_custom_suitcase_carry, 2, ROUND((45 * load_mult)::numeric / 5) * 5, 1, NULL, false, 2, 90, ROUND((0.04 * load_mult)::numeric, 2)),
        (sess, ex_custom_suitcase_carry, 3, ROUND((45 * load_mult)::numeric / 5) * 5, 1, NULL, false, 2, 90, ROUND((0.04 * load_mult)::numeric, 2)),
        (sess, ex_custom_suitcase_carry, 4, ROUND((45 * load_mult)::numeric / 5) * 5, 1, NULL, false, 2, 90, ROUND((0.04 * load_mult)::numeric, 2));
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed complete for user % (4-week cycle x3 with custom exercises)', user_uuid;
END $$;
