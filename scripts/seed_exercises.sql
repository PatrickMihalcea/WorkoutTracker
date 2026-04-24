-- Seed: exercises (full library)
-- Media hosted at: https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/

CREATE TABLE IF NOT EXISTS exercises (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  name              text NOT NULL,
  muscle_group      text NOT NULL,
  equipment         text NOT NULL DEFAULT 'barbell',
  exercise_type     text NOT NULL DEFAULT 'weight_reps',
  secondary_muscles text[] DEFAULT '{}',
  movement_pattern  text,
  is_compound       boolean,
  difficulty_tier   text,
  fatigue_score     smallint CHECK (fatigue_score BETWEEN 1 AND 5),
  is_cardio         boolean NOT NULL DEFAULT false,
  is_ai_routine_candidate boolean NOT NULL DEFAULT false,
  media_type        text NOT NULL DEFAULT 'none'
                    CHECK (media_type IN ('none', 'image', 'gif', 'video')),
  media_url         text DEFAULT NULL,
  thumbnail_url     text DEFAULT NULL,
  CONSTRAINT exercises_difficulty_tier_check
    CHECK (
      difficulty_tier IS NULL OR
      difficulty_tier IN ('beginner', 'intermediate', 'advanced')
    )
);

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS is_ai_routine_candidate boolean NOT NULL DEFAULT false;

-- Start fresh each seed run
DELETE FROM exercises;

