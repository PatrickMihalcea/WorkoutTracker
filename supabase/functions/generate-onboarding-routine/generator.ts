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
  | 'upper_back'
  | 'lower_back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'forearms'
  | 'traps'
  | 'tibialis'
  | 'adductors'
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

const GOAL_LABELS: Record<OnboardingRoutineAnswers['goal'], string> = {
  muscle_gain: 'Muscle Gain',
  strength: 'Strength',
  fat_loss: 'Fat Loss',
  general_fitness: 'General Fitness',
};

const BASE_DAY_TEMPLATES_BY_DAYS: Record<3 | 4 | 5, DayTemplate[]> = {
  3: [
    { label: 'Full Body A', day_of_week: 1, selectors: ['legs', 'chest', 'back', 'core'] },
    { label: 'Full Body B', day_of_week: 3, selectors: ['legs', 'shoulders', 'back', 'arms'] },
    { label: 'Full Body C', day_of_week: 5, selectors: ['legs', 'chest', 'back', 'core'] },
  ],
  4: [
    { label: 'Upper Push', day_of_week: 1, selectors: ['chest', 'shoulders', 'triceps', 'core'] },
    { label: 'Lower A', day_of_week: 2, selectors: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { label: 'Upper Pull', day_of_week: 4, selectors: ['back', 'biceps', 'shoulders', 'core'] },
    { label: 'Lower B', day_of_week: 5, selectors: ['legs', 'glutes', 'hamstrings', 'core'] },
  ],
  5: [
    { label: 'Push', day_of_week: 1, selectors: ['chest', 'shoulders', 'triceps'] },
    { label: 'Pull', day_of_week: 2, selectors: ['back', 'biceps', 'upper_back'] },
    { label: 'Legs', day_of_week: 3, selectors: ['legs', 'glutes', 'calves'] },
    { label: 'Upper', day_of_week: 4, selectors: ['chest', 'back', 'shoulders', 'arms'] },
    { label: 'Lower', day_of_week: 5, selectors: ['legs', 'glutes', 'hamstrings', 'core'] },
  ],
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

function focusToSelectors(focus: OnboardingFocusMuscle): MuscleSelector[] {
  switch (focus) {
    case 'none':
      return [];
    case 'arms':
      return ['arms'];
    case 'legs':
      return ['legs'];
    case 'core':
      return ['core'];
    case 'chest':
    case 'back':
    case 'shoulders':
    case 'biceps':
    case 'triceps':
    case 'glutes':
      return [focus];
  }
}

export function focusToMuscles(focus: OnboardingFocusMuscle): string[] {
  return focusToSelectors(focus).flatMap(expandSelector);
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

function sessionExerciseCount(answers: OnboardingRoutineAnswers): number {
  let count = answers.session_minutes === 30 ? 4 : answers.session_minutes === 45 ? 5 : 6;

  if (answers.experience === 'beginner') count -= 1;
  if (answers.goal === 'strength') count -= 1;

  return Math.max(3, Math.min(7, count));
}

function routineNameForAnswers(answers: OnboardingRoutineAnswers): string {
  const level =
    answers.experience === 'beginner'
      ? 'Foundation'
      : answers.experience === 'intermediate'
        ? 'Build'
        : 'Performance';

  return `${answers.days_per_week}-Day ${GOAL_LABELS[answers.goal]} ${level}`;
}

function getDayTemplates(answers: OnboardingRoutineAnswers): DayTemplate[] {
  if (answers.goal === 'fat_loss') {
    if (answers.days_per_week === 3) {
      return [
        { label: 'Full Body A', day_of_week: 1, selectors: ['legs', 'chest', 'back', 'core'] },
        { label: 'Full Body B', day_of_week: 3, selectors: ['legs', 'shoulders', 'arms', 'core'] },
        { label: 'Full Body C', day_of_week: 5, selectors: ['legs', 'back', 'chest', 'core'] },
      ];
    }
    if (answers.days_per_week === 4) {
      return [
        { label: 'Full Body A', day_of_week: 1, selectors: ['legs', 'chest', 'back', 'core'] },
        { label: 'Full Body B', day_of_week: 2, selectors: ['legs', 'shoulders', 'arms', 'core'] },
        { label: 'Full Body C', day_of_week: 4, selectors: ['legs', 'back', 'chest', 'core'] },
        { label: 'Full Body D', day_of_week: 5, selectors: ['legs', 'shoulders', 'arms', 'core'] },
      ];
    }
  }

  if (answers.goal === 'strength') {
    if (answers.days_per_week === 3) {
      return [
        { label: 'Full Body Strength A', day_of_week: 1, selectors: ['legs', 'chest', 'back'] },
        { label: 'Full Body Strength B', day_of_week: 3, selectors: ['legs', 'shoulders', 'back'] },
        { label: 'Full Body Strength C', day_of_week: 5, selectors: ['legs', 'chest', 'back'] },
      ];
    }
    if (answers.days_per_week === 4) {
      return [
        { label: 'Upper Strength', day_of_week: 1, selectors: ['chest', 'back', 'shoulders'] },
        { label: 'Lower Strength', day_of_week: 2, selectors: ['quads', 'hamstrings', 'glutes'] },
        { label: 'Upper Accessories', day_of_week: 4, selectors: ['back', 'chest', 'arms'] },
        { label: 'Lower Accessories', day_of_week: 5, selectors: ['legs', 'glutes', 'core'] },
      ];
    }
  }

  return BASE_DAY_TEMPLATES_BY_DAYS[answers.days_per_week];
}

function inferMovementPattern(exercise: ExerciseRow): string {
  const name = exercise.name.toLowerCase();

  if (name.includes('bench') || name.includes('chest press') || name.includes('push-up') || name.includes('dip')) {
    return 'horizontal_press';
  }
  if (
    name.includes('overhead') ||
    name.includes('shoulder press') ||
    name.includes('arnold press') ||
    name.includes('handstand') ||
    name.includes('pike push-up') ||
    name.includes('push press')
  ) {
    return 'vertical_press';
  }
  if (name.includes('fly')) return 'fly';
  if (name.includes('row')) return 'row';
  if (name.includes('pulldown') || name.includes('pull-up') || name.includes('chin-up')) return 'vertical_pull';
  if (
    name.includes('squat') ||
    name.includes('lunge') ||
    name.includes('leg press') ||
    name.includes('step-up') ||
    name.includes('leg extension')
  ) {
    return 'knee_dominant';
  }
  if (
    name.includes('deadlift') ||
    name.includes('romanian') ||
    name.includes('rdl') ||
    name.includes('good morning') ||
    name.includes('hip thrust') ||
    name.includes('glute bridge') ||
    name.includes('pull-through') ||
    name.includes('back extension') ||
    name.includes('swing')
  ) {
    return 'hip_dominant';
  }
  if (name.includes('curl')) return 'curl';
  if (
    name.includes('pushdown') ||
    name.includes('skull crusher') ||
    name.includes('tricep extension') ||
    name.includes('tricep pushdown') ||
    name.includes('jm press') ||
    name.includes('kickback')
  ) {
    return 'triceps_iso';
  }
  if (name.includes('raise')) return 'raise';
  if (name.includes('shrug')) return 'shrug';
  if (
    name.includes('plank') ||
    name.includes('woodchopper') ||
    name.includes('twist') ||
    name.includes('sit-up') ||
    name.includes('v-up') ||
    name.includes('dragon flag')
  ) {
    return 'core';
  }

  return exercise.muscle_group;
}

function isStableBeginnerChoice(exercise: ExerciseRow): boolean {
  const name = exercise.name.toLowerCase();

  if (exercise.equipment === 'machine') return true;
  if (exercise.equipment === 'cable') return true;
  if (name.includes('machine')) return true;
  if (name.includes('leg press')) return true;
  if (name.includes('lat pulldown')) return true;
  if (name.includes('seated cable row')) return true;
  if (name.includes('chest press')) return true;
  if (name.includes('shoulder press')) return true;
  if (name.includes('leg curl')) return true;
  if (name.includes('leg extension')) return true;
  if (name.includes('push-up')) return true;
  if (name.includes('bodyweight squat')) return true;

  return false;
}

function isBigCompound(exercise: ExerciseRow): boolean {
  const name = exercise.name.toLowerCase();
  const majorMuscles = new Set([
    'chest',
    'back',
    'upper_back',
    'lower_back',
    'shoulders',
    'quads',
    'hamstrings',
    'glutes',
    'full_body',
  ]);

  if (exercise.muscle_group === 'full_body') return true;
  if (
    name.includes('squat') ||
    name.includes('deadlift') ||
    name.includes('bench') ||
    name.includes('row') ||
    name.includes('pull-up') ||
    name.includes('chin-up') ||
    name.includes('pulldown') ||
    name.includes('leg press') ||
    name.includes('shoulder press') ||
    name.includes('overhead press') ||
    name.includes('push press') ||
    name.includes('dip') ||
    name.includes('hip thrust')
  ) {
    return true;
  }

  return majorMuscles.has(exercise.muscle_group) && ['barbell', 'machine', 'dumbbell'].includes(exercise.equipment);
}

function isIsolation(exercise: ExerciseRow): boolean {
  const name = exercise.name.toLowerCase();

  return (
    ['biceps', 'triceps', 'calves', 'abs', 'obliques', 'forearms', 'traps', 'tibialis', 'adductors'].includes(
      exercise.muscle_group,
    ) ||
    name.includes('raise') ||
    name.includes('curl') ||
    name.includes('fly') ||
    name.includes('pushdown') ||
    name.includes('extension') ||
    name.includes('kickback') ||
    name.includes('shrug')
  );
}

function scoreExercise(
  exercise: ExerciseRow,
  selector: MuscleSelector,
  answers: OnboardingRoutineAnswers,
  focusMuscles: Set<string>,
  selectedInDay: ExerciseRow[],
): number {
  let score = 0;
  const expandedSelector = new Set(expandSelector(selector));
  const name = exercise.name.toLowerCase();

  if (expandedSelector.has(exercise.muscle_group)) score += 100;

  const secondary = Array.isArray(exercise.secondary_muscles)
    ? exercise.secondary_muscles
    : typeof exercise.secondary_muscles === 'string'
      ? exercise.secondary_muscles
          .replace(/[{}]/g, '')
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

  for (const muscle of secondary) {
    if (expandedSelector.has(muscle)) score += 18;
  }

  if (focusMuscles.has(exercise.muscle_group)) score += 24;
  for (const muscle of secondary) {
    if (focusMuscles.has(muscle)) score += 6;
  }

  if (answers.goal === 'strength') {
    if (isBigCompound(exercise)) score += 24;
    if (isIsolation(exercise)) score -= 4;
    if (exercise.exercise_type === 'duration') score -= 20;
  }

  if (answers.goal === 'muscle_gain') {
    if (exercise.exercise_type === 'weight_reps') score += 14;
    if (isIsolation(exercise)) score += 8;
    if (isBigCompound(exercise)) score += 10;
  }

  if (answers.goal === 'fat_loss') {
    if (exercise.exercise_type === 'duration') score += 12;
    if (isBigCompound(exercise)) score += 8;
    if (name.includes('barbell')) score -= 3;
  }

  if (answers.goal === 'general_fitness') {
    if (isBigCompound(exercise)) score += 10;
    if (exercise.exercise_type === 'duration') score += 6;
  }

  if (answers.experience === 'beginner') {
    if (isStableBeginnerChoice(exercise)) score += 14;
    if (exercise.equipment === 'barbell' && !name.includes('bench')) score -= 5;
    if (name.includes('snatch') || name.includes('zercher')) score -= 20;
  }

  if (answers.experience === 'advanced') {
    if (isBigCompound(exercise)) score += 8;
  }

  const alreadyHasSamePrimary = selectedInDay.some((item) => item.muscle_group === exercise.muscle_group);
  if (alreadyHasSamePrimary) score -= 3;

  return score;
}

function pickBestExercise(
  candidates: ExerciseRow[],
  usedInDay: Set<string>,
  usedAcrossRoutine: Set<string>,
  selectedInDay: ExerciseRow[],
): ExerciseRow | null {
  const usedPatterns = new Set(selectedInDay.map(inferMovementPattern));

  const filtered = candidates.filter((candidate) => {
    if (usedInDay.has(candidate.id)) return false;

    const pattern = inferMovementPattern(candidate);
    const samePatternAlready = usedPatterns.has(pattern);

    if (samePatternAlready) {
      const samePatternCount = selectedInDay.filter((item) => inferMovementPattern(item) === pattern).length;
      if (samePatternCount >= 1 && selectedInDay.length < 4) return false;
      if (samePatternCount >= 2) return false;
    }

    return true;
  });

  if (filtered.length === 0) return null;

  const fresh = filtered.find((candidate) => !usedAcrossRoutine.has(candidate.id));
  return fresh ?? filtered[0];
}

function buildSetPrescription(
  answers: OnboardingRoutineAnswers,
  exercise: ExerciseRow,
  indexInDay: number,
): PlannedSet[] {
  const name = exercise.name.toLowerCase();
  const bigCompound = isBigCompound(exercise);
  const isolation = isIsolation(exercise);

  let sets = 3;
  let repsMin = 8;
  let repsMax = 12;
  let targetRir: number | null = 2;
  let targetDuration = 0;
  let targetDistance = 0;
  const targetWeight = 0;

  if (exercise.exercise_type === 'duration' || exercise.exercise_type === 'duration_weight') {
    sets = answers.goal === 'fat_loss' ? 3 : 2;
    repsMin = 0;
    repsMax = 0;
    targetRir = null;
    targetDuration = answers.goal === 'fat_loss' ? 60 : 45;
  } else if (answers.goal === 'strength' && bigCompound && indexInDay <= 1) {
    sets = 4;
    repsMin = 4;
    repsMax = 6;
    targetRir = answers.experience === 'advanced' ? 1 : 2;
  } else if (answers.goal === 'strength' && isolation) {
    sets = 2;
    repsMin = 8;
    repsMax = 12;
    targetRir = 2;
  } else if (answers.goal === 'strength') {
    sets = 3;
    repsMin = 6;
    repsMax = 8;
    targetRir = 2;
  } else if (answers.goal === 'fat_loss') {
    if (isolation) {
      sets = 2;
      repsMin = 12;
      repsMax = 15;
      targetRir = 2;
    } else {
      sets = 2;
      repsMin = 10;
      repsMax = 15;
      targetRir = 2;
    }
  } else if (answers.goal === 'general_fitness') {
    if (bigCompound) {
      sets = 3;
      repsMin = 6;
      repsMax = 10;
      targetRir = 2;
    } else {
      sets = 2;
      repsMin = 10;
      repsMax = 15;
      targetRir = 2;
    }
  } else {
    if (bigCompound) {
      sets = 3;
      repsMin = 6;
      repsMax = 10;
      targetRir = 2;
    } else if (isolation) {
      sets = 3;
      repsMin = 10;
      repsMax = 15;
      targetRir = 1;
    }
  }

  if (answers.experience === 'beginner') {
    sets = Math.max(2, sets - 1);
    if (targetRir != null) targetRir = Math.max(targetRir, 3);
  }

  if (answers.experience === 'advanced' && exercise.exercise_type !== 'duration' && bigCompound) {
    sets = Math.min(5, sets + 1);
    if (targetRir != null) targetRir = Math.min(targetRir, 1);
  }

  const warmupFirstCompound =
    bigCompound &&
    indexInDay === 0 &&
    exercise.exercise_type !== 'duration' &&
    !name.includes('push-up') &&
    !name.includes('pull-up');

  const planned: PlannedSet[] = [];

  if (warmupFirstCompound) {
    planned.push({
      set_number: 1,
      target_weight: targetWeight,
      target_reps_min: 5,
      target_reps_max: 8,
      target_rir: 4,
      target_duration: 0,
      target_distance: 0,
      is_warmup: true,
    });
  }

  const workingSetCount = sets;
  for (let i = 0; i < workingSetCount; i += 1) {
    planned.push({
      set_number: planned.length + 1,
      target_weight: targetWeight,
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

export function generateTemplateRoutineDraft(
  answers: OnboardingRoutineAnswers,
  libraryExercises: ExerciseRow[],
  weekCount: number = 4,
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

  const template = getDayTemplates(answers);
  const exerciseCountPerDay = sessionExerciseCount(answers);
  const focusMuscles = new Set(focusToMuscles(answers.focus_muscle));
  const focusSelectors = focusToSelectors(answers.focus_muscle);
  const globalUsed = new Set<string>();
  const weekOneDays: PlannedDay[] = [];

  for (let dayIndex = 0; dayIndex < template.length; dayIndex += 1) {
    const dayTemplate = template[dayIndex];
    const usedInDay = new Set<string>();
    const selected: ExerciseRow[] = [];

    const selectorQueue: MuscleSelector[] = [...dayTemplate.selectors];
    if (focusSelectors.length > 0 && exerciseCountPerDay >= 5) {
      selectorQueue.splice(Math.min(2, selectorQueue.length), 0, ...focusSelectors);
    }

    while (selected.length < exerciseCountPerDay) {
      const selector = selectorQueue[selected.length % selectorQueue.length];

      const muscleCandidates = expandSelector(selector)
        .flatMap((muscle) => byMuscle.get(muscle) ?? [])
        .filter((exercise) => {
          if (answers.goal === 'fat_loss') return true;
          return exercise.exercise_type !== 'duration';
        })
        .slice()
        .sort((a, b) => {
          const diff =
            scoreExercise(b, selector, answers, focusMuscles, selected) -
            scoreExercise(a, selector, answers, focusMuscles, selected);

          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });

      let picked = pickBestExercise(muscleCandidates, usedInDay, globalUsed, selected);

      if (!picked) {
        const fallback = filtered
          .filter((exercise) => (answers.goal === 'fat_loss' ? true : exercise.exercise_type !== 'duration'))
          .slice()
          .sort((a, b) => {
            const diff =
              scoreExercise(b, selector, answers, focusMuscles, selected) -
              scoreExercise(a, selector, answers, focusMuscles, selected);

            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          });

        picked = pickBestExercise(fallback, usedInDay, globalUsed, selected);
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
      const sets = buildSetPrescription(answers, exercise, index);

      const firstWorkingSet = sets.find((setRow) => !setRow.is_warmup);

      return {
        exercise_id: exercise.id,
        sort_order: index,
        target_sets: sets.filter((setRow) => !setRow.is_warmup).length,
        target_reps: firstWorkingSet?.target_reps_min ?? 8,
        sets,
      };
    });

    weekOneDays.push({
      day_of_week: dayTemplate.day_of_week,
      label: dayTemplate.label,
      week_index: 1,
      exercises,
    });
  }

  const normalizedWeekCount = Math.max(1, Math.floor(weekCount));
  const days: PlannedDay[] = [];

  for (let weekIndex = 1; weekIndex <= normalizedWeekCount; weekIndex += 1) {
    for (const baseDay of weekOneDays) {
      days.push({
        day_of_week: baseDay.day_of_week,
        label: baseDay.label,
        week_index: weekIndex,
        exercises: baseDay.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((setRow) => ({ ...setRow })),
        })),
      });
    }
  }

  return {
    routine_name: routineNameForAnswers(answers),
    days,
  };
}

export function validateRoutineDraft(
  draft: RoutineDraft,
  allowedExerciseIds: Set<string>,
  expectedDaysPerWeek: number,
  expectedWeekCount: number = 1,
): string[] {
  const errors: string[] = [];

  if (!draft || typeof draft !== 'object') return ['Draft is missing'];
  if (!draft.routine_name || draft.routine_name.trim().length < 3) {
    errors.push('Routine name is invalid');
  }
  const normalizedWeekCount = Math.max(1, Math.floor(expectedWeekCount));
  const expectedTotalDays = expectedDaysPerWeek * normalizedWeekCount;

  if (!Array.isArray(draft.days)) {
    errors.push('Routine day list is invalid');
    return errors;
  }
  if (draft.days.length !== expectedTotalDays) {
    errors.push(`Routine day count is invalid (expected ${expectedTotalDays}, got ${draft.days.length})`);
  }

  const dayCountByWeek = new Map<number, number>();

  for (const day of draft.days) {
    if (!Number.isInteger(day.week_index) || day.week_index < 1 || day.week_index > normalizedWeekCount) {
      errors.push('Week index is invalid');
    } else {
      dayCountByWeek.set(day.week_index, (dayCountByWeek.get(day.week_index) ?? 0) + 1);
    }

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
      const isCardioLike = Array.isArray(exercise.sets) && exercise.sets.length > 0
        ? exercise.sets.every((setRow) =>
          (setRow.target_duration ?? 0) > 0 || (setRow.target_distance ?? 0) > 0
        )
        : false;

      const minSetsRequired = isCardioLike ? 1 : 2;
      if (!Array.isArray(exercise.sets) || exercise.sets.length < minSetsRequired) {
        errors.push('Exercise sets are invalid');
        continue;
      }

      for (const setRow of exercise.sets) {
        if (setRow.set_number < 1) errors.push('Set number is invalid');

        if (setRow.target_reps_min != null && setRow.target_reps_min < 0) {
          errors.push('Reps min must be >= 0');
        }
        if (setRow.target_reps_max != null && setRow.target_reps_max < 0) {
          errors.push('Reps max must be >= 0');
        }
        if (
          setRow.target_reps_min != null &&
          setRow.target_reps_max != null &&
          setRow.target_reps_max > 0 &&
          setRow.target_reps_max < setRow.target_reps_min
        ) {
          errors.push('Rep range is invalid');
        }

        if (setRow.target_duration != null && setRow.target_duration < 0) {
          errors.push('Duration must be >= 0');
        }
        if (setRow.target_distance != null && setRow.target_distance < 0) {
          errors.push('Distance must be >= 0');
        }
      }
    }
  }

  for (let weekIndex = 1; weekIndex <= normalizedWeekCount; weekIndex += 1) {
    const count = dayCountByWeek.get(weekIndex) ?? 0;
    if (count !== expectedDaysPerWeek) {
      errors.push('Routine weekly day count is invalid');
      break;
    }
  }

  return errors;
}
