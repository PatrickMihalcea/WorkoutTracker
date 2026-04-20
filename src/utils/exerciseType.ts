export interface FieldConfig {
  key: 'weight' | 'reps' | 'duration' | 'distance';
  label: string;
  targetKey: string;
  keyboardType: 'decimal-pad' | 'number-pad';
}

export interface ExerciseTypeConfig {
  fields: FieldConfig[];
  showRir: boolean;
  negateWeight: boolean;
  label: string;
}

const CONFIGS: Record<string, ExerciseTypeConfig> = {
  weight_reps: {
    label: 'Weight & Reps',
    fields: [
      { key: 'weight', label: 'LBS', targetKey: 'target_weight', keyboardType: 'decimal-pad' },
      { key: 'reps', label: 'REPS', targetKey: 'target_reps_min', keyboardType: 'number-pad' },
    ],
    showRir: true,
    negateWeight: false,
  },
  bodyweight_reps: {
    label: 'Bodyweight Reps',
    fields: [
      { key: 'reps', label: 'REPS', targetKey: 'target_reps_min', keyboardType: 'number-pad' },
    ],
    showRir: true,
    negateWeight: false,
  },
  weighted_bodyweight: {
    label: 'Weighted Bodyweight',
    fields: [
      { key: 'weight', label: 'LBS', targetKey: 'target_weight', keyboardType: 'decimal-pad' },
      { key: 'reps', label: 'REPS', targetKey: 'target_reps_min', keyboardType: 'number-pad' },
    ],
    showRir: true,
    negateWeight: false,
  },
  assisted_bodyweight: {
    label: 'Assisted Bodyweight',
    fields: [
      { key: 'weight', label: '-LBS', targetKey: 'target_weight', keyboardType: 'decimal-pad' },
      { key: 'reps', label: 'REPS', targetKey: 'target_reps_min', keyboardType: 'number-pad' },
    ],
    showRir: true,
    negateWeight: true,
  },
  duration: {
    label: 'Duration',
    fields: [
      { key: 'duration', label: 'TIME', targetKey: 'target_duration', keyboardType: 'number-pad' },
    ],
    showRir: false,
    negateWeight: false,
  },
  duration_weight: {
    label: 'Duration & Weight',
    fields: [
      { key: 'weight', label: 'LBS', targetKey: 'target_weight', keyboardType: 'decimal-pad' },
      { key: 'duration', label: 'TIME', targetKey: 'target_duration', keyboardType: 'number-pad' },
    ],
    showRir: false,
    negateWeight: false,
  },
  distance_duration: {
    label: 'Distance & Duration',
    fields: [
      { key: 'distance', label: 'KM', targetKey: 'target_distance', keyboardType: 'decimal-pad' },
      { key: 'duration', label: 'TIME', targetKey: 'target_duration', keyboardType: 'number-pad' },
    ],
    showRir: false,
    negateWeight: false,
  },
  weight_distance: {
    label: 'Weight & Distance',
    fields: [
      { key: 'weight', label: 'LBS', targetKey: 'target_weight', keyboardType: 'decimal-pad' },
      { key: 'distance', label: 'KM', targetKey: 'target_distance', keyboardType: 'decimal-pad' },
    ],
    showRir: false,
    negateWeight: false,
  },
};

const DEFAULT_CONFIG = CONFIGS.weight_reps;

export function getExerciseTypeConfig(type: string | undefined): ExerciseTypeConfig {
  return CONFIGS[type ?? 'weight_reps'] ?? DEFAULT_CONFIG;
}

export function hasWeight(type: string | undefined): boolean {
  return getExerciseTypeConfig(type).fields.some((f) => f.key === 'weight');
}

export function hasReps(type: string | undefined): boolean {
  return getExerciseTypeConfig(type).fields.some((f) => f.key === 'reps');
}

export function hasDuration(type: string | undefined): boolean {
  return getExerciseTypeConfig(type).fields.some((f) => f.key === 'duration');
}

export function hasDistance(type: string | undefined): boolean {
  return getExerciseTypeConfig(type).fields.some((f) => f.key === 'distance');
}

export function getWeightLabel(type: string | undefined, unit: string): string {
  const cfg = getExerciseTypeConfig(type);
  const wField = cfg.fields.find((f) => f.key === 'weight');
  if (!wField) return unit.toUpperCase();
  if (cfg.negateWeight) return `-${unit.toUpperCase()}`;
  return unit.toUpperCase();
}

export function getDistanceLabel(distUnit: string): string {
  return distUnit.toUpperCase();
}

const EXERCISE_TYPE_KEYS = [
  'weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight',
  'duration', 'duration_weight', 'distance_duration', 'weight_distance',
];

const EXERCISE_TYPE_EXAMPLES: Record<string, string> = {
  weight_reps: 'Bench Press, Back Squat',
  bodyweight_reps: 'Push-up, Pull-up',
  weighted_bodyweight: 'Weighted Pull-up, Weighted Dip',
  assisted_bodyweight: 'Assisted Pull-up, Assisted Dip',
  duration: 'Plank, Wall Sit',
  duration_weight: 'Farmer Carry, Static Hold',
  distance_duration: 'Run, Row',
  weight_distance: 'Sled Push, Prowler Drag',
};

export const EXERCISE_TYPE_ITEMS = EXERCISE_TYPE_KEYS.map((et) => ({
  key: et,
  label: CONFIGS[et].label,
  value: et,
  description: `Examples: ${EXERCISE_TYPE_EXAMPLES[et]}`,
}));
