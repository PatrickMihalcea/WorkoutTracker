import {
  ExerciseRow,
  OnboardingFocusMuscle,
  OnboardingRoutineAnswers,
  PlannedDay,
  PlannedExercise,
  PlannedSet,
  RoutineDraft,
} from './types.ts';

type DayTemplate = {
  label: string;
  day_of_week: number;
  selectors: MuscleSelector[];
};

type MuscleSelector =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'full_body'
  | 'arms'
  | 'legs'
  | 'core';

const SUPPORTED_EXERCISE_TYPES = new Set([
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
  'duration',
  'duration_weight',
]);

const EQUIPMENT_BY_PREFERENCE: Record<OnboardingRoutineAnswers['equipment'], string[]> = {
  full_gym: [
    'none',
    'barbell',
    'dumbbell',
    'kettlebell',
    'cable',
    'machine',
    'plate',
    'resistance_band',
    'suspension_band',
    'other',
  ],
  dumbbells_bench: ['none', 'dumbbell', 'kettlebell', 'resistance_band', 'suspension_band', 'plate'],
  bodyweight_minimal: ['none', 'resistance_band', 'suspension_band'],
};

const DEFAULT_SCHEDULE_BY_DAYS: Record<3 | 4 | 5, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
};

const DAY_TEMPLATES_BY_DAYS: Record<3 | 4 | 5, DayTemplate[]> = {
  3: [
    { label: 'Full Body A', day_of_week: 1, selectors: ['legs', 'chest', 'back', 'shoulders', 'core'] },
    { label: 'Full Body B', day_of_week: 3, selectors: ['legs', 'back', 'chest', 'arms', 'core'] },
    { label: 'Full Body C', day_of_week: 5, selectors: ['legs', 'shoulders', 'back', 'arms', 'core'] },
  ],
  4: [
    { label: 'Upper Push', day_of_week: 1, selectors: ['chest', 'shoulders', 'triceps', 'core'] },
    { label: 'Lower A', day_of_week: 2, selectors: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { label: 'Upper Pull', day_of_week: 4, selectors: ['back', 'biceps', 'shoulders', 'core'] },
    { label: 'Lower B', day_of_week: 5, selectors: ['legs', 'glutes', 'hamstrings', 'core'] },
  ],
  5: [
    { label: 'Push', day_of_week: 1, selectors: ['chest', 'shoulders', 'triceps', 'core'] },
    { label: 'Pull', day_of_week: 2, selectors: ['back', 'biceps', 'shoulders', 'core'] },
    { label: 'Legs', day_of_week: 3, selectors: ['legs', 'glutes', 'calves', 'core'] },
    { label: 'Upper', day_of_week: 4, selectors: ['chest', 'back', 'shoulders', 'arms', 'core'] },
    { label: 'Lower', day_of_week: 5, selectors: ['legs', 'glutes', 'hamstrings', 'core'] },
  ],
};

const GOAL_LABELS: Record<OnboardingRoutineAnswers['goal'], string> = {
  muscle_gain: 'Muscle Gain',
  strength: 'Strength',
  fat_loss: 'Fat Loss',
  general_fitness: 'General Fitness',
};

function expandSelector(selector: MuscleSelector): string[] {
  switch (selector) {
    case 'arms':
      return ['biceps', 'triceps', 'forearms'];
    case 'legs':
      return ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'tibialis'];
    case 'core':
      return ['abs', 'obliques', 'lower_back'];
    default:
      return [selector];
  }
}

export function focusToMuscles(focus: OnboardingFocusMuscle): string[] {
  switch (focus) {
    case 'none':
      return [];
    case 'arms':
      return expandSelector('arms');
    case 'legs':
      return expandSelector('legs');
    case 'core':
      return expandSelector('core');
    default:
      return [focus];
  }
}

