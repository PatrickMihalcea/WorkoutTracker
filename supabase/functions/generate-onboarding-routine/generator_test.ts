import {
  generateTemplateRoutineDraft,
  validateRoutineDraft,
} from './generator.ts';
import { ExerciseRow, OnboardingRoutineAnswers } from './types.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const EXERCISES: ExerciseRow[] = [
  { id: 'e1', user_id: null, name: 'Push-Up', muscle_group: 'chest', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['triceps'] },
  { id: 'e2', user_id: null, name: 'Incline Push-Up', muscle_group: 'chest', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['triceps'] },
  { id: 'e3', user_id: null, name: 'Dumbbell Bench Press', muscle_group: 'chest', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['triceps'] },
  { id: 'e4', user_id: null, name: 'Inverted Row', muscle_group: 'back', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['biceps'] },
  { id: 'e5', user_id: null, name: 'One-Arm Row', muscle_group: 'back', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['biceps'] },
  { id: 'e6', user_id: null, name: 'Bodyweight Squat', muscle_group: 'quads', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
  { id: 'e7', user_id: null, name: 'Goblet Squat', muscle_group: 'quads', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['glutes'] },
  { id: 'e8', user_id: null, name: 'Hip Hinge', muscle_group: 'hamstrings', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
  { id: 'e9', user_id: null, name: 'Dumbbell RDL', muscle_group: 'hamstrings', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['glutes'] },
  { id: 'e10', user_id: null, name: 'Glute Bridge', muscle_group: 'glutes', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e11', user_id: null, name: 'Split Squat', muscle_group: 'glutes', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['quads'] },
  { id: 'e12', user_id: null, name: 'Pike Push-Up', muscle_group: 'shoulders', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['triceps'] },
  { id: 'e13', user_id: null, name: 'Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: ['triceps'] },
  { id: 'e14', user_id: null, name: 'Tricep Dip', muscle_group: 'triceps', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['chest'] },
  { id: 'e15', user_id: null, name: 'Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: [] },
  { id: 'e16', user_id: null, name: 'Curl', muscle_group: 'biceps', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: [] },
  { id: 'e17', user_id: null, name: 'Hammer Curl', muscle_group: 'biceps', equipment: 'dumbbell', exercise_type: 'weight_reps', secondary_muscles: [] },
  { id: 'e18', user_id: null, name: 'Calf Raise', muscle_group: 'calves', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e19', user_id: null, name: 'Plank', muscle_group: 'abs', equipment: 'none', exercise_type: 'duration', secondary_muscles: [] },
  { id: 'e20', user_id: null, name: 'Crunch', muscle_group: 'abs', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e21', user_id: null, name: 'Forearm Plank', muscle_group: 'abs', equipment: 'none', exercise_type: 'duration', secondary_muscles: [] },
];

Deno.test('template generator creates expected day count', () => {
  const answers: OnboardingRoutineAnswers = {
    days_per_week: 4,
    session_minutes: 45,
    goal: 'muscle_gain',
    experience: 'beginner',
    equipment: 'dumbbells_bench',
    focus_muscle: 'none',
  };

  const draft = generateTemplateRoutineDraft(answers, EXERCISES);
  const allowed = new Set(EXERCISES.map((item) => item.id));
  const errors = validateRoutineDraft(draft, allowed, answers.days_per_week);

  assert(draft.days.length === 4, 'expected 4 days');
  assert(errors.length === 0, `expected valid draft, got: ${errors.join(', ')}`);
});

Deno.test('focus muscle is represented in generated routine', () => {
  const answers: OnboardingRoutineAnswers = {
    days_per_week: 3,
    session_minutes: 60,
    goal: 'general_fitness',
    experience: 'intermediate',
    equipment: 'dumbbells_bench',
    focus_muscle: 'arms',
  };

  const draft = generateTemplateRoutineDraft(answers, EXERCISES);
  const focusedMuscles = new Set(['biceps', 'triceps', 'forearms']);
  const picked = draft.days
    .flatMap((day) => day.exercises)
    .filter((exercise) => {
      const source = EXERCISES.find((item) => item.id === exercise.exercise_id);
      return source ? focusedMuscles.has(source.muscle_group) : false;
    });

  assert(picked.length >= 2, 'expected at least two focus-oriented exercises across routine');
});
