import { RoutineDayExerciseSet } from '../models';

export type ProgressionMode =
  | 'load_wave'
  | 'rep_stair'
  | 'assisted_inverse'
  | 'static'
  | 'endurance';

export type ExerciseProgressionProfile = {
  mode: ProgressionMode;

  // Strength / assistance progression
  loadPercentPerStep?: number;
  loadWave?: number[]; // absolute target step by wave slot
  repWave?: number[]; // absolute rep offset by wave slot
  rirWave?: number[]; // absolute rir offset by wave slot

  // Deload
  deloadEvery?: number;
  deloadWeightFactor?: number;
  deloadRepDrop?: number;
  deloadAssistIncreasePercent?: number;
  deloadDurationFactor?: number;
  deloadDistanceFactor?: number;

  // Bounds
  minRir?: number;
  maxRir?: number;
  minReps?: number;

  // Endurance progression
  durationPercentPerStep?: number;
  distancePercentPerStep?: number;
};

export type ProgressionOptions = {
  defaultProfile?: ExerciseProgressionProfile;
  profilesByExerciseId?: Record<string, ExerciseProgressionProfile>;
  targetUnits?: {
    weightUnit?: 'kg' | 'lbs' | null;
    distanceUnit?: 'km' | 'miles' | null;
  };
};

export type BuildProgressedSetsArgs = {
  sourceSets: RoutineDayExerciseSet[];
  weekIndex: number;
  exerciseType: string | null | undefined;
  exerciseId: string;
  options?: ProgressionOptions;
};

const KG_TO_LBS = 2.20462;
const KM_TO_MI = 0.6213711922;

const DEFAULT_STRENGTH_PROFILE: ExerciseProgressionProfile = {
  mode: 'load_wave',
  loadPercentPerStep: 0.04,
  loadWave: [0, 0, 1, 1],
  repWave: [0, 1, -1, 0],
  rirWave: [0, -1, -1, -1],
  deloadEvery: 5,
  deloadWeightFactor: 0.85,
  deloadRepDrop: 2,
  deloadAssistIncreasePercent: 0.1,
  minRir: 0,
  maxRir: 4,
  minReps: 1,
};

const DEFAULT_ASSISTED_PROFILE: ExerciseProgressionProfile = {
  mode: 'assisted_inverse',
  loadPercentPerStep: 0.08,
  loadWave: [0, 0, 1, 1],
  repWave: [0, 1, -1, 0],
  rirWave: [0, 0, 0, -1],
  deloadEvery: 5,
  deloadWeightFactor: 1,
  deloadRepDrop: 2,
  deloadAssistIncreasePercent: 0.12,
  minRir: 0,
  maxRir: 4,
  minReps: 1,
};

const DEFAULT_ENDURANCE_PROFILE: ExerciseProgressionProfile = {
  mode: 'endurance',
  durationPercentPerStep: 0.08,
  distancePercentPerStep: 0.08,
  loadWave: [0, 1, 1, 2],
  deloadEvery: 5,
  deloadDurationFactor: 0.8,
  deloadDistanceFactor: 0.8,
};

function clampInt(value: number, min = 0): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.round(value));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundWeightForUnit(
  value: number,
  weightUnit: 'kg' | 'lbs' | null | undefined,
): number {
  if (!Number.isFinite(value) || value <= 0) return value;

  if (weightUnit === 'lbs') {
    const lbs = value * KG_TO_LBS;
    const roundedLbs = Math.round(lbs);
    return roundedLbs / KG_TO_LBS;
  }

  return Math.round(value);
}

function roundDistanceForUnit(
  value: number,
  distanceUnit: 'km' | 'miles' | null | undefined,
): number {
  if (!Number.isFinite(value) || value <= 0) return value;

  if (distanceUnit === 'miles') {
    const miles = value * KM_TO_MI;
    const roundedMiles = roundToDecimals(miles, 1);
    return roundedMiles / KM_TO_MI;
  }

  return roundToDecimals(value, 1);
}

