import {
  ExerciseRow,
  GenerateOnboardingRoutineRequest,
  OnboardingRoutineAnswers,
  RoutineDraft,
  UserProfileContext,
} from './types.ts';
import { validateRoutineDraft } from './generator.ts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT_MS = 200_000;
const KG_TO_LBS = 2.20462;
const KM_TO_MI = 0.6213711922;
type RepairContext = NonNullable<GenerateOnboardingRoutineRequest['repair_context']>;

export class AiDraftValidationError extends Error {
  repairContext: RepairContext;

  constructor(message: string, repairContext: RepairContext) {
    super(message);
    this.name = 'AiDraftValidationError';
    this.repairContext = repairContext;
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractJsonObject(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return null;
}

function normalizeExerciseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundWeightForUnit(value: number, unit: 'kg' | 'lbs' | null | undefined): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  if (unit === 'lbs') {
    const lbs = value * KG_TO_LBS;
    const roundedLbs = Math.round(lbs);
    return roundedLbs / KG_TO_LBS;
  }
  return Math.round(value);
}

function roundDistanceForUnit(value: number, unit: 'km' | 'miles' | null | undefined): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  if (unit === 'miles') {
    const miles = value * KM_TO_MI;
    const roundedMiles = roundToDecimals(miles, 1);
    return roundedMiles / KM_TO_MI;
  }
  return roundToDecimals(value, 1);
}

function toFiniteNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toIntAtLeast(value: unknown, fallback: number, min: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(min, parsed);
}

function toNullableFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toBooleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeAiDraft(
  rawDraft: unknown,
  allowedExercises: ExerciseRow[],
  expectedDaysPerWeek: number,
  expectedWeekCount: number,
  userContext?: UserProfileContext | null,
): RoutineDraft {
  const draft = rawDraft as RoutineDraft;
  if (!draft || typeof draft !== 'object' || !Array.isArray(draft.days)) {
    throw new Error('AI draft is not a valid object');
  }

  const normalizedWeekCount = Math.max(1, Math.floor(expectedWeekCount));
  const expectedTotalDays = expectedDaysPerWeek * normalizedWeekCount;

  const trimmedDays =
    draft.days.length > expectedTotalDays
      ? draft.days.slice(0, expectedTotalDays)
      : draft.days;

  const idSet = new Set(allowedExercises.map((item) => item.id));
  const idByName = new Map<string, string>();

  for (const exercise of allowedExercises) {
    const key = normalizeExerciseName(exercise.name);
    if (!idByName.has(key)) {
      idByName.set(key, exercise.id);
    }
  }

  const normalizedDays = trimmedDays.map((day) => {
    const exercises = (day.exercises ?? []).map((exercise) => {
      const maybeId =
        typeof exercise.exercise_id === 'string' && idSet.has(exercise.exercise_id)
          ? exercise.exercise_id
          : null;

      let mappedId = maybeId;
      if (!mappedId) {
        const exerciseName = (exercise as { exercise_name?: unknown }).exercise_name;
        if (typeof exerciseName === 'string') {
          mappedId = idByName.get(normalizeExerciseName(exerciseName)) ?? null;
        }
      }

      if (!mappedId) {
        throw new Error('AI draft contains an exercise that is not in the allowed library');
      }

      const sets = (exercise.sets ?? []).map((setRow, setIndex) => {
        const targetWeight = roundWeightForUnit(
          toFiniteNumberOr(setRow.target_weight, 0),
          userContext?.weight_unit,
        );
        const targetDistance = roundDistanceForUnit(
          toFiniteNumberOr(setRow.target_distance, 0),
          userContext?.distance_unit,
        );

        return {
          ...setRow,
          set_number: toIntAtLeast(setRow.set_number, setIndex + 1, 1),
          target_weight: targetWeight,
          target_reps_min: toFiniteNumberOr(setRow.target_reps_min, 0),
          target_reps_max: toFiniteNumberOr(setRow.target_reps_max, 0),
          target_rir: toNullableFiniteNumber(setRow.target_rir),
          target_duration: toFiniteNumberOr(setRow.target_duration, 0),
          target_distance: targetDistance,
          is_warmup: toBooleanOr(setRow.is_warmup, false),
        };
      });

      const firstSet = sets.find((setRow) => !setRow.is_warmup) ?? sets[0];
      const derivedTargetReps = firstSet?.target_reps_min ?? 0;

      return {
        ...exercise,
        sort_order: toIntAtLeast(exercise.sort_order, 1, 1),
        exercise_id: mappedId,
        target_sets: sets.length,
        target_reps: derivedTargetReps,
        sets,
      };
    });

    return {
      ...day,
      exercises,
    };
  });

  return {
    ...draft,
    days: normalizedDays,
  };
}

