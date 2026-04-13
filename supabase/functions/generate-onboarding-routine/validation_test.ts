import { validateRoutineDraft } from './generator.ts';
import { RoutineDraft } from './types.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test('validateRoutineDraft rejects unknown exercise ids', () => {
  const draft: RoutineDraft = {
    routine_name: 'Test Routine',
    days: [
      {
        day_of_week: 1,
        label: 'Day 1',
        week_index: 1,
        exercises: [
          {
            exercise_id: 'missing-id',
            sort_order: 0,
            target_sets: 3,
            target_reps: 8,
            sets: [
              {
                set_number: 1,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 2,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 3,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
            ],
          },
          {
            exercise_id: 'missing-id-2',
            sort_order: 1,
            target_sets: 3,
            target_reps: 8,
            sets: [
              {
                set_number: 1,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 2,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 3,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
            ],
          },
          {
            exercise_id: 'missing-id-3',
            sort_order: 2,
            target_sets: 3,
            target_reps: 8,
            sets: [
              {
                set_number: 1,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 2,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
              {
                set_number: 3,
                target_weight: 0,
                target_reps_min: 8,
                target_reps_max: 12,
                target_rir: 2,
                target_duration: 0,
                target_distance: 0,
                is_warmup: false,
              },
            ],
          },
        ],
      },
    ],
  };

  const errors = validateRoutineDraft(draft, new Set(['known-id']), 1);
  assert(errors.some((error) => error.includes('not allowed')), 'expected unknown exercise id validation error');
});