function roundDuration(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  return Math.round(value);
}

function applyTargetRounding(
  setRow: RoutineDayExerciseSet,
  options?: ProgressionOptions,
): RoutineDayExerciseSet {
  return {
    ...setRow,
    target_weight: roundWeightForUnit(
      setRow.target_weight,
      options?.targetUnits?.weightUnit,
    ),
    target_distance: roundDistanceForUnit(
      setRow.target_distance,
      options?.targetUnits?.distanceUnit,
    ),
    target_duration: roundDuration(setRow.target_duration),
  };
}

function isDeloadWeek(weekIndex: number, deloadEvery?: number): boolean {
  if (!deloadEvery || deloadEvery <= 0) return false;
  return weekIndex % deloadEvery === 0;
}

function getWaveLength(profile: ExerciseProgressionProfile): number {
  return Math.max(
    profile.loadWave?.length ?? 0,
    profile.repWave?.length ?? 0,
    profile.rirWave?.length ?? 0,
    1,
  );
}

function getWaveIndex(weekIndex: number, waveLength: number): number {
  return Math.max(0, (weekIndex - 1) % waveLength);
}

function getPreviousWaveIndex(weekIndex: number, waveLength: number): number {
  return Math.max(0, (weekIndex - 2 + waveLength) % waveLength);
}

function getCycleIndex(weekIndex: number, waveLength: number): number {
  return Math.floor((weekIndex - 1) / waveLength);
}

function getWaveValue(
  wave: number[] | undefined,
  index: number,
  fallback = 0,
): number {
  if (!wave || wave.length === 0) return fallback;
  return wave[index] ?? fallback;
}

function getMaxWaveStep(loadWave: number[] | undefined): number {
  if (!loadWave || loadWave.length === 0) return 0;
  return Math.max(...loadWave, 0);
}

function applyPercentSteps(
  baseValue: number,
  percentPerStep: number,
  totalSteps: number,
): number {
  if (!Number.isFinite(baseValue) || baseValue <= 0) return baseValue;
  if (!Number.isFinite(percentPerStep) || percentPerStep <= 0) return baseValue;
  if (!Number.isFinite(totalSteps) || totalSteps <= 0) return baseValue;
  return baseValue * (1 + (percentPerStep * totalSteps));
}

function reduceByPercent(
  baseValue: number,
  percentPerStep: number,
  totalSteps: number,
): number {
  if (!Number.isFinite(baseValue) || baseValue <= 0) return baseValue;
  if (!Number.isFinite(percentPerStep) || percentPerStep <= 0) return baseValue;
  if (!Number.isFinite(totalSteps) || totalSteps <= 0) return baseValue;
  return Math.max(0, baseValue * (1 - (percentPerStep * totalSteps)));
}

function adjustByPercentDelta(
  currentValue: number,
  percentPerStep: number,
  stepDelta: number,
): number {
  if (!Number.isFinite(currentValue) || currentValue <= 0) return currentValue;
  if (!Number.isFinite(percentPerStep) || percentPerStep <= 0) return currentValue;
  if (!Number.isFinite(stepDelta) || stepDelta === 0) return currentValue;

  if (stepDelta > 0) {
    return currentValue * (1 + (percentPerStep * stepDelta));
  }
  return Math.max(0, currentValue * (1 - (percentPerStep * Math.abs(stepDelta))));
}

function increaseByPercent(baseValue: number, percent: number): number {
  if (!Number.isFinite(baseValue) || baseValue <= 0) return baseValue;
  if (!Number.isFinite(percent) || percent <= 0) return baseValue;
  return baseValue * (1 + percent);
}

function ensureRepRange(
  minReps: number,
  maxReps: number,
  floor: number,
): { minReps: number; maxReps: number } {
  const safeMin = clampInt(minReps, floor);
  const safeMax = clampInt(maxReps, safeMin);
  return { minReps: safeMin, maxReps: safeMax };
}

