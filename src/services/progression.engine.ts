import { RoutineDayExerciseSet } from '../models';

export type ProgressionMode =
  | 'load_stair'
  | 'rep_stair'
  | 'assisted_inverse'
  | 'static'
  | 'endurance';

export type ExerciseProgressionProfile = {
  mode: ProgressionMode;
  loadIncrement?: number;
  repWave?: number[];
  rirWave?: number[];
  deloadEvery?: number;
  deloadWeightFactor?: number;
  deloadRepDrop?: number;
  minRir?: number;
  maxRir?: number;
  durationStep?: number;
  distanceStep?: number;
};

export type ProgressionOptions = {
  defaultProfile?: ExerciseProgressionProfile;
  profilesByExerciseId?: Record<string, ExerciseProgressionProfile>;
  targetUnits?: {
    weightUnit?: 'kg' | 'lbs' | null;
    distanceUnit?: 'km' | 'miles' | null;
  };
};

const DEFAULT_STRENGTH_PROFILE: ExerciseProgressionProfile = {
  mode: 'load_stair',
  loadIncrement: 2.5,
  repWave: [0, 1, -1, 0],
  rirWave: [0, 0, -1, -1],
  deloadEvery: 5,
  deloadWeightFactor: 0.9,
  deloadRepDrop: 2,
  minRir: 1,
  maxRir: 4,
};

const DEFAULT_ENDURANCE_PROFILE: ExerciseProgressionProfile = {
  mode: 'endurance',
  durationStep: 30,
  distanceStep: 100,
  deloadEvery: 5,
  deloadWeightFactor: 1,
  deloadRepDrop: 0,
};
const KG_TO_LBS = 2.20462;
const KM_TO_MI = 0.6213711922;

function roundToIncrement(value: number, increment: number): number {
  if (!Number.isFinite(value) || increment <= 0) return value;
  return Math.round(value / increment) * increment;
}

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

function roundWeightForUnit(value: number, weightUnit: 'kg' | 'lbs' | null | undefined): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  if (weightUnit === 'lbs') {
    const lbs = value * KG_TO_LBS;
    const roundedLbs = Math.round(lbs);
    return roundedLbs / KG_TO_LBS;
  }
  return Math.round(value);
}

function roundDistanceForUnit(value: number, distanceUnit: 'km' | 'miles' | null | undefined): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  if (distanceUnit === 'miles') {
    const miles = value * KM_TO_MI;
    const roundedMiles = roundToDecimals(miles, 1);
    return roundedMiles / KM_TO_MI;
  }
  return roundToDecimals(value, 1);
}

function applyTargetRounding(
  setRow: RoutineDayExerciseSet,
  options?: ProgressionOptions,
): RoutineDayExerciseSet {
  return {
    ...setRow,
    target_weight: roundWeightForUnit(setRow.target_weight, options?.targetUnits?.weightUnit),
    target_distance: roundDistanceForUnit(setRow.target_distance, options?.targetUnits?.distanceUnit),
  };
}

function isDeloadWeek(weekIndex: number, deloadEvery?: number): boolean {
  if (!deloadEvery || deloadEvery <= 0) return false;
  return weekIndex % deloadEvery === 0;
}

function getCycleIndex(weekDelta: number, repWaveLength: number): number {
  if (repWaveLength <= 0) return 0;
  return Math.floor(weekDelta / repWaveLength);
}

function getWaveIndex(weekDelta: number, repWaveLength: number): number {
  if (repWaveLength <= 0) return 0;
  return weekDelta % repWaveLength;
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
    return { ...DEFAULT_STRENGTH_PROFILE, mode: 'assisted_inverse' };
  }

  const hasDuration = (sampleSet.target_duration ?? 0) > 0;
  const hasDistance = (sampleSet.target_distance ?? 0) > 0;
  if (exerciseType === 'duration' || hasDuration || hasDistance) {
    return DEFAULT_ENDURANCE_PROFILE;
  }

  return options?.defaultProfile ?? DEFAULT_STRENGTH_PROFILE;
}