export function filterExercisesForAnswers(
  exercises: ExerciseRow[],
  answers: OnboardingRoutineAnswers,
): ExerciseRow[] {
  const allowedEquipment = new Set(EQUIPMENT_BY_PREFERENCE[answers.equipment]);
  return exercises
    .filter((exercise) => exercise.user_id === null)
    .filter((exercise) => allowedEquipment.has(exercise.equipment))
    .filter((exercise) => SUPPORTED_EXERCISE_TYPES.has(exercise.exercise_type))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function sessionExerciseCount(minutes: 30 | 45 | 60): number {
  if (minutes === 30) return 4;
  if (minutes === 45) return 5;
  return 6;
}

function routineNameForAnswers(answers: OnboardingRoutineAnswers): string {
  return `${answers.days_per_week}-Day ${GOAL_LABELS[answers.goal]} Starter`;
}

function buildSetPrescription(
  answers: OnboardingRoutineAnswers,
  exerciseType: string,
  indexInDay: number,
): PlannedSet[] {
  let sets = 3;
  let repsMin = 8;
  let repsMax = 12;
  let targetRir: number | null = 2;
  let targetDuration = 0;
  let targetDistance = 0;

  if (answers.goal === 'strength') {
    if (indexInDay <= 1) {
      sets = 4;
      repsMin = 4;
      repsMax = 6;
      targetRir = 2;
    } else {
      sets = 3;
      repsMin = 6;
      repsMax = 10;
      targetRir = 2;
    }
  } else if (answers.goal === 'fat_loss') {
    sets = 3;
    repsMin = 10;
    repsMax = 15;
    targetRir = 2;
  } else if (answers.goal === 'general_fitness') {
    sets = 3;
    repsMin = 8;
    repsMax = 12;
    targetRir = 2;
  } else {
    sets = 3;
    repsMin = 8;
    repsMax = 12;
    targetRir = 2;
  }

  if (answers.experience === 'beginner') {
    sets = Math.max(2, sets - 1);
    targetRir = 3;
  }
  if (answers.experience === 'advanced') {
    sets = Math.min(5, sets + 1);
    targetRir = 1;
  }

  if (exerciseType === 'duration' || exerciseType === 'duration_weight') {
    repsMin = 0;
    repsMax = 0;
    targetDuration = answers.goal === 'fat_loss' ? 60 : 45;
  }

  const planned: PlannedSet[] = [];
  for (let i = 0; i < sets; i += 1) {
    planned.push({
      set_number: i + 1,
      target_weight: 0,
      target_reps_min: repsMin,
      target_reps_max: repsMax,
      target_rir: targetRir,
      target_duration: targetDuration,
      target_distance: targetDistance,
      is_warmup: false,
    });
  }
  return planned;
}

function pickBestExercise(
  candidates: ExerciseRow[],
  usedInDay: Set<string>,
  usedAcrossRoutine: Set<string>,
): ExerciseRow | null {
  const unusedInDay = candidates.filter((candidate) => !usedInDay.has(candidate.id));
  if (unusedInDay.length === 0) return null;
  const fresh = unusedInDay.find((candidate) => !usedAcrossRoutine.has(candidate.id));
  return fresh ?? unusedInDay[0];
}

export function generateTemplateRoutineDraft(
  answers: OnboardingRoutineAnswers,
  libraryExercises: ExerciseRow[],
): RoutineDraft {
  const filtered = filterExercisesForAnswers(libraryExercises, answers);
  if (filtered.length < 20) {
    throw new Error('Exercise library is too small for selected equipment.');
  }

  const byMuscle = new Map<string, ExerciseRow[]>();
  for (const exercise of filtered) {
    const arr = byMuscle.get(exercise.muscle_group) ?? [];
    arr.push(exercise);
    byMuscle.set(exercise.muscle_group, arr);
  }

  const template = DAY_TEMPLATES_BY_DAYS[answers.days_per_week];
  const exerciseCountPerDay = sessionExerciseCount(answers.session_minutes);
  const focusMuscles = new Set(focusToMuscles(answers.focus_muscle));
  const globalUsed = new Set<string>();
  const days: PlannedDay[] = [];

  for (let dayIndex = 0; dayIndex < template.length; dayIndex += 1) {
    const dayTemplate = template[dayIndex];
    const usedInDay = new Set<string>();
    const selected: ExerciseRow[] = [];

    const selectorQueue: MuscleSelector[] = [...dayTemplate.selectors];
    if (focusMuscles.size > 0 && exerciseCountPerDay >= 5) {
      selectorQueue.splice(Math.min(2, selectorQueue.length), 0, 'core');
    }

    while (selected.length < exerciseCountPerDay) {
      const selector = selectorQueue[selected.length % selectorQueue.length];
      const muscleCandidates = expandSelector(selector)
        .flatMap((muscle) => byMuscle.get(muscle) ?? [])
        .filter((exercise) => {
          if (answers.goal === 'fat_loss') return true;
          return exercise.exercise_type !== 'duration';
        });

      const boosted = muscleCandidates.sort((a, b) => {
        const aBoost = focusMuscles.has(a.muscle_group) ? -1 : 0;
        const bBoost = focusMuscles.has(b.muscle_group) ? -1 : 0;
        if (aBoost !== bBoost) return aBoost - bBoost;
        return a.name.localeCompare(b.name);
      });

      let picked = pickBestExercise(boosted, usedInDay, globalUsed);
      if (!picked) {
        picked = pickBestExercise(filtered, usedInDay, globalUsed);
      }
      if (!picked) break;

      selected.push(picked);
      usedInDay.add(picked.id);
      globalUsed.add(picked.id);
    }

    if (selected.length < 3) {
      throw new Error('Could not generate a valid day with at least 3 exercises.');
    }

    const exercises: PlannedExercise[] = selected.map((exercise, index) => {
      const sets = buildSetPrescription(answers, exercise.exercise_type, index);
      return {
        exercise_id: exercise.id,
        sort_order: index,
        target_sets: sets.length,
        target_reps: sets[0]?.target_reps_min ?? 8,
        sets,
      };
    });

    days.push({
      day_of_week: DEFAULT_SCHEDULE_BY_DAYS[answers.days_per_week][dayIndex],
      label: dayTemplate.label,
      week_index: 1,
      exercises,
    });
  }

  return {
    routine_name: routineNameForAnswers(answers),
    days,
  };
}

export function validateRoutineDraft(
  draft: RoutineDraft,
  allowedExerciseIds: Set<string>,
  expectedDays: number,
): string[] {
  const errors: string[] = [];

  if (!draft || typeof draft !== 'object') return ['Draft is missing'];
  if (!draft.routine_name || draft.routine_name.trim().length < 3) {
    errors.push('Routine name is invalid');
  }
  if (!Array.isArray(draft.days) || draft.days.length !== expectedDays) {
    errors.push('Routine day count is invalid');
    return errors;
  }

  for (const day of draft.days) {
    if (typeof day.day_of_week !== 'number' || day.day_of_week < 1 || day.day_of_week > 7) {
      errors.push('Day schedule is invalid');
    }
    if (!day.label || day.label.trim().length < 2) {
      errors.push('Day label is invalid');
    }
    if (!Array.isArray(day.exercises) || day.exercises.length < 3) {
      errors.push('Each day must have at least 3 exercises');
      continue;
    }

    for (const exercise of day.exercises) {
      if (!allowedExerciseIds.has(exercise.exercise_id)) {
        errors.push(`Exercise ${exercise.exercise_id} is not allowed`);
      }
      if (!Array.isArray(exercise.sets) || exercise.sets.length < 2) {
        errors.push('Exercise sets are invalid');
        continue;
      }
      for (const setRow of exercise.sets) {
        if (setRow.set_number < 1) errors.push('Set number is invalid');
        if (setRow.target_reps_min < 0 || setRow.target_reps_max < 0) {
          errors.push('Reps must be >= 0');
        }
        if (setRow.target_reps_max > 0 && setRow.target_reps_max < setRow.target_reps_min) {
          errors.push('Rep range is invalid');
        }
        if (setRow.target_duration < 0 || setRow.target_distance < 0) {
          errors.push('Duration/distance must be >= 0');
        }
      }
    }
  }

  return errors;
}