function resolveProfile(
  exerciseId: string,
  exerciseType: string | null | undefined,
  sampleSet: RoutineDayExerciseSet,
  options?: ProgressionOptions,
): ExerciseProgressionProfile {
  const explicit = options?.profilesByExerciseId?.[exerciseId];
  if (explicit) return explicit;

  if (exerciseType === 'assisted_bodyweight') {
    return DEFAULT_ASSISTED_PROFILE;
  }

  const hasDuration = (sampleSet.target_duration ?? 0) > 0;
  const hasDistance = (sampleSet.target_distance ?? 0) > 0;

  if (exerciseType === 'duration' || hasDuration || hasDistance) {
    return DEFAULT_ENDURANCE_PROFILE;
  }

  return options?.defaultProfile ?? DEFAULT_STRENGTH_PROFILE;
}

function progressStrengthFromBaseline(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const baseRepsMin = sourceSet.target_reps_min;
  const baseRepsMax = sourceSet.target_reps_max;
  const baseWeight = sourceSet.target_weight;
  const baseRir = sourceSet.target_rir;

  const loadPercentPerStep = profile.loadPercentPerStep ?? 0.04;
  const minRir = profile.minRir ?? 0;
  const maxRir = profile.maxRir ?? 4;
  const minRepsFloor = profile.minReps ?? 1;

  const waveLength = getWaveLength(profile);
  const cycleIndex = getCycleIndex(weekIndex, waveLength);
  const waveIndex = getWaveIndex(weekIndex, waveLength);

  const loadOffsetThisWave = getWaveValue(profile.loadWave, waveIndex, 0);
  const repOffsetThisWave = getWaveValue(profile.repWave, waveIndex, 0);
  const rirOffsetThisWave = getWaveValue(profile.rirWave, waveIndex, 0);
  const maxWaveStep = getMaxWaveStep(profile.loadWave);

  const totalLoadSteps = (cycleIndex * maxWaveStep) + loadOffsetThisWave;
  const difficultyIncreased = totalLoadSteps > 0;

  let nextWeight = baseWeight;
  let nextRepsMin = baseRepsMin;
  let nextRepsMax = baseRepsMax;
  let nextRir = baseRir;

  switch (profile.mode) {
    case 'static':
      break;

    case 'rep_stair': {
      nextRepsMin =
        baseRepsMin > 0
          ? clampInt(baseRepsMin + cycleIndex + repOffsetThisWave, minRepsFloor)
          : baseRepsMin;
      nextRepsMax =
        baseRepsMax > 0
          ? clampInt(baseRepsMax + cycleIndex + repOffsetThisWave, minRepsFloor)
          : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffsetThisWave, minRir, maxRir);
      }
      break;
    }

    case 'assisted_inverse': {
      nextWeight =
        baseWeight > 0
          ? reduceByPercent(baseWeight, loadPercentPerStep, totalLoadSteps)
          : baseWeight;

      const effectiveRepOffset =
        repOffsetThisWave < 0 && !difficultyIncreased ? 0 : repOffsetThisWave;

      nextRepsMin =
        baseRepsMin > 0
          ? clampInt(baseRepsMin + effectiveRepOffset, minRepsFloor)
          : baseRepsMin;
      nextRepsMax =
        baseRepsMax > 0
          ? clampInt(baseRepsMax + effectiveRepOffset, minRepsFloor)
          : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffsetThisWave, minRir, maxRir);
      }
      break;
    }

    case 'load_wave':
    default: {
      nextWeight =
        baseWeight > 0
          ? applyPercentSteps(baseWeight, loadPercentPerStep, totalLoadSteps)
          : baseWeight;

      const effectiveRepOffset =
        repOffsetThisWave < 0 && !difficultyIncreased ? 0 : repOffsetThisWave;

      nextRepsMin =
        baseRepsMin > 0
          ? clampInt(baseRepsMin + effectiveRepOffset, minRepsFloor)
          : baseRepsMin;
      nextRepsMax =
        baseRepsMax > 0
          ? clampInt(baseRepsMax + effectiveRepOffset, minRepsFloor)
          : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffsetThisWave, minRir, maxRir);
      }
      break;
    }
  }

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    const deloadWeightFactor = profile.deloadWeightFactor ?? 0.85;
    const deloadRepDrop = profile.deloadRepDrop ?? 2;
    const deloadAssistIncreasePercent = profile.deloadAssistIncreasePercent ?? 0.1;

    if (profile.mode === 'assisted_inverse') {
      if (nextWeight > 0) {
        nextWeight = increaseByPercent(nextWeight, deloadAssistIncreasePercent);
      }
    } else if (nextWeight > 0) {
      nextWeight = nextWeight * deloadWeightFactor;
    }

    if (nextRepsMin > 0) {
      nextRepsMin = clampInt(nextRepsMin - deloadRepDrop, minRepsFloor);
    }
    if (nextRepsMax > 0) {
      nextRepsMax = clampInt(nextRepsMax - deloadRepDrop, Math.max(nextRepsMin, minRepsFloor));
    }
    if (nextRir != null) {
      nextRir = clampNumber(nextRir + 1, minRir, maxRir);
    }
  }

  if (nextRepsMin > 0 && nextRepsMax > 0) {
    const fixed = ensureRepRange(nextRepsMin, nextRepsMax, minRepsFloor);
    nextRepsMin = fixed.minReps;
    nextRepsMax = fixed.maxReps;
  }

  return {
    ...sourceSet,
    target_weight: nextWeight,
    target_reps_min: nextRepsMin,
    target_reps_max: nextRepsMax,
    target_rir: nextRir,
  };
}

