-- Public exercise library (user_id = NULL)
-- Complete data: exercise_type, equipment, muscle_group, secondary_muscles
DELETE FROM exercises WHERE user_id IS NULL;

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