function progressStrengthLikeSet(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const repWave = profile.repWave ?? [0];
  const rirWave = profile.rirWave ?? [0];
  const waveLength = Math.max(repWave.length, 1);

  const cycleIndex = getCycleIndex(weekIndex - 1, waveLength);
  const waveIndex = getWaveIndex(weekIndex - 1, waveLength);

  const repOffset = repWave[waveIndex] ?? 0;
  const rirOffset = rirWave[waveIndex] ?? 0;
  const minRir = profile.minRir ?? 1;
  const maxRir = profile.maxRir ?? 4;
  const loadIncrement = profile.loadIncrement ?? 2.5;

  const baseRepsMin = sourceSet.target_reps_min;
  const baseRepsMax = sourceSet.target_reps_max;
  const baseWeight = sourceSet.target_weight;
  const baseRir = sourceSet.target_rir;

  let nextWeight = baseWeight;
  let nextRepsMin = baseRepsMin;
  let nextRepsMax = baseRepsMax;
  let nextRir = baseRir;

  switch (profile.mode) {
    case 'static': {
      break;
    }

    case 'rep_stair': {
      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + cycleIndex + repOffset, 1) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + cycleIndex + repOffset, 1) : baseRepsMax;
      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffset, minRir, maxRir);
      }
      break;
    }

    case 'assisted_inverse': {
      nextWeight =
        baseWeight > 0
          ? roundToIncrement(Math.max(0, baseWeight - (cycleIndex * loadIncrement)), loadIncrement)
          : baseWeight;

      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + repOffset, 1) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + repOffset, 1) : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffset, minRir, maxRir);
      }
      break;
    }

    case 'load_stair':
    default: {
      nextWeight =
        baseWeight > 0
          ? roundToIncrement(baseWeight + (cycleIndex * loadIncrement), loadIncrement)
          : baseWeight;

      nextRepsMin = baseRepsMin > 0 ? clampInt(baseRepsMin + repOffset, 1) : baseRepsMin;
      nextRepsMax = baseRepsMax > 0 ? clampInt(baseRepsMax + repOffset, 1) : baseRepsMax;

      if (baseRir != null) {
        nextRir = clampNumber(baseRir + rirOffset, minRir, maxRir);
      }
      break;
    }
  }

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    const deloadWeightFactor = profile.deloadWeightFactor ?? 0.9;
    const deloadRepDrop = profile.deloadRepDrop ?? 2;

    if (nextWeight > 0 && profile.mode !== 'assisted_inverse') {
      nextWeight = roundToIncrement(nextWeight * deloadWeightFactor, loadIncrement);
    }

    if (nextWeight > 0 && profile.mode === 'assisted_inverse') {
      nextWeight = roundToIncrement(nextWeight + loadIncrement, loadIncrement);
    }

    if (nextRepsMin > 0) {
      nextRepsMin = clampInt(nextRepsMin - deloadRepDrop, 1);
    }
    if (nextRepsMax > 0) {
      nextRepsMax = clampInt(nextRepsMax - deloadRepDrop, Math.max(nextRepsMin, 1));
    }
    if (nextRir != null) {
      nextRir = clampNumber(nextRir + 1, minRir, maxRir);
    }
  }

  return {
    ...sourceSet,
    target_weight: nextWeight,
    target_reps_min: nextRepsMin,
    target_reps_max: nextRepsMax,
    target_rir: nextRir,
  };
}

function progressEnduranceSet(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  profile: ExerciseProgressionProfile,
): RoutineDayExerciseSet {
  const durationStep = profile.durationStep ?? 30;
  const distanceStep = profile.distanceStep ?? 100;

  let nextDuration =
    sourceSet.target_duration > 0
      ? clampInt(sourceSet.target_duration + ((weekIndex - 1) * durationStep), 1)
      : sourceSet.target_duration;

  let nextDistance =
    sourceSet.target_distance > 0
      ? clampInt(sourceSet.target_distance + ((weekIndex - 1) * distanceStep), 1)
      : sourceSet.target_distance;

  if (isDeloadWeek(weekIndex, profile.deloadEvery)) {
    nextDuration = nextDuration > 0 ? clampInt(nextDuration * 0.85, 1) : nextDuration;
    nextDistance = nextDistance > 0 ? clampInt(nextDistance * 0.85, 1) : nextDistance;
  }

  return {
    ...sourceSet,
    target_duration: nextDuration,
    target_distance: nextDistance,
  };
}

function progressSet(
  sourceSet: RoutineDayExerciseSet,
  weekIndex: number,
  exerciseId: string,
  exerciseType: string | null | undefined,
  options?: ProgressionOptions,
): RoutineDayExerciseSet {
  const isWarmup = sourceSet.is_warmup ?? false;
  if (isWarmup) {
    return { ...sourceSet };
  }

  const profile = resolveProfile(exerciseId, exerciseType, sourceSet, options);
  if (profile.mode === 'endurance') {
    return progressEnduranceSet(sourceSet, weekIndex, profile);
  }

  return progressStrengthLikeSet(sourceSet, weekIndex, profile);
}

export function buildProgressedSets(args: {
  sourceSets: RoutineDayExerciseSet[];
  weekIndex: number;
  exerciseType: string | null | undefined;
  exerciseId: string;
  options?: ProgressionOptions;
}): RoutineDayExerciseSet[] {
  const { sourceSets, weekIndex, exerciseType, exerciseId, options } = args;
  return [...sourceSets]
    .sort((a, b) => a.set_number - b.set_number)
    .map((setRow) => progressSet(setRow, weekIndex, exerciseId, exerciseType, options))
    .map((setRow) => applyTargetRounding(setRow, options))
    .map((setRow, index) => ({
      ...setRow,
      set_number: index + 1,
    }));
}