function progressStrengthFromPrevious(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const baseRepsMin = sourceSet.target_reps_min;
  const baseRepsMax = sourceSet.target_reps_max;
  const baseWeight = sourceSet.target_weight;
  const baseRir = sourceSet.target_rir;

  const loadPercentPerStep = profile.loadPercentPerStep ?? 0.04;
  const minRir = profile.minRir ?? 0;
  const maxRir = profile.maxRir ?? 4;
  const minRepsFloor = profile.minReps ?? 1;

  const waveLength = getWaveLength(profile);
  const waveIndex = getWaveIndex(weekIndex, waveLength);
  const previousWaveIndex = getPreviousWaveIndex(weekIndex, waveLength);

  const currentLoadStep = getWaveValue(profile.loadWave, waveIndex, 0);
  const previousLoadStep = getWaveValue(profile.loadWave, previousWaveIndex, 0);
  const loadStepDelta = currentLoadStep - previousLoadStep;

  const currentRepOffset = getWaveValue(profile.repWave, waveIndex, 0);
  const previousRepOffset = getWaveValue(profile.repWave, previousWaveIndex, 0);
  const repDelta = currentRepOffset - previousRepOffset;

  const currentRirOffset = getWaveValue(profile.rirWave, waveIndex, 0);
  const previousRirOffset = getWaveValue(profile.rirWave, previousWaveIndex, 0);
  const rirDelta = currentRirOffset - previousRirOffset;

  let nextWeight = baseWeight;
  let nextRepsMin = baseRepsMin;
  let nextRepsMax = baseRepsMax;
  let nextRir = baseRir;

  switch (profile.mode) {
    case 'static':
      break;

    case 'rep_stair': {
      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + repDelta, minRepsFloor) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + repDelta, minRepsFloor) : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirDelta, minRir, maxRir);
      }
      break;
    }

    case 'assisted_inverse': {
      nextWeight =
        baseWeight > 0
          ? adjustByPercentDelta(baseWeight, loadPercentPerStep, -loadStepDelta)
          : baseWeight;

      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + repDelta, minRepsFloor) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + repDelta, minRepsFloor) : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirDelta, minRir, maxRir);
      }
      break;
    }

    case 'load_wave':
    default: {
      nextWeight =
        baseWeight > 0
          ? adjustByPercentDelta(baseWeight, loadPercentPerStep, loadStepDelta)
          : baseWeight;

      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + repDelta, minRepsFloor) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + repDelta, minRepsFloor) : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirDelta, minRir, maxRir);
      }
      break;
    }
  }

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    const deloadWeightFactor = profile.deloadWeightFactor ?? 0.85;
    const deloadRepDrop = profile.deloadRepDrop ?? 2;
    const deloadAssistIncreasePercent = profile.deloadAssistIncreasePercent ?? 0.1;

    if (profile.mode === 'assisted_inverse') {
      if (nextWeight > 0) {
        nextWeight = increaseByPercent(nextWeight, deloadAssistIncreasePercent);
      }
    } else if (nextWeight > 0) {
      nextWeight = nextWeight * deloadWeightFactor;
    }

    if (nextRepsMin > 0) {
      nextRepsMin = clampInt(nextRepsMin - deloadRepDrop, minRepsFloor);
    }
    if (nextRepsMax > 0) {
      nextRepsMax = clampInt(nextRepsMax - deloadRepDrop, Math.max(nextRepsMin, minRepsFloor));
    }
    if (nextRir != null) {
      nextRir = clampNumber(nextRir + 1, minRir, maxRir);
    }
  }

  if (nextRepsMin > 0 && nextRepsMax > 0) {
    const fixed = ensureRepRange(nextRepsMin, nextRepsMax, minRepsFloor);
    nextRepsMin = fixed.minReps;
    nextRepsMax = fixed.maxReps;
  }

  return {
    ...sourceSet,
    target_weight: nextWeight,
    target_reps_min: nextRepsMin,
    target_reps_max: nextRepsMax,
    target_rir: nextRir,
  };
}