INSERT INTO exercises (
  user_id,
  name,
  muscle_group,
  equipment,
  exercise_type,
  secondary_muscles,
  movement_pattern,
  is_compound,
  difficulty_tier,
  fatigue_score,
  is_cardio,
  media_type,
  media_url,
  thumbnail_url
) VALUES
-- 0
(NULL, '3 Quarter Sit-up',                    'abs',      'none',   'bodyweight_reps', '{obliques}',                       'trunk_flexion',  false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/0_3 Quarter Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/0_3 Quarter Sit-up.jpg'),

-- 1
(NULL, '45° Side Bend',                        'obliques', 'none',   'bodyweight_reps', '{abs}',                             'lateral_flexion', false, 'beginner',   1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1_45° Side Bend.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1_45° Side Bend.jpg'),

-- 2
(NULL, 'Air Bike',                             'abs',      'none',   'bodyweight_reps', '{obliques}',                        'trunk_rotation', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/2_Air Bike.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/2_Air Bike.jpg'),

-- 3
(NULL, 'All Fours Squad Stretch',              'quads',    'none',   'duration',        '{}',                     'stretch',        false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/3_All Fours Squad Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/3_All Fours Squad Stretch.jpg'),

-- 4
(NULL, 'Alternate Heel Touchers',              'obliques', 'none',   'bodyweight_reps', '{abs}',                             'trunk_flexion',  false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/4_Alternate Heel Touchers.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/4_Alternate Heel Touchers.jpg'),

-- 5
(NULL, 'Alternate Lateral Pulldown',           'back',     'cable',  'weight_reps',     '{biceps,forearms,upper_back}',      'vertical_pull',  true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/5_Alternate Lateral Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/5_Alternate Lateral Pulldown.jpg'),

-- 6
(NULL, 'Ankle Circles',                        'calves',   'none',   'duration',        '{feet}',                            'mobility',       false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/6_Ankle Circles.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/6_Ankle Circles.jpg'),

-- 7
(NULL, 'Archer Pull Up',                       'back',     'none',   'bodyweight_reps', '{biceps,forearms,upper_back,abs}',  'vertical_pull',  true,  'advanced',    5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/7_Archer Pull Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/7_Archer Pull Up.jpg'),

-- 8
(NULL, 'Archer Push Up',                       'chest',    'none',   'bodyweight_reps', '{triceps,shoulders,abs,obliques}',  'horizontal_press', true, 'advanced',   4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/8_Archer Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/8_Archer Push Up.jpg'),

-- 9
(NULL, 'Arm Slingers Hanging Bent Knee Legs', 'abs',      'none',   'bodyweight_reps', '{forearms,hands,shoulders}',        'trunk_flexion',  true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/9_Arm Slingers Hanging Bent Knee Legs.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/9_Arm Slingers Hanging Bent Knee Legs.jpg'),

-- 10
(NULL, 'Arm Slingers Hanging Straight Legs',                      'abs',         'none',           'bodyweight_reps',    '{forearms,hands,shoulders}',              'trunk_flexion',    true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/10_Arm Slingers Hanging Straight Legs.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/10_Arm Slingers Hanging Straight Legs.jpg'),

-- 11
(NULL, 'Arms Apart Circular Toe Touch',                           'abs',         'none',           'bodyweight_reps',    '{obliques,hamstrings}',                   'trunk_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/11_Arms Apart Circular Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/11_Arms Apart Circular Toe Touch.jpg'),

-- 12
(NULL, 'Arms Overhead Full Sit-up',                               'abs',         'none',           'bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/12_Arms Overhead Full Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/12_Arms Overhead Full Sit-up.jpg'),

-- 13
(NULL, 'Assisted Chest Dip (Kneeling)',                           'triceps',     'machine',        'assisted_bodyweight','{chest,shoulders}',                       'vertical_press',   true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/13_Assisted Chest Dip (Kneeling).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/13_Assisted Chest Dip (Kneeling).jpg'),

-- 14
(NULL, 'Assisted Hanging Knee Raise',                             'abs',         'machine',        'assisted_bodyweight','{forearms}',                  'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/14_Assisted Hanging Knee Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/14_Assisted Hanging Knee Raise.jpg'),

-- 15
(NULL, 'Assisted Hanging Knee Raise With Throw Down',             'abs',         'other',          'assisted_bodyweight','{forearms,obliques}',          'trunk_flexion',    false, 'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/15_Assisted Hanging Knee Raise With Throw Down.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/15_Assisted Hanging Knee Raise With Throw Down.jpg'),

-- 16
(NULL, 'Assisted Lying Calves Stretch',                           'calves',      'none',           'duration',           '{feet,ankles}',                           'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/16_Assisted Lying Calves Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/16_Assisted Lying Calves Stretch.jpg'),

-- 17
(NULL, 'Assisted Lying Glutes Stretch',                           'glutes',      'none',           'duration',           '{lower_back}',                            'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/17_Assisted Lying Glutes Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/17_Assisted Lying Glutes Stretch.jpg'),

-- 18
(NULL, 'Assisted Lying Gluteus And Piriformis Stretch',           'glutes',      'none',           'duration',           '{lower_back}',                'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/18_Assisted Lying Gluteus And Piriformis Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/18_Assisted Lying Gluteus And Piriformis Stretch.jpg'),

-- 19
(NULL, 'Assisted Lying Leg Raise With Lateral Throw Down',        'abs',         'other',          'assisted_bodyweight','{obliques}',                  'trunk_flexion',    false, 'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/19_Assisted Lying Leg Raise With Lateral Throw Down.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/19_Assisted Lying Leg Raise With Lateral Throw Down.jpg'),

-- 20
(NULL, 'Assisted Lying Leg Raise With Throw Down',                'abs',         'other',          'assisted_bodyweight','{}',                           'trunk_flexion',    false, 'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/20_Assisted Lying Leg Raise With Throw Down.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/20_Assisted Lying Leg Raise With Throw Down.jpg'),

-- 21
(NULL, 'Assisted Motion Russian Twist',                           'obliques',    'other',          'bodyweight_reps',    '{abs}',                                   'trunk_rotation',   false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/21_Assisted Motion Russian Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/21_Assisted Motion Russian Twist.jpg'),

-- 22
(NULL, 'Assisted Parallel Close Grip Pull-up',                    'back',        'machine',        'assisted_bodyweight','{biceps,forearms,upper_back,abs}',         'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/22_Assisted Parallel Close Grip Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/22_Assisted Parallel Close Grip Pull-up.jpg'),

-- 23
(NULL, 'Assisted Prone Hamstring',                                'hamstrings',  'none',           'duration',           '{calves}',                                'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/23_Assisted Prone Hamstring.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/23_Assisted Prone Hamstring.jpg'),

-- 24
(NULL, 'Assisted Prone Lying Quads Stretch',                      'quads',       'none',           'duration',           '{}',                           'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/24_Assisted Prone Lying Quads Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/24_Assisted Prone Lying Quads Stretch.jpg'),

-- 25
(NULL, 'Assisted Prone Rectus Femoris Stretch',                   'quads',       'none',           'duration',           '{}',                           'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/25_Assisted Prone Rectus Femoris Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/25_Assisted Prone Rectus Femoris Stretch.jpg'),

-- 26
(NULL, 'Assisted Pull-up',                                        'back',        'machine',        'assisted_bodyweight','{biceps,forearms,upper_back,abs}',         'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/26_Assisted Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/26_Assisted Pull-up.jpg'),

-- 27
(NULL, 'Assisted Seated Pectoralis Major Stretch With Stability Ball','chest',   'other',          'duration',           '{shoulders}',                             'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/27_Assisted Seated Pectoralis Major Stretch With Stability Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/27_Assisted Seated Pectoralis Major Stretch With Stability Ball.jpg'),

-- 28
(NULL, 'Assisted Side Lying Adductor Stretch',                    'adductors',   'none',           'duration',           '{glutes}',                                'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/28_Assisted Side Lying Adductor Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/28_Assisted Side Lying Adductor Stretch.jpg'),

-- 29
(NULL, 'Assisted Sit-up',                                         'abs',         'other',          'assisted_bodyweight','{obliques}',                  'trunk_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/29_Assisted Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/29_Assisted Sit-up.jpg'),

-- 30
(NULL, 'Assisted Standing Chin-up',                               'back',        'machine',        'assisted_bodyweight','{biceps,forearms,upper_back,abs}',         'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/30_Assisted Standing Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/30_Assisted Standing Chin-up.jpg'),

-- 31
(NULL, 'Assisted Standing Pull-up',                               'back',        'machine',        'assisted_bodyweight','{biceps,forearms,upper_back,abs}',         'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/31_Assisted Standing Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/31_Assisted Standing Pull-up.jpg'),

-- 32
(NULL, 'Assisted Standing Triceps Extension (With Towel)',        'triceps',     'other',          'assisted_bodyweight','{shoulders}',                             'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/32_Assisted Standing Triceps Extension (With Towel).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/32_Assisted Standing Triceps Extension (With Towel).jpg'),

-- 33
(NULL, 'Assisted Triceps Dip (Kneeling)',                         'triceps',     'machine',        'assisted_bodyweight','{chest,shoulders}',                       'elbow_extension',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/33_Assisted Triceps Dip (Kneeling).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/33_Assisted Triceps Dip (Kneeling).jpg'),

-- 34
(NULL, 'Assisted Wide-grip Chest Dip (Kneeling)',                 'chest',       'machine',        'assisted_bodyweight','{triceps,shoulders}',                     'vertical_press',   true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/34_Assisted Wide-grip Chest Dip (Kneeling).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/34_Assisted Wide-grip Chest Dip (Kneeling).jpg'),

-- 35
(NULL, 'Astride Jumps',                                           'cardio',      'none',           'bodyweight_reps',    '{quads,glutes,calves,adductors}',          'locomotion',       true,  'beginner',      3, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/35_Astride Jumps.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/35_Astride Jumps.jpg'),

-- 36
(NULL, 'Back And Forth Step',                                     'cardio',      'none',           'duration',           '{quads,glutes,calves}',                   'locomotion',       true,  'beginner',      2, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/36_Back And Forth Step.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/36_Back And Forth Step.jpg'),

-- 37
(NULL, 'Back Extension On Exercise Ball',                         'lower_back',  'other',          'bodyweight_reps',    '{glutes,hamstrings}',                     'hip_hinge',        true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/37_Back Extension On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/37_Back Extension On Exercise Ball.jpg'),

-- 38
(NULL, 'Back Lever',                                              'back',        'none',           'duration',           '{abs,shoulders,biceps,chest}',            'anti_extension',   true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/38_Back Lever.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/38_Back Lever.jpg'),

-- 39
(NULL, 'Back Pec Stretch',                                        'chest',       'none',           'duration',           '{shoulders,upper_back}',                  'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/39_Back Pec Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/39_Back Pec Stretch.jpg'),

-- 40
(NULL, 'Backward Jump',                                           'quads',       'none',           'bodyweight_reps',    '{glutes,calves,hamstrings}',              'locomotion',       true,  'intermediate',  3, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/40_Backward Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/40_Backward Jump.jpg'),

-- 41
(NULL, 'Balance Board',                                           'abs',         'other',          'duration',           '{calves,ankles,feet}',                    'mobility',         true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/41_Balance Board.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/41_Balance Board.jpg'),

-- 42
(NULL, 'Band Alternating Biceps Curl',                            'biceps',      'resistance_band','weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/42_Band Alternating Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/42_Band Alternating Biceps Curl.jpg'),

-- 43
(NULL, 'Band Alternating V-up',                                   'abs',         'resistance_band','bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/43_Band Alternating V-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/43_Band Alternating V-up.jpg'),

-- 44
(NULL, 'Band Assisted Pull-up',                                   'back',        'resistance_band','assisted_bodyweight','{biceps,forearms,upper_back,abs}',         'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/44_Band Assisted Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/44_Band Assisted Pull-up.jpg'),

-- 45
(NULL, 'Band Assisted Wheel Rollerout',                           'abs',         'resistance_band','bodyweight_reps',    '{shoulders,obliques,triceps}',            'anti_extension',   true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/45_Band Assisted Wheel Rollerout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/45_Band Assisted Wheel Rollerout.jpg'),

-- 46
(NULL, 'Band Bench Press',                                        'chest',       'resistance_band','weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/46_Band Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/46_Band Bench Press.jpg'),

-- 47
(NULL, 'Band Bent-over Hip Extension',                            'glutes',      'resistance_band','weight_reps',        '{hamstrings}',                            'hip_extension',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/47_Band Bent-over Hip Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/47_Band Bent-over Hip Extension.jpg'),

-- 48
(NULL, 'Band Bicycle Crunch',                                     'abs',         'resistance_band','bodyweight_reps',    '{obliques}',                  'trunk_rotation',   false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/48_Band Bicycle Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/48_Band Bicycle Crunch.jpg'),

-- 49
(NULL, 'Band Close-grip Pulldown',                                'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/49_Band Close-grip Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/49_Band Close-grip Pulldown.jpg'),

-- 50
(NULL, 'Band Close-grip Push-up',                                 'triceps',     'resistance_band','bodyweight_reps',    '{chest,shoulders,abs}',                   'horizontal_press', true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/50_Band Close-grip Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/50_Band Close-grip Push-up.jpg'),

-- 51
(NULL, 'Band Concentration Curl',                                 'biceps',      'resistance_band','weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/51_Band Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/51_Band Concentration Curl.jpg'),

-- 52
(NULL, 'Band Fixed Back Close Grip Pulldown',                     'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/52_Band Fixed Back Close Grip Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/52_Band Fixed Back Close Grip Pulldown.jpg'),

-- 53
(NULL, 'Band Fixed Back Underhand Pulldown',                      'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/53_Band Fixed Back Underhand Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/53_Band Fixed Back Underhand Pulldown.jpg'),

-- 54
(NULL, 'Band Front Lateral Raise',                                'shoulders',   'resistance_band','weight_reps',        '{traps,chest}',                           'front_raise',      false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/54_Band Front Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/54_Band Front Lateral Raise.jpg'),

-- 55
(NULL, 'Band Front Raise',                                        'shoulders',   'resistance_band','weight_reps',        '{chest,upper_back}',                      'front_raise',      false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/55_Band Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/55_Band Front Raise.jpg'),

-- 56
(NULL, 'Band Hip Lift',                                           'glutes',      'resistance_band','weight_reps',        '{hamstrings,abs,adductors}',              'hip_extension',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/56_Band Hip Lift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/56_Band Hip Lift.jpg'),

-- 57
(NULL, 'Band Horizontal Pallof Press',                            'abs',         'resistance_band','weight_reps',        '{obliques,shoulders,chest}',              'anti_rotation',    true,  'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/57_Band Horizontal Pallof Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/57_Band Horizontal Pallof Press.jpg'),

-- 58
(NULL, 'Band Jack Knife Sit-up',                                  'abs',         'resistance_band','bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/58_Band Jack Knife Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/58_Band Jack Knife Sit-up.jpg'),

-- 59
(NULL, 'Band Kneeling One Arm Pulldown',                          'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back,abs,obliques}','vertical_pull',   true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/59_Band Kneeling One Arm Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/59_Band Kneeling One Arm Pulldown.jpg'),

-- 60
(NULL, 'Band Kneeling Twisting Crunch',                           'obliques',    'resistance_band','bodyweight_reps',    '{abs}',                                   'trunk_rotation',   false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/60_Band Kneeling Twisting Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/60_Band Kneeling Twisting Crunch.jpg'),

-- 61
(NULL, 'Band Lying Hip Internal Rotation',                        'glutes',      'resistance_band','bodyweight_reps',    '{adductors}',                             'hip_rotation',     false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/61_Band Lying Hip Internal Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/61_Band Lying Hip Internal Rotation.jpg'),

-- 62
(NULL, 'Band Lying Straight Leg Raise',                           'abs',         'resistance_band','bodyweight_reps',    '{}',                           'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/62_Band Lying Straight Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/62_Band Lying Straight Leg Raise.jpg'),

-- 63
(NULL, 'Band One Arm Overhead Biceps Curl',                       'biceps',      'resistance_band','weight_reps',        '{forearms,shoulders}',                    'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/63_Band One Arm Overhead Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/63_Band One Arm Overhead Biceps Curl.jpg'),

-- 64
(NULL, 'Band One Arm Single Leg Split Squat',                     'quads',       'resistance_band','weight_reps',        '{glutes,hamstrings,adductors,calves}',    'lunge',            true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/64_Band One Arm Single Leg Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/64_Band One Arm Single Leg Split Squat.jpg'),

-- 65
(NULL, 'Band One Arm Standing Low Row',                           'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back,abs,obliques}','horizontal_pull',  true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/65_Band One Arm Standing Low Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/65_Band One Arm Standing Low Row.jpg'),

-- 66
(NULL, 'Band One Arm Twisting Chest Press',                       'chest',       'resistance_band','weight_reps',        '{triceps,shoulders,obliques}',            'horizontal_press', true,  'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/66_Band One Arm Twisting Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/66_Band One Arm Twisting Chest Press.jpg'),

-- 67
(NULL, 'Band One Arm Twisting Seated Row',                        'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back,obliques}',   'horizontal_pull',  true,  'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/67_Band One Arm Twisting Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/67_Band One Arm Twisting Seated Row.jpg'),

-- 68
(NULL, 'Band Pull Through',                                       'glutes',      'resistance_band','weight_reps',        '{hamstrings,lower_back}',                 'hip_hinge',        true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/68_Band Pull Through.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/68_Band Pull Through.jpg'),

-- 69
(NULL, 'Band Push Sit-up',                                        'abs',         'resistance_band','bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/69_Band Push Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/69_Band Push Sit-up.jpg'),

-- 70
(NULL, 'Band Reverse Fly',                                        'shoulders',   'resistance_band','weight_reps',        '{upper_back,traps}',                      'rear_delt_fly',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/70_Band Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/70_Band Reverse Fly.jpg'),

-- 71
(NULL, 'Band Reverse Wrist Curl',                                 'forearms',    'resistance_band','weight_reps',        '{}',                                      'wrist_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/71_Band Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/71_Band Reverse Wrist Curl.jpg'),

-- 72
(NULL, 'Band Seated Hip Internal Rotation',                       'glutes',      'resistance_band','bodyweight_reps',    '{adductors}',                             'hip_rotation',     false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/72_Band Seated Hip Internal Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/72_Band Seated Hip Internal Rotation.jpg'),

-- 73
(NULL, 'Band Seated Twist',                                       'obliques',    'resistance_band','weight_reps',        '{abs}',                                   'trunk_rotation',   false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/73_Band Seated Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/73_Band Seated Twist.jpg'),

-- 74
(NULL, 'Band Shoulder Press',                                     'shoulders',   'resistance_band','weight_reps',        '{triceps,abs,obliques}',                  'vertical_press',   true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/74_Band Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/74_Band Shoulder Press.jpg'),

-- 75
(NULL, 'Band Shrug',                                              'traps',       'resistance_band','weight_reps',        '{forearms,upper_back}',                   'shrug',            false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/75_Band Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/75_Band Shrug.jpg'),

-- 76
(NULL, 'Band Side Triceps Extension',                             'triceps',     'resistance_band','weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/76_Band Side Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/76_Band Side Triceps Extension.jpg'),

-- 77
(NULL, 'Band Single Leg Calf Raise',                              'calves',      'resistance_band','weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/77_Band Single Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/77_Band Single Leg Calf Raise.jpg'),

-- 78
(NULL, 'Band Single Leg Reverse Calf Raise',                      'calves',      'resistance_band','weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/78_Band Single Leg Reverse Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/78_Band Single Leg Reverse Calf Raise.jpg'),

-- 79
(NULL, 'Band Single Leg Split Squat',                             'quads',       'resistance_band','weight_reps',        '{glutes,hamstrings,adductors,calves}',    'lunge',            true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/79_Band Single Leg Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/79_Band Single Leg Split Squat.jpg'),

-- 80
(NULL, 'Band Squat',                                              'quads',       'resistance_band','weight_reps',        '{glutes,hamstrings,adductors,abs}',       'squat',            true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/80_Band Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/80_Band Squat.jpg'),

-- 81
(NULL, 'Band Squat Row',                                          'full_body',   'resistance_band','weight_reps',        '{quads,glutes,upper_back,biceps,forearms}','squat',            true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/81_Band Squat Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/81_Band Squat Row.jpg'),

-- 82
(NULL, 'Band Standing Crunch',                                    'abs',         'resistance_band','weight_reps',        '{obliques}',                              'trunk_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/82_Band Standing Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/82_Band Standing Crunch.jpg'),

-- 83
(NULL, 'Band Standing Rear Delt Row',                             'shoulders',   'resistance_band','weight_reps',        '{upper_back,traps,biceps,forearms}',      'rear_delt_fly',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/83_Band Standing Rear Delt Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/83_Band Standing Rear Delt Row.jpg'),

-- 84
(NULL, 'Band Standing Twisting Crunch',                           'obliques',    'resistance_band','weight_reps',        '{abs}',                                   'trunk_rotation',   false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/84_Band Standing Twisting Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/84_Band Standing Twisting Crunch.jpg'),

-- 85
(NULL, 'Band Step-up',                                            'quads',       'resistance_band','weight_reps',        '{glutes,hamstrings,calves,abs}',           'step_up',          true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/85_Band Step-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/85_Band Step-up.jpg'),

-- 86
(NULL, 'Band Stiff Leg Deadlift',                                 'hamstrings',  'resistance_band','weight_reps',        '{glutes,lower_back}',                     'hip_hinge',        true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/86_Band Stiff Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/86_Band Stiff Leg Deadlift.jpg'),

-- 87
(NULL, 'Band Straight Back Stiff Leg Deadlift',                   'hamstrings',  'resistance_band','weight_reps',        '{glutes,lower_back}',                     'hip_hinge',        true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/87_Band Straight Back Stiff Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/87_Band Straight Back Stiff Leg Deadlift.jpg'),

-- 88
(NULL, 'Band Straight Leg Deadlift',                              'hamstrings',  'resistance_band','weight_reps',        '{glutes,lower_back}',                     'hip_hinge',        true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/88_Band Straight Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/88_Band Straight Leg Deadlift.jpg'),

-- 89
(NULL, 'Band Twisting Overhead Press',                            'shoulders',   'resistance_band','weight_reps',        '{triceps,abs,obliques}',                  'vertical_press',   true,  'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/89_Band Twisting Overhead Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/89_Band Twisting Overhead Press.jpg'),

-- 90
(NULL, 'Band Two Legs Calf Raise - (Band Under Both Legs) V. 2',  'calves',      'resistance_band','weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/90_Band Two Legs Calf Raise - (Band Under Both Legs) V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/90_Band Two Legs Calf Raise - (Band Under Both Legs) V. 2.jpg'),

-- 91
(NULL, 'Band Underhand Pulldown',                                 'back',        'resistance_band','weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/91_Band Underhand Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/91_Band Underhand Pulldown.jpg'),

-- 92
(NULL, 'Band V-up',                                               'abs',         'resistance_band','bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/92_Band V-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/92_Band V-up.jpg'),

-- 93
(NULL, 'Band Vertical Pallof Press',                              'abs',         'resistance_band','weight_reps',        '{obliques,shoulders,chest}',              'anti_rotation',    true,  'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/93_Band Vertical Pallof Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/93_Band Vertical Pallof Press.jpg'),

-- 94
(NULL, 'Band Wrist Curl',                                         'forearms',    'resistance_band','weight_reps',        '{}',                                      'wrist_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/94_Band Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/94_Band Wrist Curl.jpg'),

-- 95
(NULL, 'Band Y-raise',                                            'upper_back',  'resistance_band','weight_reps',        '{shoulders,traps}',                       'rear_delt_fly',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/95_Band Y-raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/95_Band Y-raise.jpg'),

-- 96
(NULL, 'Barbell Alternate Biceps Curl',                           'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/96_Barbell Alternate Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/96_Barbell Alternate Biceps Curl.jpg'),

-- 97
(NULL, 'Barbell Bench Front Squat',                               'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,adductors}',       'squat',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/97_Barbell Bench Front Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/97_Barbell Bench Front Squat.jpg'),

-- 98
(NULL, 'Barbell Bench Press',                                     'chest',       'barbell',        'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/98_Barbell Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/98_Barbell Bench Press.jpg'),

-- 99
(NULL, 'Barbell Bench Squat',                                     'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/99_Barbell Bench Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/99_Barbell Bench Squat.jpg'),

-- 100
(NULL, 'Barbell Bent Arm Pullover',                               'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/100_Barbell Bent Arm Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/100_Barbell Bent Arm Pullover.jpg'),

-- 101
(NULL, 'Barbell Bent Over Row',                                   'upper_back',  'barbell',        'weight_reps',        '{lower_back,biceps,forearms,traps}',      'horizontal_pull',  true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/101_Barbell Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/101_Barbell Bent Over Row.jpg'),

-- 102
(NULL, 'Barbell Biceps Curl (With Arm Blaster)',                  'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/102_Barbell Biceps Curl (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/102_Barbell Biceps Curl (With Arm Blaster).jpg'),

-- 103
(NULL, 'Barbell Clean And Press',                                 'full_body',   'barbell',        'weight_reps',        '{shoulders,triceps,quads,glutes,traps,lower_back}','hip_hinge',  true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/103_Barbell Clean And Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/103_Barbell Clean And Press.jpg'),

-- 104
(NULL, 'Barbell Clean-grip Front Squat',                          'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,lower_back,adductors}','squat',          true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/104_Barbell Clean-grip Front Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/104_Barbell Clean-grip Front Squat.jpg'),

-- 105
(NULL, 'Barbell Close-grip Bench Press',                          'triceps',     'barbell',        'weight_reps',        '{chest,shoulders}',                       'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/105_Barbell Close-grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/105_Barbell Close-grip Bench Press.jpg'),

-- 106
(NULL, 'Barbell Curl',                                            'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/106_Barbell Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/106_Barbell Curl.jpg'),

-- 107
(NULL, 'Barbell Deadlift',                                        'full_body',   'barbell',        'weight_reps',        '{lower_back,glutes,hamstrings,upper_back,traps,forearms}','hip_hinge',true,'intermediate', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/107_Barbell Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/107_Barbell Deadlift.jpg'),

-- 108
(NULL, 'Barbell Decline Bench Press',                             'chest',       'barbell',        'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/108_Barbell Decline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/108_Barbell Decline Bench Press.jpg'),

-- 109
(NULL, 'Barbell Decline Bent Arm Pullover',                       'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/109_Barbell Decline Bent Arm Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/109_Barbell Decline Bent Arm Pullover.jpg'),

-- 110
(NULL, 'Barbell Decline Close Grip To Skull Press',               'triceps',     'barbell',        'weight_reps',        '{chest,shoulders}',                       'elbow_extension',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/110_Barbell Decline Close Grip To Skull Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/110_Barbell Decline Close Grip To Skull Press.jpg'),

-- 111
(NULL, 'Barbell Decline Pullover',                                'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/111_Barbell Decline Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/111_Barbell Decline Pullover.jpg'),

-- 112
(NULL, 'Barbell Decline Wide-grip Press',                         'chest',       'barbell',        'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/112_Barbell Decline Wide-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/112_Barbell Decline Wide-grip Press.jpg'),

-- 113
(NULL, 'Barbell Decline Wide-grip Pullover',                      'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/113_Barbell Decline Wide-grip Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/113_Barbell Decline Wide-grip Pullover.jpg'),

-- 114
(NULL, 'Barbell Drag Curl',                                       'biceps',      'barbell',        'weight_reps',        '{forearms,shoulders}',                    'elbow_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/114_Barbell Drag Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/114_Barbell Drag Curl.jpg'),

-- 115
(NULL, 'Barbell Floor Calf Raise',                                'calves',      'barbell',        'weight_reps',        '{feet,ankles,lower_back}',                'calf_raise',       false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/115_Barbell Floor Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/115_Barbell Floor Calf Raise.jpg'),

-- 116
(NULL, 'Barbell Front Chest Squat',                               'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,adductors}',       'squat',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/116_Barbell Front Chest Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/116_Barbell Front Chest Squat.jpg'),

-- 117
(NULL, 'Barbell Front Raise',                                     'shoulders',   'barbell',        'weight_reps',        '{chest,upper_back}',                      'front_raise',      false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/117_Barbell Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/117_Barbell Front Raise.jpg'),

-- 118
(NULL, 'Barbell Front Raise And Pullover',                        'shoulders',   'barbell',        'weight_reps',        '{chest,upper_back,triceps}',              'front_raise',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/118_Barbell Front Raise And Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/118_Barbell Front Raise And Pullover.jpg'),

-- 119
(NULL, 'Barbell Front Squat',                                     'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,lower_back,adductors}','squat',          true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/119_Barbell Front Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/119_Barbell Front Squat.jpg'),

-- 120
(NULL, 'Barbell Full Squat',                                      'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/120_Barbell Full Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/120_Barbell Full Squat.jpg'),

-- 123
(NULL, 'Barbell Full Zercher Squat',                              'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,lower_back,biceps,adductors}','squat',   true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/123_Barbell Full Zercher Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/123_Barbell Full Zercher Squat.jpg'),

-- 124
(NULL, 'Barbell Glute Bridge',                                    'glutes',      'barbell',        'weight_reps',        '{hamstrings,abs,adductors}',              'hip_extension',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/124_Barbell Glute Bridge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/124_Barbell Glute Bridge.jpg'),

-- 125
(NULL, 'Barbell Glute Bridge Two Legs On Bench',                  'glutes',      'barbell',        'weight_reps',        '{hamstrings,abs,adductors}',              'hip_extension',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/125_Barbell Glute Bridge Two Legs On Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/125_Barbell Glute Bridge Two Legs On Bench.jpg'),

-- 126
(NULL, 'Barbell Good Morning',                                    'hamstrings',  'barbell',        'weight_reps',        '{glutes,lower_back,abs}',                 'hip_hinge',        true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/126_Barbell Good Morning.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/126_Barbell Good Morning.jpg'),

-- 127
(NULL, 'Barbell Guillotine Bench Press',                          'chest',       'barbell',        'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/127_Barbell Guillotine Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/127_Barbell Guillotine Bench Press.jpg'),

-- 128
(NULL, 'Barbell Hack Squat',                                      'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves}',    'squat',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/128_Barbell Hack Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/128_Barbell Hack Squat.jpg'),

-- 129
(NULL, 'Barbell High Bar Squat',                                  'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/129_Barbell High Bar Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/129_Barbell High Bar Squat.jpg'),

-- 130
(NULL, 'Barbell Incline Bench Press',                             'chest',       'barbell',        'weight_reps',        '{shoulders,triceps}',                     'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/130_Barbell Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/130_Barbell Incline Bench Press.jpg'),

-- 131
(NULL, 'Barbell Incline Close Grip Bench Press',                  'triceps',     'barbell',        'weight_reps',        '{chest,shoulders}',                       'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/131_Barbell Incline Close Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/131_Barbell Incline Close Grip Bench Press.jpg'),

-- 132
(NULL, 'Barbell Incline Reverse-grip Press',                      'chest',       'barbell',        'weight_reps',        '{triceps,biceps,shoulders}',              'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/132_Barbell Incline Reverse-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/132_Barbell Incline Reverse-grip Press.jpg'),

-- 133
(NULL, 'Barbell Incline Row',                                     'upper_back',  'barbell',        'weight_reps',        '{biceps,forearms,traps}',                 'horizontal_pull',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/133_Barbell Incline Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/133_Barbell Incline Row.jpg'),

-- 134
(NULL, 'Barbell Incline Shoulder Raise',                          'shoulders',   'barbell',        'weight_reps',        '{traps,upper_back}',                      'front_raise',      false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/134_Barbell Incline Shoulder Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/134_Barbell Incline Shoulder Raise.jpg'),

-- 135
(NULL, 'Barbell Jefferson Squat',                                 'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,lower_back,abs}','squat',          true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/135_Barbell Jefferson Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/135_Barbell Jefferson Squat.jpg'),

-- 136
(NULL, 'Barbell Jm Bench Press',                                  'triceps',     'barbell',        'weight_reps',        '{shoulders,chest}',                       'elbow_extension',  true,  'advanced',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/136_Barbell Jm Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/136_Barbell Jm Bench Press.jpg'),

-- 137
(NULL, 'Barbell Jump Squat',                                      'quads',       'barbell',        'weight_reps',        '{glutes,calves,hamstrings}',              'squat',            true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/137_Barbell Jump Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/137_Barbell Jump Squat.jpg'),

-- 138
(NULL, 'Barbell Lateral Lunge',                                   'quads',       'barbell',        'weight_reps',        '{glutes,adductors,hamstrings,calves}',    'lunge',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/138_Barbell Lateral Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/138_Barbell Lateral Lunge.jpg'),

-- 139
(NULL, 'Barbell Low Bar Squat',                                   'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/139_Barbell Low Bar Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/139_Barbell Low Bar Squat.jpg'),

-- 140
(NULL, 'Barbell Lunge',                                           'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,calves,adductors,abs}', 'lunge',           true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/140_Barbell Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/140_Barbell Lunge.jpg'),

-- 141
(NULL, 'Barbell Lying Back Of The Head Tricep Extension',         'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/141_Barbell Lying Back Of The Head Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/141_Barbell Lying Back Of The Head Tricep Extension.jpg'),

-- 142
(NULL, 'Barbell Lying Close-grip Press',                          'triceps',     'barbell',        'weight_reps',        '{chest,shoulders}',                       'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/142_Barbell Lying Close-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/142_Barbell Lying Close-grip Press.jpg'),

-- 143
(NULL, 'Barbell Lying Close-grip Triceps Extension',              'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/143_Barbell Lying Close-grip Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/143_Barbell Lying Close-grip Triceps Extension.jpg'),

-- 144
(NULL, 'Barbell Lying Extension',                                 'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/144_Barbell Lying Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/144_Barbell Lying Extension.jpg'),

-- 145
(NULL, 'Barbell Lying Lifting (On Hip)',                          'glutes',      'barbell',        'weight_reps',        '{hamstrings,abs,adductors}',              'hip_extension',    true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/145_Barbell Lying Lifting (On Hip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/145_Barbell Lying Lifting (On Hip).jpg'),

-- 146
(NULL, 'Barbell Lying Preacher Curl',                             'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/146_Barbell Lying Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/146_Barbell Lying Preacher Curl.jpg'),

-- 147
(NULL, 'Barbell Lying Triceps Extension',                         'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/147_Barbell Lying Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/147_Barbell Lying Triceps Extension.jpg'),

-- 148
(NULL, 'Barbell Lying Triceps Extension Skull Crusher',           'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/148_Barbell Lying Triceps Extension Skull Crusher.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/148_Barbell Lying Triceps Extension Skull Crusher.jpg'),

-- 149
(NULL, 'Barbell Narrow Stance Squat',                             'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/149_Barbell Narrow Stance Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/149_Barbell Narrow Stance Squat.jpg'),

-- 150
(NULL, 'Barbell One Arm Bent Over Row',                           'upper_back',  'barbell',        'weight_reps',        '{biceps,forearms,traps,obliques}',        'horizontal_pull',  true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/150_Barbell One Arm Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/150_Barbell One Arm Bent Over Row.jpg'),

-- 151
(NULL, 'Barbell One Arm Floor Press',                             'chest',       'barbell',        'weight_reps',        '{triceps,abs,obliques,shoulders}',        'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/151_Barbell One Arm Floor Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/151_Barbell One Arm Floor Press.jpg'),

-- 152
(NULL, 'Barbell One Arm Side Deadlift',                           'full_body',   'barbell',        'weight_reps',        '{lower_back,obliques,glutes,hamstrings,traps,forearms}','hip_hinge',true,'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/152_Barbell One Arm Side Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/152_Barbell One Arm Side Deadlift.jpg'),

-- 153
(NULL, 'Barbell One Arm Snatch',                                  'full_body',   'barbell',        'weight_reps',        '{shoulders,triceps,quads,glutes,traps,lower_back,forearms}','hip_hinge',true,'advanced',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/153_Barbell One Arm Snatch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/153_Barbell One Arm Snatch.jpg'),

-- 154
(NULL, 'Barbell One Leg Squat',                                   'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves,abs}', 'squat',           true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/154_Barbell One Leg Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/154_Barbell One Leg Squat.jpg'),

-- 155
(NULL, 'Barbell Overhead Squat',                                  'quads',       'barbell',        'weight_reps',        '{glutes,shoulders,abs,upper_back,lower_back,adductors}','squat',true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/155_Barbell Overhead Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/155_Barbell Overhead Squat.jpg'),

-- 156
(NULL, 'Barbell Palms Down Wrist Curl Over A Bench',              'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/156_Barbell Palms Down Wrist Curl Over A Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/156_Barbell Palms Down Wrist Curl Over A Bench.jpg'),

-- 157
(NULL, 'Barbell Palms Up Wrist Curl Over A Bench',                'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/157_Barbell Palms Up Wrist Curl Over A Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/157_Barbell Palms Up Wrist Curl Over A Bench.jpg'),

-- 158
(NULL, 'Barbell Pendlay Row',                                     'upper_back',  'barbell',        'weight_reps',        '{lower_back,biceps,forearms,traps}',      'horizontal_pull',  true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/158_Barbell Pendlay Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/158_Barbell Pendlay Row.jpg'),

-- 159
(NULL, 'Barbell Pin Presses',                                     'chest',       'barbell',        'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/159_Barbell Pin Presses.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/159_Barbell Pin Presses.jpg'),

-- 160
(NULL, 'Barbell Preacher Curl',                                   'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/160_Barbell Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/160_Barbell Preacher Curl.jpg'),

-- 161
(NULL, 'Barbell Press Sit-up',                                    'abs',         'barbell',        'weight_reps',        '{obliques,shoulders,chest}',  'trunk_flexion',    true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/161_Barbell Press Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/161_Barbell Press Sit-up.jpg'),

-- 162
(NULL, 'Barbell Prone Incline Curl',                              'biceps',      'barbell',        'weight_reps',        '{forearms,shoulders}',                    'elbow_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/162_Barbell Prone Incline Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/162_Barbell Prone Incline Curl.jpg'),

-- 163
(NULL, 'Barbell Pullover',                                        'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/163_Barbell Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/163_Barbell Pullover.jpg'),

-- 164
(NULL, 'Barbell Pullover To Press',                               'chest',       'barbell',        'weight_reps',        '{back,triceps,shoulders}',                'chest_fly',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/164_Barbell Pullover To Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/164_Barbell Pullover To Press.jpg'),

-- 165
(NULL, 'Barbell Rack Pull',                                       'upper_back',  'barbell',        'weight_reps',        '{lower_back,traps,glutes,forearms,hamstrings}','hip_hinge',     true,  'intermediate',  5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/165_Barbell Rack Pull.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/165_Barbell Rack Pull.jpg'),

-- 166
(NULL, 'Barbell Rear Delt Raise',                                 'shoulders',   'barbell',        'weight_reps',        '{upper_back,traps}',                      'rear_delt_fly',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/166_Barbell Rear Delt Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/166_Barbell Rear Delt Raise.jpg'),

-- 167
(NULL, 'Barbell Rear Delt Row',                                   'shoulders',   'barbell',        'weight_reps',        '{upper_back,traps,biceps,forearms}',      'rear_delt_fly',    true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/167_Barbell Rear Delt Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/167_Barbell Rear Delt Row.jpg'),

-- 168
(NULL, 'Barbell Rear Lunge',                                      'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves,abs}', 'lunge',           true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/168_Barbell Rear Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/168_Barbell Rear Lunge.jpg'),

-- 169
(NULL, 'Barbell Rear Lunge V. 2',                                 'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves,abs}', 'lunge',           true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/169_Barbell Rear Lunge V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/169_Barbell Rear Lunge V. 2.jpg'),

-- 170
(NULL, 'Barbell Reverse Wrist Curl V. 2',                         'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/170_Barbell Reverse Wrist Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/170_Barbell Reverse Wrist Curl V. 2.jpg'),

-- 171
(NULL, 'Barbell Reverse Close-grip Bench Press',                  'chest',       'barbell',        'weight_reps',        '{triceps,biceps,shoulders}',              'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/171_Barbell Reverse Close-grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/171_Barbell Reverse Close-grip Bench Press.jpg'),

-- 172
(NULL, 'Barbell Reverse Curl',                                    'forearms',    'barbell',        'weight_reps',        '{biceps}',                                'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/172_Barbell Reverse Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/172_Barbell Reverse Curl.jpg'),

-- 173
(NULL, 'Barbell Reverse Grip Bent Over Row',                      'upper_back',  'barbell',        'weight_reps',        '{lower_back,biceps,forearms,traps}',      'horizontal_pull',  true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/173_Barbell Reverse Grip Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/173_Barbell Reverse Grip Bent Over Row.jpg'),

-- 174
(NULL, 'Barbell Reverse Grip Decline Bench Press',                'chest',       'barbell',        'weight_reps',        '{triceps,biceps,shoulders}',              'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/174_Barbell Reverse Grip Decline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/174_Barbell Reverse Grip Decline Bench Press.jpg'),

-- 175
(NULL, 'Barbell Reverse Grip Incline Bench Press',                'chest',       'barbell',        'weight_reps',        '{triceps,biceps,shoulders}',              'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/175_Barbell Reverse Grip Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/175_Barbell Reverse Grip Incline Bench Press.jpg'),

-- 176
(NULL, 'Barbell Reverse Grip Incline Bench Row',                  'upper_back',  'barbell',        'weight_reps',        '{biceps,forearms,traps}',                 'horizontal_pull',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/176_Barbell Reverse Grip Incline Bench Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/176_Barbell Reverse Grip Incline Bench Row.jpg'),

-- 177
(NULL, 'Barbell Reverse Grip Skullcrusher',                       'triceps',     'barbell',        'weight_reps',        '{shoulders,forearms}',                    'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/177_Barbell Reverse Grip Skullcrusher.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/177_Barbell Reverse Grip Skullcrusher.jpg'),

-- 178
(NULL, 'Barbell Reverse Preacher Curl',                           'forearms',    'barbell',        'weight_reps',        '{biceps}',                                'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/178_Barbell Reverse Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/178_Barbell Reverse Preacher Curl.jpg'),

-- 179
(NULL, 'Barbell Reverse Wrist Curl',                              'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/179_Barbell Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/179_Barbell Reverse Wrist Curl.jpg'),

-- 180
(NULL, 'Barbell Rollerout',                                       'abs',         'barbell',        'bodyweight_reps',    '{shoulders,obliques,triceps,lower_back}',  'anti_extension',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/180_Barbell Rollerout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/180_Barbell Rollerout.jpg'),

-- 181
(NULL, 'Barbell Rollerout From Bench',                            'abs',         'barbell',        'bodyweight_reps',    '{shoulders,obliques,triceps,lower_back}',  'anti_extension',  true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/181_Barbell Rollerout From Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/181_Barbell Rollerout From Bench.jpg'),

-- 182
(NULL, 'Barbell Romanian Deadlift',                               'hamstrings',  'barbell',        'weight_reps',        '{glutes,lower_back,forearms,abs}',        'hip_hinge',        true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/182_Barbell Romanian Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/182_Barbell Romanian Deadlift.jpg'),

-- 183
(NULL, 'Barbell Seated Behind Head Military Press',               'shoulders',   'barbell',        'weight_reps',        '{triceps,traps,upper_back}',              'vertical_press',   true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/183_Barbell Seated Behind Head Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/183_Barbell Seated Behind Head Military Press.jpg'),

-- 184
(NULL, 'Barbell Seated Bradford Rocky Press',                     'shoulders',   'barbell',        'weight_reps',        '{triceps,traps,upper_back}',              'vertical_press',   true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/184_Barbell Seated Bradford Rocky Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/184_Barbell Seated Bradford Rocky Press.jpg'),

-- 185
(NULL, 'Barbell Seated Calf Raise',                               'calves',      'barbell',        'weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/185_Barbell Seated Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/185_Barbell Seated Calf Raise.jpg'),

-- 186
(NULL, 'Barbell Seated Calf Raise V. 2',                          'calves',      'barbell',        'weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/186_Barbell Seated Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/186_Barbell Seated Calf Raise.jpg'),

-- 187
(NULL, 'Barbell Seated Close Grip Behind Neck Triceps Extension', 'triceps',     'barbell',        'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/187_Barbell Seated Close Grip Behind Neck Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/187_Barbell Seated Close Grip Behind Neck Triceps Extension.jpg'),

-- 188
(NULL, 'Barbell Seated Close-grip Concentration Curl',            'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/188_Barbell Seated Close-grip Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/188_Barbell Seated Close-grip Concentration Curl.jpg'),

-- 189
(NULL, 'Barbell Seated Good Morning',                             'hamstrings',  'barbell',        'weight_reps',        '{glutes,lower_back,abs}',                 'hip_hinge',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/189_Barbell Seated Good Morning.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/189_Barbell Seated Good Morning.jpg'),

-- 190
(NULL, 'Barbell Seated Overhead Press',                           'shoulders',   'barbell',        'weight_reps',        '{triceps,abs}',                           'vertical_press',   true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/190_Barbell Seated Overhead Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/190_Barbell Seated Overhead Press.jpg'),

-- 191
(NULL, 'Barbell Seated Overhead Triceps Extension',               'triceps',     'barbell',        'weight_reps',        '{shoulders,abs}',                         'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/191_Barbell Seated Overhead Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/191_Barbell Seated Overhead Triceps Extension.jpg'),

-- 192
(NULL, 'Barbell Seated Twist',                                    'obliques',    'barbell',        'weight_reps',        '{abs}',                                   'trunk_rotation',   false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/192_Barbell Seated Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/192_Barbell Seated Twist.jpg'),

-- 193
(NULL, 'Barbell Shrug',                                           'traps',       'barbell',        'weight_reps',        '{forearms,upper_back}',                   'shrug',            false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/193_Barbell Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/193_Barbell Shrug.jpg'),

-- 194
(NULL, 'Barbell Side Bent V. 2',                                  'obliques',    'barbell',        'weight_reps',        '{abs}',                                   'lateral_flexion',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/194_Barbell Side Bent V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/194_Barbell Side Bent V. 2.jpg'),

-- 195
(NULL, 'Barbell Side Split Squat',                                'quads',       'barbell',        'weight_reps',        '{glutes,adductors,hamstrings}',           'lunge',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/195_Barbell Side Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/195_Barbell Side Split Squat.jpg'),

-- 196
(NULL, 'Barbell Side Split Squat V. 2',                           'quads',       'barbell',        'weight_reps',        '{glutes,adductors,hamstrings}',           'lunge',            true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/196_Barbell Side Split Squat V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/196_Barbell Side Split Squat V. 2.jpg'),

-- 197
(NULL, 'Barbell Single Leg Deadlift',                             'hamstrings',  'barbell',        'weight_reps',        '{glutes,abs,obliques,lower_back}',        'hip_hinge',        true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/197_Barbell Single Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/197_Barbell Single Leg Deadlift.jpg'),

-- 198
(NULL, 'Barbell Single Leg Split Squat',                          'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves,abs}', 'lunge',           true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/198_Barbell Single Leg Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/198_Barbell Single Leg Split Squat.jpg'),

-- 199
(NULL, 'Barbell Sitted Alternate Leg Raise',                      'abs',         'barbell',        'weight_reps',        '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/199_Barbell Sitted Alternate Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/199_Barbell Sitted Alternate Leg Raise.jpg'),

-- 200
(NULL, 'Barbell Sitted Alternate Leg Raise V. 2',                 'abs',         'barbell',        'weight_reps',        '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/200_Barbell Sitted Alternate Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/200_Barbell Sitted Alternate Leg Raise.jpg'),

-- 201
(NULL, 'Barbell Skier',                                           'shoulders',   'barbell',        'weight_reps',        '{traps,biceps,forearms}',                 'upright_row',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/201_Barbell Skier.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/201_Barbell Skier.jpg'),

-- 202
(NULL, 'Barbell Speed Squat',                                     'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,abs,lower_back,adductors}','squat',          true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/202_Barbell Speed Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/202_Barbell Speed Squat.jpg'),

-- 203
(NULL, 'Barbell Split Squat V. 2',                                'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,calves,abs}', 'lunge',           true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/203_Barbell Split Squat V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/203_Barbell Split Squat V. 2.jpg'),

-- 204
(NULL, 'Barbell Squat (On Knees)',                                'quads',       'barbell',        'weight_reps',        '{glutes,abs,lower_back}',                 'squat',            true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/204_Barbell Squat (On Knees).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/204_Barbell Squat (On Knees).jpg'),

-- 205
(NULL, 'Barbell Squat Jump Step Rear Lunge',                      'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,calves,abs,adductors}', 'lunge',           true,  'advanced',      5, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/205_Barbell Squat Jump Step Rear Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/205_Barbell Squat Jump Step Rear Lunge.jpg'),

-- 206
(NULL, 'Barbell Standing Ab Rollerout',                           'abs',         'barbell',        'bodyweight_reps',    '{shoulders,obliques,triceps,lower_back}',  'anti_extension',  true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/206_Barbell Standing Ab Rollerout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/206_Barbell Standing Ab Rollerout.jpg'),

-- 207
(NULL, 'Barbell Standing Back Wrist Curl',                        'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/207_Barbell Standing Back Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/207_Barbell Standing Back Wrist Curl.jpg'),

-- 208
(NULL, 'Barbell Standing Bradford Press',                         'shoulders',   'barbell',        'weight_reps',        '{triceps,traps,upper_back}',              'vertical_press',   true,  'advanced',      4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/208_Barbell Standing Bradford Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/208_Barbell Standing Bradford Press.jpg'),

-- 209
(NULL, 'Barbell Standing Calf Raise',                             'calves',      'barbell',        'weight_reps',        '{feet,ankles,lower_back}',                'calf_raise',       false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/209_Barbell Standing Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/209_Barbell Standing Calf Raise.jpg'),

-- 210
(NULL, 'Barbell Standing Close Grip Curl',                        'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/210_Barbell Standing Close Grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/210_Barbell Standing Close Grip Curl.jpg'),

-- 211
(NULL, 'Barbell Standing Close Grip Military Press',              'shoulders',   'barbell',        'weight_reps',        '{triceps,abs,obliques}',                  'vertical_press',   true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/211_Barbell Standing Close Grip Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/211_Barbell Standing Close Grip Military Press.jpg'),

-- 212
(NULL, 'Barbell Standing Concentration Curl',                     'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/212_Barbell Standing Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/212_Barbell Standing Concentration Curl.jpg'),

-- 213
(NULL, 'Barbell Standing Front Raise Over Head',                  'shoulders',   'barbell',        'weight_reps',        '{chest,upper_back,triceps}',              'front_raise',      false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/213_Barbell Standing Front Raise Over Head.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/213_Barbell Standing Front Raise Over Head.jpg'),

-- 214
(NULL, 'Barbell Standing Leg Calf Raise',                         'calves',      'barbell',        'weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/214_Barbell Standing Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/214_Barbell Standing Leg Calf Raise.jpg'),

-- 215
(NULL, 'Barbell Standing Overhead Triceps Extension',             'triceps',     'barbell',        'weight_reps',        '{shoulders,abs}',                         'elbow_extension',  false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/215_Barbell Standing Overhead Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/215_Barbell Standing Overhead Triceps Extension.jpg'),

-- 216
(NULL, 'Barbell Standing Reverse Grip Curl',                      'forearms',    'barbell',        'weight_reps',        '{biceps}',                                'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/216_Barbell Standing Reverse Grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/216_Barbell Standing Reverse Grip Curl.jpg'),

-- 217
(NULL, 'Barbell Standing Rocking Leg Calf Raise',                 'calves',      'barbell',        'weight_reps',        '{feet,ankles}',                           'calf_raise',       false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/217_Barbell Standing Rocking Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/217_Barbell Standing Rocking Leg Calf Raise.jpg'),

-- 218
(NULL, 'Barbell Standing Twist',                                  'obliques',    'barbell',        'weight_reps',        '{abs}',                                   'trunk_rotation',   false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/218_Barbell Standing Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/218_Barbell Standing Twist.jpg'),

-- 219
(NULL, 'Barbell Standing Wide Grip Biceps Curl',                  'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/219_Barbell Standing Wide Grip Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/219_Barbell Standing Wide Grip Biceps Curl.jpg'),

-- 220
(NULL, 'Barbell Standing Wide Military Press',                    'shoulders',   'barbell',        'weight_reps',        '{triceps,abs,obliques}',                  'vertical_press',   true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/220_Barbell Standing Wide Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/220_Barbell Standing Wide Military Press.jpg'),

-- 221
(NULL, 'Barbell Standing Wide-grip Curl',                         'biceps',      'barbell',        'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/221_Barbell Standing Wide-grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/221_Barbell Standing Wide-grip Curl.jpg'),

-- 222
(NULL, 'Barbell Step-up',                                         'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,calves,abs}',           'step_up',          true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/222_Barbell Step-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/222_Barbell Step-up.jpg'),

-- 223
(NULL, 'Barbell Stiff Leg Good Morning',                          'hamstrings',  'barbell',        'weight_reps',        '{glutes,lower_back}',                     'hip_hinge',        true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/223_Barbell Stiff Leg Good Morning.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/223_Barbell Stiff Leg Good Morning.jpg'),

-- 224
(NULL, 'Barbell Straight Leg Deadlift',                           'hamstrings',  'barbell',        'weight_reps',        '{glutes,lower_back,forearms}',            'hip_hinge',        true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/224_Barbell Straight Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/224_Barbell Straight Leg Deadlift.jpg'),

-- 225
(NULL, 'Barbell Sumo Deadlift',                                   'full_body',   'barbell',        'weight_reps',        '{glutes,hamstrings,quads,lower_back,traps,forearms,adductors}','hip_hinge',true,'intermediate',5,false,'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/225_Barbell Sumo Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/225_Barbell Sumo Deadlift.jpg'),

-- 226
(NULL, 'Barbell Thruster',                                        'full_body',   'barbell',        'weight_reps',        '{shoulders,triceps,quads,glutes,abs}',    'squat',            true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/226_Barbell Thruster.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/226_Barbell Thruster.jpg'),

-- 227
(NULL, 'Barbell Upright Row',                                     'traps',       'barbell',        'weight_reps',        '{shoulders,biceps,forearms}',             'upright_row',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/227_Barbell Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/227_Barbell Upright Row.jpg'),

-- 228
(NULL, 'Barbell Upright Row V. 2',                                'traps',       'barbell',        'weight_reps',        '{shoulders,biceps,forearms}',             'upright_row',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/228_Barbell Upright Row V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/228_Barbell Upright Row V. 2.jpg'),

-- 229
(NULL, 'Barbell Upright Row V. 3',                                'traps',       'barbell',        'weight_reps',        '{shoulders,biceps,forearms}',             'upright_row',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/229_Barbell Upright Row V. 3.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/229_Barbell Upright Row V. 3.jpg'),

-- 230
(NULL, 'Barbell Wide Bench Press',                                'chest',       'barbell',        'weight_reps',        '{shoulders,triceps}',                     'horizontal_press', true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/230_Barbell Wide Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/230_Barbell Wide Bench Press.jpg'),

-- 231
(NULL, 'Barbell Wide Reverse Grip Bench Press',                   'chest',       'barbell',        'weight_reps',        '{triceps,biceps,shoulders}',              'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/231_Barbell Wide Reverse Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/231_Barbell Wide Reverse Grip Bench Press.jpg'),

-- 232
(NULL, 'Barbell Wide Squat',                                      'quads',       'barbell',        'weight_reps',        '{glutes,hamstrings,adductors,abs,lower_back}','squat',          true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/232_Barbell Wide Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/232_Barbell Wide Squat.jpg'),

-- 233
(NULL, 'Barbell Wide-grip Upright Row',                           'traps',       'barbell',        'weight_reps',        '{shoulders,biceps,forearms}',             'upright_row',      true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/233_Barbell Wide-grip Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/233_Barbell Wide-grip Upright Row.jpg'),

-- 234
(NULL, 'Barbell Wrist Curl',                                      'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/234_Barbell Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/234_Barbell Wrist Curl.jpg'),

-- 235
(NULL, 'Barbell Wrist Curl V. 2',                                 'forearms',    'barbell',        'weight_reps',        '{}',                                      'wrist_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/235_Barbell Wrist Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/235_Barbell Wrist Curl V. 2.jpg'),

-- 236
(NULL, 'Barbell Zercher Squat',                                   'quads',       'barbell',        'weight_reps',        '{glutes,abs,upper_back,lower_back,biceps,adductors}','squat',   true,  'advanced',      5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/236_Barbell Zercher Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/236_Barbell Zercher Squat.jpg'),

-- 237
(NULL, 'Basic Toe Touch',                                         'hamstrings',  'none',           'duration',           '{lower_back,calves}',                     'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/237_Basic Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/237_Basic Toe Touch.jpg'),

-- 238
(NULL, 'Battling Ropes',                                          'cardio',      'other',          'duration',           '{shoulders,triceps,biceps,forearms,abs,obliques,traps}','conditioning',true,'beginner',  4, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/238_Battling Ropes.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/238_Battling Ropes.jpg'),

-- 239
(NULL, 'Bear Crawl',                                              'full_body',   'none',           'distance_duration',  '{shoulders,triceps,abs,quads,glutes}',    'locomotion',       true,  'intermediate',  4, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/239_Bear Crawl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/239_Bear Crawl.jpg'),

-- 240
(NULL, 'Behind Head Chest Stretch',                               'chest',       'none',           'duration',           '{shoulders,upper_back}',                  'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/240_Behind Head Chest Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/240_Behind Head Chest Stretch.jpg'),

-- 241
(NULL, 'Bench Dip (Knees Bent)',                                  'triceps',     'none',           'bodyweight_reps',    '{shoulders,chest}',                       'elbow_extension',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/241_Bench Dip (Knees Bent).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/241_Bench Dip (Knees Bent).jpg'),

-- 242
(NULL, 'Bench Dip On Floor',                                      'triceps',     'none',           'bodyweight_reps',    '{shoulders,chest}',                       'elbow_extension',  true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/242_Bench Dip On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/242_Bench Dip On Floor.jpg'),

-- 243
(NULL, 'Bench Hip Extension',                                     'glutes',      'none',           'bodyweight_reps',    '{hamstrings,lower_back}',                 'hip_extension',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/243_Bench Hip Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/243_Bench Hip Extension.jpg'),

-- 244
(NULL, 'Bench Pull-ups',                                          'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back}',            'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/244_Bench Pull-ups.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/244_Bench Pull-ups.jpg'),

-- 245
(NULL, 'Bent Knee Lying Twist',                                   'obliques',    'none',           'bodyweight_reps',    '{abs,lower_back}',                        'trunk_rotation',   false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/245_Bent Knee Lying Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/245_Bent Knee Lying Twist.jpg'),

-- 246
(NULL, 'Biceps Leg Concentration Curl',                           'biceps',      'none',           'bodyweight_reps',    '{forearms}',                              'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/246_Biceps Leg Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/246_Biceps Leg Concentration Curl.jpg'),

-- 247
(NULL, 'Biceps Narrow Pull-ups',                                  'biceps',      'none',           'bodyweight_reps',    '{back,forearms,upper_back,abs}',          'vertical_pull',    true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/247_Biceps Narrow Pull-ups.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/247_Biceps Narrow Pull-ups.jpg'),

-- 248
(NULL, 'Biceps Pull-up',                                          'biceps',      'none',           'bodyweight_reps',    '{back,forearms,upper_back,abs}',          'vertical_pull',    true,  'intermediate',  4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/248_Biceps Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/248_Biceps Pull-up.jpg'),

-- 249
(NULL, 'Body-up',                                                 'chest',       'none',           'bodyweight_reps',    '{triceps,abs,shoulders}',                 'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/249_Body-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/249_Body-up.jpg'),

-- 250
(NULL, 'Bodyweight Drop Jump Squat',                              'quads',       'none',           'bodyweight_reps',    '{glutes,calves,hamstrings}',              'squat',            true,  'advanced',      5, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/250_Bodyweight Drop Jump Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/250_Bodyweight Drop Jump Squat.jpg'),

-- 251
(NULL, 'Bodyweight Incline Side Plank',                           'obliques',    'none',           'duration',           '{abs,shoulders}',                         'anti_extension',   false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/251_Bodyweight Incline Side Plank.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/251_Bodyweight Incline Side Plank.jpg'),

-- 252
(NULL, 'Bodyweight Kneeling Triceps Extension',                   'triceps',     'none',           'bodyweight_reps',    '{shoulders,abs}',                         'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/252_Bodyweight Kneeling Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/252_Bodyweight Kneeling Triceps Extension.jpg'),

-- 253
(NULL, 'Bodyweight Side Lying Biceps Curl',                       'biceps',      'none',           'bodyweight_reps',    '{forearms}',                              'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/253_Bodyweight Side Lying Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/253_Bodyweight Side Lying Biceps Curl.jpg'),

-- 254
(NULL, 'Bodyweight Squatting Row',                                'back',        'none',           'bodyweight_reps',    '{biceps,forearms,quads,glutes}',          'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/254_Bodyweight Squatting Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/254_Bodyweight Squatting Row.jpg'),

-- 255
(NULL, 'Bodyweight Squatting Row (With Towel)',                   'back',        'none',           'bodyweight_reps',    '{biceps,forearms,quads,glutes}',          'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/255_Bodyweight Squatting Row (With Towel).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/255_Bodyweight Squatting Row (With Towel).jpg'),

-- 256
(NULL, 'Bodyweight Standing Calf Raise',                          'calves',      'none',           'bodyweight_reps',    '{feet,ankles}',                           'calf_raise',       false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/256_Bodyweight Standing Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/256_Bodyweight Standing Calf Raise.jpg'),

-- 257
(NULL, 'Bodyweight Standing Close-grip One Arm Row',              'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back,abs,obliques}','horizontal_pull',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/257_Bodyweight Standing Close-grip One Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/257_Bodyweight Standing Close-grip One Arm Row.jpg'),

-- 258
(NULL, 'Bodyweight Standing Close-grip Row',                      'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back}',            'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/258_Bodyweight Standing Close-grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/258_Bodyweight Standing Close-grip Row.jpg'),

-- 259
(NULL, 'Bodyweight Standing One Arm Row',                         'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back,abs,obliques}','horizontal_pull',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/259_Bodyweight Standing One Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/259_Bodyweight Standing One Arm Row.jpg'),

-- 260
(NULL, 'Bodyweight Standing One Arm Row (With Towel)',            'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back,abs,obliques}','horizontal_pull',  true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/260_Bodyweight Standing One Arm Row (With Towel).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/260_Bodyweight Standing One Arm Row (With Towel).jpg'),

-- 261
(NULL, 'Bodyweight Standing Row',                                 'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back}',            'horizontal_pull',  true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/261_Bodyweight Standing Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/261_Bodyweight Standing Row.jpg'),

-- 262
(NULL, 'Bodyweight Standing Row (With Towel)',                    'back',        'none',           'bodyweight_reps',    '{biceps,forearms,upper_back}',            'horizontal_pull',  true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/262_Bodyweight Standing Row (With Towel).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/262_Bodyweight Standing Row (With Towel).jpg'),

-- 263
(NULL, 'Bottoms-up',                                              'abs',         'none',           'bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/263_Bottoms-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/263_Bottoms-up.jpg'),

-- 264
(NULL, 'Box Jump Down With One Leg Stabilization',                'quads',       'other',          'bodyweight_reps',    '{glutes,calves,hamstrings,abs}',          'locomotion',       true,  'advanced',      4, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/264_Box Jump Down With One Leg Stabilization.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/264_Box Jump Down With One Leg Stabilization.jpg'),

-- 265
(NULL, 'Bridge - Mountain Climber (Cross Body)',                  'abs',         'none',           'bodyweight_reps',    '{obliques,shoulders,quads,glutes}',       'anti_extension',   true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/265_Bridge - Mountain Climber (Cross Body).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/265_Bridge - Mountain Climber (Cross Body).jpg'),

-- 266
(NULL, 'Burpee',                                                  'full_body',   'none',           'bodyweight_reps',    '{chest,triceps,shoulders,quads,glutes,calves,abs}','conditioning',true,'intermediate', 5, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/266_Burpee.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/266_Burpee.jpg'),

-- 267
(NULL, 'Butt-ups',                                                'abs',         'none',           'bodyweight_reps',    '{obliques}',                  'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/267_Butt-ups.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/267_Butt-ups.jpg'),

-- 268
(NULL, 'Butterfly Yoga Pose',                                     'adductors',   'none',           'duration',           '{glutes}',                    'stretch',          false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/268_Butterfly Yoga Pose.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/268_Butterfly Yoga Pose.jpg'),

-- 269
(NULL, 'Cable Alternate Shoulder Press',                          'shoulders',   'cable',          'weight_reps',        '{triceps,abs,obliques}',                  'vertical_press',   true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/269_Cable Alternate Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/269_Cable Alternate Shoulder Press.jpg'),

-- 270
(NULL, 'Cable Alternate Triceps Extension',                       'triceps',     'cable',          'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/270_Cable Alternate Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/270_Cable Alternate Triceps Extension.jpg'),

-- 271
(NULL, 'Cable Assisted Inverse Leg Curl',                         'hamstrings',  'cable',          'assisted_bodyweight','{calves,glutes}',                          'knee_flexion',     false, 'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/271_Cable Assisted Inverse Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/271_Cable Assisted Inverse Leg Curl.jpg'),

-- 272
(NULL, 'Cable Bar Lateral Pulldown',                              'back',        'cable',          'weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/272_Cable Bar Lateral Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/272_Cable Bar Lateral Pulldown.jpg'),

-- 273
(NULL, 'Cable Bench Press',                                       'chest',       'cable',          'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/273_Cable Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/273_Cable Bench Press.jpg'),

-- 274
(NULL, 'Cable Close Grip Curl',                                   'biceps',      'cable',          'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/274_Cable Close Grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/274_Cable Close Grip Curl.jpg'),

-- 275
(NULL, 'Cable Concentration Curl',                                'biceps',      'cable',          'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/275_Cable Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/275_Cable Concentration Curl.jpg'),

-- 276
(NULL, 'Cable Concentration Extension (On Knee)',                 'triceps',     'cable',          'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/276_Cable Concentration Extension (On Knee).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/276_Cable Concentration Extension (On Knee).jpg'),

-- 277
(NULL, 'Cable Cross-over Lateral Pulldown',                       'back',        'cable',          'weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/277_Cable Cross-over Lateral Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/277_Cable Cross-over Lateral Pulldown.jpg'),

-- 278
(NULL, 'Cable Cross-over Reverse Fly',                            'shoulders',   'cable',          'weight_reps',        '{upper_back,traps}',                      'rear_delt_fly',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/278_Cable Cross-over Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/278_Cable Cross-over Reverse Fly.jpg'),

-- 279
(NULL, 'Cable Cross-over Variation',                              'chest',       'cable',          'weight_reps',        '{shoulders}',                             'chest_fly',        false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/279_Cable Cross-over Variation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/279_Cable Cross-over Variation.jpg'),

-- 280
(NULL, 'Cable Curl',                                              'biceps',      'cable',          'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/280_Cable Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/280_Cable Curl.jpg'),

-- 281
(NULL, 'Cable Deadlift',                                          'full_body',   'cable',          'weight_reps',        '{lower_back,glutes,hamstrings,upper_back,traps,forearms}','hip_hinge',true,'intermediate',4,false,'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/281_Cable Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/281_Cable Deadlift.jpg'),

-- 282
(NULL, 'Cable Decline Fly',                                       'chest',       'cable',          'weight_reps',        '{shoulders}',                             'chest_fly',        false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/282_Cable Decline Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/282_Cable Decline Fly.jpg'),

-- 283
(NULL, 'Cable Decline One Arm Press',                             'chest',       'cable',          'weight_reps',        '{triceps,shoulders,abs,obliques}',        'horizontal_press', true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/283_Cable Decline One Arm Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/283_Cable Decline One Arm Press.jpg'),

-- 284
(NULL, 'Cable Decline Press',                                     'chest',       'cable',          'weight_reps',        '{triceps,shoulders}',                     'horizontal_press', true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/284_Cable Decline Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/284_Cable Decline Press.jpg'),

-- 285
(NULL, 'Cable Decline Seated Wide-grip Row',                      'back',        'cable',          'weight_reps',        '{upper_back,biceps,forearms}',            'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/285_Cable Decline Seated Wide-grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/285_Cable Decline Seated Wide-grip Row.jpg'),

-- 286
(NULL, 'Cable Drag Curl',                                         'biceps',      'cable',          'weight_reps',        '{forearms,shoulders}',                    'elbow_flexion',    false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/286_Cable Drag Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/286_Cable Drag Curl.jpg'),

-- 287
(NULL, 'Cable Floor Seated Wide-grip Row',                        'back',        'cable',          'weight_reps',        '{upper_back,biceps,forearms}',            'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/287_Cable Floor Seated Wide-grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/287_Cable Floor Seated Wide-grip Row.jpg'),

-- 288
(NULL, 'Cable Forward Raise',                                     'shoulders',   'cable',          'weight_reps',        '{chest,upper_back}',                      'front_raise',      false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/288_Cable Forward Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/288_Cable Forward Raise.jpg'),

-- 289
(NULL, 'Cable Front Raise',                                       'shoulders',   'cable',          'weight_reps',        '{chest,upper_back}',                      'front_raise',      false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/289_Cable Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/289_Cable Front Raise.jpg'),

-- 290
(NULL, 'Cable Front Shoulder Raise',                              'shoulders',   'cable',          'weight_reps',        '{chest,upper_back}',                      'front_raise',      false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/290_Cable Front Shoulder Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/290_Cable Front Shoulder Raise.jpg'),

-- 291
(NULL, 'Cable Hammer Curl (With Rope)',                           'biceps',      'cable',          'weight_reps',        '{forearms}',                              'elbow_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/291_Cable Hammer Curl (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/291_Cable Hammer Curl (With Rope).jpg'),

-- 292
(NULL, 'Cable High Pulley Overhead Tricep Extension',             'triceps',     'cable',          'weight_reps',        '{shoulders,abs}',                         'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/292_Cable High Pulley Overhead Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/292_Cable High Pulley Overhead Tricep Extension.jpg'),

-- 293
(NULL, 'Cable High Row (Kneeling)',                               'back',        'cable',          'weight_reps',        '{upper_back,biceps,forearms,abs}',        'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/293_Cable High Row (Kneeling).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/293_Cable High Row (Kneeling).jpg'),

-- 294
(NULL, 'Cable Hip Adduction',                                     'adductors',   'cable',          'weight_reps',        '{glutes}',                                'hip_abduction',    false, 'beginner',      1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/294_Cable Hip Adduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/294_Cable Hip Adduction.jpg'),

-- 295
(NULL, 'Cable Incline Bench Press',                               'chest',       'cable',          'weight_reps',        '{shoulders,triceps}',                     'horizontal_press', true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/295_Cable Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/295_Cable Incline Bench Press.jpg'),

-- 296
(NULL, 'Cable Incline Bench Row',                                 'back',        'cable',          'weight_reps',        '{upper_back,biceps,forearms}',            'horizontal_pull',  true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/296_Cable Incline Bench Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/296_Cable Incline Bench Row.jpg'),

-- 297
(NULL, 'Cable Incline Fly',                                       'chest',       'cable',          'weight_reps',        '{shoulders}',                             'chest_fly',        false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/297_Cable Incline Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/297_Cable Incline Fly.jpg'),

-- 298
(NULL, 'Cable Incline Fly (On Stability Ball)',                   'chest',       'cable',          'weight_reps',        '{shoulders,abs,obliques}',                'chest_fly',        false, 'intermediate',  2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/298_Cable Incline Fly (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/298_Cable Incline Fly (On Stability Ball).jpg'),

-- 299
(NULL, 'Cable Incline Pushdown',                                  'triceps',     'cable',          'weight_reps',        '{forearms}',                              'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/299_Cable Incline Pushdown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/299_Cable Incline Pushdown.jpg'),

-- 300
(NULL, 'Cable Incline Triceps Extension',                         'triceps',     'cable',          'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/300_Cable Incline Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/300_Cable Incline Triceps Extension.jpg'),

-- 301
(NULL, 'Cable Judo Flip',                                         'obliques',    'cable',          'weight_reps',        '{abs,shoulders,back,glutes,hamstrings}',  'trunk_rotation',   true,  'intermediate',  3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/301_Cable Judo Flip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/301_Cable Judo Flip.jpg'),

-- 302
(NULL, 'Cable Kickback',                                          'glutes',      'cable',          'weight_reps',        '{hamstrings}',                            'hip_extension',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/302_Cable Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/302_Cable Kickback.jpg'),

-- 303
(NULL, 'Cable Kneeling Crunch',                                   'abs',         'cable',          'weight_reps',        '{obliques}',                              'trunk_flexion',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/303_Cable Kneeling Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/303_Cable Kneeling Crunch.jpg'),

-- 304
(NULL, 'Cable Kneeling Rear Delt Row (With Rope)',                'shoulders',   'cable',          'weight_reps',        '{upper_back,traps,biceps,forearms}',      'rear_delt_fly',    true,  'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/304_Cable Kneeling Rear Delt Row (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/304_Cable Kneeling Rear Delt Row (With Rope).jpg'),

-- 305
(NULL, 'Cable Kneeling Triceps Extension',                        'triceps',     'cable',          'weight_reps',        '{shoulders}',                             'elbow_extension',  false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/305_Cable Kneeling Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/305_Cable Kneeling Triceps Extension.jpg'),

-- 306
(NULL, 'Cable Lat Pulldown Full Range Of Motion',                 'back',        'cable',          'weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/306_Cable Lat Pulldown Full Range Of Motion.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/306_Cable Lat Pulldown Full Range Of Motion.jpg'),

-- 307
(NULL, 'Cable Lateral Pulldown (With Rope Attachment)',           'back',        'cable',          'weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/307_Cable Lateral Pulldown (With Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/307_Cable Lateral Pulldown (With Rope Attachment).jpg'),

-- 308
(NULL, 'Cable Lateral Pulldown With V-bar',                       'back',        'cable',          'weight_reps',        '{biceps,forearms,upper_back}',            'vertical_pull',    true,  'beginner',      3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/308_Cable Lateral Pulldown With V-bar.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/308_Cable Lateral Pulldown With V-bar.jpg'),

-- 309
(NULL, 'Cable Lateral Raise',                                     'shoulders',   'cable',          'weight_reps',        '{traps,obliques}',                        'lateral_raise',    false, 'beginner',      2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/309_Cable Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/309_Cable Lateral Raise.jpg'),

-- 310
(NULL, 'Cable Low Fly',                                                        'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/310_Cable Low Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/310_Cable Low Fly.jpg'),

-- 311
(NULL, 'Cable Low Seated Row',                                                 'back',        'cable', 'weight_reps', '{biceps,forearms,shoulders}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/311_Cable Low Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/311_Cable Low Seated Row.jpg'),

-- 312
(NULL, 'Cable Lying Bicep Curl',                                               'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/312_Cable Lying Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/312_Cable Lying Bicep Curl.jpg'),

-- 313
(NULL, 'Cable Lying Close-grip Curl',                                          'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/313_Cable Lying Close-grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/313_Cable Lying Close-grip Curl.jpg'),

-- 314
(NULL, 'Cable Lying Extension Pullover (With Rope Attachment)',                'triceps',     'cable', 'weight_reps', '{chest}',                                 'elbow_extension', false, 'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/314_Cable Lying Extension Pullover (With Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/314_Cable Lying Extension Pullover (With Rope Attachment).jpg'),

-- 315
(NULL, 'Cable Lying Fly',                                                      'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/315_Cable Lying Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/315_Cable Lying Fly.jpg'),

-- 316
(NULL, 'Cable Lying Triceps Extension V. 2',                                   'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/316_Cable Lying Triceps Extension V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/316_Cable Lying Triceps Extension V. 2.jpg'),

-- 317
(NULL, 'Cable Middle Fly',                                                     'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/317_Cable Middle Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/317_Cable Middle Fly.jpg'),

-- 318
(NULL, 'Cable One Arm Bent Over Row',                                          'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/318_Cable One Arm Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/318_Cable One Arm Bent Over Row.jpg'),

-- 319
(NULL, 'Cable One Arm Curl',                                                   'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/319_Cable One Arm Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/319_Cable One Arm Curl.jpg'),

-- 320
(NULL, 'Cable One Arm Decline Chest Fly',                                      'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/320_Cable One Arm Decline Chest Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/320_Cable One Arm Decline Chest Fly.jpg'),

-- 321
(NULL, 'Cable One Arm Fly On Exercise Ball',                                   'chest',       'cable', 'weight_reps', '{shoulders,abs}',                             'chest_fly',       false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/321_Cable One Arm Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/321_Cable One Arm Fly On Exercise Ball.jpg'),

-- 322
(NULL, 'Cable One Arm Incline Fly On Exercise Ball',                           'chest',       'cable', 'weight_reps', '{shoulders,abs}',                             'chest_fly',       false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/322_Cable One Arm Incline Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/322_Cable One Arm Incline Fly On Exercise Ball.jpg'),

-- 323
(NULL, 'Cable One Arm Incline Press',                                          'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'horizontal_press',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/323_Cable One Arm Incline Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/323_Cable One Arm Incline Press.jpg'),

-- 324
(NULL, 'Cable One Arm Incline Press On Exercise Ball',                         'chest',       'cable', 'weight_reps', '{shoulders,triceps,abs}',                     'horizontal_press',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/324_Cable One Arm Incline Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/324_Cable One Arm Incline Press On Exercise Ball.jpg'),

-- 325
(NULL, 'Cable One Arm Lateral Bent-over',                                      'shoulders',  'cable', 'weight_reps', '{traps,upper_back}',                           'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/325_Cable One Arm Lateral Bent-over.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/325_Cable One Arm Lateral Bent-over.jpg'),

-- 326
(NULL, 'Cable One Arm Lateral Raise',                                          'shoulders',   'cable', 'weight_reps', '{traps}',                                      'lateral_raise',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/326_Cable One Arm Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/326_Cable One Arm Lateral Raise.jpg'),

-- 327
(NULL, 'Cable One Arm Preacher Curl',                                          'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/327_Cable One Arm Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/327_Cable One Arm Preacher Curl.jpg'),

-- 328
(NULL, 'Cable One Arm Press On Exercise Ball',                                 'chest',       'cable', 'weight_reps', '{shoulders,triceps,abs}',                     'horizontal_press',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/328_Cable One Arm Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/328_Cable One Arm Press On Exercise Ball.jpg'),

-- 329
(NULL, 'Cable One Arm Pulldown',                                               'back',        'cable', 'weight_reps', '{biceps,forearms}',                            'vertical_pull',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/329_Cable One Arm Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/329_Cable One Arm Pulldown.jpg'),

-- 330
(NULL, 'Cable One Arm Reverse Preacher Curl',                                  'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/330_Cable One Arm Reverse Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/330_Cable One Arm Reverse Preacher Curl.jpg'),

-- 331
(NULL, 'Cable One Arm Straight Back High Row (Kneeling)',                      'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/331_Cable One Arm Straight Back High Row (Kneeling).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/331_Cable One Arm Straight Back High Row (Kneeling).jpg'),

-- 332
(NULL, 'Cable One Arm Tricep Pushdown',                                        'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/332_Cable One Arm Tricep Pushdown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/332_Cable One Arm Tricep Pushdown.jpg'),

-- 333
(NULL, 'Cable Overhead Curl',                                                  'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/333_Cable Overhead Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/333_Cable Overhead Curl.jpg'),

-- 334
(NULL, 'Cable Overhead Curl On Exercise Ball',                                 'biceps',      'cable', 'weight_reps', '{forearms,abs}',                              'elbow_flexion',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/334_Cable Overhead Curl On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/334_Cable Overhead Curl On Exercise Ball.jpg'),

-- 335
(NULL, 'Cable Overhead Triceps Extension (Rope Attachment)',                   'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/335_Cable Overhead Triceps Extension (Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/335_Cable Overhead Triceps Extension (Rope Attachment).jpg'),

-- 336
(NULL, 'Cable Palm Rotational Row',                                            'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/336_Cable Palm Rotational Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/336_Cable Palm Rotational Row.jpg'),

-- 337
(NULL, 'Cable Preacher Curl',                                                  'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/337_Cable Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/337_Cable Preacher Curl.jpg'),

-- 338
(NULL, 'Cable Press On Exercise Ball',                                         'chest',       'cable', 'weight_reps', '{shoulders,triceps,abs}',                     'horizontal_press',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/338_Cable Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/338_Cable Press On Exercise Ball.jpg'),

-- 339
(NULL, 'Cable Pull Through (With Rope)',                                       'glutes',      'cable', 'weight_reps', '{hamstrings,lower_back}',                      'hip_hinge',       true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/339_Cable Pull Through (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/339_Cable Pull Through (With Rope).jpg'),

-- 340
(NULL, 'Cable Pulldown',                                                       'back',        'cable', 'weight_reps', '{biceps,forearms,upper_back}',                 'vertical_pull',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/340_Cable Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/340_Cable Pulldown.jpg'),

-- 341
(NULL, 'Cable Pulldown (Pro Lat Bar)',                                         'back',        'cable', 'weight_reps', '{biceps,forearms,upper_back}',                 'vertical_pull',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/341_Cable Pulldown (Pro Lat Bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/341_Cable Pulldown (Pro Lat Bar).jpg'),

-- 342
(NULL, 'Cable Pulldown Bicep Curl',                                            'biceps',      'cable', 'weight_reps', '{forearms,upper_back}',                        'elbow_flexion',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/342_Cable Pulldown Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/342_Cable Pulldown Bicep Curl.jpg'),

-- 343
(NULL, 'Cable Pushdown',                                                       'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/343_Cable Pushdown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/343_Cable Pushdown.jpg'),

-- 344
(NULL, 'Cable Pushdown (Straight Arm) V. 2',                                  'back',        'cable', 'weight_reps', '{triceps,abs}',                               'vertical_pull',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/344_Cable Pushdown (Straight Arm) V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/344_Cable Pushdown (Straight Arm) V. 2.jpg'),

-- 345
(NULL, 'Cable Pushdown (With Rope Attachment)',                                'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/345_Cable Pushdown (With Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/345_Cable Pushdown (With Rope Attachment).jpg'),

-- 346
(NULL, 'Cable Rear Delt Row (Stirrups)',                                       'shoulders',  'cable', 'weight_reps', '{upper_back,biceps}',                          'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/346_Cable Rear Delt Row (Stirrups).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/346_Cable Rear Delt Row (Stirrups).jpg'),

-- 347
(NULL, 'Cable Rear Delt Row (With Rope)',                                      'shoulders',  'cable', 'weight_reps', '{upper_back,biceps}',                          'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/347_Cable Rear Delt Row (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/347_Cable Rear Delt Row (With Rope).jpg'),

-- 348
(NULL, 'Cable Rear Drive',                                                     'glutes',      'cable', 'weight_reps', '{hamstrings,lower_back}',                      'hip_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/348_Cable Rear Drive.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/348_Cable Rear Drive.jpg'),

-- 349
(NULL, 'Cable Rear Pulldown',                                                  'back',        'cable', 'weight_reps', '{biceps,forearms,upper_back}',                 'vertical_pull',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/349_Cable Rear Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/349_Cable Rear Pulldown.jpg'),

-- 350
(NULL, 'Cable Reverse Crunch',                                                 'abs',         'cable', 'weight_reps', '{obliques}',                       'trunk_flexion',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/350_Cable Reverse Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/350_Cable Reverse Crunch.jpg'),

-- 351
(NULL, 'Cable Reverse Curl',                                                   'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/351_Cable Reverse Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/351_Cable Reverse Curl.jpg'),

-- 352
(NULL, 'Cable Reverse Grip Triceps Pushdown (Sz-bar) (With Arm Blaster)',      'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/352_Cable Reverse Grip Triceps Pushdown (Sz-bar) (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/352_Cable Reverse Grip Triceps Pushdown (Sz-bar) (With Arm Blaster).jpg'),

-- 353
(NULL, 'Cable Reverse One Arm Curl',                                           'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/353_Cable Reverse One Arm Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/353_Cable Reverse One Arm Curl.jpg'),

-- 354
(NULL, 'Cable Reverse Preacher Curl',                                          'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/354_Cable Reverse Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/354_Cable Reverse Preacher Curl.jpg'),

-- 355
(NULL, 'Cable Reverse Wrist Curl',                                             'forearms',    'cable', 'weight_reps', '{}',                                           'wrist_extension', false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/355_Cable Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/355_Cable Reverse Wrist Curl.jpg'),

-- 356
(NULL, 'Cable Reverse-grip Pushdown',                                          'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/356_Cable Reverse-grip Pushdown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/356_Cable Reverse-grip Pushdown.jpg'),

-- 357
(NULL, 'Cable Reverse-grip Straight Back Seated High Row',                     'back',        'cable', 'weight_reps', '{biceps,shoulders}',                          'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/357_Cable Reverse-grip Straight Back Seated High Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/357_Cable Reverse-grip Straight Back Seated High Row.jpg'),

-- 358
(NULL, 'Cable Rope Crossover Seated Row',                                      'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/358_Cable Rope Crossover Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/358_Cable Rope Crossover Seated Row.jpg'),

-- 359
(NULL, 'Cable Rope Elevated Seated Row',                                       'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/359_Cable Rope Elevated Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/359_Cable Rope Elevated Seated Row.jpg'),

-- 360
(NULL, 'Cable Rope Extension Incline Bench Row',                               'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/360_Cable Rope Extension Incline Bench Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/360_Cable Rope Extension Incline Bench Row.jpg'),

-- 361
(NULL, 'Cable Rope Hammer Preacher Curl',                                      'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/361_Cable Rope Hammer Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/361_Cable Rope Hammer Preacher Curl.jpg'),

-- 362
(NULL, 'Cable Rope High Pulley Overhead Tricep Extension',                     'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/362_Cable Rope High Pulley Overhead Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/362_Cable Rope High Pulley Overhead Tricep Extension.jpg'),

-- 363
(NULL, 'Cable Rope Incline Tricep Extension',                                  'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/363_Cable Rope Incline Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/363_Cable Rope Incline Tricep Extension.jpg'),

-- 364
(NULL, 'Cable Rope Lying On Floor Tricep Extension',                           'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/364_Cable Rope Lying On Floor Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/364_Cable Rope Lying On Floor Tricep Extension.jpg'),

-- 365
(NULL, 'Cable Rope One Arm Hammer Preacher Curl',                              'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/365_Cable Rope One Arm Hammer Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/365_Cable Rope One Arm Hammer Preacher Curl.jpg'),

-- 366
(NULL, 'Cable Rope Seated Row',                                                'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/366_Cable Rope Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/366_Cable Rope Seated Row.jpg'),

-- 367
(NULL, 'Cable Russian Twists (On Stability Ball)',                             'obliques',    'cable', 'weight_reps', '{abs}',                                   'trunk_rotation',  false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/367_Cable Russian Twists (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/367_Cable Russian Twists (On Stability Ball).jpg'),

-- 368
(NULL, 'Cable Seated Chest Press',                                             'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'horizontal_press',true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/368_Cable Seated Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/368_Cable Seated Chest Press.jpg'),

-- 369
(NULL, 'Cable Seated Crunch',                                                  'abs',         'cable', 'weight_reps', '{obliques}',                                   'trunk_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/369_Cable Seated Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/369_Cable Seated Crunch.jpg'),

-- 370
(NULL, 'Cable Seated Curl',                                                    'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/370_Cable Seated Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/370_Cable Seated Curl.jpg'),

-- 371
(NULL, 'Cable Seated High Row (V-bar)',                                        'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/371_Cable Seated High Row (V-bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/371_Cable Seated High Row (V-bar).jpg'),

-- 372
(NULL, 'Cable Seated One Arm Alternate Row',                                   'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/372_Cable Seated One Arm Alternate Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/372_Cable Seated One Arm Alternate Row.jpg'),

-- 373
(NULL, 'Cable Seated One Arm Concentration Curl',                              'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/373_Cable Seated One Arm Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/373_Cable Seated One Arm Concentration Curl.jpg'),

-- 374
(NULL, 'Cable Seated Overhead Curl',                                           'biceps',      'cable', 'weight_reps', '{forearms}',                                   'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/374_Cable Seated Overhead Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/374_Cable Seated Overhead Curl.jpg'),

-- 375
(NULL, 'Cable Seated Rear Lateral Raise',                                      'shoulders',  'cable', 'weight_reps', '{upper_back,traps}',                           'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/375_Cable Seated Rear Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/375_Cable Seated Rear Lateral Raise.jpg'),

-- 376
(NULL, 'Cable Seated Row',                                                     'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/376_Cable Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/376_Cable Seated Row.jpg'),

-- 377
(NULL, 'Cable Seated Shoulder Internal Rotation',                              'shoulders',   'cable', 'weight_reps', '{}',                                           'shoulder_rotation',false,'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/377_Cable Seated Shoulder Internal Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/377_Cable Seated Shoulder Internal Rotation.jpg'),

-- 378
(NULL, 'Cable Seated Twist',                                                   'obliques',    'cable', 'weight_reps', '{abs}',                                   'trunk_rotation',  false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/378_Cable Seated Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/378_Cable Seated Twist.jpg'),

-- 379
(NULL, 'Cable Seated Wide-grip Row',                                           'back',        'cable', 'weight_reps', '{biceps,shoulders,upper_back}',               'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/379_Cable Seated Wide-grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/379_Cable Seated Wide-grip Row.jpg'),

-- 380
(NULL, 'Cable Shoulder Press',                                                 'shoulders',   'cable', 'weight_reps', '{triceps,upper_chest}',                        'vertical_press',  true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/380_Cable Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/380_Cable Shoulder Press.jpg'),

-- 381
(NULL, 'Cable Shrug',                                                          'traps',       'cable', 'weight_reps', '{upper_back,forearms}',                        'shrug',           false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/381_Cable Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/381_Cable Shrug.jpg'),

-- 382
(NULL, 'Cable Side Bend',                                                      'obliques',    'cable', 'weight_reps', '{abs}',                                        'lateral_flexion', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/382_Cable Side Bend.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/382_Cable Side Bend.jpg'),

-- 383
(NULL, 'Cable Side Bend Crunch (Bosu Ball)',                                   'obliques',    'cable', 'weight_reps', '{abs,abs}',                                   'lateral_flexion', false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/383_Cable Side Bend Crunch (Bosu Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/383_Cable Side Bend Crunch (Bosu Ball).jpg'),

-- 384
(NULL, 'Cable Side Crunch',                                                    'obliques',    'cable', 'weight_reps', '{abs}',                                        'lateral_flexion', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/384_Cable Side Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/384_Cable Side Crunch.jpg'),

-- 385
(NULL, 'Cable Squat Row (With Rope Attachment)',                               'back',        'cable', 'weight_reps', '{glutes,hamstrings,biceps}',                   'squat',           true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/385_Cable Squat Row (With Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/385_Cable Squat Row (With Rope Attachment).jpg'),

-- 386
(NULL, 'Cable Squatting Curl',                                                 'biceps',      'cable', 'weight_reps', '{forearms,quads,glutes}',                      'squat',           true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/386_Cable Squatting Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/386_Cable Squatting Curl.jpg'),

-- 387
(NULL, 'Cable Standing Back Wrist Curl',                                       'forearms',    'cable', 'weight_reps', '{}',                                           'wrist_extension', false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/387_Cable Standing Back Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/387_Cable Standing Back Wrist Curl.jpg'),

-- 388
(NULL, 'Cable Standing Calf Raise',                                            'calves',      'cable', 'weight_reps', '{}',                                           'calf_raise',      false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/388_Cable Standing Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/388_Cable Standing Calf Raise.jpg'),

-- 389
(NULL, 'Cable Standing Cross-over High Reverse Fly',                           'shoulders',  'cable', 'weight_reps', '{upper_back,traps}',                           'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/389_Cable Standing Cross-over High Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/389_Cable Standing Cross-over High Reverse Fly.jpg'),

-- 390
(NULL, 'Cable Standing Crunch',                                                'abs',         'cable', 'weight_reps', '{obliques}',                       'trunk_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/390_Cable Standing Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/390_Cable Standing Crunch.jpg'),

-- 391
(NULL, 'Cable Standing Crunch (With Rope Attachment)',                         'abs',         'cable', 'weight_reps', '{obliques}',                                   'trunk_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/391_Cable Standing Crunch (With Rope Attachment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/391_Cable Standing Crunch (With Rope Attachment).jpg'),

-- 392
(NULL, 'Cable Standing Fly',                                                   'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/392_Cable Standing Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/392_Cable Standing Fly.jpg'),

-- 393
(NULL, 'Cable Standing Hip Extension',                                         'glutes',      'cable', 'weight_reps', '{hamstrings,lower_back}',                      'hip_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/393_Cable Standing Hip Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/393_Cable Standing Hip Extension.jpg'),

-- 394
(NULL, 'Cable Standing Inner Curl',                                            'biceps',      'cable', 'weight_reps', '{forearms}',                        'elbow_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/394_Cable Standing Inner Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/394_Cable Standing Inner Curl.jpg'),

-- 395
(NULL, 'Cable Standing Lift',                                                  'abs',        'cable', 'weight_reps', '{obliques,shoulders,quads}',                    'trunk_rotation',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/395_Cable Standing Lift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/395_Cable Standing Lift.jpg'),

-- 396
(NULL, 'Cable Standing One Arm Triceps Extension',                             'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/396_Cable Standing One Arm Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/396_Cable Standing One Arm Triceps Extension.jpg'),

-- 397
(NULL, 'Cable Standing One Leg Calf Raise',                                    'calves',      'cable', 'weight_reps', '{}',                                           'calf_raise',      false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/397_Cable Standing One Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/397_Cable Standing One Leg Calf Raise.jpg'),

-- 398
(NULL, 'Cable Standing Pulldown (With Rope)',                                  'back',        'cable', 'weight_reps', '{biceps,abs}',                                'vertical_pull',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/398_Cable Standing Pulldown (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/398_Cable Standing Pulldown (With Rope).jpg'),

-- 399
(NULL, 'Cable Standing Rear Delt Row (With Rope)',                             'shoulders',  'cable', 'weight_reps', '{upper_back,biceps}',                          'rear_delt_fly',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/399_Cable Standing Rear Delt Row (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/399_Cable Standing Rear Delt Row (With Rope).jpg'),

-- 400
(NULL, 'Cable Standing Reverse Grip One Arm Overhead Tricep Extension',       'triceps',     'cable', 'weight_reps', '{forearms}',                                   'elbow_extension', false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/400_Cable Standing Reverse Grip One Arm Overhead Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/400_Cable Standing Reverse Grip One Arm Overhead Tricep Extension.jpg'),

-- 401
(NULL, 'Cable Standing Row (V-bar)',                                           'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/401_Cable Standing Row (V-bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/401_Cable Standing Row (V-bar).jpg'),

-- 402
(NULL, 'Cable Standing Shoulder External Rotation',                            'shoulders',   'cable', 'weight_reps', '{}',                                           'shoulder_rotation',false,'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/402_Cable Standing Shoulder External Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/402_Cable Standing Shoulder External Rotation.jpg'),

-- 403
(NULL, 'Cable Standing Twist Row (V-bar)',                                     'back',        'cable', 'weight_reps', '{biceps,obliques,abs}',                       'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/403_Cable Standing Twist Row (V-bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/403_Cable Standing Twist Row (V-bar).jpg'),

-- 404
(NULL, 'Cable Standing Up Straight Crossovers',                                'chest',       'cable', 'weight_reps', '{shoulders,triceps}',                          'chest_fly',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/404_Cable Standing Up Straight Crossovers.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/404_Cable Standing Up Straight Crossovers.jpg'),

-- 405
(NULL, 'Cable Straight Arm Pulldown',                                          'back',        'cable', 'weight_reps', '{triceps,abs}',                               'vertical_pull',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/405_Cable Straight Arm Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/405_Cable Straight Arm Pulldown.jpg'),

-- 406
(NULL, 'Cable Straight Arm Pulldown (With Rope)',                              'back',        'cable', 'weight_reps', '{triceps,abs}',                               'vertical_pull',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/406_Cable Straight Arm Pulldown (With Rope).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/406_Cable Straight Arm Pulldown (With Rope).jpg'),

-- 407
(NULL, 'Cable Straight Back Seated Row',                                       'back',        'cable', 'weight_reps', '{biceps,shoulders,forearms}',                 'horizontal_pull', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/407_Cable Straight Back Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/407_Cable Straight Back Seated Row.jpg'),

-- 408
(NULL, 'Cable Supine Reverse Fly',                                             'shoulders',  'cable', 'weight_reps', '{upper_back,traps}',                           'rear_delt_fly',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/408_Cable Supine Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/408_Cable Supine Reverse Fly.jpg'),

-- 409
(NULL, 'Cable Thibaudeau Kayak Row',                                           'back',        'cable', 'weight_reps', '{biceps,obliques,abs,shoulders}',            'horizontal_pull', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/409_Cable Thibaudeau Kayak Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/409_Cable Thibaudeau Kayak Row.jpg'),

-- 410
(NULL, 'Cable Triceps Pushdown (V-bar)',                                        'triceps',     'cable',         'weight_reps',     '{forearms}',                                   'elbow_extension',  false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/410_Cable Triceps Pushdown (V-bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/410_Cable Triceps Pushdown (V-bar).jpg'),

-- 411
(NULL, 'Cable Triceps Pushdown (V-bar) (With Arm Blaster)',                    'triceps',     'cable',         'weight_reps',     '{forearms}',                                   'elbow_extension',  false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/411_Cable Triceps Pushdown (V-bar) (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/411_Cable Triceps Pushdown (V-bar) (With Arm Blaster).jpg'),

-- 412
(NULL, 'Cable Tuck Reverse Crunch',                                            'abs',         'cable',         'weight_reps',     '{obliques}',                       'trunk_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/412_Cable Tuck Reverse Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/412_Cable Tuck Reverse Crunch.jpg'),

-- 413
(NULL, 'Cable Twist',                                                          'obliques',    'cable',         'weight_reps',     '{abs}',                                   'trunk_rotation',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/413_Cable Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/413_Cable Twist.jpg'),

-- 414
(NULL, 'Cable Twist (Up-down)',                                                'obliques',    'cable',         'weight_reps',     '{abs,shoulders}',                         'trunk_rotation',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/414_Cable Twist (Up-down).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/414_Cable Twist (Up-down).jpg'),

-- 415
(NULL, 'Cable Twisting Pull',                                                  'abs',        'cable',         'weight_reps',     '{shoulders,back}',                        'trunk_rotation',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/415_Cable Twisting Pull.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/415_Cable Twisting Pull.jpg'),

-- 416
(NULL, 'Cable Two Arm Curl On Incline Bench',                                  'biceps',      'cable',         'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/416_Cable Two Arm Curl On Incline Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/416_Cable Two Arm Curl On Incline Bench.jpg'),

-- 417
(NULL, 'Cable Two Arm Tricep Kickback',                                        'triceps',     'cable',         'weight_reps',     '{forearms}',                                   'elbow_extension',  false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/417_Cable Two Arm Tricep Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/417_Cable Two Arm Tricep Kickback.jpg'),

-- 418
(NULL, 'Cable Underhand Pulldown',                                             'back',        'cable',         'weight_reps',     '{biceps,forearms,upper_back}',                 'vertical_pull',    true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/418_Cable Underhand Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/418_Cable Underhand Pulldown.jpg'),

-- 419
(NULL, 'Cable Upper Chest Crossovers',                                         'chest',       'cable',         'weight_reps',     '{shoulders,triceps}',                          'chest_fly',        false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/419_Cable Upper Chest Crossovers.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/419_Cable Upper Chest Crossovers.jpg'),

-- 420
(NULL, 'Cable Upper Row',                                                      'back',        'cable',         'weight_reps',     '{biceps,shoulders,forearms}',                 'horizontal_pull',  true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/420_Cable Upper Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/420_Cable Upper Row.jpg'),

-- 421
(NULL, 'Cable Upright Row',                                                    'shoulders',   'cable',         'weight_reps',     '{traps,biceps}',                               'upright_row',      true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/421_Cable Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/421_Cable Upright Row.jpg'),

-- 422
(NULL, 'Cable Wide Grip Rear Pulldown Behind Neck',                            'back',        'cable',         'weight_reps',     '{biceps,forearms,upper_back}',                 'vertical_pull',    true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/422_Cable Wide Grip Rear Pulldown Behind Neck.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/422_Cable Wide Grip Rear Pulldown Behind Neck.jpg'),

-- 423
(NULL, 'Cable Wrist Curl',                                                     'forearms',    'cable',         'weight_reps',     '{}',                                           'wrist_flexion',    false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/423_Cable Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/423_Cable Wrist Curl.jpg'),

-- 424
(NULL, 'Calf Push Stretch With Hands Against Wall',                            'calves',      'none',          'duration',         '{}',                                           'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/424_Calf Push Stretch With Hands Against Wall.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/424_Calf Push Stretch With Hands Against Wall.jpg'),

-- 425
(NULL, 'Calf Stretch With Hands Against Wall',                                 'calves',      'none',          'duration',         '{}',                                           'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/425_Calf Stretch With Hands Against Wall.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/425_Calf Stretch With Hands Against Wall.jpg'),

-- 426
(NULL, 'Calf Stretch With Rope',                                               'calves',      'none',          'duration',         '{}',                                           'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/426_Calf Stretch With Rope.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/426_Calf Stretch With Rope.jpg'),

-- 427
(NULL, 'Cambered Bar Lying Row',                                               'back',        'barbell',       'weight_reps',     '{biceps,shoulders,forearms}',                 'horizontal_pull',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/427_Cambered Bar Lying Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/427_Cambered Bar Lying Row.jpg'),

-- 428
(NULL, 'Captains Chair Straight Leg Raise',                                    'abs',         'machine',       'bodyweight_reps', '{obliques}',                       'trunk_flexion',    false, 'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/428_Captains Chair Straight Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/428_Captains Chair Straight Leg Raise.jpg'),

-- 429
(NULL, 'Chair Leg Extended Stretch',                                           'hamstrings',  'none',          'duration',         '{lower_back}',                                 'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/429_Chair Leg Extended Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/429_Chair Leg Extended Stretch.jpg'),

-- 430
(NULL, 'Chest And Front Of Shoulder Stretch',                                  'chest',       'none',          'duration',         '{shoulders}',                                  'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/430_Chest And Front Of Shoulder Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/430_Chest And Front Of Shoulder Stretch.jpg'),

-- 431
(NULL, 'Chest Dip',                                                            'chest',       'none',    'bodyweight_reps', '{triceps,shoulders}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/431_Chest Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/431_Chest Dip.jpg'),

-- 432
(NULL, 'Chest Dip (On Dip-pull-up Cage)',                                      'chest',       'none',    'bodyweight_reps', '{triceps,shoulders}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/432_Chest Dip (On Dip-pull-up Cage).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/432_Chest Dip (On Dip-pull-up Cage).jpg'),

-- 433
(NULL, 'Chest Dip On Straight Bar',                                            'chest',       'none',    'bodyweight_reps', '{triceps,shoulders}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/433_Chest Dip On Straight Bar.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/433_Chest Dip On Straight Bar.jpg'),

-- 434
(NULL, 'Chest Stretch With Exercise Ball',                                     'chest',       'other', 'duration',         '{shoulders}',                                  'stretch',          false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/434_Chest Stretch With Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/434_Chest Stretch With Exercise Ball.jpg'),

-- 435
(NULL, 'Chest Tap Push-up',                                                    'chest',       'none',          'bodyweight_reps', '{triceps,shoulders,abs}',                     'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/435_Chest Tap Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/435_Chest Tap Push-up.jpg'),

-- 436
(NULL, 'Chin-up',                                                              'back',        'none',    'bodyweight_reps', '{biceps,forearms}',                            'vertical_pull',    true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/436_Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/436_Chin-up.jpg'),

-- 437
(NULL, 'Chin-ups (Narrow Parallel Grip)',                                      'back',        'none',    'bodyweight_reps', '{biceps,forearms}',                            'vertical_pull',    true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/437_Chin-ups (Narrow Parallel Grip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/437_Chin-ups (Narrow Parallel Grip).jpg'),

-- 438
(NULL, 'Circles Knee Stretch',                                                 'knees',       'none',          'bodyweight_reps',        '{}',                                           'mobility',         false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/438_Circles Knee Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/438_Circles Knee Stretch.jpg'),

-- 439
(NULL, 'Clap Push Up',                                                         'chest',       'none',          'bodyweight_reps', '{triceps,shoulders,abs}',                     'horizontal_press', true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/439_Clap Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/439_Clap Push Up.jpg'),

-- 440
(NULL, 'Clock Push-up',                                                        'chest',       'none',          'bodyweight_reps', '{triceps,shoulders,abs}',                     'horizontal_press', true,  'advanced',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/440_Clock Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/440_Clock Push-up.jpg'),

-- 441
(NULL, 'Close Grip Chin-up',                                                   'back',        'none',    'bodyweight_reps', '{biceps,forearms}',                            'vertical_pull',    true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/441_Close Grip Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/441_Close Grip Chin-up.jpg'),

-- 442
(NULL, 'Close-grip Push-up',                                                   'triceps',     'none',          'bodyweight_reps', '{chest,shoulders}',                            'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/442_Close-grip Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/442_Close-grip Push-up.jpg'),

-- 443
(NULL, 'Close-grip Push-up (On Knees)',                                        'triceps',     'none',          'bodyweight_reps', '{chest,shoulders}',                            'horizontal_press', true,  'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/443_Close-grip Push-up (On Knees).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/443_Close-grip Push-up (On Knees).jpg'),

-- 444
(NULL, 'Cocoons',                                                              'abs',         'none',          'bodyweight_reps', '{obliques}',                       'trunk_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/444_Cocoons.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/444_Cocoons.jpg'),

-- 445
(NULL, 'Crab Twist Toe Touch',                                                 'abs',        'none',          'bodyweight_reps', '{shoulders,glutes,obliques}',                  'trunk_rotation',   true,  'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/445_Crab Twist Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/445_Crab Twist Toe Touch.jpg'),

-- 446
(NULL, 'Cross Body Crunch',                                                    'obliques',    'none',          'bodyweight_reps', '{abs}',                            'trunk_rotation',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/446_Cross Body Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/446_Cross Body Crunch.jpg'),

-- 447
(NULL, 'Crunch (Hands Overhead)',                                              'abs',         'none',          'bodyweight_reps', '{obliques}',                                   'trunk_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/447_Crunch (Hands Overhead).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/447_Crunch (Hands Overhead).jpg'),

-- 448
(NULL, 'Crunch (On Stability Ball)',                                           'abs',         'other', 'bodyweight_reps', '{obliques,abs}',                              'trunk_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/448_Crunch (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/448_Crunch (On Stability Ball).jpg'),

-- 449
(NULL, 'Crunch (On Stability Ball, Arms Straight)',                            'abs',         'other', 'bodyweight_reps', '{obliques,abs}',                              'trunk_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/449_Crunch (On Stability Ball_ Arms Straight).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/449_Crunch (On Stability Ball_ Arms Straight).jpg'),

-- 450
(NULL, 'Crunch Floor',                                                         'abs',         'none',          'bodyweight_reps', '{obliques}',                                   'trunk_flexion',    false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/450_Crunch Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/450_Crunch Floor.jpg'),

-- 451
(NULL, 'Curl-up',                                                              'abs',         'none',          'bodyweight_reps', '{obliques}',                                   'trunk_flexion',    false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/451_Curl-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/451_Curl-up.jpg'),

-- 452
(NULL, 'Curtsey Squat',                                                        'glutes',      'none',          'bodyweight_reps', '{quads,hamstrings,adductors}',                 'squat',            true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/452_Curtsey Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/452_Curtsey Squat.jpg'),

-- 453
(NULL, 'Cycle Cross Trainer',                                                  'cardio',      'machine',       'distance_duration',     '{quads,hamstrings,glutes,abs}',                           'cyclical_cardio',  true,  'beginner',    3, true,  'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/453_Cycle Cross Trainer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/453_Cycle Cross Trainer.jpg'),

-- 454
(NULL, 'Dead Bug',                                                             'abs',        'none',          'bodyweight_reps', '{abs,lower_back}',                 'anti_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/454_Dead Bug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/454_Dead Bug.jpg'),

-- 455
(NULL, 'Decline Crunch',                                                       'abs',         'none',          'bodyweight_reps', '{obliques}',                                   'trunk_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/455_Decline Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/455_Decline Crunch.jpg'),

-- 456
(NULL, 'Decline Push-up',                                                      'chest',       'none',          'bodyweight_reps', '{triceps,shoulders}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/456_Decline Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/456_Decline Push-up.jpg'),

-- 457
(NULL, 'Decline Sit-up',                                                       'abs',         'none',          'bodyweight_reps', '{obliques}',                       'trunk_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/457_Decline Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/457_Decline Sit-up.jpg'),

-- 458
(NULL, 'Deep Push Up',                                                         'chest',       'none',          'bodyweight_reps', '{triceps,shoulders,abs}',                     'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/458_Deep Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/458_Deep Push Up.jpg'),

-- 459
(NULL, 'Diamond Push-up',                                                      'triceps',     'none',          'bodyweight_reps', '{chest,shoulders}',                            'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/459_Diamond Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/459_Diamond Push-up.jpg'),

-- 460
(NULL, 'Donkey Calf Raise',                                                    'calves',      'none',          'bodyweight_reps', '{}',                                           'calf_raise',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/460_Donkey Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/460_Donkey Calf Raise.jpg'),

-- 461
(NULL, 'Drop Push Up',                                                         'chest',       'none',          'bodyweight_reps', '{triceps,shoulders,abs}',                     'horizontal_press', true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/461_Drop Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/461_Drop Push Up.jpg'),

-- 462
(NULL, 'Dumbbell Alternate Biceps Curl',                                       'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/462_Dumbbell Alternate Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/462_Dumbbell Alternate Biceps Curl.jpg'),

-- 463
(NULL, 'Dumbbell Alternate Biceps Curl (With Arm Blaster)',                    'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/463_Dumbbell Alternate Biceps Curl (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/463_Dumbbell Alternate Biceps Curl (With Arm Blaster).jpg'),

-- 464
(NULL, 'Dumbbell Alternate Hammer Preacher Curl',                              'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/464_Dumbbell Alternate Hammer Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/464_Dumbbell Alternate Hammer Preacher Curl.jpg'),

-- 465
(NULL, 'Dumbbell Alternate Preacher Curl',                                     'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/465_Dumbbell Alternate Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/465_Dumbbell Alternate Preacher Curl.jpg'),

-- 466
(NULL, 'Dumbbell Alternate Seated Hammer Curl',                                'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/466_Dumbbell Alternate Seated Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/466_Dumbbell Alternate Seated Hammer Curl.jpg'),

-- 467
(NULL, 'Dumbbell Alternate Side Press',                                        'shoulders',   'dumbbell',      'weight_reps',     '{triceps,abs}',                               'vertical_press',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/467_Dumbbell Alternate Side Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/467_Dumbbell Alternate Side Press.jpg'),

-- 468
(NULL, 'Dumbbell Alternating Bicep Curl With Leg Raised On Exercise Ball',     'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/468_Dumbbell Alternating Bicep Curl With Leg Raised On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/468_Dumbbell Alternating Bicep Curl With Leg Raised On Exercise Ball.jpg'),

-- 469
(NULL, 'Dumbbell Alternating Seated Bicep Curl On Exercise Ball',              'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/469_Dumbbell Alternating Seated Bicep Curl On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/469_Dumbbell Alternating Seated Bicep Curl On Exercise Ball.jpg'),

-- 470
(NULL, 'Dumbbell Arnold Press',                                                'shoulders',   'dumbbell',      'weight_reps',     '{triceps,upper_chest}',                        'vertical_press',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/470_Dumbbell Arnold Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/470_Dumbbell Arnold Press.jpg'),

-- 471
(NULL, 'Dumbbell Arnold Press V. 2',                                           'shoulders',   'dumbbell',      'weight_reps',     '{triceps,upper_chest}',                        'vertical_press',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/471_Dumbbell Arnold Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/471_Dumbbell Arnold Press V. 2.jpg'),

-- 472
(NULL, 'Dumbbell Around Pullover',                                             'back',        'dumbbell',      'weight_reps',     '{triceps,chest}',                         'elbow_extension',  false, 'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/472_Dumbbell Around Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/472_Dumbbell Around Pullover.jpg'),

-- 473
(NULL, 'Dumbbell Bench Press',                                                 'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'horizontal_press', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/473_Dumbbell Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/473_Dumbbell Bench Press.jpg'),

-- 474
(NULL, 'Dumbbell Bench Seated Press',                                          'shoulders',   'dumbbell',      'weight_reps',     '{triceps,upper_chest}',                        'vertical_press',   true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/474_Dumbbell Bench Seated Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/474_Dumbbell Bench Seated Press.jpg'),

-- 475
(NULL, 'Dumbbell Bench Squat',                                                 'quads',       'dumbbell',      'weight_reps',     '{glutes,hamstrings}',                          'squat',            true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/475_Dumbbell Bench Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/475_Dumbbell Bench Squat.jpg'),

-- 476
(NULL, 'Dumbbell Bent Over Row',                                               'back',        'dumbbell',      'weight_reps',     '{biceps,shoulders,forearms}',                 'horizontal_pull',  true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/476_Dumbbell Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/476_Dumbbell Bent Over Row.jpg'),

-- 477
(NULL, 'Dumbbell Bicep Curl Lunge With Bowling Motion',                        'biceps',      'dumbbell',      'weight_reps',     '{quads,glutes,forearms}',                      'lunge',            true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/477_Dumbbell Bicep Curl Lunge With Bowling Motion.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/477_Dumbbell Bicep Curl Lunge With Bowling Motion.jpg'),

-- 478
(NULL, 'Dumbbell Bicep Curl On Exercise Ball With Leg Raised',                 'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/478_Dumbbell Bicep Curl On Exercise Ball With Leg Raised.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/478_Dumbbell Bicep Curl On Exercise Ball With Leg Raised.jpg'),

-- 479
(NULL, 'Dumbbell Bicep Curl With Stork Stance',                                'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/479_Dumbbell Bicep Curl With Stork Stance.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/479_Dumbbell Bicep Curl With Stork Stance.jpg'),

-- 480
(NULL, 'Dumbbell Biceps Curl',                                                 'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/480_Dumbbell Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/480_Dumbbell Biceps Curl.jpg'),

-- 481
(NULL, 'Dumbbell Biceps Curl (With Arm Blaster)',                              'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/481_Dumbbell Biceps Curl (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/481_Dumbbell Biceps Curl (With Arm Blaster).jpg'),

-- 482
(NULL, 'Dumbbell Biceps Curl Reverse',                                         'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/482_Dumbbell Biceps Curl Reverse.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/482_Dumbbell Biceps Curl Reverse.jpg'),

-- 483
(NULL, 'Dumbbell Biceps Curl Squat',                                           'biceps',      'dumbbell',      'weight_reps',     '{quads,glutes,forearms}',                      'squat',            true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/483_Dumbbell Biceps Curl Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/483_Dumbbell Biceps Curl Squat.jpg'),

-- 484
(NULL, 'Dumbbell Biceps Curl V Sit On Bosu Ball',                              'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs,abs}',                          'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/484_Dumbbell Biceps Curl V Sit On Bosu Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/484_Dumbbell Biceps Curl V Sit On Bosu Ball.jpg'),

-- 485
(NULL, 'Dumbbell Burpee',                                                      'full_body',   'dumbbell',      'bodyweight_reps', '{chest,shoulders,triceps,quads,glutes}',        'conditioning',     true,  'intermediate',5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/485_Dumbbell Burpee.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/485_Dumbbell Burpee.jpg'),

-- 486
(NULL, 'Dumbbell Clean',                                                       'full_body',   'dumbbell',      'weight_reps',     '{shoulders,quads,glutes,traps,lower_back}',     'hip_hinge',        true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/486_Dumbbell Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/486_Dumbbell Clean.jpg'),

-- 487
(NULL, 'Dumbbell Close Grip Press',                                            'triceps',     'dumbbell',      'weight_reps',     '{chest,shoulders}',                            'horizontal_press', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/487_Dumbbell Close Grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/487_Dumbbell Close Grip Press.jpg'),

-- 488
(NULL, 'Dumbbell Close-grip Press',                                            'triceps',     'dumbbell',      'weight_reps',     '{chest,shoulders}',                            'horizontal_press', true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/488_Dumbbell Close-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/488_Dumbbell Close-grip Press.jpg'),

-- 489
(NULL, 'Dumbbell Concentration Curl',                                          'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/489_Dumbbell Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/489_Dumbbell Concentration Curl.jpg'),

-- 490
(NULL, 'Dumbbell Contralateral Forward Lunge',                                 'quads',       'dumbbell',      'weight_reps',     '{glutes,hamstrings,abs}',                     'lunge',            true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/490_Dumbbell Contralateral Forward Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/490_Dumbbell Contralateral Forward Lunge.jpg'),

-- 491
(NULL, 'Dumbbell Cross Body Hammer Curl',                                      'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/491_Dumbbell Cross Body Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/491_Dumbbell Cross Body Hammer Curl.jpg'),

-- 492
(NULL, 'Dumbbell Cross Body Hammer Curl V. 2',                                 'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/492_Dumbbell Cross Body Hammer Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/492_Dumbbell Cross Body Hammer Curl V. 2.jpg'),

-- 493
(NULL, 'Dumbbell Cuban Press',                                                 'shoulders',   'dumbbell',      'weight_reps',     '{traps,upper_back}',              'shoulder_rotation',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/493_Dumbbell Cuban Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/493_Dumbbell Cuban Press.jpg'),

-- 494
(NULL, 'Dumbbell Cuban Press V. 2',                                            'shoulders',   'dumbbell',      'weight_reps',     '{traps,upper_back}',              'shoulder_rotation',true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/494_Dumbbell Cuban Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/494_Dumbbell Cuban Press V. 2.jpg'),

-- 495
(NULL, 'Dumbbell Deadlift',                                                    'back',        'dumbbell',      'weight_reps',     '{glutes,hamstrings,quads,lower_back,traps}',   'hip_hinge',        true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/495_Dumbbell Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/495_Dumbbell Deadlift.jpg'),

-- 496
(NULL, 'Dumbbell Decline Bench Press',                                         'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/496_Dumbbell Decline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/496_Dumbbell Decline Bench Press.jpg'),

-- 497
(NULL, 'Dumbbell Decline Fly',                                                 'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/497_Dumbbell Decline Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/497_Dumbbell Decline Fly.jpg'),

-- 498
(NULL, 'Dumbbell Decline Hammer Press',                                        'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/498_Dumbbell Decline Hammer Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/498_Dumbbell Decline Hammer Press.jpg'),

-- 499
(NULL, 'Dumbbell Decline One Arm Fly',                                         'chest',       'dumbbell',      'weight_reps',     '{shoulders}',                                  'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/499_Dumbbell Decline One Arm Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/499_Dumbbell Decline One Arm Fly.jpg'),

-- 500
(NULL, 'Dumbbell Decline One Arm Hammer Press',                                'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/500_Dumbbell Decline One Arm Hammer Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/500_Dumbbell Decline One Arm Hammer Press.jpg'),

-- 501
(NULL, 'Dumbbell Decline Shrug',                                               'traps',       'dumbbell',      'weight_reps',     '{upper_back,forearms}',                        'shrug',            false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/501_Dumbbell Decline Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/501_Dumbbell Decline Shrug.jpg'),

-- 502
(NULL, 'Dumbbell Decline Shrug V. 2',                                          'traps',       'dumbbell',      'weight_reps',     '{upper_back,forearms}',                        'shrug',            false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/502_Dumbbell Decline Shrug V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/502_Dumbbell Decline Shrug V. 2.jpg'),

-- 503
(NULL, 'Dumbbell Decline Triceps Extension',                                   'triceps',     'dumbbell',      'weight_reps',     '{forearms}',                                   'elbow_extension',  false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/503_Dumbbell Decline Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/503_Dumbbell Decline Triceps Extension.jpg'),

-- 504
(NULL, 'Dumbbell Decline Twist Fly',                                           'chest',       'dumbbell',      'weight_reps',     '{shoulders,obliques,abs}',                    'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/504_Dumbbell Decline Twist Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/504_Dumbbell Decline Twist Fly.jpg'),

-- 505
(NULL, 'Dumbbell Finger Curls',                                                'forearms',    'dumbbell',      'weight_reps',     '{}',                                           'grip',             false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/505_Dumbbell Finger Curls.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/505_Dumbbell Finger Curls.jpg'),

-- 506
(NULL, 'Dumbbell Fly',                                                         'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                          'chest_fly',        false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/506_Dumbbell Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/506_Dumbbell Fly.jpg'),

-- 507
(NULL, 'Dumbbell Fly On Exercise Ball',                                        'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps,abs}',                     'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/507_Dumbbell Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/507_Dumbbell Fly On Exercise Ball.jpg'),

-- 508
(NULL, 'Dumbbell Forward Lunge Triceps Extension',                             'triceps',     'dumbbell',      'weight_reps',     '{quads,glutes,shoulders}',                     'lunge',            true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/508_Dumbbell Forward Lunge Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/508_Dumbbell Forward Lunge Triceps Extension.jpg'),

-- 509
(NULL, 'Dumbbell Front Raise',                                                 'shoulders',   'dumbbell',      'weight_reps',     '{upper_chest,traps}',                          'front_raise',      false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/509_Dumbbell Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/509_Dumbbell Front Raise.jpg'),

 -- 510
(NULL, 'Dumbbell Front Raise V. 2',                                         'shoulders',   'dumbbell',      'weight_reps',     '{upper_chest,traps}',                          'front_raise',      false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/510_Dumbbell Front Raise V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/510_Dumbbell Front Raise V. 2.jpg'),

-- 511
(NULL, 'Dumbbell Full Can Lateral Raise',                                  'shoulders',   'dumbbell',      'weight_reps',     '{traps}',                                     'lateral_raise',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/511_Dumbbell Full Can Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/511_Dumbbell Full Can Lateral Raise.jpg'),

-- 512
(NULL, 'Dumbbell Goblet Squat',                                            'quads',       'dumbbell',      'weight_reps',     '{glutes,hamstrings,abs,lower_back,adductors}','squat',            true,  'beginner',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/512_Dumbbell Goblet Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/512_Dumbbell Goblet Squat.jpg'),

-- 513
(NULL, 'Dumbbell Hammer Curl',                                             'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                       'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/513_Dumbbell Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/513_Dumbbell Hammer Curl.jpg'),

-- 514
(NULL, 'Dumbbell Hammer Curl On Exercise Ball',                            'biceps',      'dumbbell',      'weight_reps',     '{forearms,abs}',                  'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/514_Dumbbell Hammer Curl On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/514_Dumbbell Hammer Curl On Exercise Ball.jpg'),

-- 515
(NULL, 'Dumbbell Hammer Curl V. 2',                                        'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                       'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/515_Dumbbell Hammer Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/515_Dumbbell Hammer Curl V. 2.jpg'),

-- 516
(NULL, 'Dumbbell Hammer Curls (With Arm Blaster)',                         'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                       'elbow_flexion',    false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/516_Dumbbell Hammer Curls (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/516_Dumbbell Hammer Curls (With Arm Blaster).jpg'),

-- 517
(NULL, 'Dumbbell High Curl',                                               'biceps',      'dumbbell',      'weight_reps',     '{forearms,shoulders}',                        'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/517_Dumbbell High Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/517_Dumbbell High Curl.jpg'),

-- 518
(NULL, 'Dumbbell Incline Alternate Press',                                'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/518_Dumbbell Incline Alternate Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/518_Dumbbell Incline Alternate Press.jpg'),

-- 519
(NULL, 'Dumbbell Incline Bench Press',                                     'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/519_Dumbbell Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/519_Dumbbell Incline Bench Press.jpg'),

-- 520
(NULL, 'Dumbbell Incline Biceps Curl',                                     'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/520_Dumbbell Incline Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/520_Dumbbell Incline Biceps Curl.jpg'),

-- 521
(NULL, 'Dumbbell Incline Breeding',                                        'chest',       'dumbbell',      'weight_reps',     '{shoulders}',                                 'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/521_Dumbbell Incline Breeding.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/521_Dumbbell Incline Breeding.jpg'),

-- 522
(NULL, 'Dumbbell Incline Curl',                                            'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/522_Dumbbell Incline Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/522_Dumbbell Incline Curl.jpg'),

-- 523
(NULL, 'Dumbbell Incline Curl V. 2',                                       'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/523_Dumbbell Incline Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/523_Dumbbell Incline Curl V. 2.jpg'),

-- 524
(NULL, 'Dumbbell Incline Fly',                                             'chest',       'dumbbell',      'weight_reps',     '{shoulders}',                                 'chest_fly',        false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/524_Dumbbell Incline Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/524_Dumbbell Incline Fly.jpg'),

-- 525
(NULL, 'Dumbbell Incline Fly On Exercise Ball',                            'chest',       'dumbbell',      'weight_reps',     '{shoulders,abs}',                            'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/525_Dumbbell Incline Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/525_Dumbbell Incline Fly On Exercise Ball.jpg'),

-- 526
(NULL, 'Dumbbell Incline Hammer Curl',                                    'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                       'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/526_Dumbbell Incline Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/526_Dumbbell Incline Hammer Curl.jpg'),

-- 527
(NULL, 'Dumbbell Incline Hammer Press',                                   'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/527_Dumbbell Incline Hammer Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/527_Dumbbell Incline Hammer Press.jpg'),

-- 528
(NULL, 'Dumbbell Incline Hammer Press On Exercise Ball',                   'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps,abs}',                    'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/528_Dumbbell Incline Hammer Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/528_Dumbbell Incline Hammer Press On Exercise Ball.jpg'),

-- 529
(NULL, 'Dumbbell Incline Inner Biceps Curl',                              'biceps',      'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/529_Dumbbell Incline Inner Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/529_Dumbbell Incline Inner Biceps Curl.jpg'),

-- 530
(NULL, 'Dumbbell Incline One Arm Fly',                                    'chest',       'dumbbell',      'weight_reps',     '{shoulders}',                                 'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/530_Dumbbell Incline One Arm Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/530_Dumbbell Incline One Arm Fly.jpg'),

-- 531
(NULL, 'Dumbbell Incline One Arm Fly On Exercise Ball',                   'chest',       'dumbbell',      'weight_reps',     '{shoulders,abs}',                            'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/531_Dumbbell Incline One Arm Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/531_Dumbbell Incline One Arm Fly On Exercise Ball.jpg'),

-- 532
(NULL, 'Dumbbell Incline One Arm Hammer Press',                           'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/532_Dumbbell Incline One Arm Hammer Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/532_Dumbbell Incline One Arm Hammer Press.jpg'),

-- 533
(NULL, 'Dumbbell Incline One Arm Hammer Press On Exercise Ball',          'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps,abs}',                    'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/533_Dumbbell Incline One Arm Hammer Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/533_Dumbbell Incline One Arm Hammer Press On Exercise Ball.jpg'),

-- 534
(NULL, 'Dumbbell Incline One Arm Lateral Raise',                          'shoulders',   'dumbbell',      'weight_reps',     '{traps}',                                     'lateral_raise',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/534_Dumbbell Incline One Arm Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/534_Dumbbell Incline One Arm Lateral Raise.jpg'),

-- 535
(NULL, 'Dumbbell Incline One Arm Press',                                 'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/535_Dumbbell Incline One Arm Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/535_Dumbbell Incline One Arm Press.jpg'),

-- 536
(NULL, 'Dumbbell Incline One Arm Press On Exercise Ball',                 'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps,abs}',                    'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/536_Dumbbell Incline One Arm Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/536_Dumbbell Incline One Arm Press On Exercise Ball.jpg'),

-- 537
(NULL, 'Dumbbell Incline Palm-in Press',                                 'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps}',                         'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/537_Dumbbell Incline Palm-in Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/537_Dumbbell Incline Palm-in Press.jpg'),

-- 538
(NULL, 'Dumbbell Incline Press On Exercise Ball',                        'chest',       'dumbbell',      'weight_reps',     '{shoulders,triceps,abs}',                    'horizontal_press', true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/538_Dumbbell Incline Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/538_Dumbbell Incline Press On Exercise Ball.jpg'),

-- 539
(NULL, 'Dumbbell Incline Raise',                                         'shoulders',   'dumbbell',      'weight_reps',     '{chest,upper_back}',                          'front_raise',      false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/539_Dumbbell Incline Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/539_Dumbbell Incline Raise.jpg'),

-- 540
(NULL, 'Dumbbell Incline Rear Lateral Raise',                           'shoulders',  'dumbbell',      'weight_reps',     '{upper_back,traps}',                          'rear_delt_fly',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/540_Dumbbell Incline Rear Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/540_Dumbbell Incline Rear Lateral Raise.jpg'),

-- 541
(NULL, 'Dumbbell Incline Row',                                           'upper_back',  'dumbbell',      'weight_reps',     '{biceps,forearms,traps}',                    'horizontal_pull',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/541_Dumbbell Incline Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/541_Dumbbell Incline Row.jpg'),

-- 542
(NULL, 'Dumbbell Incline Shoulder Raise',                              'shoulders',   'dumbbell',      'weight_reps',     '{traps,upper_back}',                          'front_raise',      false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/542_Dumbbell Incline Shoulder Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/542_Dumbbell Incline Shoulder Raise.jpg'),

-- 543
(NULL, 'Dumbbell Incline Shrug',                                        'traps',       'dumbbell',      'weight_reps',     '{upper_back,forearms}',                       'shrug',            false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/543_Dumbbell Incline Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/543_Dumbbell Incline Shrug.jpg'),

-- 544
(NULL, 'Dumbbell Incline T-raise',                                     'shoulders',  'dumbbell',      'weight_reps',     '{upper_back,traps}',                          'rear_delt_fly',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/544_Dumbbell Incline T-raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/544_Dumbbell Incline T-raise.jpg'),

-- 545
(NULL, 'Dumbbell Incline Triceps Extension',                           'triceps',     'dumbbell',      'weight_reps',     '{shoulders}',                                 'elbow_extension',  false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/545_Dumbbell Incline Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/545_Dumbbell Incline Triceps Extension.jpg'),

-- 546
(NULL, 'Dumbbell Incline Twisted Flyes',                               'chest',       'dumbbell',      'weight_reps',     '{shoulders,obliques,abs}',                   'chest_fly',        false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/546_Dumbbell Incline Twisted Flyes.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/546_Dumbbell Incline Twisted Flyes.jpg'),

-- 547
(NULL, 'Dumbbell Incline Two Arm Extension',                           'triceps',     'dumbbell',      'weight_reps',     '{shoulders}',                                 'elbow_extension',  false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/547_Dumbbell Incline Two Arm Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/547_Dumbbell Incline Two Arm Extension.jpg'),

-- 548
(NULL, 'Dumbbell Incline Y-raise',                                     'upper_back',  'dumbbell',      'weight_reps',     '{shoulders,traps}',                           'rear_delt_fly',    false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/548_Dumbbell Incline Y-raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/548_Dumbbell Incline Y-raise.jpg'),

-- 549
(NULL, 'Dumbbell Iron Cross',                               'chest',      'dumbbell', 'weight_reps', '{shoulders}',                    'chest_fly',         false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/549_Dumbbell Iron Cross.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/549_Dumbbell Iron Cross.jpg'),

-- 550
(NULL, 'Dumbbell Kickback',                                'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                    'elbow_extension',   false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/550_Dumbbell Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/550_Dumbbell Kickback.jpg'),

-- 551
(NULL, 'Dumbbell Kickbacks On Exercise Ball',              'triceps',    'dumbbell', 'weight_reps', '{shoulders,abs}',                'elbow_extension',   false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/551_Dumbbell Kickbacks On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/551_Dumbbell Kickbacks On Exercise Ball.jpg'),

-- 552
(NULL, 'Dumbbell Kneeling Bicep Curl Exercise Ball',       'biceps',     'dumbbell', 'weight_reps', '{forearms,abs}',                 'elbow_flexion',     false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/552_Dumbbell Kneeling Bicep Curl Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/552_Dumbbell Kneeling Bicep Curl Exercise Ball.jpg'),

-- 553
(NULL, 'Dumbbell Lateral Raise',                           'shoulders',  'dumbbell', 'weight_reps', '{traps}',                        'lateral_raise',     false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/553_Dumbbell Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/553_Dumbbell Lateral Raise.jpg'),

-- 554
(NULL, 'Dumbbell Lateral To Front Raise',                  'shoulders',  'dumbbell', 'weight_reps', '{traps}',                        'front_raise',       false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/554_Dumbbell Lateral To Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/554_Dumbbell Lateral To Front Raise.jpg'),

-- 555
(NULL, 'Dumbbell Lunge',                                   'quads',      'dumbbell', 'weight_reps', '{glutes,hamstrings}',            'lunge',             true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/555_Dumbbell Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/555_Dumbbell Lunge.jpg'),

-- 556
(NULL, 'Dumbbell Lunge With Bicep Curl',                   'quads',      'dumbbell', 'weight_reps', '{glutes,hamstrings,biceps}',     'lunge',             true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/556_Dumbbell Lunge With Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/556_Dumbbell Lunge With Bicep Curl.jpg'),

-- 557
(NULL, 'Dumbbell Lying Extension (Across Face)',           'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                    'elbow_extension',   false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/557_Dumbbell Lying Extension (Across Face).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/557_Dumbbell Lying Extension (Across Face).jpg'),

-- 558
(NULL, 'Dumbbell Lying Alternate Extension',               'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                    'elbow_extension',   false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/558_Dumbbell Lying Alternate Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/558_Dumbbell Lying Alternate Extension.jpg'),

-- 559
(NULL, 'Dumbbell Lying Elbow Press',                       'triceps',    'dumbbell', 'weight_reps', '{chest}',                        'elbow_extension',   false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/559_Dumbbell Lying Elbow Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/559_Dumbbell Lying Elbow Press.jpg'),

-- 560
(NULL, 'Dumbbell Lying External Shoulder Rotation',        'shoulders',  'dumbbell', 'weight_reps', '{upper_back}',                   'external_rotation', false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/560_Dumbbell Lying External Shoulder Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/560_Dumbbell Lying External Shoulder Rotation.jpg'),

-- 561
(NULL, 'Dumbbell Lying Femoral',                           'hamstrings', 'dumbbell', 'weight_reps', '{glutes}',                       'knee_flexion',      false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/561_Dumbbell Lying Femoral.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/561_Dumbbell Lying Femoral.jpg'),

-- 562
(NULL, 'Dumbbell Lying Hammer Press',                      'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',           'horizontal_press',  true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/562_Dumbbell Lying Hammer Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/562_Dumbbell Lying Hammer Press.jpg'),

-- 563
(NULL, 'Dumbbell Lying On Floor Rear Delt Raise',          'shoulders',  'dumbbell', 'weight_reps', '{upper_back,traps}',             'rear_delt_fly',     false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/563_Dumbbell Lying On Floor Rear Delt Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/563_Dumbbell Lying On Floor Rear Delt Raise.jpg'),

-- 564
(NULL, 'Dumbbell Lying One Arm Deltoid Rear',              'shoulders',  'dumbbell', 'weight_reps', '{upper_back,traps}',             'rear_delt_fly',     false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/564_Dumbbell Lying One Arm Deltoid Rear.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/564_Dumbbell Lying One Arm Deltoid Rear.jpg'),

-- 565
(NULL, 'Dumbbell Lying One Arm Press',                     'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',           'horizontal_press',  true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/565_Dumbbell Lying One Arm Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/565_Dumbbell Lying One Arm Press.jpg'),

-- 566
(NULL, 'Dumbbell Lying One Arm Press V. 2',                'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',           'horizontal_press',  true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/566_Dumbbell Lying One Arm Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/566_Dumbbell Lying One Arm Press V. 2.jpg'),

-- 567
(NULL, 'Dumbbell Lying One Arm Pronated Triceps Extension',          'triceps',    'dumbbell', 'weight_reps', '{forearms}',                             'elbow_extension',  false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/567_Dumbbell Lying One Arm Pronated Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/567_Dumbbell Lying One Arm Pronated Triceps Extension.jpg'),

-- 568
(NULL, 'Dumbbell Lying One Arm Rear Lateral Raise',                  'shoulders',  'dumbbell', 'weight_reps', '{upper_back,traps}',                    'rear_delt_fly',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/568_Dumbbell Lying One Arm Rear Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/568_Dumbbell Lying One Arm Rear Lateral Raise.jpg'),

-- 569
(NULL, 'Dumbbell Lying One Arm Supinated Triceps Extension',         'triceps',    'dumbbell', 'weight_reps', '{forearms}',                             'elbow_extension',  false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/569_Dumbbell Lying One Arm Supinated Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/569_Dumbbell Lying One Arm Supinated Triceps Extension.jpg'),

-- 570
(NULL, 'Dumbbell Lying Pronation',                                   'forearms',   'dumbbell', 'weight_reps', '{biceps}',                               'grip',             false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/570_Dumbbell Lying Pronation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/570_Dumbbell Lying Pronation.jpg'),

-- 571
(NULL, 'Dumbbell Lying Pronation On Floor',                          'forearms',   'dumbbell', 'weight_reps', '{biceps}',                               'grip',             false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/571_Dumbbell Lying Pronation On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/571_Dumbbell Lying Pronation On Floor.jpg'),

-- 572
(NULL, 'Dumbbell Lying Pullover On Exercise Ball',                   'chest',      'dumbbell', 'weight_reps', '{back,triceps,shoulders,abs}',          'chest_fly',        true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/572_Dumbbell Lying Pullover On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/572_Dumbbell Lying Pullover On Exercise Ball.jpg'),

-- 573
(NULL, 'Dumbbell Lying Rear Delt Row',                               'upper_back', 'dumbbell', 'weight_reps', '{shoulders,traps,biceps,forearms}',     'horizontal_pull',  true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/573_Dumbbell Lying Rear Delt Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/573_Dumbbell Lying Rear Delt Row.jpg'),

-- 574
(NULL, 'Dumbbell Lying Rear Lateral Raise',                          'shoulders',  'dumbbell', 'weight_reps', '{upper_back,traps}',                    'rear_delt_fly',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/574_Dumbbell Lying Rear Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/574_Dumbbell Lying Rear Lateral Raise.jpg'),

-- 575
(NULL, 'Dumbbell Lying Single Extension',                            'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                            'elbow_extension',  false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/575_Dumbbell Lying Single Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/575_Dumbbell Lying Single Extension.jpg'),

-- 576
(NULL, 'Dumbbell Lying Supination',                                  'forearms',   'dumbbell', 'weight_reps', '{biceps}',                               'grip',             false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/576_Dumbbell Lying Supination.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/576_Dumbbell Lying Supination.jpg'),

-- 577
(NULL, 'Dumbbell Lying Supination On Floor',                         'forearms',   'dumbbell', 'weight_reps', '{biceps}',                               'grip',             false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/577_Dumbbell Lying Supination On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/577_Dumbbell Lying Supination On Floor.jpg'),

-- 578
(NULL, 'Dumbbell Lying Supine Biceps Curl',                          'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/578_Dumbbell Lying Supine Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/578_Dumbbell Lying Supine Biceps Curl.jpg'),

-- 579
(NULL, 'Dumbbell Lying Supine Curl',                                 'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/579_Dumbbell Lying Supine Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/579_Dumbbell Lying Supine Curl.jpg'),

-- 580
(NULL, 'Dumbbell Lying Triceps Extension',                           'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                            'elbow_extension',  false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/580_Dumbbell Lying Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/580_Dumbbell Lying Triceps Extension.jpg'),

-- 581
(NULL, 'Dumbbell Lying Wide Curl',                                   'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/581_Dumbbell Lying Wide Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/581_Dumbbell Lying Wide Curl.jpg'),

-- 582
(NULL, 'Dumbbell Neutral Grip Bench Press',                          'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',                   'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/582_Dumbbell Neutral Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/582_Dumbbell Neutral Grip Bench Press.jpg'),

-- 583
(NULL, 'Dumbbell One Arm Bench Fly',                                 'chest',      'dumbbell', 'weight_reps', '{shoulders,abs}',                       'chest_fly',        false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/583_Dumbbell One Arm Bench Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/583_Dumbbell One Arm Bench Fly.jpg'),

-- 584
(NULL, 'Dumbbell One Arm Bent-over Row',                             'upper_back', 'dumbbell', 'weight_reps', '{lower_back,biceps,forearms,traps}',    'horizontal_pull',  true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/584_Dumbbell One Arm Bent-over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/584_Dumbbell One Arm Bent-over Row.jpg'),

-- 585
(NULL, 'Dumbbell One Arm Chest Fly On Exercise Ball',                'chest',      'dumbbell', 'weight_reps', '{shoulders,abs}',                       'chest_fly',        false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/585_Dumbbell One Arm Chest Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/585_Dumbbell One Arm Chest Fly On Exercise Ball.jpg'),

-- 586
(NULL, 'Dumbbell One Arm Concentration Curl (On Stability Ball)',    'biceps',     'dumbbell', 'weight_reps', '{forearms,abs}',                       'elbow_flexion',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/586_Dumbbell One Arm Concentration Curl (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/586_Dumbbell One Arm Concentration Curl (On Stability Ball).jpg'),

-- 587
(NULL, 'Dumbbell One Arm Decline Chest Press',                        'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',                   'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/587_Dumbbell One Arm Decline Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/587_Dumbbell One Arm Decline Chest Press.jpg'),

-- 588
(NULL, 'Dumbbell One Arm Fly On Exercise Ball',                       'chest',      'dumbbell', 'weight_reps', '{shoulders,abs}',                       'chest_fly',        false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/588_Dumbbell One Arm Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/588_Dumbbell One Arm Fly On Exercise Ball.jpg'),
-- 589
(NULL, 'Dumbbell One Arm French Press On Exercise Ball',              'triceps',    'dumbbell', 'weight_reps', '{shoulders,abs}',                       'elbow_extension',  false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/589_Dumbbell One Arm French Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/589_Dumbbell One Arm French Press On Exercise Ball.jpg'),
-- 590
(NULL, 'Dumbbell One Arm Hammer Preacher Curl',                       'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/590_Dumbbell One Arm Hammer Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/590_Dumbbell One Arm Hammer Preacher Curl.jpg'),

-- 591
(NULL, 'Dumbbell One Arm Hammer Press On Exercise Ball',            'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders,abs}',                'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/591_Dumbbell One Arm Hammer Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/591_Dumbbell One Arm Hammer Press On Exercise Ball.jpg'),

-- 592
(NULL, 'Dumbbell One Arm Incline Chest Press',                      'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',                    'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/592_Dumbbell One Arm Incline Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/592_Dumbbell One Arm Incline Chest Press.jpg'),

-- 593
(NULL, 'Dumbbell One Arm Kickback',                                'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                            'elbow_extension',  false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/593_Dumbbell One Arm Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/593_Dumbbell One Arm Kickback.jpg'),

-- 594
(NULL, 'Dumbbell One Arm Lateral Raise',                           'shoulders',  'dumbbell', 'weight_reps', '{traps}',                                'lateral_raise',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/594_Dumbbell One Arm Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/594_Dumbbell One Arm Lateral Raise.jpg'),

-- 595
(NULL, 'Dumbbell One Arm Lateral Raise With Support',               'shoulders',  'dumbbell', 'weight_reps', '{traps}',                                'lateral_raise',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/595_Dumbbell One Arm Lateral Raise With Support.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/595_Dumbbell One Arm Lateral Raise With Support.jpg'),

-- 596
(NULL, 'Dumbbell One Arm Press On Exercise Ball',                   'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders,abs}',                'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/596_Dumbbell One Arm Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/596_Dumbbell One Arm Press On Exercise Ball.jpg'),

-- 597
(NULL, 'Dumbbell One Arm Prone Curl',                              'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/597_Dumbbell One Arm Prone Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/597_Dumbbell One Arm Prone Curl.jpg'),

-- 598
(NULL, 'Dumbbell One Arm Prone Hammer Curl',                       'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/598_Dumbbell One Arm Prone Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/598_Dumbbell One Arm Prone Hammer Curl.jpg'),

-- 599
(NULL, 'Dumbbell One Arm Pullover On Exercise Ball',                'chest',      'dumbbell', 'weight_reps', '{back,triceps,shoulders,abs}',           'chest_fly',        true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/599_Dumbbell One Arm Pullover On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/599_Dumbbell One Arm Pullover On Exercise Ball.jpg'),

-- 600
(NULL, 'Dumbbell One Arm Reverse Wrist Curl',                       'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_extension',  false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/600_Dumbbell One Arm Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/600_Dumbbell One Arm Reverse Wrist Curl.jpg'),

-- 601
(NULL, 'Dumbbell One Arm Reverse Fly (With Support)',               'upper_back', 'dumbbell', 'weight_reps', '{shoulders,traps}',                      'rear_delt_fly',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/601_Dumbbell One Arm Reverse Fly (With Support).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/601_Dumbbell One Arm Reverse Fly (With Support).jpg'),

-- 602
(NULL, 'Dumbbell One Arm Reverse Grip Press',                       'chest',      'dumbbell', 'weight_reps', '{triceps,shoulders}',                    'horizontal_press', true,  'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/602_Dumbbell One Arm Reverse Grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/602_Dumbbell One Arm Reverse Grip Press.jpg'),

-- 603
(NULL, 'Dumbbell One Arm Reverse Preacher Curl',                    'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/603_Dumbbell One Arm Reverse Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/603_Dumbbell One Arm Reverse Preacher Curl.jpg'),

-- 604
(NULL, 'Dumbbell One Arm Reverse Spider Curl',                      'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/604_Dumbbell One Arm Reverse Spider Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/604_Dumbbell One Arm Reverse Spider Curl.jpg'),

-- 605
(NULL, 'Dumbbell One Arm Seated Bicep Curl On Exercise Ball',       'biceps',     'dumbbell', 'weight_reps', '{forearms,abs}',                         'elbow_flexion',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/605_Dumbbell One Arm Seated Bicep Curl On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/605_Dumbbell One Arm Seated Bicep Curl On Exercise Ball.jpg'),

-- 606
(NULL, 'Dumbbell One Arm Seated Hammer Curl',                       'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/606_Dumbbell One Arm Seated Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/606_Dumbbell One Arm Seated Hammer Curl.jpg'),

-- 607
(NULL, 'Dumbbell One Arm Seated Neutral Wrist Curl',                'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_flexion',    false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/607_Dumbbell One Arm Seated Neutral Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/607_Dumbbell One Arm Seated Neutral Wrist Curl.jpg'),

-- 608
(NULL, 'Dumbbell One Arm Shoulder Press',                           'shoulders',  'dumbbell', 'weight_reps', '{triceps,traps,abs,obliques}',           'vertical_press',   true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/608_Dumbbell One Arm Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/608_Dumbbell One Arm Shoulder Press.jpg'),

-- 609
(NULL, 'Dumbbell One Arm Shoulder Press V. 2',                      'shoulders',  'dumbbell', 'weight_reps', '{triceps,traps,abs,obliques}',           'vertical_press',   true,  'beginner',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/609_Dumbbell One Arm Shoulder Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/609_Dumbbell One Arm Shoulder Press V. 2.jpg'),

-- 610
(NULL, 'Dumbbell One Arm Snatch',                                   'full_body',  'dumbbell', 'weight_reps', '{shoulders,triceps,quads,glutes,traps,lower_back,forearms}', 'hip_hinge', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/610_Dumbbell One Arm Snatch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/610_Dumbbell One Arm Snatch.jpg'),

-- 611
(NULL, 'Dumbbell One Arm Standing Curl',                            'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/611_Dumbbell One Arm Standing Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/611_Dumbbell One Arm Standing Curl.jpg'),

-- 612
(NULL, 'Dumbbell One Arm Standing Hammer Curl',                     'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/612_Dumbbell One Arm Standing Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/612_Dumbbell One Arm Standing Hammer Curl.jpg'),

-- 613
(NULL, 'Dumbbell One Arm Triceps Extension (On Bench)',             'triceps',    'dumbbell', 'weight_reps', '{shoulders}',                            'elbow_extension',  false, 'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/613_Dumbbell One Arm Triceps Extension (On Bench).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/613_Dumbbell One Arm Triceps Extension (On Bench).jpg'),

-- 614
(NULL, 'Dumbbell One Arm Upright Row',                              'shoulders',  'dumbbell', 'weight_reps', '{traps,upper_back}',                     'upright_row',      true,  'beginner',     2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/614_Dumbbell One Arm Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/614_Dumbbell One Arm Upright Row.jpg'),

-- 615
(NULL, 'Dumbbell One Arm Wrist Curl',                               'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_flexion',    false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/615_Dumbbell One Arm Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/615_Dumbbell One Arm Wrist Curl.jpg'),

-- 616
(NULL, 'Dumbbell One Arm Zottman Preacher Curl',                    'biceps',     'dumbbell', 'weight_reps', '{forearms}',                             'elbow_flexion',    false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/616_Dumbbell One Arm Zottman Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/616_Dumbbell One Arm Zottman Preacher Curl.jpg'),

-- 617
(NULL, 'Dumbbell One Leg Fly On Exercise Ball',                     'chest',      'dumbbell', 'weight_reps', '{shoulders,abs,glutes}',                 'chest_fly',        false, 'advanced',     3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/617_Dumbbell One Leg Fly On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/617_Dumbbell One Leg Fly On Exercise Ball.jpg'),

-- 618
(NULL, 'Dumbbell Over Bench Neutral Wrist Curl',                    'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_flexion',    false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/618_Dumbbell Over Bench Neutral Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/618_Dumbbell Over Bench Neutral Wrist Curl.jpg'),

-- 619
(NULL, 'Dumbbell Over Bench One Arm Neutral Wrist Curl',            'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_flexion',    false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/619_Dumbbell Over Bench One Arm Neutral Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/619_Dumbbell Over Bench One Arm Neutral Wrist Curl.jpg'),

-- 620
(NULL, 'Dumbbell Over Bench One Arm Reverse Wrist Curl',            'forearms',   'dumbbell', 'weight_reps', '{}',                                       'wrist_extension',  false, 'beginner',     1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/620_Dumbbell Over Bench One Arm Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/620_Dumbbell Over Bench One Arm Reverse Wrist Curl.jpg'),

 -- 621
(NULL, 'Dumbbell Over Bench One Arm Wrist Curl',                       'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_flexion',     false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/621_Dumbbell Over Bench One Arm Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/621_Dumbbell Over Bench One Arm Wrist Curl.jpg'),

-- 622
(NULL, 'Dumbbell Over Bench Reverse Wrist Curl',                       'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_extension',   false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/622_Dumbbell Over Bench Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/622_Dumbbell Over Bench Reverse Wrist Curl.jpg'),

-- 623
(NULL, 'Dumbbell Over Bench Wrist Curl',                               'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_flexion',     false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/623_Dumbbell Over Bench Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/623_Dumbbell Over Bench Wrist Curl.jpg'),

-- 624
(NULL, 'Dumbbell Palm Rotational Bent Over Row',                       'upper_back', 'dumbbell',      'weight_reps',     '{back,biceps,forearms,lower_back,traps}',      'horizontal_pull',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/624_Dumbbell Palm Rotational Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/624_Dumbbell Palm Rotational Bent Over Row.jpg'),

-- 625
(NULL, 'Dumbbell Palms In Incline Bench Press',                        'chest',      'dumbbell',      'weight_reps',     '{triceps,shoulders}',                          'horizontal_press',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/625_Dumbbell Palms In Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/625_Dumbbell Palms In Incline Bench Press.jpg'),

-- 626
(NULL, 'Dumbbell Preacher Hammer Curl',                                'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/626_Dumbbell Preacher Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/626_Dumbbell Preacher Hammer Curl.jpg'),

-- 627
(NULL, 'Dumbbell Plyo Squat',                                           'quads',      'dumbbell',      'weight_reps',     '{glutes,hamstrings,calves}',                  'squat',             true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/627_Dumbbell Plyo Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/627_Dumbbell Plyo Squat.jpg'),

-- 628
(NULL, 'Dumbbell Preacher Curl',                                       'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/628_Dumbbell Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/628_Dumbbell Preacher Curl.jpg'),

-- 629
(NULL, 'Dumbbell Preacher Curl Over Exercise Ball',                    'biceps',     'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/629_Dumbbell Preacher Curl Over Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/629_Dumbbell Preacher Curl Over Exercise Ball.jpg'),

-- 630
(NULL, 'Dumbbell Press On Exercise Ball',                              'chest',      'dumbbell',      'weight_reps',     '{triceps,shoulders,abs}',                     'horizontal_press',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/630_Dumbbell Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/630_Dumbbell Press On Exercise Ball.jpg'),

-- 631
(NULL, 'Dumbbell Pronate-grip Triceps Extension',                      'triceps',    'dumbbell',      'weight_reps',     '{forearms,shoulders}',                        'elbow_extension',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/631_Dumbbell Pronate-grip Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/631_Dumbbell Pronate-grip Triceps Extension.jpg'),

-- 632
(NULL, 'Dumbbell Prone Incline Curl',                                  'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/632_Dumbbell Prone Incline Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/632_Dumbbell Prone Incline Curl.jpg'),

-- 633
(NULL, 'Dumbbell Prone Incline Hammer Curl',                           'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/633_Dumbbell Prone Incline Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/633_Dumbbell Prone Incline Hammer Curl.jpg'),

-- 634
(NULL, 'Dumbbell Pullover',                                            'chest',      'dumbbell',      'weight_reps',     '{back,triceps,shoulders}',                    'chest_fly',         true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/634_Dumbbell Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/634_Dumbbell Pullover.jpg'),

-- 635
(NULL, 'Dumbbell Pullover Hip Extension On Exercise Ball',            'glutes',     'dumbbell',      'weight_reps',     '{hamstrings,abs,chest,back}',                'hip_extension',     true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/635_Dumbbell Pullover Hip Extension On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/635_Dumbbell Pullover Hip Extension On Exercise Ball.jpg'),

-- 636
(NULL, 'Dumbbell Pullover On Exercise Ball',                           'chest',      'dumbbell',      'weight_reps',     '{back,triceps,shoulders,abs}',                'chest_fly',         true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/636_Dumbbell Pullover On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/636_Dumbbell Pullover On Exercise Ball.jpg'),

-- 637
(NULL, 'Dumbbell Push Press',                                          'shoulders',  'dumbbell',      'weight_reps',     '{triceps,quads,glutes,traps}',                'vertical_press',    true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/637_Dumbbell Push Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/637_Dumbbell Push Press.jpg'),

-- 638
(NULL, 'Dumbbell Raise',                                               'shoulders',  'dumbbell',      'weight_reps',     '{traps}',                                    'front_raise',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/638_Dumbbell Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/638_Dumbbell Raise.jpg'),

-- 639
(NULL, 'Dumbbell Rear Delt Raise',                                    'shoulders',  'dumbbell',      'weight_reps',     '{upper_back,traps}',                         'rear_delt_fly',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/639_Dumbbell Rear Delt Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/639_Dumbbell Rear Delt Raise.jpg'),

-- 640
(NULL, 'Dumbbell Rear Delt Row (Shoulder)',                            'upper_back', 'dumbbell',      'weight_reps',     '{shoulders,traps,biceps,forearms}',          'horizontal_pull',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/640_Dumbbell Rear Delt Row (Shoulder).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/640_Dumbbell Rear Delt Row (Shoulder).jpg'),

-- 641
(NULL, 'Dumbbell Rear Fly',                                            'upper_back', 'dumbbell',      'weight_reps',     '{shoulders,traps}',                          'rear_delt_fly',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/641_Dumbbell Rear Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/641_Dumbbell Rear Fly.jpg'),

-- 642
(NULL, 'Dumbbell Rear Lateral Raise',                                 'shoulders',  'dumbbell',      'weight_reps',     '{upper_back,traps}',                         'rear_delt_fly',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/642_Dumbbell Rear Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/642_Dumbbell Rear Lateral Raise.jpg'),

-- 643
(NULL, 'Dumbbell Rear Lateral Raise (Support Head)',                  'shoulders',  'dumbbell',      'weight_reps',     '{upper_back,traps}',                         'rear_delt_fly',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/643_Dumbbell Rear Lateral Raise (Support Head).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/643_Dumbbell Rear Lateral Raise (Support Head).jpg'),

-- 644
(NULL, 'Dumbbell Rear Lunge',                                          'quads',      'dumbbell',      'weight_reps',     '{glutes,hamstrings,calves}',                 'lunge',             true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/644_Dumbbell Rear Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/644_Dumbbell Rear Lunge.jpg'),

-- 645
(NULL, 'Dumbbell Reverse Grip Biceps Curl',                           'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/645_Dumbbell Reverse Grip Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/645_Dumbbell Reverse Grip Biceps Curl.jpg'),

-- 646
(NULL, 'Dumbbell Reverse Bench Press',                                'chest',      'dumbbell',      'weight_reps',     '{triceps,shoulders}',                        'horizontal_press',  true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/646_Dumbbell Reverse Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/646_Dumbbell Reverse Bench Press.jpg'),

-- 647
(NULL, 'Dumbbell Reverse Fly',                                         'upper_back', 'dumbbell',      'weight_reps',     '{shoulders,traps}',                          'rear_delt_fly',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/647_Dumbbell Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/647_Dumbbell Reverse Fly.jpg'),

-- 648
(NULL, 'Dumbbell Reverse Grip Incline Bench One Arm Row',             'upper_back', 'dumbbell',      'weight_reps',     '{back,biceps,forearms,traps}',               'horizontal_pull',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/648_Dumbbell Reverse Grip Incline Bench One Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/648_Dumbbell Reverse Grip Incline Bench One Arm Row.jpg'),

-- 649
(NULL, 'Dumbbell Reverse Grip Incline Bench Two Arm Row',             'upper_back', 'dumbbell',      'weight_reps',     '{back,biceps,forearms,traps}',               'horizontal_pull',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/649_Dumbbell Reverse Grip Incline Bench Two Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/649_Dumbbell Reverse Grip Incline Bench Two Arm Row.jpg'),

-- 650
(NULL, 'Dumbbell Reverse Grip Row',                                   'upper_back', 'dumbbell',      'weight_reps',     '{back,biceps,forearms,lower_back,traps}',    'horizontal_pull',   true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/650_Dumbbell Reverse Grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/650_Dumbbell Reverse Grip Row.jpg'),

-- 651
(NULL, 'Dumbbell Reverse Preacher Curl',                              'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/651_Dumbbell Reverse Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/651_Dumbbell Reverse Preacher Curl.jpg'),

-- 652
(NULL, 'Dumbbell Reverse Spider Curl',                                'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/652_Dumbbell Reverse Spider Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/652_Dumbbell Reverse Spider Curl.jpg'),

-- 653
(NULL, 'Dumbbell Reverse Wrist Curl',                                 'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_extension',   false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/653_Dumbbell Reverse Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/653_Dumbbell Reverse Wrist Curl.jpg'),

-- 654
(NULL, 'Dumbbell Romanian Deadlift',                                  'hamstrings', 'dumbbell',      'weight_reps',     '{glutes,lower_back,forearms}',                'hip_hinge',         true,  'beginner',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/654_Dumbbell Romanian Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/654_Dumbbell Romanian Deadlift.jpg'),

-- 655
(NULL, 'Dumbbell Rotation Reverse Fly',                               'upper_back', 'dumbbell',      'weight_reps',     '{shoulders,traps,obliques}',                 'rear_delt_fly',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/655_Dumbbell Rotation Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/655_Dumbbell Rotation Reverse Fly.jpg'),

-- 656
(NULL, 'Dumbbell Scott Press',                                         'shoulders',  'dumbbell',      'weight_reps',     '{triceps,upper_back,traps}',                 'vertical_press',    true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/656_Dumbbell Scott Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/656_Dumbbell Scott Press.jpg'),

-- 657
(NULL, 'Dumbbell Seated Alternate Front Raise',                       'shoulders',  'dumbbell',      'weight_reps',     '{upper_chest,traps}',                         'front_raise',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/657_Dumbbell Seated Alternate Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/657_Dumbbell Seated Alternate Front Raise.jpg'),

-- 658
(NULL, 'Dumbbell Seated Alternate Hammer Curl On Exercise Ball',      'biceps',     'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/658_Dumbbell Seated Alternate Hammer Curl On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/658_Dumbbell Seated Alternate Hammer Curl On Exercise Ball.jpg'),

-- 659
(NULL, 'Dumbbell Seated Alternate Press',                             'shoulders',  'dumbbell',      'weight_reps',     '{triceps,traps,abs}',                        'vertical_press',    true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/659_Dumbbell Seated Alternate Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/659_Dumbbell Seated Alternate Press.jpg'),

-- 660
(NULL, 'Dumbbell Seated Alternate Shoulder',                          'shoulders',  'dumbbell',      'weight_reps',     '{triceps,traps}',                             'vertical_press',    true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/660_Dumbbell Seated Alternate Shoulder.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/660_Dumbbell Seated Alternate Shoulder.jpg'),

-- 661
(NULL, 'Dumbbell Seated Bench Extension',                             'triceps',    'dumbbell',      'weight_reps',     '{shoulders}',                                'elbow_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/661_Dumbbell Seated Bench Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/661_Dumbbell Seated Bench Extension.jpg'),

-- 662
(NULL, 'Dumbbell Seated Bent Arm Lateral Raise',                      'shoulders',  'dumbbell',      'weight_reps',     '{traps}',                                    'lateral_raise',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/662_Dumbbell Seated Bent Arm Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/662_Dumbbell Seated Bent Arm Lateral Raise.jpg'),

-- 663
(NULL, 'Dumbbell Seated Bent Over Alternate Kickback',                'triceps',    'dumbbell',      'weight_reps',     '{shoulders,upper_back}',                     'elbow_extension',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/663_Dumbbell Seated Bent Over Alternate Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/663_Dumbbell Seated Bent Over Alternate Kickback.jpg'),

-- 664
(NULL, 'Dumbbell Seated Bent Over Triceps Extension',                 'triceps',    'dumbbell',      'weight_reps',     '{shoulders,upper_back}',                     'elbow_extension',   false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/664_Dumbbell Seated Bent Over Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/664_Dumbbell Seated Bent Over Triceps Extension.jpg'),

-- 665
(NULL, 'Dumbbell Seated Bicep Curl',                                  'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/665_Dumbbell Seated Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/665_Dumbbell Seated Bicep Curl.jpg'),

-- 666
(NULL, 'Dumbbell Seated Biceps Curl (On Stability Ball)',             'biceps',     'dumbbell',      'weight_reps',     '{forearms,abs}',                              'elbow_flexion',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/666_Dumbbell Seated Biceps Curl (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/666_Dumbbell Seated Biceps Curl (On Stability Ball).jpg'),

-- 667
(NULL, 'Dumbbell Seated Biceps Curl To Shoulder Press',               'shoulders',  'dumbbell',      'weight_reps',     '{biceps,triceps,traps}',                      'vertical_press',    true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/667_Dumbbell Seated Biceps Curl To Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/667_Dumbbell Seated Biceps Curl To Shoulder Press.jpg'),

-- 668
(NULL, 'Dumbbell Seated Calf Raise',                                  'calves',     'dumbbell',      'weight_reps',     '{}',                                           'plantar_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/668_Dumbbell Seated Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/668_Dumbbell Seated Calf Raise.jpg'),

-- 669
(NULL, 'Dumbbell Seated Curl',                                        'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/669_Dumbbell Seated Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/669_Dumbbell Seated Curl.jpg'),

-- 670
(NULL, 'Dumbbell Seated Front Raise',                                 'shoulders',  'dumbbell',      'weight_reps',     '{upper_chest,traps}',                         'front_raise',       false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/670_Dumbbell Seated Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/670_Dumbbell Seated Front Raise.jpg'),

-- 671
(NULL, 'Dumbbell Seated Hammer Curl',                                 'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/671_Dumbbell Seated Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/671_Dumbbell Seated Hammer Curl.jpg'),

-- 672
(NULL, 'Dumbbell Seated Inner Biceps Curl',                           'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/672_Dumbbell Seated Inner Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/672_Dumbbell Seated Inner Biceps Curl.jpg'),

-- 673
(NULL, 'Dumbbell Seated Kickback',                                    'triceps',    'dumbbell',      'weight_reps',     '{shoulders}',                                'elbow_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/673_Dumbbell Seated Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/673_Dumbbell Seated Kickback.jpg'),

-- 674
(NULL, 'Dumbbell Seated Lateral Raise',                               'shoulders',  'dumbbell',      'weight_reps',     '{traps}',                                    'lateral_raise',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/674_Dumbbell Seated Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/674_Dumbbell Seated Lateral Raise.jpg'),

-- 675
(NULL, 'Dumbbell Seated Lateral Raise V. 2',                          'shoulders',  'dumbbell',      'weight_reps',     '{traps}',                                    'lateral_raise',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/675_Dumbbell Seated Lateral Raise V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/675_Dumbbell Seated Lateral Raise V. 2.jpg'),

-- 676
(NULL, 'Dumbbell Seated Neutral Wrist Curl',                          'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_flexion',     false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/676_Dumbbell Seated Neutral Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/676_Dumbbell Seated Neutral Wrist Curl.jpg'),

-- 677
(NULL, 'Dumbbell Seated One Arm Bicep Curl On Exercise Ball With Leg Raised', 'biceps', 'dumbbell', 'weight_reps', '{forearms,abs,glutes}', 'elbow_flexion', false, 'advanced', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/677_Dumbbell Seated One Arm Bicep Curl On Exercise Ball With Leg Raised.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/677_Dumbbell Seated One Arm Bicep Curl On Exercise Ball With Leg Raised.jpg'),

-- 678
(NULL, 'Dumbbell Seated One Arm Kickback',                            'triceps',    'dumbbell',      'weight_reps',     '{shoulders}',                                'elbow_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/678_Dumbbell Seated One Arm Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/678_Dumbbell Seated One Arm Kickback.jpg'),

-- 679
(NULL, 'Dumbbell Seated One Arm Rotate',                              'shoulders',  'dumbbell',      'weight_reps',     '{upper_back}',                               'external_rotation', false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/679_Dumbbell Seated One Arm Rotate.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/679_Dumbbell Seated One Arm Rotate.jpg'),

-- 680
(NULL, 'Dumbbell Seated One Leg Calf Raise',                          'calves',     'dumbbell',      'weight_reps',     '{}',                                           'plantar_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/680_Dumbbell Seated One Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/680_Dumbbell Seated One Leg Calf Raise.jpg'),

-- 681
(NULL, 'Dumbbell Seated One Leg Calf Raise - Hammer Grip',           'calves',     'dumbbell',      'weight_reps',     '{forearms}',                                  'plantar_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/681_Dumbbell Seated One Leg Calf Raise - Hammer Grip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/681_Dumbbell Seated One Leg Calf Raise - Hammer Grip.jpg'),

-- 682
(NULL, 'Dumbbell Seated One Leg Calf Raise - Palm Up',               'calves',     'dumbbell',      'weight_reps',     '{forearms}',                                  'plantar_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/682_Dumbbell Seated One Leg Calf Raise - Palm Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/682_Dumbbell Seated One Leg Calf Raise - Palm Up.jpg'),

-- 683
(NULL, 'Dumbbell Seated Palms Up Wrist Curl',                         'forearms',   'dumbbell',      'weight_reps',     '{}',                                           'wrist_flexion',     false, 'beginner',    1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/683_Dumbbell Seated Palms Up Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/683_Dumbbell Seated Palms Up Wrist Curl.jpg'),

-- 684
(NULL, 'Dumbbell Seated Preacher Curl',                               'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/684_Dumbbell Seated Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/684_Dumbbell Seated Preacher Curl.jpg'),

-- 685
(NULL, 'Dumbbell Seated Reverse Grip Concentration Curl',             'biceps',     'dumbbell',      'weight_reps',     '{forearms}',                                  'elbow_flexion',     false, 'intermediate',2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/685_Dumbbell Seated Reverse Grip Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/685_Dumbbell Seated Reverse Grip Concentration Curl.jpg'),

-- 686
(NULL, 'Dumbbell Seated Reverse Grip One Arm Overhead Tricep Extension', 'triceps', 'dumbbell', 'weight_reps', '{forearms,shoulders}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/686_Dumbbell Seated Reverse Grip One Arm Overhead Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/686_Dumbbell Seated Reverse Grip One Arm Overhead Tricep Extension.jpg'),

-- 687
(NULL, 'Dumbbell Seated Shoulder Press',                              'shoulders',  'dumbbell',      'weight_reps',     '{triceps,traps,abs}',                        'vertical_press',    true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/687_Dumbbell Seated Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/687_Dumbbell Seated Shoulder Press.jpg'),

-- 688
(NULL, 'Dumbbell Seated Shoulder Press (Parallel Grip)',              'shoulders',  'dumbbell',      'weight_reps',     '{triceps,traps,abs}',                        'vertical_press',    true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/688_Dumbbell Seated Shoulder Press (Parallel Grip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/688_Dumbbell Seated Shoulder Press (Parallel Grip).jpg'),

-- 689
(NULL, 'Dumbbell Seated Triceps Extension',                           'triceps',    'dumbbell',      'weight_reps',     '{shoulders}',                                'elbow_extension',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/689_Dumbbell Seated Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/689_Dumbbell Seated Triceps Extension.jpg'),

-- 690
(NULL, 'Dumbbell Shrug',                                               'traps',      'dumbbell',      'weight_reps',     '{forearms}',                                  'shrug',             false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/690_Dumbbell Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/690_Dumbbell Shrug.jpg'),

-- 691
(NULL, 'Dumbbell Side Bend',                                           'obliques',   'dumbbell',      'weight_reps',     '{abs,lower_back}',                            'lateral_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/691_Dumbbell Side Bend.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/691_Dumbbell Side Bend.jpg'),

-- 692
(NULL, 'Dumbbell Side Lying One Hand Raise',                           'shoulders',  'dumbbell',      'weight_reps',     '{traps}',                                    'lateral_raise',     false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/692_Dumbbell Side Lying One Hand Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/692_Dumbbell Side Lying One Hand Raise.jpg'),

-- 693
(NULL, 'Dumbbell Side Plank With Rear Fly',                           'obliques',   'dumbbell',      'weight_reps',     '{abs,shoulders,upper_back,traps}',            'rear_delt_fly',     true,  'advanced',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/693_Dumbbell Side Plank With Rear Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/693_Dumbbell Side Plank With Rear Fly.jpg'),

-- 694
(NULL, 'Dumbbell Single Arm Overhead Carry',                          'shoulders',  'dumbbell',      'duration_weight', '{traps,abs,obliques,forearms}',               'carry',             true,  'intermediate',3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/694_Dumbbell Single Arm Overhead Carry.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/694_Dumbbell Single Arm Overhead Carry.jpg'),

-- 695
(NULL, 'Dumbbell Single Leg Calf Raise',                              'calves',     'dumbbell',      'weight_reps',     '{}',                                           'plantar_flexion',   false, 'beginner',    2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/695_Dumbbell Single Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/695_Dumbbell Single Leg Calf Raise.jpg'),

-- 696
(NULL, 'Dumbbell Single Leg Deadlift',                                'hamstrings', 'dumbbell',      'weight_reps',     '{glutes,lower_back,abs,obliques,forearms}',   'hip_hinge',         true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/696_Dumbbell Single Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/696_Dumbbell Single Leg Deadlift.jpg'),

-- 697
(NULL, 'Dumbbell Single Leg Deadlift With Stepbox Support',           'hamstrings', 'dumbbell',      'weight_reps',     '{glutes,lower_back,abs,obliques,forearms}',   'hip_hinge',         true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/697_Dumbbell Single Leg Deadlift With Stepbox Support.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/697_Dumbbell Single Leg Deadlift With Stepbox Support.jpg'),

-- 698
(NULL, 'Dumbbell Single Leg Split Squat',                             'quads',      'dumbbell',      'weight_reps',     '{glutes,hamstrings,calves}',                 'split_squat',       true,  'intermediate',4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/698_Dumbbell Single Leg Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/698_Dumbbell Single Leg Split Squat.jpg'),

-- 699
(NULL, 'Dumbbell Single Leg Squat',                                   'quads',      'dumbbell',      'weight_reps',     '{glutes,hamstrings,calves,abs}',             'squat',             true,  'advanced',    4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/699_Dumbbell Single Leg Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/699_Dumbbell Single Leg Squat.jpg'),

-- 700
(NULL, 'Dumbbell Squat',                                               'quads',      'dumbbell',      'weight_reps',     '{glutes,hamstrings,lower_back}',              'squat',             true,  'beginner',    3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/700_Dumbbell Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/700_Dumbbell Squat.jpg'),

-- 701
(NULL, 'Dumbbell Standing Alternate Hammer Curl And Press', 'shoulders', 'dumbbell', 'weight_reps', '{biceps,forearms,triceps,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/701_Dumbbell Standing Alternate Hammer Curl And Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/701_Dumbbell Standing Alternate Hammer Curl And Press.jpg'),

-- 702
(NULL, 'Dumbbell Standing Alternate Overhead Press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/702_Dumbbell Standing Alternate Overhead Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/702_Dumbbell Standing Alternate Overhead Press.jpg'),

-- 703
(NULL, 'Dumbbell Standing Alternate Raise', 'shoulders', 'dumbbell', 'weight_reps', '{traps}', 'front_raise', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/703_Dumbbell Standing Alternate Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/703_Dumbbell Standing Alternate Raise.jpg'),

-- 704
(NULL, 'Dumbbell Standing Alternating Tricep Kickback', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/704_Dumbbell Standing Alternating Tricep Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/704_Dumbbell Standing Alternating Tricep Kickback.jpg'),

-- 705
(NULL, 'Dumbbell Standing Around World', 'shoulders', 'dumbbell', 'weight_reps', '{chest,traps}', 'shoulder_circle', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/705_Dumbbell Standing Around World.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/705_Dumbbell Standing Around World.jpg'),

-- 706
(NULL, 'Dumbbell Standing Bent Over One Arm Triceps Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,upper_back}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/706_Dumbbell Standing Bent Over One Arm Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/706_Dumbbell Standing Bent Over One Arm Triceps Extension.jpg'),

-- 707
(NULL, 'Dumbbell Standing Bent Over Two Arm Triceps Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,upper_back}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/707_Dumbbell Standing Bent Over Two Arm Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/707_Dumbbell Standing Bent Over Two Arm Triceps Extension.jpg'),

-- 708
(NULL, 'Dumbbell Standing Biceps Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/708_Dumbbell Standing Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/708_Dumbbell Standing Biceps Curl.jpg'),

-- 709
(NULL, 'Dumbbell Standing Calf Raise', 'calves', 'dumbbell', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/709_Dumbbell Standing Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/709_Dumbbell Standing Calf Raise.jpg'),

-- 710
(NULL, 'Dumbbell Standing Concentration Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/710_Dumbbell Standing Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/710_Dumbbell Standing Concentration Curl.jpg'),

-- 711
(NULL, 'Dumbbell Standing Front Raise Above Head', 'shoulders', 'dumbbell', 'weight_reps', '{traps}', 'front_raise', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/711_Dumbbell Standing Front Raise Above Head.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/711_Dumbbell Standing Front Raise Above Head.jpg'),

-- 712
(NULL, 'Dumbbell Standing Inner Biceps Curl V. 2', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/712_Dumbbell Standing Inner Biceps Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/712_Dumbbell Standing Inner Biceps Curl V. 2.jpg'),

-- 713
(NULL, 'Dumbbell Standing Kickback', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/713_Dumbbell Standing Kickback.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/713_Dumbbell Standing Kickback.jpg'),

-- 714
(NULL, 'Dumbbell Standing One Arm Concentration Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/714_Dumbbell Standing One Arm Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/714_Dumbbell Standing One Arm Concentration Curl.jpg'),

-- 715
(NULL, 'Dumbbell Standing One Arm Curl (Over Incline Bench)', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/715_Dumbbell Standing One Arm Curl (Over Incline Bench).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/715_Dumbbell Standing One Arm Curl (Over Incline Bench).jpg'),

-- 716
(NULL, 'Dumbbell Standing One Arm Curl Over Incline Bench', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/716_Dumbbell Standing One Arm Curl Over Incline Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/716_Dumbbell Standing One Arm Curl Over Incline Bench.jpg'),

-- 717
(NULL, 'Dumbbell Standing One Arm Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/717_Dumbbell Standing One Arm Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/717_Dumbbell Standing One Arm Extension.jpg'),

-- 718
(NULL, 'Dumbbell Standing One Arm Palm In Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/718_Dumbbell Standing One Arm Palm In Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/718_Dumbbell Standing One Arm Palm In Press.jpg'),

-- 719
(NULL, 'Dumbbell Standing One Arm Reverse Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/719_Dumbbell Standing One Arm Reverse Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/719_Dumbbell Standing One Arm Reverse Curl.jpg'),

-- 720
(NULL, 'Dumbbell Standing Overhead Press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/720_Dumbbell Standing Overhead Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/720_Dumbbell Standing Overhead Press.jpg'),

-- 721
(NULL, 'Dumbbell Standing Palms In Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/721_Dumbbell Standing Palms In Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/721_Dumbbell Standing Palms In Press.jpg'),

-- 722
(NULL, 'Dumbbell Standing Preacher Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/722_Dumbbell Standing Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/722_Dumbbell Standing Preacher Curl.jpg'),

-- 723
(NULL, 'Dumbbell Standing Reverse Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/723_Dumbbell Standing Reverse Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/723_Dumbbell Standing Reverse Curl.jpg'),

-- 724
(NULL, 'Dumbbell Standing Triceps Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/724_Dumbbell Standing Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/724_Dumbbell Standing Triceps Extension.jpg'),

-- 725
(NULL, 'Dumbbell Standing Zottman Preacher Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/725_Dumbbell Standing Zottman Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/725_Dumbbell Standing Zottman Preacher Curl.jpg'),

-- 726
(NULL, 'Dumbbell Step Up Single Leg Balance With Bicep Curl', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves,biceps,forearms}', 'step_up', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/726_Dumbbell Step Up Single Leg Balance With Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/726_Dumbbell Step Up Single Leg Balance With Bicep Curl.jpg'),

-- 727
(NULL, 'Dumbbell Step-up', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves}', 'step_up', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/727_Dumbbell Step-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/727_Dumbbell Step-up.jpg'),

-- 728
(NULL, 'Dumbbell Step-up Lunge', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves}', 'lunge', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/728_Dumbbell Step-up Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/728_Dumbbell Step-up Lunge.jpg'),

-- 729
(NULL, 'Dumbbell Step-up Split Squat', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves}', 'split_squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/729_Dumbbell Step-up Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/729_Dumbbell Step-up Split Squat.jpg'),

-- 730
(NULL, 'Dumbbell Stiff Leg Deadlift', 'hamstrings', 'dumbbell', 'weight_reps', '{glutes,lower_back,forearms}', 'hip_hinge', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/730_Dumbbell Stiff Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/730_Dumbbell Stiff Leg Deadlift.jpg'),

-- 731
(NULL, 'Dumbbell Straight Arm Pullover', 'chest', 'dumbbell', 'weight_reps', '{back,shoulders,triceps}', 'chest_fly', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/731_Dumbbell Straight Arm Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/731_Dumbbell Straight Arm Pullover.jpg'),

-- 732
(NULL, 'Dumbbell Straight Leg Deadlift', 'hamstrings', 'dumbbell', 'weight_reps', '{glutes,lower_back,forearms}', 'hip_hinge', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/732_Dumbbell Straight Leg Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/732_Dumbbell Straight Leg Deadlift.jpg'),

-- 733
(NULL, 'Dumbbell Sumo Pull Through', 'glutes', 'dumbbell', 'weight_reps', '{hamstrings,adductors,quads}', 'hip_hinge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/733_Dumbbell Sumo Pull Through.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/733_Dumbbell Sumo Pull Through.jpg'),

-- 734
(NULL, 'Dumbbell Supported Squat', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/734_Dumbbell Supported Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/734_Dumbbell Supported Squat.jpg'),

-- 735
(NULL, 'Dumbbell Tate Press', 'triceps', 'dumbbell', 'weight_reps', '{chest,shoulders}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/735_Dumbbell Tate Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/735_Dumbbell Tate Press.jpg'),

-- 736
(NULL, 'Dumbbell Tricep Kickback With Stork Stance', 'triceps', 'dumbbell', 'weight_reps', '{shoulders,glutes,abs}', 'elbow_extension', false, 'advanced', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/736_Dumbbell Tricep Kickback With Stork Stance.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/736_Dumbbell Tricep Kickback With Stork Stance.jpg'),

-- 737
(NULL, 'Dumbbell Twisting Bench Press', 'chest', 'dumbbell', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/737_Dumbbell Twisting Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/737_Dumbbell Twisting Bench Press.jpg'),

-- 738
(NULL, 'Dumbbell Upright Row', 'shoulders', 'dumbbell', 'weight_reps', '{traps,upper_back}', 'upright_row', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/738_Dumbbell Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/738_Dumbbell Upright Row.jpg'),

-- 740
(NULL, 'Dumbbell Upright Shoulder External Rotation', 'shoulders', 'dumbbell', 'weight_reps', '{upper_back}', 'external_rotation', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/740_Dumbbell Upright Shoulder External Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/740_Dumbbell Upright Shoulder External Rotation.jpg'),

-- 741
(NULL, 'Dumbbell Waiter Biceps Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/741_Dumbbell Waiter Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/741_Dumbbell Waiter Biceps Curl.jpg'),

-- 742
(NULL, 'Dumbbell W-press', 'shoulders', 'dumbbell', 'weight_reps', '{triceps,upper_back,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/742_Dumbbell W-press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/742_Dumbbell W-press.jpg'),

-- 743
(NULL, 'Dumbbell Zottman Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/743_Dumbbell Zottman Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/743_Dumbbell Zottman Curl.jpg'),

-- 744
(NULL, 'Dumbbell Zottman Preacher Curl', 'biceps', 'dumbbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/744_Dumbbell Zottman Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/744_Dumbbell Zottman Preacher Curl.jpg'),

-- 745
(NULL, 'Dumbbells Seated Triceps Extension', 'triceps', 'dumbbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/745_Dumbbells Seated Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/745_Dumbbells Seated Triceps Extension.jpg'),

-- 746
(NULL, 'Dynamic Chest Stretch', 'chest', 'none', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/746_Dynamic Chest Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/746_Dynamic Chest Stretch.jpg'),

-- 747
(NULL, 'Elbow Dips', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/747_Elbow Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/747_Elbow Dips.jpg'),

-- 748
(NULL, 'Elbow Lift - Reverse Push-up', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/748_Elbow Lift - Reverse Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/748_Elbow Lift - Reverse Push-up.jpg'),

-- 749
(NULL, 'Elbow-to-knee', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/749_Elbow-to-knee.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/749_Elbow-to-knee.jpg'),

-- 750
(NULL, 'Elevator', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/750_Elevator.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/750_Elevator.jpg'),

-- 751
(NULL, 'Exercise Ball Alternating Arm Ups', 'shoulders', 'other', 'bodyweight_reps', '{abs}', 'shoulder_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/751_Exercise Ball Alternating Arm Ups.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/751_Exercise Ball Alternating Arm Ups.jpg'),

-- 752
(NULL, 'Exercise Ball Back Extension With Arms Extended', 'lower_back', 'other', 'bodyweight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/752_Exercise Ball Back Extension With Arms Extended.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/752_Exercise Ball Back Extension With Arms Extended.jpg'),

-- 753
(NULL, 'Exercise Ball Back Extension With Hands Behind Head', 'lower_back', 'other', 'bodyweight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/753_Exercise Ball Back Extension With Hands Behind Head.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/753_Exercise Ball Back Extension With Hands Behind Head.jpg'),

-- 754
(NULL, 'Exercise Ball Back Extension With Knees Off Ground', 'lower_back', 'other', 'bodyweight_reps', '{glutes,hamstrings,abs}', 'spinal_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/754_Exercise Ball Back Extension With Knees Off Ground.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/754_Exercise Ball Back Extension With Knees Off Ground.jpg'),

-- 755
(NULL, 'Exercise Ball Back Extension With Rotation', 'lower_back', 'other', 'bodyweight_reps', '{glutes,hamstrings,obliques}', 'spinal_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/755_Exercise Ball Back Extension With Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/755_Exercise Ball Back Extension With Rotation.jpg'),

-- 756
(NULL, 'Exercise Ball Dip', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/756_Exercise Ball Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/756_Exercise Ball Dip.jpg'),

-- 757
(NULL, 'Exercise Ball Hip Flexor Stretch', 'quads', 'other', 'duration', '{glutes}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/757_Exercise Ball Hip Flexor Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/757_Exercise Ball Hip Flexor Stretch.jpg'),

-- 758
(NULL, 'Exercise Ball Hug', 'chest', 'other', 'bodyweight_reps', '{shoulders,abs}', 'horizontal_adduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/758_Exercise Ball Hug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/758_Exercise Ball Hug.jpg'),

-- 759
(NULL, 'Exercise Ball Lat Stretch', 'back', 'other', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/759_Exercise Ball Lat Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/759_Exercise Ball Lat Stretch.jpg'),

-- 760
(NULL, 'Exercise Ball Lower Back Stretch (Pyramid)', 'lower_back', 'other', 'duration', '{glutes,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/760_Exercise Ball Lower Back Stretch (Pyramid).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/760_Exercise Ball Lower Back Stretch (Pyramid).jpg'),

-- 761
(NULL, 'Exercise Ball Lying Side Lat Stretch', 'back', 'other', 'duration', '{obliques,shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/761_Exercise Ball Lying Side Lat Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/761_Exercise Ball Lying Side Lat Stretch.jpg'),

-- 762
(NULL, 'Exercise Ball On The Wall Calf Raise', 'calves', 'other', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/762_Exercise Ball On The Wall Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/762_Exercise Ball On The Wall Calf Raise.jpg'),

-- 763
(NULL, 'Exercise Ball On The Wall Calf Raise (Tennis Ball Between Ankles)', 'calves', 'other', 'bodyweight_reps', '{adductors}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/763_Exercise Ball On The Wall Calf Raise (Tennis Ball Between Ankles).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/763_Exercise Ball On The Wall Calf Raise (Tennis Ball Between Ankles).jpg'),

-- 764
(NULL, 'Exercise Ball On The Wall Calf Raise (Tennis Ball Between Knees)', 'calves', 'other', 'bodyweight_reps', '{adductors}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/764_Exercise Ball On The Wall Calf Raise (Tennis Ball Between Knees).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/764_Exercise Ball On The Wall Calf Raise (Tennis Ball Between Knees).jpg'),

-- 765
(NULL, 'Exercise Ball One Leg Prone Lower Body Rotation', 'obliques', 'other', 'bodyweight_reps', '{abs,glutes,hamstrings}', 'rotation', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/765_Exercise Ball One Leg Prone Lower Body Rotation.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/765_Exercise Ball One Leg Prone Lower Body Rotation.jpg'),

-- 766
(NULL, 'Exercise Ball One Legged Diagonal Kick Hamstring Curl', 'hamstrings', 'other', 'bodyweight_reps', '{glutes,abs,obliques}', 'knee_flexion', false, 'advanced', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/766_Exercise Ball One Legged Diagonal Kick Hamstring Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/766_Exercise Ball One Legged Diagonal Kick Hamstring Curl.jpg'),

-- 767
(NULL, 'Exercise Ball Pike Push Up', 'shoulders', 'other', 'bodyweight_reps', '{triceps,chest,abs}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/767_Exercise Ball Pike Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/767_Exercise Ball Pike Push Up.jpg'),

-- 768
(NULL, 'Exercise Ball Prone Leg Raise', 'glutes', 'other', 'bodyweight_reps', '{hamstrings,lower_back}', 'hip_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/768_Exercise Ball Prone Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/768_Exercise Ball Prone Leg Raise.jpg'),

-- 769
(NULL, 'Exercise Ball Seated Hamstring Stretch', 'hamstrings', 'other', 'duration', '{calves,lower_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/769_Exercise Ball Seated Hamstring Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/769_Exercise Ball Seated Hamstring Stretch.jpg'),

-- 770
(NULL, 'Exercise Ball Seated Triceps Stretch', 'triceps', 'other', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/770_Exercise Ball Seated Triceps Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/770_Exercise Ball Seated Triceps Stretch.jpg'),

-- 771
(NULL, 'Exercise Ball Supine Triceps Extension', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders,abs}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/771_Exercise Ball Supine Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/771_Exercise Ball Supine Triceps Extension.jpg'),

-- 772
(NULL, 'Ez Bar French Press On Exercise Ball', 'triceps', 'barbell', 'weight_reps', '{shoulders,abs}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/772_Ez Bar French Press On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/772_Ez Bar French Press On Exercise Ball.jpg'),

-- 773
(NULL, 'Ez Bar Lying Bent Arms Pullover', 'chest', 'barbell', 'weight_reps', '{back,triceps,shoulders}', 'chest_fly', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/773_Ez Bar Lying Bent Arms Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/773_Ez Bar Lying Bent Arms Pullover.jpg'),

-- 774
(NULL, 'Ez Bar Lying Close Grip Triceps Extension Behind Head', 'triceps', 'barbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/774_Ez Bar Lying Close Grip Triceps Extension Behind Head.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/774_Ez Bar Lying Close Grip Triceps Extension Behind Head.jpg'),

-- 776
(NULL, 'Ez Bar Seated Close Grip Concentration Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/776_Ez Bar Seated Close Grip Concentration Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/776_Ez Bar Seated Close Grip Concentration Curl.jpg'),

-- 777
(NULL, 'Ez Bar Standing French Press', 'triceps', 'barbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/777_Ez Bar Standing French Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/777_Ez Bar Standing French Press.jpg'),

-- 778
(NULL, 'Ez Barbell Anti Gravity Press', 'shoulders', 'barbell', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/778_Ez Barbell Anti Gravity Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/778_Ez Barbell Anti Gravity Press.jpg'),

-- 779
(NULL, 'Ez Barbell Close Grip Preacher Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/779_Ez Barbell Close Grip Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/779_Ez Barbell Close Grip Preacher Curl.jpg'),

-- 780
(NULL, 'Ez Barbell Close-grip Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/780_Ez Barbell Close-grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/780_Ez Barbell Close-grip Curl.jpg'),

-- 781
(NULL, 'Ez Barbell Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/781_Ez Barbell Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/781_Ez Barbell Curl.jpg'),

-- 782
(NULL, 'Ez Barbell Decline Close Grip Face Press', 'triceps', 'barbell', 'weight_reps', '{chest,shoulders}', 'elbow_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/782_Ez Barbell Decline Close Grip Face Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/782_Ez Barbell Decline Close Grip Face Press.jpg'),

-- 783
(NULL, 'Ez Barbell Decline Triceps Extension', 'triceps', 'barbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/783_Ez Barbell Decline Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/783_Ez Barbell Decline Triceps Extension.jpg'),

-- 784
(NULL, 'Ez Barbell Incline Triceps Extension', 'triceps', 'barbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/784_Ez Barbell Incline Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/784_Ez Barbell Incline Triceps Extension.jpg'),

-- 785
(NULL, 'Ez Barbell Jm Bench Press', 'triceps', 'barbell', 'weight_reps', '{chest,shoulders}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/785_Ez Barbell Jm Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/785_Ez Barbell Jm Bench Press.jpg'),

-- 786
(NULL, 'Ez Barbell Reverse Grip Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/786_Ez Barbell Reverse Grip Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/786_Ez Barbell Reverse Grip Curl.jpg'),

-- 787
(NULL, 'Ez Barbell Reverse Grip Preacher Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/787_Ez Barbell Reverse Grip Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/787_Ez Barbell Reverse Grip Preacher Curl.jpg'),

-- 788
(NULL, 'Ez Barbell Seated Curls', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/788_Ez Barbell Seated Curls.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/788_Ez Barbell Seated Curls.jpg'),

-- 789
(NULL, 'Ez Barbell Seated Triceps Extension', 'triceps', 'barbell', 'weight_reps', '{shoulders}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/789_Ez Barbell Seated Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/789_Ez Barbell Seated Triceps Extension.jpg'),

-- 790
(NULL, 'Ez Barbell Spider Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/790_Ez Barbell Spider Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/790_Ez Barbell Spider Curl.jpg'),

-- 791
(NULL, 'Ez Barbell Spider Curl (Chest Supported)', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/791_Ez Barbell Spider Curl (Chest Supported).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/791_Ez Barbell Spider Curl (Chest Supported).jpg'),

-- 792
(NULL, 'Ez-bar Biceps Curl (With Arm Blaster)', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/792_Ez-bar Biceps Curl (With Arm Blaster).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/792_Ez-bar Biceps Curl (With Arm Blaster).jpg'),

-- 793
(NULL, 'Ez-bar Close-grip Bench Press', 'triceps', 'barbell', 'weight_reps', '{chest,shoulders}', 'horizontal_press', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/793_Ez-bar Close-grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/793_Ez-bar Close-grip Bench Press.jpg'),

-- 794
(NULL, 'Ez-barbell Standing Wide Grip Biceps Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/794_Ez-barbell Standing Wide Grip Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/794_Ez-barbell Standing Wide Grip Biceps Curl.jpg'),

-- 795
(NULL, 'Farmers Walk', 'full_body', 'dumbbell', 'duration_weight', '{forearms,traps,abs,obliques}', 'carry', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/795_Farmers Walk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/795_Farmers Walk.jpg'),

-- 796
(NULL, 'Finger Curls', 'forearms', 'dumbbell', 'weight_reps', '{hands}', 'grip', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/796_Finger Curls.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/796_Finger Curls.jpg'),

-- 797
(NULL, 'Flag', 'abs', 'none', 'bodyweight_reps', '{obliques,shoulders}', 'anti_extension', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/797_Flag.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/797_Flag.jpg'),

-- 798
(NULL, 'Flexion Leg Sit Up (Bent Knee)', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/798_Flexion Leg Sit Up (Bent Knee).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/798_Flexion Leg Sit Up (Bent Knee).jpg'),

-- 799
(NULL, 'Flexion Leg Sit Up (Straight Arm)', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/799_Flexion Leg Sit Up (Straight Arm).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/799_Flexion Leg Sit Up (Straight Arm).jpg'),

-- 800
(NULL, 'Floor Fly (With Barbell)', 'chest', 'barbell', 'weight_reps', '{shoulders,triceps}', 'chest_fly', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/800_Floor Fly (With Barbell).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/800_Floor Fly (With Barbell).jpg'),

 -- 801
(NULL, 'Flutter Kicks', 'abs', 'none', 'duration', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/801_Flutter Kicks.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/801_Flutter Kicks.jpg'),

-- 802
(NULL, 'Forward Jump', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}', 'jump', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/802_Forward Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/802_Forward Jump.jpg'),

-- 803
(NULL, 'Forward Lunge', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves}', 'lunge', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/803_Forward Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/803_Forward Lunge.jpg'),

-- 804
(NULL, 'Frankenstein Squat', 'quads', 'barbell', 'weight_reps', '{glutes,hamstrings,abs,lower_back}', 'squat', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/804_Frankenstein Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/804_Frankenstein Squat.jpg'),

-- 805
(NULL, 'Frog Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/805_Frog Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/805_Frog Crunch.jpg'),

-- 806
(NULL, 'Frog Planche', 'shoulders', 'none', 'duration', '{chest,triceps,abs}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/806_Frog Planche.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/806_Frog Planche.jpg'),

-- 807
(NULL, 'Front Lever', 'back', 'none', 'duration', '{shoulders,abs,forearms}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/807_Front Lever.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/807_Front Lever.jpg'),

-- 808
(NULL, 'Front Lever Reps', 'back', 'none', 'bodyweight_reps', '{shoulders,abs,forearms}', 'horizontal_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/808_Front Lever Reps.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/808_Front Lever Reps.jpg'),

-- 809
(NULL, 'Front Plank With Twist', 'abs', 'none', 'duration', '{obliques,shoulders}', 'rotation', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/809_Front Plank With Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/809_Front Plank With Twist.jpg'),

-- 810
(NULL, 'Full Maltese', 'chest', 'none', 'duration', '{shoulders,triceps,abs}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/810_Full Maltese.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/810_Full Maltese.jpg'),

-- 811
(NULL, 'Full Planche', 'shoulders', 'none', 'duration', '{chest,triceps,abs}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/811_Full Planche.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/811_Full Planche.jpg'),

-- 812
(NULL, 'Full Planche Push-up', 'shoulders', 'none', 'bodyweight_reps', '{chest,triceps,abs}', 'horizontal_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/812_Full Planche Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/812_Full Planche Push-up.jpg'),

-- 813
(NULL, 'Gironda Sternum Chin', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/813_Gironda Sternum Chin.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/813_Gironda Sternum Chin.jpg'),

-- 814
(NULL, 'Glute Bridge March', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/814_Glute Bridge March.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/814_Glute Bridge March.jpg'),

-- 815
(NULL, 'Glute Bridge Two Legs On Bench', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/815_Glute Bridge Two Legs On Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/815_Glute Bridge Two Legs On Bench.jpg'),

-- 816
(NULL, 'Glute-ham Raise', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,lower_back}', 'knee_flexion', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/816_Glute-ham Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/816_Glute-ham Raise.jpg'),

-- 817
(NULL, 'Gorilla Chin', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/817_Gorilla Chin.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/817_Gorilla Chin.jpg'),

-- 818
(NULL, 'Groin Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques,adductors}', 'trunk_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/818_Groin Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/818_Groin Crunch.jpg'),

-- 819
(NULL, 'Hack Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/819_Hack Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/819_Hack Calf Raise.jpg'),

-- 820
(NULL, 'Hack One Leg Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/820_Hack One Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/820_Hack One Leg Calf Raise.jpg'),

-- 821
(NULL, 'Half Knee Bends', 'quads', 'none', 'bodyweight_reps', '{glutes,calves}', 'squat', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/821_Half Knee Bends.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/821_Half Knee Bends.jpg'),

-- 822
(NULL, 'Half Sit-up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/822_Half Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/822_Half Sit-up.jpg'),

-- 823
(NULL, 'Hamstring Stretch', 'hamstrings', 'none', 'duration', '{calves,lower_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/823_Hamstring Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/823_Hamstring Stretch.jpg'),

-- 824
(NULL, 'Hands Bike', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/824_Hands Bike.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/824_Hands Bike.jpg'),

-- 825
(NULL, 'Hands Clasped Circular Toe Touch', 'abs', 'none', 'bodyweight_reps', '{obliques,hamstrings}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/825_Hands Clasped Circular Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/825_Hands Clasped Circular Toe Touch.jpg'),

-- 826
(NULL, 'Hands Reversed Clasped Circular Toe Touch', 'abs', 'none', 'bodyweight_reps', '{obliques,hamstrings}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/826_Hands Reversed Clasped Circular Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/826_Hands Reversed Clasped Circular Toe Touch.jpg'),

-- 827
(NULL, 'Handstand', 'shoulders', 'none', 'duration', '{triceps,abs,upper_back}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/827_Handstand.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/827_Handstand.jpg'),

-- 828
(NULL, 'Handstand Push-up', 'shoulders', 'none', 'bodyweight_reps', '{triceps,abs,upper_back}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/828_Handstand Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/828_Handstand Push-up.jpg'),

-- 829
(NULL, 'Hanging Leg Hip Raise', 'abs', 'none', 'bodyweight_reps', '{obliques,forearms}', 'hip_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/829_Hanging Leg Hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/829_Hanging Leg Hip Raise.jpg'),

-- 830
(NULL, 'Hanging Leg Raise', 'abs', 'none', 'bodyweight_reps', '{obliques,forearms}', 'hip_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/830_Hanging Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/830_Hanging Leg Raise.jpg'),

-- 831
(NULL, 'Hanging Oblique Knee Raise', 'obliques', 'none', 'bodyweight_reps', '{abs,forearms}', 'hip_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/831_Hanging Oblique Knee Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/831_Hanging Oblique Knee Raise.jpg'),

-- 832
(NULL, 'Hanging Pike', 'abs', 'none', 'bodyweight_reps', '{obliques,forearms}', 'hip_flexion', false, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/832_Hanging Pike.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/832_Hanging Pike.jpg'),

-- 833
(NULL, 'Hanging Straight Leg Hip Raise', 'abs', 'none', 'bodyweight_reps', '{obliques,forearms}', 'hip_flexion', false, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/833_Hanging Straight Leg Hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/833_Hanging Straight Leg Hip Raise.jpg'),

-- 834
(NULL, 'Hanging Straight Leg Raise', 'abs', 'none', 'bodyweight_reps', '{obliques,forearms}', 'hip_flexion', false, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/834_Hanging Straight Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/834_Hanging Straight Leg Raise.jpg'),

-- 835
(NULL, 'Hanging Straight Twisting Leg Hip Raise', 'obliques', 'none', 'bodyweight_reps', '{abs,forearms}', 'rotation', false, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/835_Hanging Straight Twisting Leg Hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/835_Hanging Straight Twisting Leg Hip Raise.jpg'),

-- 836
(NULL, 'High Knee Against Wall', 'quads', 'none', 'duration', '{glutes,calves}', 'march', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/836_High Knee Against Wall.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/836_High Knee Against Wall.jpg'),

-- 837
(NULL, 'Hip Raise (Bent Knee)', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/837_Hip Raise (Bent Knee).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/837_Hip Raise (Bent Knee).jpg'),

-- 838
(NULL, 'Hug Knees To Chest', 'lower_back', 'none', 'duration', '{glutes,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/838_Hug Knees To Chest.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/838_Hug Knees To Chest.jpg'),

-- 839
(NULL, 'Hyght Dumbbell Fly', 'chest', 'dumbbell', 'weight_reps', '{shoulders}', 'chest_fly', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/839_Hyght Dumbbell Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/839_Hyght Dumbbell Fly.jpg'),

-- 840
(NULL, 'Hyperextension', 'lower_back', 'none', 'bodyweight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/840_Hyperextension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/840_Hyperextension.jpg'),

-- 841
(NULL, 'Hyperextension (On Bench)', 'lower_back', 'other', 'bodyweight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/841_Hyperextension (On Bench).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/841_Hyperextension (On Bench).jpg'),

-- 842
(NULL, 'Impossible Dips', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/842_Impossible Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/842_Impossible Dips.jpg'),

-- 843
(NULL, 'Inchworm', 'full_body', 'none', 'bodyweight_reps', '{shoulders,abs,hamstrings,calves}', 'hinge_walkout', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/843_Inchworm.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/843_Inchworm.jpg'),

-- 844
(NULL, 'Inchworm V. 2', 'full_body', 'none', 'bodyweight_reps', '{shoulders,abs,hamstrings,calves}', 'hinge_walkout', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/844_Inchworm V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/844_Inchworm V. 2.jpg'),

-- 845
(NULL, 'Incline Close-grip Push-up', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/845_Incline Close-grip Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/845_Incline Close-grip Push-up.jpg'),

-- 846
(NULL, 'Incline Leg Hip Raise (Leg Straight)', 'abs', 'other', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/846_Incline Leg Hip Raise (Leg Straight).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/846_Incline Leg Hip Raise (Leg Straight).jpg'),

-- 847
(NULL, 'Incline Push Up Depth Jump', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/847_Incline Push Up Depth Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/847_Incline Push Up Depth Jump.jpg'),

-- 848
(NULL, 'Incline Push-up', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/848_Incline Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/848_Incline Push-up.jpg'),

-- 849
(NULL, 'Incline Push-up (On Box)', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/849_Incline Push-up (On Box).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/849_Incline Push-up (On Box).jpg'),

-- 850
(NULL, 'Incline Reverse Grip Push-up', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/850_Incline Reverse Grip Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/850_Incline Reverse Grip Push-up.jpg'),

-- 851
(NULL, 'Incline Scapula Push Up', 'chest', 'other', 'bodyweight_reps', '{shoulders,abs}', 'scapular_protraction', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/851_Incline Scapula Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/851_Incline Scapula Push Up.jpg'),

-- 852
(NULL, 'Incline Twisting Sit-up', 'obliques', 'other', 'bodyweight_reps', '{abs}', 'trunk_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/852_Incline Twisting Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/852_Incline Twisting Sit-up.jpg'),

-- 853
(NULL, 'Intermediate Hip Flexor And Quad Stretch', 'quads', 'none', 'duration', '{glutes}', 'stretch', false, 'intermediate', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/853_Intermediate Hip Flexor And Quad Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/853_Intermediate Hip Flexor And Quad Stretch.jpg'),

-- 854
(NULL, 'Inverse Leg Curl (Bench Support)', 'hamstrings', 'other', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/854_Inverse Leg Curl (Bench Support).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/854_Inverse Leg Curl (Bench Support).jpg'),

-- 855
(NULL, 'Inverse Leg Curl (On Pull-up Cable Machine)', 'hamstrings', 'cable', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/855_Inverse Leg Curl (On Pull-up Cable Machine).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/855_Inverse Leg Curl (On Pull-up Cable Machine).jpg'),

-- 856
(NULL, 'Inverted Row', 'upper_back', 'none', 'bodyweight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/856_Inverted Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/856_Inverted Row.jpg'),

-- 857
(NULL, 'Inverted Row Bent Knees', 'upper_back', 'none', 'bodyweight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/857_Inverted Row Bent Knees.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/857_Inverted Row Bent Knees.jpg'),

-- 858
(NULL, 'Inverted Row On Bench', 'upper_back', 'other', 'bodyweight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/858_Inverted Row On Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/858_Inverted Row On Bench.jpg'),

-- 859
(NULL, 'Inverted Row V. 2', 'upper_back', 'none', 'bodyweight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/859_Inverted Row V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/859_Inverted Row V. 2.jpg'),

-- 860
(NULL, 'Inverted Row With Straps', 'upper_back', 'suspension_band', 'bodyweight_reps', '{back,biceps,forearms,abs}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/860_Inverted Row With Straps.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/860_Inverted Row With Straps.jpg'),

-- 861
(NULL, 'Iron Cross Stretch', 'chest', 'none', 'duration', '{shoulders,biceps}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/861_Iron Cross Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/861_Iron Cross Stretch.jpg'),

-- 862
(NULL, 'Isometric Chest Squeeze', 'chest', 'none', 'duration', '{shoulders}', 'isometric_hold', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/862_Isometric Chest Squeeze.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/862_Isometric Chest Squeeze.jpg'),

-- 863
(NULL, 'Isometric Wipers', 'obliques', 'none', 'duration', '{abs,shoulders}', 'isometric_hold', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/863_Isometric Wipers.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/863_Isometric Wipers.jpg'),

-- 864
(NULL, 'Jack Burpee', 'full_body', 'none', 'bodyweight_reps', '{quads,glutes,calves,chest,shoulders,triceps,abs}', 'burpee', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/864_Jack Burpee.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/864_Jack Burpee.jpg'),

-- 865
(NULL, 'Jack Jump', 'quads', 'none', 'bodyweight_reps', '{glutes,calves}', 'jump', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/865_Jack Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/865_Jack Jump.jpg'),

-- 866
(NULL, 'Jackknife Sit-up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/866_Jackknife Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/866_Jackknife Sit-up.jpg'),

-- 867
(NULL, 'Janda Sit-up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'advanced', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/867_Janda Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/867_Janda Sit-up.jpg'),

-- 868
(NULL, 'Jump Rope', 'cardio', 'other', 'duration', '{calves,quads}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/868_Jump Rope.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/868_Jump Rope.jpg'),

-- 869
(NULL, 'Jump Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/869_Jump Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/869_Jump Squat.jpg'),

-- 870
(NULL, 'Jump Squat V. 2', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/870_Jump Squat V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/870_Jump Squat V. 2.jpg'),

-- 871
(NULL, 'Kettlebell Advanced Windmill', 'shoulders', 'kettlebell', 'weight_reps', '{obliques,abs,glutes,hamstrings}', 'rotation', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/871_Kettlebell Advanced Windmill.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/871_Kettlebell Advanced Windmill.jpg'),

-- 872
(NULL, 'Kettlebell Alternating Hang Clean', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,glutes,quads,forearms}', 'hinge_pull', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/872_Kettlebell Alternating Hang Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/872_Kettlebell Alternating Hang Clean.jpg'),

-- 873
(NULL, 'Kettlebell Alternating Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/873_Kettlebell Alternating Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/873_Kettlebell Alternating Press.jpg'),

-- 874
(NULL, 'Kettlebell Alternating Press On Floor', 'chest', 'kettlebell', 'weight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/874_Kettlebell Alternating Press On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/874_Kettlebell Alternating Press On Floor.jpg'),

-- 875
(NULL, 'Kettlebell Alternating Renegade Row', 'upper_back', 'kettlebell', 'weight_reps', '{back,biceps,forearms,abs,shoulders}', 'horizontal_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/875_Kettlebell Alternating Renegade Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/875_Kettlebell Alternating Renegade Row.jpg'),

-- 876
(NULL, 'Kettlebell Alternating Row', 'upper_back', 'kettlebell', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/876_Kettlebell Alternating Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/876_Kettlebell Alternating Row.jpg'),

-- 877
(NULL, 'Kettlebell Arnold Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/877_Kettlebell Arnold Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/877_Kettlebell Arnold Press.jpg'),

-- 878
(NULL, 'Kettlebell Bent Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,obliques,abs,glutes}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/878_Kettlebell Bent Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/878_Kettlebell Bent Press.jpg'),

-- 879
(NULL, 'Kettlebell Bottoms Up Clean From The Hang Position', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,forearms,glutes,quads}', 'hinge_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/879_Kettlebell Bottoms Up Clean From The Hang Position.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/879_Kettlebell Bottoms Up Clean From The Hang Position.jpg'),

-- 880
(NULL, 'Kettlebell Double Alternating Hang Clean', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,forearms,glutes,quads}', 'hinge_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/880_Kettlebell Double Alternating Hang Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/880_Kettlebell Double Alternating Hang Clean.jpg'),

-- 881
(NULL, 'Kettlebell Double Jerk', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,quads,glutes,calves}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/881_Kettlebell Double Jerk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/881_Kettlebell Double Jerk.jpg'),

-- 882
(NULL, 'Kettlebell Double Push Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,quads,glutes}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/882_Kettlebell Double Push Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/882_Kettlebell Double Push Press.jpg'),

-- 883
(NULL, 'Kettlebell Double Snatch', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,glutes,quads,forearms,lower_back}', 'hinge_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/883_Kettlebell Double Snatch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/883_Kettlebell Double Snatch.jpg'),

-- 884
(NULL, 'Kettlebell Double Windmill', 'shoulders', 'kettlebell', 'weight_reps', '{obliques,abs,glutes,hamstrings}', 'rotation', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/884_Kettlebell Double Windmill.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/884_Kettlebell Double Windmill.jpg'),

-- 885
(NULL, 'Kettlebell Extended Range One Arm Press On Floor', 'chest', 'kettlebell', 'weight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/885_Kettlebell Extended Range One Arm Press On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/885_Kettlebell Extended Range One Arm Press On Floor.jpg'),

-- 886
(NULL, 'Kettlebell Figure 8', 'full_body', 'kettlebell', 'weight_reps', '{glutes,hamstrings,abs,obliques,forearms}', 'hip_hinge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/886_Kettlebell Figure 8.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/886_Kettlebell Figure 8.jpg'),

-- 887
(NULL, 'Kettlebell Front Squat', 'quads', 'kettlebell', 'weight_reps', '{glutes,hamstrings,abs,lower_back}', 'squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/887_Kettlebell Front Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/887_Kettlebell Front Squat.jpg'),

-- 888
(NULL, 'Kettlebell Goblet Squat', 'quads', 'kettlebell', 'weight_reps', '{glutes,hamstrings,abs}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/888_Kettlebell Goblet Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/888_Kettlebell Goblet Squat.jpg'),

-- 889
(NULL, 'Kettlebell Hang Clean', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,forearms,glutes,quads}', 'hinge_pull', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/889_Kettlebell Hang Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/889_Kettlebell Hang Clean.jpg'),

-- 890
(NULL, 'Kettlebell Lunge Pass Through', 'quads', 'kettlebell', 'weight_reps', '{glutes,hamstrings,abs,obliques}', 'lunge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/890_Kettlebell Lunge Pass Through.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/890_Kettlebell Lunge Pass Through.jpg'),

-- 891
(NULL, 'Kettlebell One Arm Clean And Jerk', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,triceps,traps,glutes,quads,forearms}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/891_Kettlebell One Arm Clean And Jerk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/891_Kettlebell One Arm Clean And Jerk.jpg'),

-- 892
(NULL, 'Kettlebell One Arm Floor Press', 'chest', 'kettlebell', 'weight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/892_Kettlebell One Arm Floor Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/892_Kettlebell One Arm Floor Press.jpg'),

-- 893
(NULL, 'Kettlebell One Arm Jerk', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,quads,glutes,calves}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/893_Kettlebell One Arm Jerk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/893_Kettlebell One Arm Jerk.jpg'),

-- 894
(NULL, 'Kettlebell One Arm Military Press To The Side', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,obliques}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/894_Kettlebell One Arm Military Press To The Side.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/894_Kettlebell One Arm Military Press To The Side.jpg'),

-- 895
(NULL, 'Kettlebell One Arm Push Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,quads,glutes}', 'vertical_press', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/895_Kettlebell One Arm Push Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/895_Kettlebell One Arm Push Press.jpg'),

-- 896
(NULL, 'Kettlebell One Arm Row', 'upper_back', 'kettlebell', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/896_Kettlebell One Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/896_Kettlebell One Arm Row.jpg'),

-- 897
(NULL, 'Kettlebell One Arm Snatch', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,glutes,quads,forearms,lower_back}', 'hinge_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/897_Kettlebell One Arm Snatch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/897_Kettlebell One Arm Snatch.jpg'),

-- 898
(NULL, 'Kettlebell Pirate Supper Legs', 'quads', 'kettlebell', 'weight_reps', '{glutes,hamstrings,abs}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/898_Kettlebell Pirate Supper Legs.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/898_Kettlebell Pirate Supper Legs.jpg'),

-- 899
(NULL, 'Kettlebell Pistol Squat', 'quads', 'kettlebell', 'weight_reps', '{glutes,hamstrings,calves,abs}', 'squat', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/899_Kettlebell Pistol Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/899_Kettlebell Pistol Squat.jpg'),

-- 900
(NULL, 'Kettlebell Plyo Push-up', 'chest', 'kettlebell', 'weight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/900_Kettlebell Plyo Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/900_Kettlebell Plyo Push-up.jpg'),

 -- 901
(NULL, 'Kettlebell Seated Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/901_Kettlebell Seated Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/901_Kettlebell Seated Press.jpg'),

-- 902
(NULL, 'Kettlebell Seated Two Arm Military Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/902_Kettlebell Seated Two Arm Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/902_Kettlebell Seated Two Arm Military Press.jpg'),

-- 903
(NULL, 'Kettlebell Seesaw Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,abs,obliques}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/903_Kettlebell Seesaw Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/903_Kettlebell Seesaw Press.jpg'),

-- 904
(NULL, 'Kettlebell Sumo High Pull', 'full_body', 'kettlebell', 'weight_reps', '{glutes,hamstrings,quads,traps,shoulders,forearms}', 'hinge_pull', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/904_Kettlebell Sumo High Pull.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/904_Kettlebell Sumo High Pull.jpg'),

-- 905
(NULL, 'Kettlebell Swing', 'glutes', 'kettlebell', 'weight_reps', '{hamstrings,lower_back,forearms,abs}', 'hip_hinge', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/905_Kettlebell Swing.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/905_Kettlebell Swing.jpg'),

-- 906
(NULL, 'Kettlebell Thruster', 'full_body', 'kettlebell', 'weight_reps', '{quads,glutes,shoulders,triceps,abs}', 'thruster', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/906_Kettlebell Thruster.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/906_Kettlebell Thruster.jpg'),

-- 907
(NULL, 'Kettlebell Turkish Get Up (Squat Style)', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,abs,obliques,glutes,quads}', 'carry', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/907_Kettlebell Turkish Get Up (Squat Style).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/907_Kettlebell Turkish Get Up (Squat Style).jpg'),

-- 908
(NULL, 'Kettlebell Two Arm Clean', 'full_body', 'kettlebell', 'weight_reps', '{shoulders,traps,forearms,glutes,quads}', 'hinge_pull', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/908_Kettlebell Two Arm Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/908_Kettlebell Two Arm Clean.jpg'),

-- 909
(NULL, 'Kettlebell Two Arm Military Press', 'shoulders', 'kettlebell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/909_Kettlebell Two Arm Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/909_Kettlebell Two Arm Military Press.jpg'),

-- 910
(NULL, 'Kettlebell Two Arm Row', 'upper_back', 'kettlebell', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/910_Kettlebell Two Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/910_Kettlebell Two Arm Row.jpg'),

-- 911
(NULL, 'Kettlebell Windmill', 'shoulders', 'kettlebell', 'weight_reps', '{obliques,abs,glutes,hamstrings}', 'rotation', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/911_Kettlebell Windmill.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/911_Kettlebell Windmill.jpg'),

-- 912
(NULL, 'Kick Out Sit', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/912_Kick Out Sit.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/912_Kick Out Sit.jpg'),

-- 913
(NULL, 'Kipping Muscle Up', 'back', 'none', 'bodyweight_reps', '{chest,shoulders,triceps,biceps,forearms}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/913_Kipping Muscle Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/913_Kipping Muscle Up.jpg'),

-- 914
(NULL, 'Knee Touch Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/914_Knee Touch Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/914_Knee Touch Crunch.jpg'),

-- 915
(NULL, 'Kneeling Jump Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,calves}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/915_Kneeling Jump Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/915_Kneeling Jump Squat.jpg'),

-- 916
(NULL, 'Kneeling Lat Stretch', 'back', 'none', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/916_Kneeling Lat Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/916_Kneeling Lat Stretch.jpg'),

-- 917
(NULL, 'Kneeling Plank Tap Shoulder', 'abs', 'none', 'bodyweight_reps', '{obliques,shoulders,chest}', 'plank', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/917_Kneeling Plank Tap Shoulder.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/917_Kneeling Plank Tap Shoulder.jpg'),

-- 918
(NULL, 'Kneeling Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/918_Kneeling Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/918_Kneeling Push-up.jpg'),

-- 919
(NULL, 'Korean Dips', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/919_Korean Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/919_Korean Dips.jpg'),

-- 920
(NULL, 'L-pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,abs}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/920_L-pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/920_L-pull-up.jpg'),

-- 921
(NULL, 'L-sit On Floor', 'abs', 'none', 'duration', '{shoulders,triceps}', 'isometric_hold', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/921_L-sit On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/921_L-sit On Floor.jpg'),

-- 922
(NULL, 'Landmine 180', 'obliques', 'barbell', 'weight_reps', '{abs,shoulders,traps}', 'rotation', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/922_Landmine 180.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/922_Landmine 180.jpg'),

-- 923
(NULL, 'Landmine Lateral Raise', 'shoulders', 'barbell', 'weight_reps', '{traps}', 'lateral_raise', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/923_Landmine Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/923_Landmine Lateral Raise.jpg'),

-- 924
(NULL, 'Lean Planche', 'shoulders', 'none', 'duration', '{chest,triceps,abs}', 'isometric_hold', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/924_Lean Planche.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/924_Lean Planche.jpg'),

-- 925
(NULL, 'Left Hook (Boxing)', 'shoulders', 'none', 'duration', '{chest,triceps,obliques}', 'cardio', true, 'beginner', 2, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/925_Left Hook (Boxing).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/925_Left Hook (Boxing).jpg'),

-- 926
(NULL, 'Leg Pull In Flat Bench', 'abs', 'other', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/926_Leg Pull In Flat Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/926_Leg Pull In Flat Bench.jpg'),

-- 927
(NULL, 'Leg Up Hamstring Stretch', 'hamstrings', 'none', 'duration', '{calves,lower_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/927_Leg Up Hamstring Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/927_Leg Up Hamstring Stretch.jpg'),

-- 928
(NULL, 'Lever Alternate Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'leg_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/928_Lever Alternate Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/928_Lever Alternate Leg Press.jpg'),

-- 929
(NULL, 'Lever Alternating Narrow Grip Seated Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/929_Lever Alternating Narrow Grip Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/929_Lever Alternating Narrow Grip Seated Row.jpg'),

-- 930
(NULL, 'Lever Assisted Chin-up', 'back', 'machine', 'assisted_bodyweight', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/930_Lever Assisted Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/930_Lever Assisted Chin-up.jpg'),

-- 931
(NULL, 'Lever Back Extension', 'lower_back', 'machine', 'weight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/931_Lever Back Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/931_Lever Back Extension.jpg'),

-- 932
(NULL, 'Lever Bent Over Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/932_Lever Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/932_Lever Bent Over Row.jpg'),

-- 933
(NULL, 'Lever Bent-over Row With V-bar', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/933_Lever Bent-over Row With V-bar.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/933_Lever Bent-over Row With V-bar.jpg'),

-- 934
(NULL, 'Lever Bicep Curl', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/934_Lever Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/934_Lever Bicep Curl.jpg'),

-- 935
(NULL, 'Lever Calf Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/935_Lever Calf Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/935_Lever Calf Press.jpg'),

-- 936
(NULL, 'Lever Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/936_Lever Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/936_Lever Chest Press.jpg'),

-- 937
(NULL, 'Lever Chest Press V. 2', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/937_Lever Chest Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/937_Lever Chest Press V. 2.jpg'),

-- 938
(NULL, 'Lever Deadlift', 'hamstrings', 'machine', 'weight_reps', '{glutes,lower_back,forearms}', 'hip_hinge', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/938_Lever Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/938_Lever Deadlift.jpg'),

-- 939
(NULL, 'Lever Decline Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/939_Lever Decline Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/939_Lever Decline Chest Press.jpg'),

-- 940
(NULL, 'Lever Donkey Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/940_Lever Donkey Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/940_Lever Donkey Calf Raise.jpg'),

-- 941
(NULL, 'Lever Front Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/941_Lever Front Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/941_Lever Front Pulldown.jpg'),

-- 942
(NULL, 'Lever Gripless Shrug', 'traps', 'machine', 'weight_reps', '{}', 'shrug', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/942_Lever Gripless Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/942_Lever Gripless Shrug.jpg'),

-- 943
(NULL, 'Lever Gripless Shrug V. 2', 'traps', 'machine', 'weight_reps', '{}', 'shrug', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/943_Lever Gripless Shrug V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/943_Lever Gripless Shrug V. 2.jpg'),

-- 944
(NULL, 'Lever Gripper Hands', 'hands', 'machine', 'weight_reps', '{forearms}', 'grip', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/944_Lever Gripper Hands.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/944_Lever Gripper Hands.jpg'),

-- 945
(NULL, 'Lever Hammer Grip Preacher Curl', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/945_Lever Hammer Grip Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/945_Lever Hammer Grip Preacher Curl.jpg'),

-- 946
(NULL, 'Lever High Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/946_Lever High Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/946_Lever High Row.jpg'),

-- 947
(NULL, 'Lever Hip Extension V. 2', 'glutes', 'machine', 'weight_reps', '{hamstrings}', 'hip_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/947_Lever Hip Extension V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/947_Lever Hip Extension V. 2.jpg'),

-- 948
(NULL, 'Lever Horizontal One Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'leg_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/948_Lever Horizontal One Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/948_Lever Horizontal One Leg Press.jpg'),

-- 949
(NULL, 'Lever Incline Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/949_Lever Incline Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/949_Lever Incline Chest Press.jpg'),

-- 950
(NULL, 'Lever Incline Chest Press V. 2', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/950_Lever Incline Chest Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/950_Lever Incline Chest Press V. 2.jpg'),

-- 951
(NULL, 'Lever Kneeling Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{glutes,calves}', 'knee_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/951_Lever Kneeling Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/951_Lever Kneeling Leg Curl.jpg'),

-- 952
(NULL, 'Lever Kneeling Twist', 'obliques', 'machine', 'weight_reps', '{abs}', 'rotation', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/952_Lever Kneeling Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/952_Lever Kneeling Twist.jpg'),

-- 953
(NULL, 'Lever Lateral Raise', 'shoulders', 'machine', 'weight_reps', '{traps}', 'lateral_raise', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/953_Lever Lateral Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/953_Lever Lateral Raise.jpg'),

-- 954
(NULL, 'Lever Leg Extension', 'quads', 'machine', 'weight_reps', '{}', 'knee_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/954_Lever Leg Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/954_Lever Leg Extension.jpg'),

-- 955
(NULL, 'Lever Lying Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}', 'knee_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/955_Lever Lying Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/955_Lever Lying Leg Curl.jpg'),

-- 956
(NULL, 'Lever Lying Two-one Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}', 'knee_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/956_Lever Lying Two-one Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/956_Lever Lying Two-one Leg Curl.jpg'),

-- 957
(NULL, 'Lever Military Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/957_Lever Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/957_Lever Military Press.jpg'),

-- 958
(NULL, 'Lever Narrow Grip Seated Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/958_Lever Narrow Grip Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/958_Lever Narrow Grip Seated Row.jpg'),

-- 959
(NULL, 'Lever One Arm Bent Over Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/959_Lever One Arm Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/959_Lever One Arm Bent Over Row.jpg'),

-- 960
(NULL, 'Lever One Arm Lateral High Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms,shoulders}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/960_Lever One Arm Lateral High Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/960_Lever One Arm Lateral High Row.jpg'),

-- 961
(NULL, 'Lever One Arm Lateral Wide Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back,shoulders}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/961_Lever One Arm Lateral Wide Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/961_Lever One Arm Lateral Wide Pulldown.jpg'),

-- 962
(NULL, 'Lever One Arm Shoulder Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/962_Lever One Arm Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/962_Lever One Arm Shoulder Press.jpg'),

-- 963
(NULL, 'Lever Overhand Triceps Dip', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/963_Lever Overhand Triceps Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/963_Lever Overhand Triceps Dip.jpg'),

-- 964
(NULL, 'Lever Preacher Curl', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/964_Lever Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/964_Lever Preacher Curl.jpg'),

-- 965
(NULL, 'Lever Preacher Curl V. 2', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/965_Lever Preacher Curl V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/965_Lever Preacher Curl V. 2.jpg'),

-- 966
(NULL, 'Lever Pullover', 'chest', 'machine', 'weight_reps', '{back,triceps,shoulders}', 'chest_fly', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/966_Lever Pullover.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/966_Lever Pullover.jpg'),

-- 967
(NULL, 'Lever Reverse Grip Lateral Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/967_Lever Reverse Grip Lateral Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/967_Lever Reverse Grip Lateral Pulldown.jpg'),

-- 968
(NULL, 'Lever Reverse Grip Preacher Curl', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/968_Lever Reverse Grip Preacher Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/968_Lever Reverse Grip Preacher Curl.jpg'),

-- 969
(NULL, 'Lever Reverse Grip Vertical Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/969_Lever Reverse Grip Vertical Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/969_Lever Reverse Grip Vertical Row.jpg'),

-- 970
(NULL, 'Lever Reverse Hyperextension', 'glutes', 'machine', 'weight_reps', '{hamstrings,lower_back}', 'hip_extension', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/970_Lever Reverse Hyperextension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/970_Lever Reverse Hyperextension.jpg'),

 -- 971
(NULL, 'Lever Reverse T-bar Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/971_Lever Reverse T-bar Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/971_Lever Reverse T-bar Row.jpg'),

-- 972
(NULL, 'Lever Rotary Calf', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/972_Lever Rotary Calf.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/972_Lever Rotary Calf.jpg'),

-- 973
(NULL, 'Lever Seated Calf Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/973_Lever Seated Calf Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/973_Lever Seated Calf Press.jpg'),

-- 974
(NULL, 'Lever Seated Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/974_Lever Seated Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/974_Lever Seated Calf Raise.jpg'),

-- 975
(NULL, 'Lever Seated Crunch', 'abs', 'machine', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/975_Lever Seated Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/975_Lever Seated Crunch.jpg'),

-- 976
(NULL, 'Lever Seated Crunch (Chest Pad)', 'abs', 'machine', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/976_Lever Seated Crunch (Chest Pad).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/976_Lever Seated Crunch (Chest Pad).jpg'),

-- 977
(NULL, 'Lever Seated Crunch V. 2', 'abs', 'machine', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/977_Lever Seated Crunch V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/977_Lever Seated Crunch V. 2.jpg'),

-- 978
(NULL, 'Lever Seated Dip', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/978_Lever Seated Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/978_Lever Seated Dip.jpg'),

-- 979
(NULL, 'Lever Seated Fly', 'chest', 'machine', 'weight_reps', '{shoulders}', 'chest_fly', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/979_Lever Seated Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/979_Lever Seated Fly.jpg'),

-- 980
(NULL, 'Lever Seated Good Morning', 'lower_back', 'machine', 'weight_reps', '{glutes,hamstrings,abs}', 'hip_hinge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/980_Lever Seated Good Morning.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/980_Lever Seated Good Morning.jpg'),

-- 981
(NULL, 'Lever Seated Hip Abduction', 'glutes', 'machine', 'weight_reps', '{obliques}', 'hip_abduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/981_Lever Seated Hip Abduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/981_Lever Seated Hip Abduction.jpg'),

-- 982
(NULL, 'Lever Seated Hip Adduction', 'adductors', 'machine', 'weight_reps', '{glutes}', 'hip_adduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/982_Lever Seated Hip Adduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/982_Lever Seated Hip Adduction.jpg'),

-- 983
(NULL, 'Lever Seated Leg Curl', 'hamstrings', 'machine', 'weight_reps', '{calves}', 'knee_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/983_Lever Seated Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/983_Lever Seated Leg Curl.jpg'),

-- 984
(NULL, 'Lever Seated Leg Raise Crunch', 'abs', 'machine', 'weight_reps', '{obliques}', 'hip_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/984_Lever Seated Leg Raise Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/984_Lever Seated Leg Raise Crunch.jpg'),

-- 985
(NULL, 'Lever Seated Reverse Fly', 'upper_back', 'machine', 'weight_reps', '{shoulders,traps}', 'rear_delt_fly', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/985_Lever Seated Reverse Fly.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/985_Lever Seated Reverse Fly.jpg'),

-- 986
(NULL, 'Lever Seated Reverse Fly (Parallel Grip)', 'upper_back', 'machine', 'weight_reps', '{shoulders,traps}', 'rear_delt_fly', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/986_Lever Seated Reverse Fly (Parallel Grip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/986_Lever Seated Reverse Fly (Parallel Grip).jpg'),

-- 987
(NULL, 'Lever Seated Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/987_Lever Seated Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/987_Lever Seated Row.jpg'),

-- 988
(NULL, 'Lever Seated Squat Calf Raise On Leg Press Machine', 'calves', 'machine', 'weight_reps', '{quads}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/988_Lever Seated Squat Calf Raise On Leg Press Machine.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/988_Lever Seated Squat Calf Raise On Leg Press Machine.jpg'),

-- 989
(NULL, 'Lever Shoulder Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/989_Lever Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/989_Lever Shoulder Press.jpg'),

-- 990
(NULL, 'Lever Shoulder Press V. 2', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/990_Lever Shoulder Press V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/990_Lever Shoulder Press V. 2.jpg'),

-- 991
(NULL, 'Lever Shoulder Press V. 3', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/991_Lever Shoulder Press V. 3.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/991_Lever Shoulder Press V. 3.jpg'),

-- 992
(NULL, 'Lever Shrug', 'traps', 'machine', 'weight_reps', '{}', 'shrug', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/992_Lever Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/992_Lever Shrug.jpg'),

-- 993
(NULL, 'Lever Standing Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/993_Lever Standing Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/993_Lever Standing Calf Raise.jpg'),

-- 994
(NULL, 'Lever Standing Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/994_Lever Standing Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/994_Lever Standing Chest Press.jpg'),

-- 995
(NULL, 'Lever T Bar Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/995_Lever T Bar Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/995_Lever T Bar Row.jpg'),

-- 996
(NULL, 'Lever T-bar Reverse Grip Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/996_Lever T-bar Reverse Grip Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/996_Lever T-bar Reverse Grip Row.jpg'),

-- 997
(NULL, 'Lever Triceps Extension', 'triceps', 'machine', 'weight_reps', '{forearms}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/997_Lever Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/997_Lever Triceps Extension.jpg'),

-- 998
(NULL, 'Lever Unilateral Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/998_Lever Unilateral Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/998_Lever Unilateral Row.jpg'),

-- 999
(NULL, 'London Bridge', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/999_London Bridge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/999_London Bridge.jpg'),

-- 1000
(NULL, 'Low Glute Bridge On Floor', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1000_Low Glute Bridge On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1000_Low Glute Bridge On Floor.jpg'),

-- 1001
(NULL, 'Lower Back Curl', 'lower_back', 'none', 'bodyweight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1001_Lower Back Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1001_Lower Back Curl.jpg'),

-- 1002
(NULL, 'Lunge With Jump', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1002_Lunge With Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1002_Lunge With Jump.jpg'),

-- 1003
(NULL, 'Lunge With Twist', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,obliques,abs}', 'lunge', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1003_Lunge With Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1003_Lunge With Twist.jpg'),

-- 1004
(NULL, 'Lying (Side) Quads Stretch', 'quads', 'none', 'duration', '{}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1004_Lying (Side) Quads Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1004_Lying (Side) Quads Stretch.jpg'),

-- 1005
(NULL, 'Lying Elbow To Knee', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1005_Lying Elbow To Knee.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1005_Lying Elbow To Knee.jpg'),

-- 1006
(NULL, 'Lying Leg Raise Flat Bench', 'abs', 'other', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1006_Lying Leg Raise Flat Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1006_Lying Leg Raise Flat Bench.jpg'),

-- 1007
(NULL, 'Lying Leg-hip Raise', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1007_Lying Leg-hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1007_Lying Leg-hip Raise.jpg'),

-- 1008
(NULL, 'Machine Inner Chest Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1008_Machine Inner Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1008_Machine Inner Chest Press.jpg'),

-- 1009
(NULL, 'March Sit (Wall)', 'quads', 'none', 'duration', '{glutes,calves,abs}', 'isometric_hold', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1009_March Sit (Wall).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1009_March Sit (Wall).jpg'),

-- 1010
(NULL, 'Medicine Ball Catch And Overhead Throw', 'shoulders', 'other', 'weight_reps', '{triceps,chest,abs}', 'throw', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1010_Medicine Ball Catch And Overhead Throw.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1010_Medicine Ball Catch And Overhead Throw.jpg'),

-- 1011
(NULL, 'Medicine Ball Chest Pass', 'chest', 'other', 'weight_reps', '{triceps,shoulders}', 'throw', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1011_Medicine Ball Chest Pass.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1011_Medicine Ball Chest Pass.jpg'),

-- 1012
(NULL, 'Medicine Ball Chest Push From 3 Point Stance', 'chest', 'other', 'weight_reps', '{triceps,shoulders,abs}', 'throw', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1012_Medicine Ball Chest Push From 3 Point Stance.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1012_Medicine Ball Chest Push From 3 Point Stance.jpg'),

-- 1013
(NULL, 'Medicine Ball Chest Push Multiple Response', 'chest', 'other', 'weight_reps', '{triceps,shoulders}', 'throw', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1013_Medicine Ball Chest Push Multiple Response.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1013_Medicine Ball Chest Push Multiple Response.jpg'),

-- 1014
(NULL, 'Medicine Ball Chest Push Single Response', 'chest', 'other', 'weight_reps', '{triceps,shoulders}', 'throw', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1014_Medicine Ball Chest Push Single Response.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1014_Medicine Ball Chest Push Single Response.jpg'),

-- 1015
(NULL, 'Medicine Ball Chest Push With Run Release', 'chest', 'other', 'weight_reps', '{triceps,shoulders,quads,glutes}', 'throw', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1015_Medicine Ball Chest Push With Run Release.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1015_Medicine Ball Chest Push With Run Release.jpg'),

-- 1016
(NULL, 'Medicine Ball Close Grip Push Up', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1016_Medicine Ball Close Grip Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1016_Medicine Ball Close Grip Push Up.jpg'),

-- 1017
(NULL, 'Medicine Ball Overhead Slam', 'full_body', 'other', 'weight_reps', '{shoulders,triceps,abs,back,glutes}', 'slam', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1017_Medicine Ball Overhead Slam.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1017_Medicine Ball Overhead Slam.jpg'),

-- 1018
(NULL, 'Medicine Ball Supine Chest Throw', 'chest', 'other', 'weight_reps', '{triceps,shoulders}', 'throw', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1018_Medicine Ball Supine Chest Throw.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1018_Medicine Ball Supine Chest Throw.jpg'),

-- 1019
(NULL, 'Mixed Grip Chin-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1019_Mixed Grip Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1019_Mixed Grip Chin-up.jpg'),

-- 1020
(NULL, 'Modified Hindu Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1020_Modified Hindu Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1020_Modified Hindu Push-up.jpg'),

-- 1021
(NULL, 'Modified Push Up To Lower Arms', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1021_Modified Push Up To Lower Arms.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1021_Modified Push Up To Lower Arms.jpg'),

-- 1022
(NULL, 'Monster Walk', 'glutes', 'resistance_band', 'duration', '{adductors,abs,quads}', 'walk', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1022_Monster Walk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1022_Monster Walk.jpg'),

-- 1023
(NULL, 'Mountain Climber', 'abs', 'none', 'duration', '{obliques,shoulders,chest,quads}', 'cardio', true, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1023_Mountain Climber.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1023_Mountain Climber.jpg'),

-- 1024
(NULL, 'Muscle Up', 'back', 'none', 'bodyweight_reps', '{chest,shoulders,triceps,biceps,forearms}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1024_Muscle Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1024_Muscle Up.jpg'),

-- 1025
(NULL, 'Muscle-up (On Vertical Bar)', 'back', 'none', 'bodyweight_reps', '{chest,shoulders,triceps,biceps,forearms}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1025_Muscle-up (On Vertical Bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1025_Muscle-up (On Vertical Bar).jpg'),

-- 1026
(NULL, 'Narrow Push-up On Exercise Ball', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1026_Narrow Push-up On Exercise Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1026_Narrow Push-up On Exercise Ball.jpg'),

-- 1027
(NULL, 'Neck Side Stretch', 'neck', 'none', 'duration', '{}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1027_Neck Side Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1027_Neck Side Stretch.jpg'),

-- 1028
(NULL, 'Negative Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1028_Negative Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1028_Negative Crunch.jpg'),

-- 1029
(NULL, 'Oblique Crunch V. 2', 'obliques', 'none', 'bodyweight_reps', '{abs}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1029_Oblique Crunch V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1029_Oblique Crunch V. 2.jpg'),

-- 1030
(NULL, 'Oblique Crunches Floor', 'obliques', 'none', 'bodyweight_reps', '{abs}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1030_Oblique Crunches Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1030_Oblique Crunches Floor.jpg'),

-- 1031
(NULL, 'Olympic Barbell Hammer Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1031_Olympic Barbell Hammer Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1031_Olympic Barbell Hammer Curl.jpg'),

-- 1032
(NULL, 'Olympic Barbell Triceps Extension', 'triceps', 'barbell', 'weight_reps', '{forearms,shoulders}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1032_Olympic Barbell Triceps Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1032_Olympic Barbell Triceps Extension.jpg'),

-- 1033
(NULL, 'One Arm Against Wall', 'shoulders', 'none', 'duration', '{chest}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1033_One Arm Against Wall.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1033_One Arm Against Wall.jpg'),

-- 1034
(NULL, 'One Arm Chin-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back,abs}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1034_One Arm Chin-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1034_One Arm Chin-up.jpg'),

-- 1035
(NULL, 'One Arm Dip', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1035_One Arm Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1035_One Arm Dip.jpg'),

-- 1036
(NULL, 'One Arm Slam (With Medicine Ball)', 'full_body', 'other', 'weight_reps', '{shoulders,triceps,abs,obliques,back}', 'slam', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1036_One Arm Slam (With Medicine Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1036_One Arm Slam (With Medicine Ball).jpg'),

-- 1037
(NULL, 'One Arm Towel Row', 'upper_back', 'none', 'bodyweight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1037_One Arm Towel Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1037_One Arm Towel Row.jpg'),

-- 1038
(NULL, 'One Leg Donkey Calf Raise', 'calves', 'none', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1038_One Leg Donkey Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1038_One Leg Donkey Calf Raise.jpg'),

-- 1039
(NULL, 'One Leg Floor Calf Raise', 'calves', 'none', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1039_One Leg Floor Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1039_One Leg Floor Calf Raise.jpg'),

-- 1040
(NULL, 'One Leg Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves,abs}', 'squat', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1040_One Leg Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1040_One Leg Squat.jpg'),

 -- 1041
(NULL, 'Otis Up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1041_Otis Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1041_Otis Up.jpg'),

-- 1042
(NULL, 'Outside Leg Kick Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,glutes,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1042_Outside Leg Kick Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1042_Outside Leg Kick Push-up.jpg'),

-- 1043
(NULL, 'Overhead Triceps Stretch', 'triceps', 'none', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1043_Overhead Triceps Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1043_Overhead Triceps Stretch.jpg'),

-- 1044
(NULL, 'Pelvic Tilt', 'abs', 'none', 'bodyweight_reps', '{glutes}', 'posterior_tilt', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1044_Pelvic Tilt.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1044_Pelvic Tilt.jpg'),

-- 1045
(NULL, 'Pelvic Tilt Into Bridge', 'glutes', 'none', 'bodyweight_reps', '{abs,hamstrings}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1045_Pelvic Tilt Into Bridge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1045_Pelvic Tilt Into Bridge.jpg'),

-- 1046
(NULL, 'Peroneals Stretch', 'calves', 'none', 'duration', '{ankles}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1046_Peroneals Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1046_Peroneals Stretch.jpg'),

-- 1047
(NULL, 'Pike-to-cobra Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1047_Pike-to-cobra Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1047_Pike-to-cobra Push-up.jpg'),

-- 1048
(NULL, 'Plyo Push Up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1048_Plyo Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1048_Plyo Push Up.jpg'),

-- 1049
(NULL, 'Posterior Step To Overhead Reach', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,shoulders,abs}', 'lunge', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1049_Posterior Step To Overhead Reach.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1049_Posterior Step To Overhead Reach.jpg'),

-- 1050
(NULL, 'Posterior Tibialis Stretch', 'calves', 'none', 'duration', '{ankles}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1050_Posterior Tibialis Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1050_Posterior Tibialis Stretch.jpg'),

-- 1051
(NULL, 'Potty Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,adductors}', 'squat', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1051_Potty Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1051_Potty Squat.jpg'),

-- 1052
(NULL, 'Potty Squat With Support', 'quads', 'other', 'bodyweight_reps', '{glutes,hamstrings,adductors}', 'squat', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1052_Potty Squat With Support.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1052_Potty Squat With Support.jpg'),

-- 1053
(NULL, 'Power Clean', 'full_body', 'barbell', 'weight_reps', '{quads,glutes,hamstrings,traps,shoulders,forearms}', 'hinge_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1053_Power Clean.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1053_Power Clean.jpg'),

-- 1054
(NULL, 'Power Point Plank', 'abs', 'none', 'duration', '{obliques,shoulders}', 'plank', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1054_Power Point Plank.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1054_Power Point Plank.jpg'),

-- 1055
(NULL, 'Prisoner Half Sit-up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1055_Prisoner Half Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1055_Prisoner Half Sit-up.jpg'),

-- 1056
(NULL, 'Prone Twist On Stability Ball', 'obliques', 'other', 'bodyweight_reps', '{abs,lower_back}', 'rotation', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1056_Prone Twist On Stability Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1056_Prone Twist On Stability Ball.jpg'),

-- 1057
(NULL, 'Pull Up (Neutral Grip)', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1057_Pull Up (Neutral Grip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1057_Pull Up (Neutral Grip).jpg'),

-- 1058
(NULL, 'Pull-in (On Stability Ball)', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1058_Pull-in (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1058_Pull-in (On Stability Ball).jpg'),

-- 1059
(NULL, 'Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1059_Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1059_Pull-up.jpg'),

-- 1060
(NULL, 'Push And Pull Bodyweight', 'full_body', 'none', 'bodyweight_reps', '{chest,back,shoulders,triceps,biceps,abs}', 'compound', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1060_Push And Pull Bodyweight.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1060_Push And Pull Bodyweight.jpg'),

-- 1061
(NULL, 'Push To Run', 'full_body', 'none', 'duration', '{chest,shoulders,triceps,quads,glutes,abs}', 'cardio', true, 'intermediate', 4, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1061_Push To Run.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1061_Push To Run.jpg'),

-- 1062
(NULL, 'Push Up On Bosu Ball', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1062_Push Up On Bosu Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1062_Push Up On Bosu Ball.jpg'),

-- 1063
(NULL, 'Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1063_Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1063_Push-up.jpg'),

-- 1064
(NULL, 'Push-up (Bosu Ball)', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1064_Push-up (Bosu Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1064_Push-up (Bosu Ball).jpg'),

-- 1065
(NULL, 'Push-up (On Stability Ball)', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1065_Push-up (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1065_Push-up (On Stability Ball).jpg'),

-- 1066
(NULL, 'Decline Push-up (On Stability Ball)', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1066_Decline Push-up (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1066_Decline Push-up (On Stability Ball).jpg'),

-- 1067
(NULL, 'Push-up (Wall)', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1067_Push-up (Wall).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1067_Push-up (Wall).jpg'),

-- 1068
(NULL, 'Push-up (Wall) V. 2', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1068_Push-up (Wall) V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1068_Push-up (Wall) V. 2.jpg'),

-- 1069
(NULL, 'Push-up Close-grip Off Dumbbell', 'triceps', 'dumbbell', 'bodyweight_reps', '{chest,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1069_Push-up Close-grip Off Dumbbell.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1069_Push-up Close-grip Off Dumbbell.jpg'),

-- 1070
(NULL, 'Push-up Inside Leg Kick', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,glutes,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1070_Push-up Inside Leg Kick.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1070_Push-up Inside Leg Kick.jpg'),

-- 1071
(NULL, 'Push-up Medicine Ball', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1071_Push-up Medicine Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1071_Push-up Medicine Ball.jpg'),

-- 1072
(NULL, 'Push-up On Lower Arms', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1072_Push-up On Lower Arms.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1072_Push-up On Lower Arms.jpg'),

-- 1073
(NULL, 'Push-up Plus', 'chest', 'none', 'bodyweight_reps', '{shoulders,triceps,abs}', 'scapular_protraction', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1073_Push-up Plus.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1073_Push-up Plus.jpg'),

-- 1074
(NULL, 'Push-up To Side Plank', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1074_Push-up To Side Plank.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1074_Push-up To Side Plank.jpg'),

-- 1075
(NULL, 'Quads (Bodyweight Squat)', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1075_Quads (Bodyweight Squat).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1075_Quads (Bodyweight Squat).jpg'),

-- 1076
(NULL, 'Quarter Sit-up', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1076_Quarter Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1076_Quarter Sit-up.jpg'),

-- 1077
(NULL, 'Quick Feet V. 2', 'cardio', 'none', 'duration', '{calves,quads}', 'cardio', false, 'beginner', 2, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1077_Quick Feet V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1077_Quick Feet V. 2.jpg'),

-- 1078
(NULL, 'Raise Single Arm Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1078_Raise Single Arm Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1078_Raise Single Arm Push-up.jpg'),

-- 1079
(NULL, 'Rear Decline Bridge', 'glutes', 'other', 'bodyweight_reps', '{hamstrings,lower_back,abs}', 'hip_extension', true, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1079_Rear Decline Bridge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1079_Rear Decline Bridge.jpg'),

-- 1080
(NULL, 'Rear Deltoid Stretch', 'shoulders', 'none', 'duration', '{upper_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1080_Rear Deltoid Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1080_Rear Deltoid Stretch.jpg'),

-- 1081
(NULL, 'Rear Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1081_Rear Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1081_Rear Pull-up.jpg'),

-- 1082
(NULL, 'Reclining Big Toe Pose With Rope', 'hamstrings', 'other', 'duration', '{calves}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1082_Reclining Big Toe Pose With Rope.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1082_Reclining Big Toe Pose With Rope.jpg'),

-- 1083
(NULL, 'Resistance Band Hip Thrusts On Knees', 'glutes', 'resistance_band', 'weight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1083_Resistance Band Hip Thrusts On Knees.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1083_Resistance Band Hip Thrusts On Knees.jpg'),

-- 1084
(NULL, 'Resistance Band Leg Extension', 'quads', 'resistance_band', 'weight_reps', '{}', 'knee_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1084_Resistance Band Leg Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1084_Resistance Band Leg Extension.jpg'),

-- 1085
(NULL, 'Resistance Band Seated Biceps Curl', 'biceps', 'resistance_band', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1085_Resistance Band Seated Biceps Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1085_Resistance Band Seated Biceps Curl.jpg'),

-- 1086
(NULL, 'Resistance Band Seated Chest Press', 'chest', 'resistance_band', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1086_Resistance Band Seated Chest Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1086_Resistance Band Seated Chest Press.jpg'),

-- 1087
(NULL, 'Resistance Band Seated Hip Abduction', 'glutes', 'resistance_band', 'weight_reps', '{obliques}', 'hip_abduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1087_Resistance Band Seated Hip Abduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1087_Resistance Band Seated Hip Abduction.jpg'),

-- 1088
(NULL, 'Resistance Band Seated Shoulder Press', 'shoulders', 'resistance_band', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1088_Resistance Band Seated Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1088_Resistance Band Seated Shoulder Press.jpg'),

-- 1089
(NULL, 'Resistance Band Seated Straight Back Row', 'upper_back', 'resistance_band', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1089_Resistance Band Seated Straight Back Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1089_Resistance Band Seated Straight Back Row.jpg'),

-- 1090
(NULL, 'Reverse Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1090_Reverse Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1090_Reverse Crunch.jpg'),

-- 1091
(NULL, 'Reverse Dip', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1091_Reverse Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1091_Reverse Dip.jpg'),

-- 1092
(NULL, 'Reverse Grip Machine Lat Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1092_Reverse Grip Machine Lat Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1092_Reverse Grip Machine Lat Pulldown.jpg'),

-- 1093
(NULL, 'Reverse Grip Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1093_Reverse Grip Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1093_Reverse Grip Pull-up.jpg'),

-- 1094
(NULL, 'Reverse Hyper Extension (On Stability Ball)', 'glutes', 'other', 'bodyweight_reps', '{hamstrings,lower_back}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1094_Reverse Hyper Extension (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1094_Reverse Hyper Extension (On Stability Ball).jpg'),

-- 1095
(NULL, 'Reverse Hyper On Flat Bench', 'glutes', 'other', 'bodyweight_reps', '{hamstrings,lower_back}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1095_Reverse Hyper On Flat Bench.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1095_Reverse Hyper On Flat Bench.jpg'),

-- 1096
(NULL, 'Reverse Plank With Leg Lift', 'glutes', 'none', 'duration', '{hamstrings,shoulders,abs}', 'isometric_hold', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1096_Reverse Plank With Leg Lift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1096_Reverse Plank With Leg Lift.jpg'),

-- 1097
(NULL, 'Ring Dips', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1097_Ring Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1097_Ring Dips.jpg'),

-- 1098
(NULL, 'Rocking Frog Stretch', 'adductors', 'none', 'duration', '{glutes,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1098_Rocking Frog Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1098_Rocking Frog Stretch.jpg'),

-- 1099
(NULL, 'Rocky Pull-up Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1099_Rocky Pull-up Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1099_Rocky Pull-up Pulldown.jpg'),

-- 1100
(NULL, 'Roller Back Stretch', 'lower_back', 'other', 'duration', '{glutes,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1100_Roller Back Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1100_Roller Back Stretch.jpg'),

 -- 1101
(NULL, 'Roller Body Saw', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders}', 'plank', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1101_Roller Body Saw.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1101_Roller Body Saw.jpg'),

-- 1102
(NULL, 'Roller Hip Lat Stretch', 'back', 'other', 'duration', '{obliques,glutes}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1102_Roller Hip Lat Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1102_Roller Hip Lat Stretch.jpg'),

-- 1103
(NULL, 'Roller Hip Stretch', 'glutes', 'other', 'duration', '{hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1103_Roller Hip Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1103_Roller Hip Stretch.jpg'),

-- 1104
(NULL, 'Roller Reverse Crunch', 'abs', 'other', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1104_Roller Reverse Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1104_Roller Reverse Crunch.jpg'),

-- 1105
(NULL, 'Roller Seated Shoulder Flexor Depresor Retractor', 'shoulders', 'other', 'duration', '{upper_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1105_Roller Seated Shoulder Flexor Depresor Retractor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1105_Roller Seated Shoulder Flexor Depresor Retractor.jpg'),

-- 1106
(NULL, 'Roller Seated Single Leg Shoulder Flexor Depresor Retractor', 'shoulders', 'other', 'duration', '{upper_back,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1106_Roller Seated Single Leg Shoulder Flexor Depresor Retractor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1106_Roller Seated Single Leg Shoulder Flexor Depresor Retractor.jpg'),

-- 1107
(NULL, 'Roller Side Lat Stretch', 'back', 'other', 'duration', '{obliques,shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1107_Roller Side Lat Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1107_Roller Side Lat Stretch.jpg'),

-- 1108
(NULL, 'Rope Climb', 'back', 'other', 'bodyweight_reps', '{biceps,forearms,shoulders,abs}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1108_Rope Climb.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1108_Rope Climb.jpg'),

-- 1109
(NULL, 'Run', 'cardio', 'none', 'distance_duration', '{calves,quads,glutes}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1109_Run.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1109_Run.jpg'),

-- 1110
(NULL, 'Run (Equipment)', 'cardio', 'machine', 'distance_duration', '{calves,quads,glutes}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1110_Run (Equipment).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1110_Run (Equipment).jpg'),

-- 1111
(NULL, 'Runners Stretch', 'hamstrings', 'none', 'duration', '{calves,glutes}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1111_Runners Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1111_Runners Stretch.jpg'),

-- 1112
(NULL, 'Russian Twist', 'obliques', 'none', 'bodyweight_reps', '{abs}', 'rotation', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1112_Russian Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1112_Russian Twist.jpg'),

-- 1113
(NULL, 'Scapula Dips', 'shoulders', 'none', 'bodyweight_reps', '{traps,chest}', 'scapular_depression', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1113_Scapula Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1113_Scapula Dips.jpg'),

-- 1114
(NULL, 'Scapula Push-up', 'shoulders', 'none', 'bodyweight_reps', '{chest,abs}', 'scapular_protraction', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1114_Scapula Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1114_Scapula Push-up.jpg'),

-- 1115
(NULL, 'Scapular Pull-up', 'shoulders', 'none', 'bodyweight_reps', '{back,traps,forearms}', 'scapular_depression', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1115_Scapular Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1115_Scapular Pull-up.jpg'),

-- 1116
(NULL, 'Scissor Jumps', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1116_Scissor Jumps.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1116_Scissor Jumps.jpg'),

-- 1117
(NULL, 'Seated Calf Stretch', 'calves', 'none', 'duration', '{}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1117_Seated Calf Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1117_Seated Calf Stretch.jpg'),

-- 1118
(NULL, 'Seated Glute Stretch', 'glutes', 'none', 'duration', '{obliques}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1118_Seated Glute Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1118_Seated Glute Stretch.jpg'),

-- 1119
(NULL, 'Seated Leg Raise', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1119_Seated Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1119_Seated Leg Raise.jpg'),

-- 1120
(NULL, 'Seated Lower Back Stretch', 'lower_back', 'none', 'duration', '{glutes,hamstrings}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1120_Seated Lower Back Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1120_Seated Lower Back Stretch.jpg'),

-- 1121
(NULL, 'Seated Piriformis Stretch', 'glutes', 'none', 'duration', '{obliques}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1121_Seated Piriformis Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1121_Seated Piriformis Stretch.jpg'),

-- 1122
(NULL, 'Seated Side Crunch (Wall)', 'obliques', 'none', 'bodyweight_reps', '{abs}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1122_Seated Side Crunch (Wall).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1122_Seated Side Crunch (Wall).jpg'),

-- 1123
(NULL, 'Seated Wide Angle Pose Sequence', 'adductors', 'none', 'duration', '{hamstrings,glutes}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1123_Seated Wide Angle Pose Sequence.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1123_Seated Wide Angle Pose Sequence.jpg'),

-- 1124
(NULL, 'Self Assisted Inverse Leg Curl', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1124_Self Assisted Inverse Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1124_Self Assisted Inverse Leg Curl.jpg'),

-- 1125
(NULL, 'Self Assisted Inverse Leg Curl (Floor)', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1125_Self Assisted Inverse Leg Curl (Floor).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1125_Self Assisted Inverse Leg Curl (Floor).jpg'),

-- 1126
(NULL, 'Self Assisted Inverse Leg Curl (On Floor)', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1126_Self Assisted Inverse Leg Curl (On Floor).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1126_Self Assisted Inverse Leg Curl (On Floor).jpg'),

-- 1127
(NULL, 'Semi Squat Jump', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings}', 'jump', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1127_Semi Squat Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1127_Semi Squat Jump.jpg'),

-- 1128
(NULL, 'Short Stride Run', 'cardio', 'none', 'distance_duration', '{calves,quads,glutes}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1128_Short Stride Run.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1128_Short Stride Run.jpg'),

-- 1129
(NULL, 'Shoulder Grip Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1129_Shoulder Grip Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1129_Shoulder Grip Pull-up.jpg'),

-- 1130
(NULL, 'Shoulder Tap', 'abs', 'none', 'bodyweight_reps', '{obliques,shoulders}', 'plank', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1130_Shoulder Tap.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1130_Shoulder Tap.jpg'),

-- 1131
(NULL, 'Shoulder Tap Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1131_Shoulder Tap Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1131_Shoulder Tap Push-up.jpg'),

-- 1132
(NULL, 'Side Bridge Hip Abduction', 'glutes', 'none', 'bodyweight_reps', '{obliques,abs}', 'hip_abduction', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1132_Side Bridge Hip Abduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1132_Side Bridge Hip Abduction.jpg'),

-- 1133
(NULL, 'Side Bridge V. 2', 'obliques', 'none', 'duration', '{abs,shoulders}', 'isometric_hold', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1133_Side Bridge V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1133_Side Bridge V. 2.jpg'),

-- 1134
(NULL, 'Side Hip (On Parallel Bars)', 'obliques', 'other', 'bodyweight_reps', '{abs,shoulders}', 'hip_flexion', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1134_Side Hip (On Parallel Bars).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1134_Side Hip (On Parallel Bars).jpg'),

-- 1135
(NULL, 'Side Hip Abduction', 'glutes', 'none', 'bodyweight_reps', '{obliques}', 'hip_abduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1135_Side Hip Abduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1135_Side Hip Abduction.jpg'),

-- 1136
(NULL, 'Side Lying Floor Stretch', 'obliques', 'none', 'duration', '{back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1136_Side Lying Floor Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1136_Side Lying Floor Stretch.jpg'),

-- 1137
(NULL, 'Side Lying Hip Adduction', 'adductors', 'none', 'bodyweight_reps', '{glutes}', 'hip_adduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1137_Side Lying Hip Adduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1137_Side Lying Hip Adduction.jpg'),

-- 1138
(NULL, 'Side Plank Hip Adduction', 'adductors', 'none', 'bodyweight_reps', '{obliques,abs,shoulders}', 'hip_adduction', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1138_Side Plank Hip Adduction.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1138_Side Plank Hip Adduction.jpg'),

-- 1139
(NULL, 'Side Push Neck Stretch', 'neck', 'none', 'duration', '{}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1139_Side Push Neck Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1139_Side Push Neck Stretch.jpg'),

-- 1140
(NULL, 'Side Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,obliques}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1140_Side Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1140_Side Push-up.jpg'),

-- 1141
(NULL, 'Side Wrist Pull Stretch', 'forearms', 'none', 'duration', '{hands}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1141_Side Wrist Pull Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1141_Side Wrist Pull Stretch.jpg'),

-- 1142
(NULL, 'Side-to-side Chin', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1142_Side-to-side Chin.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1142_Side-to-side Chin.jpg'),

-- 1143
(NULL, 'Side-to-side Toe Touch', 'obliques', 'none', 'bodyweight_reps', '{abs,hamstrings}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1143_Side-to-side Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1143_Side-to-side Toe Touch.jpg'),

-- 1144
(NULL, 'Single Arm Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}', 'horizontal_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1144_Single Arm Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1144_Single Arm Push-up.jpg'),

-- 1145
(NULL, 'Single Leg Bridge With Outstretched Leg', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,abs}', 'hip_extension', true, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1145_Single Leg Bridge With Outstretched Leg.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1145_Single Leg Bridge With Outstretched Leg.jpg'),

-- 1146
(NULL, 'Single Leg Calf Raise (On A Dumbbell)', 'calves', 'dumbbell', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1146_Single Leg Calf Raise (On A Dumbbell).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1146_Single Leg Calf Raise (On A Dumbbell).jpg'),

-- 1147
(NULL, 'Single Leg Platform Slide', 'hamstrings', 'other', 'bodyweight_reps', '{glutes,abs}', 'knee_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1147_Single Leg Platform Slide.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1147_Single Leg Platform Slide.jpg'),

-- 1148
(NULL, 'Single Leg Pistol Squat', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves,abs}', 'squat', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1148_Single Leg Pistol Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1148_Single Leg Pistol Squat.jpg'),

-- 1149
(NULL, 'Sissy Squat', 'quads', 'none', 'bodyweight_reps', '{calves}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1149_Sissy Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1149_Sissy Squat.jpg'),

-- 1150
(NULL, 'Sit-up V. 2', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1150_Sit-up V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1150_Sit-up V. 2.jpg'),

-- 1151
(NULL, 'Sit-up With Arms On Chest', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1151_Sit-up With Arms On Chest.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1151_Sit-up With Arms On Chest.jpg'),

-- 1152
(NULL, 'Skater Hops', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,hamstrings,obliques}', 'jump', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1152_Skater Hops.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1152_Skater Hops.jpg'),

-- 1153
(NULL, 'Ski Ergometer', 'cardio', 'machine', 'distance_duration', '{back,shoulders,triceps,abs}', 'cardio', true, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1153_Ski Ergometer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1153_Ski Ergometer.jpg'),

-- 1154
(NULL, 'Ski Step', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1154_Ski Step.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1154_Ski Step.jpg'),

-- 1155
(NULL, 'Skin The Cat', 'shoulders', 'none', 'bodyweight_reps', '{back,biceps,forearms,abs}', 'rotation', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1155_Skin The Cat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1155_Skin The Cat.jpg'),

-- 1156
(NULL, 'Sled 45° One Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'leg_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1156_Sled 45° One Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1156_Sled 45° One Leg Press.jpg'),

-- 1157
(NULL, 'Sled 45° Calf Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1157_Sled 45° Calf Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1157_Sled 45° Calf Press.jpg'),

-- 1158
(NULL, 'Sled 45° Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'leg_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1158_Sled 45° Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1158_Sled 45° Leg Press.jpg'),

-- 1161
(NULL, 'Sled 45° Leg Wide Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors}', 'leg_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1161_Sled 45° Leg Wide Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1161_Sled 45° Leg Wide Press.jpg'),

-- 1162
(NULL, 'Sled Calf Press On Leg Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1162_Sled Calf Press On Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1162_Sled Calf Press On Leg Press.jpg'),

-- 1163
(NULL, 'Sled Closer Hack Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1163_Sled Closer Hack Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1163_Sled Closer Hack Squat.jpg'),

-- 1164
(NULL, 'Sled Forward Angled Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1164_Sled Forward Angled Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1164_Sled Forward Angled Calf Raise.jpg'),

-- 1165
(NULL, 'Sled Hack Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1165_Sled Hack Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1165_Sled Hack Squat.jpg'),

-- 1166
(NULL, 'Sled Lying Calf Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1166_Sled Lying Calf Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1166_Sled Lying Calf Press.jpg'),

-- 1167
(NULL, 'Sled Lying Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1167_Sled Lying Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1167_Sled Lying Squat.jpg'),

-- 1168
(NULL, 'Sled One Leg Calf Press On Leg Press', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1168_Sled One Leg Calf Press On Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1168_Sled One Leg Calf Press On Leg Press.jpg'),

-- 1169
(NULL, 'Sledge Hammer', 'full_body', 'other', 'duration_weight', '{shoulders,back,abs,obliques,forearms}', 'slam', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1169_Sledge Hammer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1169_Sledge Hammer.jpg'),

-- 1170
(NULL, 'Smith Back Shrug', 'traps', 'machine', 'weight_reps', '{}', 'shrug', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1170_Smith Back Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1170_Smith Back Shrug.jpg'),

 -- 1171
(NULL, 'Smith Behind Neck Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1171_Smith Behind Neck Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1171_Smith Behind Neck Press.jpg'),

-- 1172
(NULL, 'Smith Bench Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1172_Smith Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1172_Smith Bench Press.jpg'),

-- 1173
(NULL, 'Smith Bent Knee Good Morning', 'lower_back', 'machine', 'weight_reps', '{glutes,hamstrings,abs}', 'hip_hinge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1173_Smith Bent Knee Good Morning.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1173_Smith Bent Knee Good Morning.jpg'),

-- 1174
(NULL, 'Smith Bent Over Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1174_Smith Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1174_Smith Bent Over Row.jpg'),

-- 1175
(NULL, 'Smith Chair Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1175_Smith Chair Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1175_Smith Chair Squat.jpg'),

-- 1176
(NULL, 'Smith Close-grip Bench Press', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1176_Smith Close-grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1176_Smith Close-grip Bench Press.jpg'),

-- 1177
(NULL, 'Smith Deadlift', 'hamstrings', 'machine', 'weight_reps', '{glutes,lower_back,forearms}', 'hip_hinge', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1177_Smith Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1177_Smith Deadlift.jpg'),

-- 1178
(NULL, 'Smith Decline Bench Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1178_Smith Decline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1178_Smith Decline Bench Press.jpg'),

-- 1179
(NULL, 'Smith Decline Reverse-grip Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1179_Smith Decline Reverse-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1179_Smith Decline Reverse-grip Press.jpg'),

-- 1180
(NULL, 'Smith Front Squat (Clean Grip)', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,abs,lower_back}', 'squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1180_Smith Front Squat (Clean Grip).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1180_Smith Front Squat (Clean Grip).jpg'),

-- 1181
(NULL, 'Smith Full Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,abs,lower_back}', 'squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1181_Smith Full Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1181_Smith Full Squat.jpg'),

-- 1182
(NULL, 'Smith Hack Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1182_Smith Hack Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1182_Smith Hack Squat.jpg'),

-- 1183
(NULL, 'Smith Hip Raise', 'glutes', 'machine', 'weight_reps', '{hamstrings,abs}', 'hip_extension', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1183_Smith Hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1183_Smith Hip Raise.jpg'),

-- 1184
(NULL, 'Smith Incline Bench Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1184_Smith Incline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1184_Smith Incline Bench Press.jpg'),

-- 1185
(NULL, 'Smith Incline Reverse-grip Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1185_Smith Incline Reverse-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1185_Smith Incline Reverse-grip Press.jpg'),

-- 1186
(NULL, 'Smith Incline Shoulder Raises', 'shoulders', 'machine', 'weight_reps', '{traps}', 'front_raise', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1186_Smith Incline Shoulder Raises.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1186_Smith Incline Shoulder Raises.jpg'),

-- 1187
(NULL, 'Smith Leg Press', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings}', 'leg_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1187_Smith Leg Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1187_Smith Leg Press.jpg'),

-- 1188
(NULL, 'Smith Low Bar Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,lower_back,abs}', 'squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1188_Smith Low Bar Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1188_Smith Low Bar Squat.jpg'),

-- 1189
(NULL, 'Smith Machine Bicep Curl', 'biceps', 'machine', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1189_Smith Machine Bicep Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1189_Smith Machine Bicep Curl.jpg'),

-- 1190
(NULL, 'Smith Machine Decline Close Grip Bench Press', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1190_Smith Machine Decline Close Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1190_Smith Machine Decline Close Grip Bench Press.jpg'),

-- 1191
(NULL, 'Smith Machine Incline Tricep Extension', 'triceps', 'machine', 'weight_reps', '{shoulders,forearms}', 'elbow_extension', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1191_Smith Machine Incline Tricep Extension.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1191_Smith Machine Incline Tricep Extension.jpg'),

-- 1192
(NULL, 'Smith Machine Reverse Decline Close Grip Bench Press', 'triceps', 'machine', 'weight_reps', '{chest,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1192_Smith Machine Reverse Decline Close Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1192_Smith Machine Reverse Decline Close Grip Bench Press.jpg'),

-- 1193
(NULL, 'Smith Narrow Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1193_Smith Narrow Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1193_Smith Narrow Row.jpg'),

-- 1194
(NULL, 'Smith One Arm Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1194_Smith One Arm Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1194_Smith One Arm Row.jpg'),

-- 1195
(NULL, 'Smith One Leg Floor Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1195_Smith One Leg Floor Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1195_Smith One Leg Floor Calf Raise.jpg'),

-- 1196
(NULL, 'Smith Rear Delt Row', 'upper_back', 'machine', 'weight_reps', '{shoulders,traps,biceps,forearms}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1196_Smith Rear Delt Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1196_Smith Rear Delt Row.jpg'),

-- 1197
(NULL, 'Elevated Smith Reverse Calf Raises', 'tibialis', 'machine', 'weight_reps', '{}', 'dorsiflexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1197_Elevated Smith Reverse Calf Raises.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1197_Elevated Smith Reverse Calf Raises.jpg'),

-- 1198
(NULL, 'Smith Reverse Calf Raises', 'calves', 'machine', 'weight_reps', '{}', 'dorsiflexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1198_Smith Reverse Calf Raises.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1198_Smith Reverse Calf Raises.jpg'),

-- 1199
(NULL, 'Smith Reverse Grip Bent Over Row', 'upper_back', 'machine', 'weight_reps', '{back,biceps,forearms,lower_back}', 'horizontal_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1199_Smith Reverse Grip Bent Over Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1199_Smith Reverse Grip Bent Over Row.jpg'),

-- 1200
(NULL, 'Smith Reverse-grip Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1200_Smith Reverse-grip Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1200_Smith Reverse-grip Press.jpg'),

-- 1201
(NULL, 'Smith Seated One Leg Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1201_Smith Seated One Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1201_Smith Seated One Leg Calf Raise.jpg'),

-- 1202
(NULL, 'Smith Seated Shoulder Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1202_Smith Seated Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1202_Smith Seated Shoulder Press.jpg'),

-- 1203
(NULL, 'Smith Seated Wrist Curl', 'forearms', 'machine', 'weight_reps', '{}', 'wrist_flexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1203_Smith Seated Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1203_Smith Seated Wrist Curl.jpg'),

-- 1204
(NULL, 'Smith Shoulder Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1204_Smith Shoulder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1204_Smith Shoulder Press.jpg'),

-- 1205
(NULL, 'Smith Shrug', 'traps', 'machine', 'weight_reps', '{}', 'shrug', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1205_Smith Shrug.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1205_Smith Shrug.jpg'),

-- 1206
(NULL, 'Smith Single Leg Split Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,calves}', 'split_squat', true, 'intermediate', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1206_Smith Single Leg Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1206_Smith Single Leg Split Squat.jpg'),

-- 1207
(NULL, 'Smith Sprint Lunge', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,calves}', 'lunge', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1207_Smith Sprint Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1207_Smith Sprint Lunge.jpg'),

-- 1208
(NULL, 'Smith Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,lower_back,abs}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1208_Smith Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1208_Smith Squat.jpg'),

-- 1209
(NULL, 'Smith Standing Back Wrist Curl', 'forearms', 'machine', 'weight_reps', '{}', 'wrist_extension', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1209_Smith Standing Back Wrist Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1209_Smith Standing Back Wrist Curl.jpg'),

-- 1210
(NULL, 'Smith Standing Behind Head Military Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1210_Smith Standing Behind Head Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1210_Smith Standing Behind Head Military Press.jpg'),

-- 1211
(NULL, 'Smith Standing Leg Calf Raise', 'calves', 'machine', 'weight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1211_Smith Standing Leg Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1211_Smith Standing Leg Calf Raise.jpg'),

-- 1212
(NULL, 'Smith Standing Military Press', 'shoulders', 'machine', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1212_Smith Standing Military Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1212_Smith Standing Military Press.jpg'),

-- 1213
(NULL, 'Smith Sumo Squat', 'quads', 'machine', 'weight_reps', '{glutes,hamstrings,adductors}', 'squat', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1213_Smith Sumo Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1213_Smith Sumo Squat.jpg'),

-- 1214
(NULL, 'Smith Toe Raise', 'tibialis', 'machine', 'weight_reps', '{}', 'dorsiflexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1214_Smith Toe Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1214_Smith Toe Raise.jpg'),

-- 1215
(NULL, 'Smith Upright Row', 'shoulders', 'machine', 'weight_reps', '{traps,upper_back}', 'upright_row', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1215_Smith Upright Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1215_Smith Upright Row.jpg'),

-- 1216
(NULL, 'Smith Wide Grip Bench Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1216_Smith Wide Grip Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1216_Smith Wide Grip Bench Press.jpg'),

-- 1217
(NULL, 'Smith Wide Grip Decline Bench Press', 'chest', 'machine', 'weight_reps', '{triceps,shoulders}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1217_Smith Wide Grip Decline Bench Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1217_Smith Wide Grip Decline Bench Press.jpg'),

-- 1218
(NULL, 'Snatch Pull', 'full_body', 'barbell', 'weight_reps', '{traps,glutes,hamstrings,quads,forearms,lower_back}', 'hinge_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1218_Snatch Pull.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1218_Snatch Pull.jpg'),

-- 1219
(NULL, 'Spell Caster', 'shoulders', 'dumbbell', 'weight_reps', '{traps,obliques}', 'front_raise', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1219_Spell Caster.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1219_Spell Caster.jpg'),

-- 1220
(NULL, 'Sphinx', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1220_Sphinx.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1220_Sphinx.jpg'),

-- 1221
(NULL, 'Spider Crawl Push Up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs,obliques}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1221_Spider Crawl Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1221_Spider Crawl Push Up.jpg'),

-- 1222
(NULL, 'Spine Stretch', 'lower_back', 'none', 'duration', '{hamstrings,glutes}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1222_Spine Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1222_Spine Stretch.jpg'),

-- 1223
(NULL, 'Spine Twist', 'obliques', 'none', 'duration', '{lower_back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1223_Spine Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1223_Spine Twist.jpg'),

-- 1224
(NULL, 'Split Squats', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves}', 'split_squat', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1224_Split Squats.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1224_Split Squats.jpg'),

-- 1225
(NULL, 'Squat Jerk', 'full_body', 'barbell', 'weight_reps', '{quads,glutes,shoulders,triceps,calves,abs}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1225_Squat Jerk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1225_Squat Jerk.jpg'),

-- 1226
(NULL, 'Squat On Bosu Ball', 'quads', 'other', 'bodyweight_reps', '{glutes,hamstrings,abs}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1226_Squat On Bosu Ball.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1226_Squat On Bosu Ball.jpg'),

-- 1227
(NULL, 'Squat To Overhead Reach', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,shoulders,abs}', 'squat', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1227_Squat To Overhead Reach.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1227_Squat To Overhead Reach.jpg'),

-- 1228
(NULL, 'Squat To Overhead Reach With Twist', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,shoulders,abs,obliques}', 'squat', true, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1228_Squat To Overhead Reach With Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1228_Squat To Overhead Reach With Twist.jpg'),

-- 1229
(NULL, 'Stability Ball Crunch (Full Range Hands Behind Head)', 'abs', 'other', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1229_Stability Ball Crunch (Full Range Hands Behind Head).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1229_Stability Ball Crunch (Full Range Hands Behind Head).jpg'),

-- 1230
(NULL, 'Stalder Press', 'shoulders', 'none', 'bodyweight_reps', '{triceps,abs}', 'vertical_press', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1230_Stalder Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1230_Stalder Press.jpg'),

-- 1231
(NULL, 'Standing Archer', 'chest', 'none', 'bodyweight_reps', '{shoulders,triceps,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1231_Standing Archer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1231_Standing Archer.jpg'),

-- 1232
(NULL, 'Standing Behind Neck Press', 'shoulders', 'barbell', 'weight_reps', '{triceps,traps,abs}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1232_Standing Behind Neck Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1232_Standing Behind Neck Press.jpg'),

-- 1233
(NULL, 'Standing Calf Raise (On A Staircase)', 'calves', 'none', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1233_Standing Calf Raise (On A Staircase).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1233_Standing Calf Raise (On A Staircase).jpg'),

-- 1234
(NULL, 'Standing Calves', 'calves', 'none', 'bodyweight_reps', '{}', 'plantar_flexion', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1234_Standing Calves.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1234_Standing Calves.jpg'),

-- 1235
(NULL, 'Standing Calves Calf Stretch', 'calves', 'none', 'duration', '{}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1235_Standing Calves Calf Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1235_Standing Calves Calf Stretch.jpg'),

-- 1236
(NULL, 'Standing Hamstring And Calf Stretch With Strap', 'hamstrings', 'other', 'duration', '{calves}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1236_Standing Hamstring And Calf Stretch With Strap.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1236_Standing Hamstring And Calf Stretch With Strap.jpg'),

-- 1237
(NULL, 'Standing Lateral Stretch', 'obliques', 'none', 'duration', '{back}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1237_Standing Lateral Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1237_Standing Lateral Stretch.jpg'),

-- 1238
(NULL, 'Standing Pelvic Tilt', 'abs', 'none', 'bodyweight_reps', '{glutes}', 'posterior_tilt', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1238_Standing Pelvic Tilt.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1238_Standing Pelvic Tilt.jpg'),

-- 1239
(NULL, 'Standing Single Leg Curl', 'hamstrings', 'none', 'bodyweight_reps', '{glutes,calves}', 'knee_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1239_Standing Single Leg Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1239_Standing Single Leg Curl.jpg'),

-- 1240
(NULL, 'Standing Wheel Rollerout', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders,back}', 'rollout', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1240_Standing Wheel Rollerout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1240_Standing Wheel Rollerout.jpg'),

 -- 1241
(NULL, 'Star Jump', 'quads', 'none', 'bodyweight_reps', '{glutes,calves,shoulders}', 'jump', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1241_Star Jump.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1241_Star Jump.jpg'),

-- 1242
(NULL, 'Stationary Bike Run V. 3', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 2, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1242_Stationary Bike Run V. 3.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1242_Stationary Bike Run V. 3.jpg'),

-- 1243
(NULL, 'Stationary Bike Walk', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 1, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1243_Stationary Bike Walk.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1243_Stationary Bike Walk.jpg'),

-- 1244
(NULL, 'Straddle Maltese', 'chest', 'none', 'duration', '{shoulders,triceps,abs}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1244_Straddle Maltese.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1244_Straddle Maltese.jpg'),

-- 1245
(NULL, 'Straddle Planche', 'shoulders', 'none', 'duration', '{chest,triceps,abs}', 'isometric_hold', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1245_Straddle Planche.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1245_Straddle Planche.jpg'),

-- 1246
(NULL, 'Straight Leg Outer Hip Abductor', 'glutes', 'none', 'bodyweight_reps', '{obliques}', 'hip_abduction', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1246_Straight Leg Outer Hip Abductor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1246_Straight Leg Outer Hip Abductor.jpg'),

-- 1247
(NULL, 'Superman Push-up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1247_Superman Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1247_Superman Push-up.jpg'),

-- 1248
(NULL, 'Suspended Abdominal Fallout', 'abs', 'suspension_band', 'bodyweight_reps', '{obliques,shoulders,back}', 'rollout', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1248_Suspended Abdominal Fallout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1248_Suspended Abdominal Fallout.jpg'),

-- 1249
(NULL, 'Suspended Push-up', 'chest', 'suspension_band', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1249_Suspended Push-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1249_Suspended Push-up.jpg'),

-- 1250
(NULL, 'Suspended Reverse Crunch', 'abs', 'suspension_band', 'bodyweight_reps', '{obliques}', 'hip_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1250_Suspended Reverse Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1250_Suspended Reverse Crunch.jpg'),

-- 1251
(NULL, 'Suspended Row', 'upper_back', 'suspension_band', 'bodyweight_reps', '{back,biceps,forearms,abs}', 'horizontal_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1251_Suspended Row.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1251_Suspended Row.jpg'),

-- 1252
(NULL, 'Suspended Split Squat', 'quads', 'suspension_band', 'bodyweight_reps', '{glutes,hamstrings,calves,abs}', 'split_squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1252_Suspended Split Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1252_Suspended Split Squat.jpg'),

-- 1253
(NULL, 'Swimmer Kicks V. 2', 'glutes', 'none', 'bodyweight_reps', '{hamstrings,lower_back}', 'hip_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1253_Swimmer Kicks V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1253_Swimmer Kicks V. 2.jpg'),

-- 1254
(NULL, 'Swing 360', 'full_body', 'kettlebell', 'weight_reps', '{glutes,hamstrings,shoulders,abs,obliques,forearms}', 'rotation', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1254_Swing 360.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1254_Swing 360.jpg'),

-- 1255
(NULL, 'Three Bench Dip', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1255_Three Bench Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1255_Three Bench Dip.jpg'),

-- 1256
(NULL, 'Tire Flip', 'full_body', 'other', 'weight_reps', '{quads,glutes,hamstrings,back,shoulders,forearms}', 'hinge_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1256_Tire Flip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1256_Tire Flip.jpg'),

-- 1257
(NULL, 'Trap Bar Deadlift', 'hamstrings', 'barbell', 'weight_reps', '{glutes,quads,lower_back,forearms}', 'hip_hinge', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1257_Trap Bar Deadlift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1257_Trap Bar Deadlift.jpg'),

-- 1258
(NULL, 'Triceps Dip', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1258_Triceps Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1258_Triceps Dip.jpg'),

-- 1259
(NULL, 'Triceps Dip (Bench Leg)', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1259_Triceps Dip (Bench Leg).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1259_Triceps Dip (Bench Leg).jpg'),

-- 1260
(NULL, 'Triceps Dip (Between Benches)', 'triceps', 'other', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1260_Triceps Dip (Between Benches).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1260_Triceps Dip (Between Benches).jpg'),

-- 1261
(NULL, 'Triceps Dips Floor', 'triceps', 'none', 'bodyweight_reps', '{chest,shoulders}', 'vertical_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1261_Triceps Dips Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1261_Triceps Dips Floor.jpg'),

-- 1262
(NULL, 'Triceps Press', 'triceps', 'machine', 'weight_reps', '{shoulders,forearms}', 'elbow_extension', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1262_Triceps Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1262_Triceps Press.jpg'),

-- 1263
(NULL, 'Triceps Stretch', 'triceps', 'none', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1263_Triceps Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1263_Triceps Stretch.jpg'),

-- 1264
(NULL, 'Tuck Crunch', 'abs', 'none', 'bodyweight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1264_Tuck Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1264_Tuck Crunch.jpg'),

-- 1265
(NULL, 'Twin Handle Parallel Grip Lat Pulldown', 'back', 'machine', 'weight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'beginner', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1265_Twin Handle Parallel Grip Lat Pulldown.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1265_Twin Handle Parallel Grip Lat Pulldown.jpg'),

-- 1266
(NULL, 'Twist Hip Lift', 'obliques', 'none', 'bodyweight_reps', '{abs,glutes}', 'rotation', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1266_Twist Hip Lift.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1266_Twist Hip Lift.jpg'),

-- 1267
(NULL, 'Twisted Leg Raise', 'obliques', 'none', 'bodyweight_reps', '{abs}', 'rotation', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1267_Twisted Leg Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1267_Twisted Leg Raise.jpg'),

-- 1269
(NULL, 'Two Toe Touch', 'abs', 'none', 'bodyweight_reps', '{obliques,hamstrings}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1269_Two Toe Touch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1269_Two Toe Touch.jpg'),

-- 1270
(NULL, 'Upper Back Stretch', 'upper_back', 'none', 'duration', '{shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1270_Upper Back Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1270_Upper Back Stretch.jpg'),

-- 1271
(NULL, 'Upward Facing Dog', 'lower_back', 'none', 'duration', '{abs,chest,shoulders}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1271_Upward Facing Dog.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1271_Upward Facing Dog.jpg'),

-- 1272
(NULL, 'V-sit On Floor', 'abs', 'none', 'duration', '{obliques}', 'isometric_hold', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1272_V-sit On Floor.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1272_V-sit On Floor.jpg'),

-- 1273
(NULL, 'Vertical Leg Raise (On Parallel Bars)', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders}', 'hip_flexion', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1273_Vertical Leg Raise (On Parallel Bars).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1273_Vertical Leg Raise (On Parallel Bars).jpg'),

-- 1274
(NULL, 'Walk Elliptical Cross Trainer', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 2, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1274_Walk Elliptical Cross Trainer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1274_Walk Elliptical Cross Trainer.jpg'),

-- 1275
(NULL, 'Walking High Knees Lunge', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves,abs}', 'lunge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1275_Walking High Knees Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1275_Walking High Knees Lunge.jpg'),

-- 1276
(NULL, 'Walking Lunge', 'quads', 'none', 'bodyweight_reps', '{glutes,hamstrings,calves}', 'lunge', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1276_Walking Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1276_Walking Lunge.jpg'),

-- 1277
(NULL, 'Walking On Incline Treadmill', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 2, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1277_Walking On Incline Treadmill.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1277_Walking On Incline Treadmill.jpg'),

-- 1278
(NULL, 'Walking On Stepmill', 'cardio', 'machine', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'beginner', 3, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1278_Walking On Stepmill.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1278_Walking On Stepmill.jpg'),

-- 1279
(NULL, 'Weighted Bench Dip', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1279_Weighted Bench Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1279_Weighted Bench Dip.jpg'),

-- 1280
(NULL, 'Weighted Close Grip Chin-up On Dip Cage', 'back', 'other', 'weighted_bodyweight', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1280_Weighted Close Grip Chin-up On Dip Cage.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1280_Weighted Close Grip Chin-up On Dip Cage.jpg'),

-- 1281
(NULL, 'Weighted Cossack Squats', 'quads', 'plate', 'weight_reps', '{glutes,hamstrings,adductors}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1281_Weighted Cossack Squats.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1281_Weighted Cossack Squats.jpg'),

-- 1282
(NULL, 'Weighted Crunch', 'abs', 'plate', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1282_Weighted Crunch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1282_Weighted Crunch.jpg'),

-- 1283
(NULL, 'Weighted Decline Sit-up', 'abs', 'plate', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1283_Weighted Decline Sit-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1283_Weighted Decline Sit-up.jpg'),

-- 1284
(NULL, 'Weighted Donkey Calf Raise', 'calves', 'plate', 'weight_reps', '{}', 'plantar_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1284_Weighted Donkey Calf Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1284_Weighted Donkey Calf Raise.jpg'),

-- 1285
(NULL, 'Weighted Drop Push Up', 'chest', 'plate', 'weighted_bodyweight', '{triceps,shoulders,abs}', 'horizontal_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1285_Weighted Drop Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1285_Weighted Drop Push Up.jpg'),

-- 1286
(NULL, 'Weighted Front Plank', 'abs', 'plate', 'duration_weight', '{obliques,shoulders}', 'plank', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1286_Weighted Front Plank.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1286_Weighted Front Plank.jpg'),

-- 1287
(NULL, 'Weighted Front Raise', 'shoulders', 'plate', 'weight_reps', '{traps}', 'front_raise', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1287_Weighted Front Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1287_Weighted Front Raise.jpg'),

-- 1288
(NULL, 'Weighted Hanging Leg-hip Raise', 'abs', 'plate', 'weighted_bodyweight', '{obliques,forearms}', 'hip_flexion', false, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1288_Weighted Hanging Leg-hip Raise.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1288_Weighted Hanging Leg-hip Raise.jpg'),

-- 1289
(NULL, 'Weighted Hyperextension (On Stability Ball)', 'lower_back', 'plate', 'weight_reps', '{glutes,hamstrings}', 'spinal_extension', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1289_Weighted Hyperextension (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1289_Weighted Hyperextension (On Stability Ball).jpg'),

-- 1290
(NULL, 'Weighted Kneeling Step With Swing', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,shoulders,abs}', 'step_up', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1290_Weighted Kneeling Step With Swing.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1290_Weighted Kneeling Step With Swing.jpg'),

-- 1291
(NULL, 'Weighted Lunge With Swing', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,shoulders,abs}', 'lunge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1291_Weighted Lunge With Swing.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1291_Weighted Lunge With Swing.jpg'),

-- 1292
(NULL, 'Weighted Muscle Up', 'back', 'other', 'weighted_bodyweight', '{chest,shoulders,triceps,biceps,forearms}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1292_Weighted Muscle Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1292_Weighted Muscle Up.jpg'),

-- 1293
(NULL, 'Weighted Muscle Up (On Bar)', 'back', 'other', 'weighted_bodyweight', '{chest,shoulders,triceps,biceps,forearms}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1293_Weighted Muscle Up (On Bar).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1293_Weighted Muscle Up (On Bar).jpg'),

-- 1294
(NULL, 'Weighted One Hand Pull Up', 'back', 'other', 'weighted_bodyweight', '{biceps,forearms,upper_back,abs}', 'vertical_pull', true, 'advanced', 5, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1294_Weighted One Hand Pull Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1294_Weighted One Hand Pull Up.jpg'),

-- 1295
(NULL, 'Weighted Overhead Crunch (On Stability Ball)', 'abs', 'plate', 'weight_reps', '{obliques}', 'trunk_flexion', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1295_Weighted Overhead Crunch (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1295_Weighted Overhead Crunch (On Stability Ball).jpg'),

-- 1296
(NULL, 'Weighted Pull-up', 'back', 'other', 'weighted_bodyweight', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1296_Weighted Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1296_Weighted Pull-up.jpg'),

-- 1297
(NULL, 'Weighted Round Arm', 'shoulders', 'dumbbell', 'weight_reps', '{traps,obliques}', 'shoulder_circle', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1297_Weighted Round Arm.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1297_Weighted Round Arm.jpg'),

-- 1298
(NULL, 'Weighted Russian Twist', 'obliques', 'plate', 'weight_reps', '{abs}', 'rotation', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1298_Weighted Russian Twist.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1298_Weighted Russian Twist.jpg'),

-- 1299
(NULL, 'Weighted Russian Twist (Legs Up)', 'obliques', 'plate', 'weight_reps', '{abs}', 'rotation', false, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1299_Weighted Russian Twist (Legs Up).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1299_Weighted Russian Twist (Legs Up).jpg'),

-- 1300
(NULL, 'Weighted Russian Twist V. 2', 'obliques', 'plate', 'weight_reps', '{abs}', 'rotation', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1300_Weighted Russian Twist V. 2.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1300_Weighted Russian Twist V. 2.jpg'),

-- 1301
(NULL, 'Weighted Seated Bicep Curl (On Stability Ball)', 'biceps', 'dumbbell', 'weight_reps', '{forearms,abs}', 'elbow_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1301_Weighted Seated Bicep Curl (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1301_Weighted Seated Bicep Curl (On Stability Ball).jpg'),

-- 1302
(NULL, 'Weighted Seated Twist (On Stability Ball)', 'obliques', 'plate', 'weight_reps', '{abs}', 'rotation', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1302_Weighted Seated Twist (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1302_Weighted Seated Twist (On Stability Ball).jpg'),

-- 1303
(NULL, 'Weighted Side Bend (On Stability Ball)', 'obliques', 'dumbbell', 'weight_reps', '{abs,lower_back}', 'lateral_flexion', false, 'intermediate', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1303_Weighted Side Bend (On Stability Ball).gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1303_Weighted Side Bend (On Stability Ball).jpg'),

-- 1304
(NULL, 'Weighted Sissy Squat', 'quads', 'plate', 'weight_reps', '{calves}', 'squat', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1304_Weighted Sissy Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1304_Weighted Sissy Squat.jpg'),

-- 1305
(NULL, 'Weighted Squat', 'quads', 'barbell', 'weight_reps', '{glutes,hamstrings,lower_back,abs}', 'squat', true, 'beginner', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1305_Weighted Squat.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1305_Weighted Squat.jpg'),

-- 1306
(NULL, 'Weighted Standing Curl', 'biceps', 'barbell', 'weight_reps', '{forearms}', 'elbow_flexion', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1306_Weighted Standing Curl.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1306_Weighted Standing Curl.jpg'),

-- 1307
(NULL, 'Weighted Standing Hand Squeeze', 'hands', 'other', 'weight_reps', '{forearms}', 'grip', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1307_Weighted Standing Hand Squeeze.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1307_Weighted Standing Hand Squeeze.jpg'),

-- 1308
(NULL, 'Weighted Straight Bar Dip', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1308_Weighted Straight Bar Dip.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1308_Weighted Straight Bar Dip.jpg'),

-- 1309
(NULL, 'Weighted Stretch Lunge', 'quads', 'dumbbell', 'weight_reps', '{glutes,hamstrings,calves}', 'lunge', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1309_Weighted Stretch Lunge.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1309_Weighted Stretch Lunge.jpg'),

-- 1310
(NULL, 'Weighted Svend Press', 'chest', 'plate', 'weight_reps', '{shoulders,triceps}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1310_Weighted Svend Press.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1310_Weighted Svend Press.jpg'),

-- 1311
(NULL, 'Weighted Three Bench Dips', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders,abs}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1311_Weighted Three Bench Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1311_Weighted Three Bench Dips.jpg'),

-- 1312
(NULL, 'Weighted Tricep Dips', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders}', 'vertical_press', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1312_Weighted Tricep Dips.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1312_Weighted Tricep Dips.jpg'),

-- 1313
(NULL, 'Weighted Triceps Dip On High Parallel Bars', 'triceps', 'other', 'weighted_bodyweight', '{chest,shoulders}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1313_Weighted Triceps Dip On High Parallel Bars.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1313_Weighted Triceps Dip On High Parallel Bars.jpg'),

-- 1314
(NULL, 'Wheel Rollout', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders,back}', 'rollout', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1314_Wheel Rollout.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1314_Wheel Rollout.jpg'),

-- 1315
(NULL, 'Wheel Run', 'abs', 'other', 'bodyweight_reps', '{obliques,shoulders,back}', 'rollout', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1315_Wheel Run.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1315_Wheel Run.jpg'),

-- 1316
(NULL, 'Wide Grip Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'intermediate', 3, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1316_Wide Grip Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1316_Wide Grip Pull-up.jpg'),

-- 1317
(NULL, 'Wide Grip Rear Pull-up', 'back', 'none', 'bodyweight_reps', '{biceps,forearms,upper_back}', 'vertical_pull', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1317_Wide Grip Rear Pull-up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1317_Wide Grip Rear Pull-up.jpg'),

-- 1318
(NULL, 'Wide Hand Push Up', 'chest', 'none', 'bodyweight_reps', '{triceps,shoulders,abs}', 'horizontal_press', true, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1318_Wide Hand Push Up.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1318_Wide Hand Push Up.jpg'),

-- 1319
(NULL, 'Wide-grip Chest Dip On High Parallel Bars', 'chest', 'other', 'bodyweight_reps', '{triceps,shoulders}', 'vertical_press', true, 'advanced', 4, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1319_Wide-grip Chest Dip On High Parallel Bars.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1319_Wide-grip Chest Dip On High Parallel Bars.jpg'),

-- 1320
(NULL, 'Wind Sprints', 'cardio', 'none', 'distance_duration', '{quads,glutes,calves}', 'cardio', false, 'advanced', 4, true, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1320_Wind Sprints.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1320_Wind Sprints.jpg'),

-- 1321
(NULL, 'World Greatest Stretch', 'glutes', 'none', 'duration', '{hamstrings,adductors,back,obliques}', 'stretch', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1321_World Greatest Stretch.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1321_World Greatest Stretch.jpg'),

-- 1322
(NULL, 'Wrist Circles', 'forearms', 'none', 'duration', '{hands}', 'wrist_rotation', false, 'beginner', 1, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1322_Wrist Circles.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1322_Wrist Circles.jpg'),

-- 1323
(NULL, 'Wrist Rollerer', 'forearms', 'other', 'weight_reps', '{hands}', 'grip', false, 'beginner', 2, false, 'gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/gifs/1323_Wrist Rollerer.gif',
 'https://pub-3b2201f25a494cd09f26c6e72bae43c9.r2.dev/jpgs/1323_Wrist Rollerer.jpg');

-- Curated AI routine pool (~top 200): broadly useful, common staples, and balanced variety.
UPDATE exercises
SET is_ai_routine_candidate = false
WHERE user_id IS NULL;

UPDATE exercises
SET is_ai_routine_candidate = true
WHERE user_id IS NULL
  AND split_part(split_part(media_url, '/gifs/', 2), '_', 1)::int IN (
    35,37,60,81,83,84,98,101,105,106,107,108,124,125,130,133,146,149,160,161,167,171,172,178,182,185,188,189,193,216,225,227,
    230,233,242,247,248,254,272,273,281,295,296,304,308,311,329,340,342,346,349,350,358,359,360,366,368,369,376,380,381,383,
    384,385,386,388,390,393,407,412,418,420,421,432,442,446,452,453,455,468,473,475,476,477,478,483,495,496,501,505,508,512,
    519,543,555,556,573,582,584,608,614,640,644,654,667,668,687,693,695,700,709,720,730,732,733,734,738,748,752,755,793,796,
    805,814,815,818,840,855,864,872,876,886,887,888,889,890,896,902,904,905,906,909,910,914,936,941,946,949,955,956,957,963,
    975,978,980,982,983,984,987,988,995,999,1000,1001,1008,1026,1028,1030,1045,1074,1083,1090,1091,1109,1122,1128,1137,1138,
    1153,1158,1162,1163,1165,1172,1173,1175,1176,1177,1180,1184,1196,1197,1215,1233,1239,1257,1258,1261,1264,1274
  );