export async function refineDraftWithAi(args: {
  apiKey: string;
  model: string;
  answers: OnboardingRoutineAnswers;
  baseDraft: RoutineDraft;
  expectedWeekCount?: number;
  repairContext?: RepairContext | null;
  allowedExercises: ExerciseRow[];
  userContext?: UserProfileContext | null;
}): Promise<RoutineDraft> {
  const { apiKey, model, answers, baseDraft, allowedExercises, userContext, repairContext } = args;
  const allowedIds = new Set(allowedExercises.map((item) => item.id));
  const expectedWeekCount = Math.max(1, Math.floor(args.expectedWeekCount ?? 1));
  const expectedTotalDays = answers.days_per_week * expectedWeekCount;
  console.log(
    JSON.stringify({
      event: 'ai_refinement_started',
      model,
      expected_week_count: expectedWeekCount,
      expected_total_days: expectedTotalDays,
      allowed_exercise_count: allowedExercises.length,
      has_repair_context: Boolean(repairContext),
      repair_error_count: repairContext?.validation_errors?.length ?? 0,
      mode_hint: repairContext ? 'repair' : 'fresh',
    }),
  );

  const candidateList = allowedExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    equipment: exercise.equipment,
    exercise_type: exercise.exercise_type,
  }));

  const systemPrompt = [
  'You are an expert fitness and hypertrophy coach.',
  'Return strict JSON only. No markdown. No explanations.',
  'Use only exercise_name values from the provided candidate list.',
  'Never invent exercises, names, fields, or enum values.',
  'Preserve the output schema exactly.',
  'Keep exactly the requested number of training days.',
  'Set numbers must be contiguous starting at 1.',
  'No duplicate exercises within the same day.',
  'Avoid repeating the same exercise on multiple days, variance is better.',
  'Build a practical, balanced, recoverable program that respects equipment, session length, goal, experience, focus muscle, and available user body metrics.',
  'Use sex, height, weight, goal, and experience to choose practical starting loads and session difficulty.',
  'Apply only a slight focus-muscle bias. Do not unbalance the program.',
  'Order exercises well: main compounds first, then secondary lifts, then isolations, then core or cardio.',
  'Use realistic sets, reps, weights (and RIR), distances, and durations based on exercise type and user profile.',
  'Fill every relevant target field for each exercise. Only leave a field null when that exercise type does not use it.',
  'For dumbbells, target_weight means per hand unless the exercise is clearly single-arm.',
  'For bodyweight, assisted, duration-only, and cardio movements, target_weight usually be null.',
  'Prefer conservative, achievable starting weights over aggressive guesses.',
  'Muscle gain: emphasize hypertrophy-friendly compounds plus isolations.',
  'Fat loss: higher rep and distance, lower weight and longer form cardio with distance (e.g., running, cycling).',
  'General fitness: keep the plan balanced, sustainable, and include some cardio.',
  'Beginner: prefer simpler, more stable exercises.',
  'Intermediate: use standard staples with moderate variety.',
  'Advanced: allow more specificity, but stay practical.',
].join(' ');

  const userPrompt = JSON.stringify(
    repairContext
      ? {
          task: 'Repair the previous routine JSON so it passes validation. Keep the same program intent unless needed to fix errors.',
          requirements: [
            'Return strict JSON only.',
            'Use only candidate exercise names.',
            'Fix all listed validation errors.',
            'Do not include explanations.',
            'For non-cardio exercises, require at least 2 sets.',
            'For cardio/duration/distance exercises, 1+ set is allowed.',
            'Set numbers must be contiguous starting at 1.',
          ],
          validation_errors: repairContext.validation_errors,
          previous_output: repairContext.previous_output,
          user_preferences: {
            days_per_week: answers.days_per_week,
            session_minutes: answers.session_minutes,
            goal: answers.goal,
            experience: answers.experience,
            equipment: answers.equipment,
            focus_muscle: answers.focus_muscle,
            sex: userContext?.sex ?? null,
            height_cm: userContext?.height_cm ?? null,
            weight_kg: userContext?.weight_kg ?? null,
            height_unit: userContext?.height_unit ?? 'cm',
            weight_unit: userContext?.weight_unit ?? 'kg',
            distance_unit: userContext?.distance_unit ?? 'km',
          },
          constraints: {
            library_only: true,
            use_only_these_exercise_names: true,
            expected_days_per_week: answers.days_per_week,
            expected_total_days: expectedTotalDays,
          },
          candidates: candidateList,
          output_schema: {
            routine_name: 'string',
            days: [
              {
                day_of_week: 'number(1-7)',
                label: 'string',
                week_index: `number(1-${expectedWeekCount})`,
                exercises: [
                  {
                    exercise_name: 'string',
                    sort_order: 'number, warmups first',
                    sets: [
                      {
                        set_number: 'number (contiguous sequence from 1 to sets.length). Non-cardio muset have at least 2 sets.',
                        target_weight: 'number non-null',
                        target_reps_min: 'number',
                        target_reps_max: 'number',
                        target_rir: 'number|null  Anything with reps should have a non null RIR value here. Descending values.',
                        target_duration: 'number in seconds. If intensive, 45 seconds or less. If more endurance based like running, 10 minutes OR MORE depending on session length.',
                        target_distance: 'number in km. All distance based exercises should have this filled.',
                        is_warmup: 'boolean, use for longer workouts with more sets. Should always come before non-warmup sets.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }
      : {
      task: 'Design a personalized high-quality routine based on the user profile and preferences. Follow the strict number of days request. Only slight bias for a focus muscle group, and have workout sets, distances, and durations that fit the designated session length for each day.',
      user_preferences: {
        days_per_week: answers.days_per_week,
        session_minutes: answers.session_minutes,
        goal: answers.goal,
        experience: answers.experience,
        equipment: answers.equipment,
        focus_muscle: answers.focus_muscle,
        sex: userContext?.sex ?? null,
        height_cm: userContext?.height_cm ?? null,
        weight_kg: userContext?.weight_kg ?? null,
        height_unit: userContext?.height_unit ?? 'cm',
        weight_unit: userContext?.weight_unit ?? 'kg',
        distance_unit: userContext?.distance_unit ?? 'km',
      },
      target_weight_rules: {
        set_weight_for_weighted_lifts_when_reasonable: true,
        use_conservative_starting_weights: true,
        dumbbell_weight_is_per_hand: true,
        barbell_weight_includes_barbell_weight: true,
        bodyweight_and_cardio_weight_should_usually_be_null: true
      },
      planning_rules: {
        use_only_candidate_exercises: true,
        preserve_exact_day_count: expectedTotalDays,
        preserve_schema_exactly: true,
        exercises_per_day_min: '3 or 4 for 30min, 4 or 5 for 60min, 6 or 7 for 90min',
        exercises_per_day_max: '4 for 30 min, 6 for 60min, 8 for 90min',
        non_cardio_sets_per_exercise_min: '2 for 30, 3 for 60, 3|4 for 90',
        cardio_sets_per_exercise_min: 'Depends on exercise and session length, but can be 1 or more',
        set_numbers_must_be_contiguous_from_1: true,
        focus_muscle_bias: 'very_slight',
        training_quality_priorities: [
          'goal alignment',
          'balanced weekly coverage',
          'variation in exercises and cardio. Use exact names',
          'follow the planning rules and constraints',
        ],
        exercise_ordering: [
          'main compound first',
          'secondary compound second',
          'isolations after compounds',
          'core or least technical work near the end'
        ],
        set_ordering: 'warmup sets first, then working sets. No interleaving. Only use warmup sets for 60 and 90 minute sessions, and only when it helps meet the set count requirements while keeping the working sets practical.',
        avoid: [
          'invalid exercise names',
          'duplicate exercises across the same day',
          'too many near-identical movement patterns in one session',
          'repetitive use of exercises especially across days. same cardio every day for example.',
          'unbalanced weekly volume',
          'unrealistic volume for selected session length',
        ]
      },
      routine_design_guidance: {
        by_days_per_week: {
          3: 'Prefer full body or upper/lower/full body style distribution',
          4: 'Prefer upper/lower, torso/limbs, or balanced hypertrophy split.',
          5: 'Prefer body groups emphasis.'
        },
        by_goal: {
          muscle_gain: 'Use hypertrophy-friendly exercise selection and set/rep schemes. Usually compounds plus isolations. Most working sets in roughly the 4-10 rep range.',
          fat_loss: 'Favor practical exercise density, moderate volume, with higher reps. Simple exercise transitions, and distance based cardio with reasonable pacing (elliptical, cycling, running etc.). Add cardio. For 90 minute sessions, can even be over 20 minutes (1200 seconds).',
          general_fitness: 'Keep the plan well rounded, and broadly effective across all major muscle groups. Bit of cardio.'
        },
        by_experience: {
          beginner: 'Prefer simple, stable, easy-to-learn exercises. Avoid overly technical or unnecessarily fatiguing combinations.',
          intermediate: 'Use standard gym staples with moderate variety and moderate training volume.',
          advanced: 'Allow somewhat greater specificity and volume, but keep the routine practical and coherent.'
        },
        by_session_length: {
          30: 'Keep sessions compact. Usually 3-4 exercises with 2-3 sets.',
          60: '4-6 exercises with balanced volume.',
          90: '6-8 exercises with room for warmup sets!, more sets (3-4), and more accessory and longer conditioning work.'
        }
      },
      output_requirements: {
        return_json_only: true,
        no_markdown: true,
        no_commentary: true,
        keep_fields_exact: true
      },
      constraints: {
        library_only: true,
        use_only_these_exercise_names: true,
        expected_days_per_week: answers.days_per_week,
        expected_total_days: expectedTotalDays,
        answers,
      },
      base_draft: baseDraft,
      candidates: candidateList,
      output_schema: {
        routine_name: 'string',
        days: [
          {
            day_of_week: 'number(1-7)',
            label: 'string',
            week_index: `number(1-${expectedWeekCount})`,
            exercises: [
              {
                exercise_name: 'string',
                sort_order: 'number, warmups first',
                sets: [
                  {
                    set_number: 'number (contiguous sequence from 1 to sets.length). Non-cardio muset have at least 2 sets.',
                    target_weight: 'number non-null',
                    target_reps_min: 'number',
                    target_reps_max: 'number',
                    target_rir: 'number|null  Anything with reps should have a non null RIR value here. Descending values.',
                    target_duration: 'number in seconds. If intensive, 45 seconds or less. If more endurance based like running, 10 minutes OR MORE depending on session length.',
                    target_distance: 'number in km. All distance based exercises should have this filled.',
                    is_warmup: 'boolean, use for longer workouts with more sets. Should always come before non-warmup sets.',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    console.log(
      JSON.stringify({
        event: 'ai_refinement_openai_request_started',
        model,
        has_repair_context: Boolean(repairContext),
      }),
    );
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        top_p: 0.95,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        JSON.stringify({
          event: 'ai_refinement_openai_error',
          status: response.status,
          body,
        }),
      );
      throw new Error(`OpenAI error: ${response.status} ${body}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: unknown;
    };
    console.log(
      JSON.stringify({
        event: 'ai_refinement_openai_response_received',
        status: response.status,
        usage: payload.usage ?? null,
      }),
    );
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty response content');

    const maybeJson = extractJsonObject(content);
    if (!maybeJson) throw new Error('OpenAI response did not contain JSON');

    const parsed = safeJsonParse<unknown>(maybeJson);
    if (!parsed) throw new Error('OpenAI JSON could not be parsed');
    console.log(
      JSON.stringify({
        event: 'ai_refinement_output_json',
        output_json: parsed,
      }),
    );
    let refined: RoutineDraft;
    try {
      refined = normalizeAiDraft(
        parsed,
        allowedExercises,
        answers.days_per_week,
        expectedWeekCount,
        userContext,
      );
      console.log(
        JSON.stringify({
          event: 'ai_refinement_normalized',
          day_count: refined.days.length,
        }),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        JSON.stringify({
          event: 'ai_refinement_normalization_failed',
          error_message: message,
        }),
      );
      throw new AiDraftValidationError(`AI draft validation failed: ${message}`, {
        validation_errors: [message],
        previous_output: {
          raw_output: parsed,
          constraints: {
            expected_days_per_week: answers.days_per_week,
            expected_week_count: expectedWeekCount,
            expected_total_days: expectedTotalDays,
          },
        },
      });
    }

    const errors = validateRoutineDraft(refined, allowedIds, answers.days_per_week, expectedWeekCount);
    if (errors.length > 0) {
      console.warn(
        JSON.stringify({
          event: 'ai_refinement_validation_failed',
          error_count: errors.length,
          errors,
        }),
      );
      throw new AiDraftValidationError(`AI draft validation failed: ${errors.slice(0, 5).join('; ')}`, {
        validation_errors: errors,
        previous_output: {
          raw_output: parsed,
          normalized_output: refined,
          constraints: {
            expected_days_per_week: answers.days_per_week,
            expected_week_count: expectedWeekCount,
            expected_total_days: expectedTotalDays,
          },
        },
      });
    }
    console.log(
      JSON.stringify({
        event: 'ai_refinement_validation_succeeded',
        day_count: refined.days.length,
      }),
    );

    return refined;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        event: 'ai_refinement_failed',
        error_name: error instanceof Error ? error.name : 'UnknownError',
        error_message: message,
      }),
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