function progressEnduranceFromBaseline(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const baseDuration = sourceSet.target_duration;
  const baseDistance = sourceSet.target_distance;

  const durationPercentPerStep = profile.durationPercentPerStep ?? 0.08;
  const distancePercentPerStep = profile.distancePercentPerStep ?? 0.08;

  const waveLength = getWaveLength(profile);
  const cycleIndex = getCycleIndex(weekIndex, waveLength);
  const waveIndex = getWaveIndex(weekIndex, waveLength);
  const loadOffsetThisWave = getWaveValue(profile.loadWave, waveIndex, 0);
  const maxWaveStep = getMaxWaveStep(profile.loadWave);
  const totalSteps = (cycleIndex * maxWaveStep) + loadOffsetThisWave;

  let nextDuration =
    baseDuration > 0
      ? applyPercentSteps(baseDuration, durationPercentPerStep, totalSteps)
      : baseDuration;

  let nextDistance =
    baseDistance > 0
      ? applyPercentSteps(baseDistance, distancePercentPerStep, totalSteps)
      : baseDistance;

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    const deloadDurationFactor = profile.deloadDurationFactor ?? 0.8;
    const deloadDistanceFactor = profile.deloadDistanceFactor ?? 0.8;

    nextDuration = nextDuration > 0 ? nextDuration * deloadDurationFactor : nextDuration;
    nextDistance = nextDistance > 0 ? nextDistance * deloadDistanceFactor : nextDistance;
  }

  return {
    ...sourceSet,
    target_duration: nextDuration,
    target_distance: nextDistance,
  };
}

