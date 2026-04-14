import { buildDraftWithOptionalAi } from './pipeline.ts';
import { ExerciseRow, OnboardingRoutineAnswers } from './types.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const EXERCISES: ExerciseRow[] = [
  { id: 'e1', user_id: null, name: 'Push-Up', muscle_group: 'chest', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['triceps'] },
  { id: 'e2', user_id: null, name: 'Inverted Row', muscle_group: 'back', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['biceps'] },
  { id: 'e3', user_id: null, name: 'Bodyweight Squat', muscle_group: 'quads', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
  { id: 'e4', user_id: null, name: 'Lunge', muscle_group: 'quads', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
  { id: 'e5', user_id: null, name: 'Glute Bridge', muscle_group: 'glutes', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e6', user_id: null, name: 'Hip Hinge', muscle_group: 'hamstrings', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
  { id: 'e7', user_id: null, name: 'Pike Push-Up', muscle_group: 'shoulders', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['triceps'] },
  { id: 'e8', user_id: null, name: 'Dip', muscle_group: 'triceps', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['chest'] },
  { id: 'e9', user_id: null, name: 'Crunch', muscle_group: 'abs', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e10', user_id: null, name: 'Leg Raise', muscle_group: 'abs', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e11', user_id: null, name: 'Mountain Climber', muscle_group: 'abs', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['quads'] },
  { id: 'e12', user_id: null, name: 'Pull-Up', muscle_group: 'back', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['biceps'] },
  { id: 'e13', user_id: null, name: 'Chin-Up', muscle_group: 'back', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['biceps'] },
  { id: 'e14', user_id: null, name: 'Calf Raise', muscle_group: 'calves', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e15', user_id: null, name: 'Side Plank', muscle_group: 'abs', equipment: 'none', exercise_type: 'duration', secondary_muscles: [] },
  { id: 'e16', user_id: null, name: 'Burpee', muscle_group: 'full_body', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e17', user_id: null, name: 'Sit-Up', muscle_group: 'abs', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: [] },
  { id: 'e18', user_id: null, name: 'Bodyweight Row', muscle_group: 'back', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['biceps'] },
  { id: 'e19', user_id: null, name: 'Close-Grip Push-Up', muscle_group: 'triceps', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['chest'] },
  { id: 'e20', user_id: null, name: 'Step-Up', muscle_group: 'quads', equipment: 'none', exercise_type: 'bodyweight_reps', secondary_muscles: ['glutes'] },
];

const ANSWERS: OnboardingRoutineAnswers = {
  days_per_week: 3,
  session_minutes: 60,
  goal: 'muscle_gain',
  experience: 'beginner',
  equipment: 'bodyweight_minimal',
  focus_muscle: 'none',
};

Deno.test('AI failure falls back to template', async () => {
  const result = await buildDraftWithOptionalAi({
    mode: 'ai',
    answers: ANSWERS,
    exercises: EXERCISES,
    openAiApiKey: 'present',
    openAiModel: 'gpt-test',
    aiRefiner: async () => {
      throw new Error('simulated ai failure');
    },
  });

  assert(result.generationModeUsed === 'fallback_template', 'expected fallback template mode');
  assert(result.draft.days.length === 12, 'expected 4 weeks of 3 template days after fallback');
});