function progressEnduranceFromPrevious(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const baseDuration = sourceSet.target_duration;
  const baseDistance = sourceSet.target_distance;

  const durationPercentPerStep = profile.durationPercentPerStep ?? 0.08;
  const distancePercentPerStep = profile.distancePercentPerStep ?? 0.08;

  const waveLength = getWaveLength(profile);
  const waveIndex = getWaveIndex(weekIndex, waveLength);
  const previousWaveIndex = getPreviousWaveIndex(weekIndex, waveLength);

  const currentStep = getWaveValue(profile.loadWave, waveIndex, 0);
  const previousStep = getWaveValue(profile.loadWave, previousWaveIndex, 0);
  const stepDelta = currentStep - previousStep;

  let nextDuration =
    baseDuration > 0
      ? adjustByPercentDelta(baseDuration, durationPercentPerStep, stepDelta)
      : baseDuration;

  let nextDistance =
    baseDistance > 0
      ? adjustByPercentDelta(baseDistance, distancePercentPerStep, stepDelta)
      : baseDistance;

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    const deloadDurationFactor = profile.deloadDurationFactor ?? 0.8;
    const deloadDistanceFactor = profile.deloadDistanceFactor ?? 0.8;

    nextDuration = nextDuration > 0 ? nextDuration * deloadDurationFactor : nextDuration;
    nextDistance = nextDistance > 0 ? nextDistance * deloadDistanceFactor : nextDistance;
  }

  return {
    ...sourceSet,
    target_duration: nextDuration,
    target_distance: nextDistance,
  };
}

function progressBaselineSet(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  exerciseId: string,
  exerciseType: string | null | undefined,
  options?: ProgressionOptions,
): RoutineDayExerciseSet {
  if (sourceSet.is_warmup ?? false) return { ...sourceSet };

  const profile = resolveProfile(exerciseId, exerciseType, sourceSet, options);
  if (profile.mode === 'endurance') {
    return progressEnduranceFromBaseline(sourceSet, weekIndex, profile);
  }
  return progressStrengthFromBaseline(sourceSet, weekIndex, profile);
}

function progressNextWeekSet(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  exerciseId: string,
  exerciseType: string | null | undefined,
  options?: ProgressionOptions,
): RoutineDayExerciseSet {
  if (sourceSet.is_warmup ?? false) return { ...sourceSet };

  const profile = resolveProfile(exerciseId, exerciseType, sourceSet, options);
  if (profile.mode === 'endurance') {
    return progressEnduranceFromPrevious(sourceSet, weekIndex, profile);
  }
  return progressStrengthFromPrevious(sourceSet, weekIndex, profile);
}

function finalizeSets(
  sourceSets: RoutineDayExerciseSet[],
  mapper: (setRow: RoutineDayExerciseSet) => RoutineDayExerciseSet,
  options?: ProgressionOptions,
): RoutineDayExerciseSet[] {
  return [...sourceSets]
    .sort((a, b) => a.set_number - b.set_number)
    .map(mapper)
    .map((setRow) => applyTargetRounding(setRow, options))
    .map((setRow, index) => ({
      ...setRow,
      set_number: index + 1,
    }));
}

/**
 * Deterministic baseline -> target week.
 * Good for generating weeks 1..n from a base week.
 */
export function buildWeekFromBaseline(args: BuildProgressedSetsArgs): RoutineDayExerciseSet[] {
  const { sourceSets, weekIndex, exerciseType, exerciseId, options } = args;
  return finalizeSets(
    sourceSets,
    (setRow) => progressBaselineSet(setRow, weekIndex, exerciseId, exerciseType, options),
    options,
  );
}

/**
 * Single-step previous week -> next week.
 * Good for "add one new week based on an existing week".
 */
export function buildNextWeekFromPrevious(args: BuildProgressedSetsArgs): RoutineDayExerciseSet[] {
  const { sourceSets, weekIndex, exerciseType, exerciseId, options } = args;
  return finalizeSets(
    sourceSets,
    (setRow) => progressNextWeekSet(setRow, weekIndex, exerciseId, exerciseType, options),
    options,
  );
}

/**
 * Backward-compatible alias: keep existing callers working.
 * Interprets source sets as baseline sets.
 */
export function buildProgressedSets(args: BuildProgressedSetsArgs): RoutineDayExerciseSet[] {
  return buildWeekFromBaseline(args);
}