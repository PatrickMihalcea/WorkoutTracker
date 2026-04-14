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
  userContext?: UserProfileContext | null,
): RoutineDraft {
  const draft = rawDraft as RoutineDraft;
  if (!draft || typeof draft !== 'object' || !Array.isArray(draft.days)) {
    throw new Error('AI draft is not a valid object');
  }

  const idSet = new Set(allowedExercises.map((item) => item.id));
  const idByName = new Map<string, string>();

  for (const exercise of allowedExercises) {
    const key = normalizeExerciseName(exercise.name);
    if (!idByName.has(key)) {
      idByName.set(key, exercise.id);
    }
  }

  const normalizedDays = draft.days.map((day) => {
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
        const targetWeight = roundWeightForUnit(toFiniteNumberOr(setRow.target_weight, 0), userContext?.weight_unit);
        const targetDistance = roundDistanceForUnit(toFiniteNumberOr(setRow.target_distance, 0), userContext?.distance_unit);
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
  'You are an expert strength and hypertrophy coach.',
  'Return strict JSON only. No markdown. No explanations.',
  'Use only exercise_name values from the provided candidate list.',
  'Never invent exercises, names, fields, or enum values.',
  'Preserve the output schema exactly.',
  'Keep exactly the requested number of training days and weeks.',
  'Each day must contain 3 to 7 exercises, while fitting the selected session length.',
  'For non-cardio exercises, include at least 2 sets.',
  'For cardio/duration/distance exercises, 1+ set is allowed.',
  'For every exercise, sets array length must equal target_sets.',
  'Do not include redundant exercise-level target_sets or target_reps fields; they are derived server-side from sets.',
  'Set numbers must be contiguous starting at 1.',
  'No duplicate exercises within the same day.',
  'Avoid repeating the same exercise on multiple days unless clearly necessary.',
  'For multi-week plans, exercises should remain the same from week to week for a given day; progression should come from load, reps, sets, RIR, duration, or distance, not from swapping exercises.',
  'Create week-to-week progression through sets, reps, target_weight, target_rir, target_duration, or target_distance as appropriate.',
  'Build a practical, balanced, recoverable program that respects equipment, session length, goal, experience, focus muscle, and available user body metrics.',
  'Use sex, height, weight, goal, and experience to choose practical starting loads and session difficulty.',
  'Apply only a slight focus-muscle bias. Do not unbalance the program.',
  'Order exercises well: main compounds first, then secondary lifts, then isolations, then core or finishers.',
  'Use realistic sets, reps, weights, durations, distances, and RIR based on exercise type and user profile.',
  'Fill every relevant target field for each exercise. Only leave a field null when that exercise type does not use it.',
  'For dumbbells, target_weight means per hand unless the exercise is clearly single-arm.',
  'For bodyweight, assisted, duration-only, and cardio movements, target_weight should usually be null.',
  'Prefer conservative, achievable starting weights over aggressive guesses.',
  'Strength: emphasize stable compounds and lower reps on main lifts.',
  'Muscle gain: emphasize hypertrophy-friendly compounds plus isolations.',
  'Fat loss: keep sessions efficient and include cardio staples.',
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
            'For every exercise, sets.length must equal target_sets.',
            'For non-cardio exercises, require at least 2 sets.',
            'For cardio/duration/distance exercises, 1+ set is allowed.',
            'Do not include exercise-level target_sets or target_reps; they are derived server-side from sets.',
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
                    sort_order: 'number',
                    sets: [
                      {
                        set_number: 'number (contiguous sequence from 1 to sets.length)',
                        target_weight: 'number',
                        target_reps_min: 'number',
                        target_reps_max: 'number',
                        target_rir: 'number|null',
                        target_duration: 'number',
                        target_distance: 'number',
                        is_warmup: 'boolean',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }
      : {
      task: 'Design a personalized high-quality routine from scratch based on the user profile and preferences. Follow the strict number ofdays request. Balance the routine, only slight bias for a focus muscle group.',
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
        exercises_per_day_min: 3,
        exercises_per_day_max: 7,
        non_cardio_sets_per_exercise_min: 2,
        cardio_sets_per_exercise_min: 1,
        set_numbers_must_be_contiguous_from_1: true,
        focus_muscle_bias: 'very_slight',
        rewrite_freedom: {
          split_style: 'high',
          day_labels: 'high',
          exercise_selection: 'high',
          set_rep_structure: 'medium_high',
        },
        training_quality_priorities: [
          'exercise quality',
          'fatigue management',
          'goal alignment',
          'equipment fit',
          'session length fit',
          'balanced weekly coverage',
        ],
        exercise_ordering: [
          'main compound first',
          'secondary compound second',
          'isolations after compounds',
          'core or least technical work near the end'
        ],
        avoid: [
          'invalid exercise names',
          'duplicate exercises across the same day',
          'too many near-identical movement patterns in one session',
          'unbalanced weekly volume',
          'advanced complexity for beginners',
          'unrealistic volume for 30-minute sessions',
        ]
      },
      routine_design_guidance: {
        by_days_per_week: {
          3: 'Prefer full body or upper/lower/full body style distribution',
          4: 'Prefer upper/lower, torso/limbs, or balanced hypertrophy split.',
          5: 'Prefer body groups emphasis. '
        },
        by_goal: {
          muscle_gain: 'Use mostly hypertrophy-friendly exercise selection and set/rep schemes. Usually compounds plus isolations. Most working sets in roughly the 4-12 rep range.',
          strength: 'Center each day around stable, high-value compound lifts. Main lifts can use lower reps. Accessories should support strength without excessive fatigue.',
          fat_loss: 'Keep sessions efficient. Favor practical exercise density, moderate volume, simple exercise transitions, and good whole-body training stimulus. And Some cardio',
          general_fitness: 'Keep the plan balanced, sustainable, and broadly effective across all major muscle groups. Bit of cardio.'
        },
        by_experience: {
          beginner: 'Prefer simple, stable, easy-to-learn exercises. Avoid overly technical or unnecessarily fatiguing combinations.',
          intermediate: 'Use standard gym staples with moderate variety and moderate training volume.',
          advanced: 'Allow somewhat greater specificity and volume, but keep the routine practical and coherent.'
        },
        by_session_length: {
          30: 'Keep sessions compact. Usually 3-4 exercises withfewer sets.',
          45: 'Usually 4-6 exercises with balanced volume.',
          60: 'Usually 5-7 exercises.'
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
                sort_order: 'number',
                sets: [
                  {
                    set_number: 'number (contiguous sequence from 1 to sets.length). Non-cardio muset have at least 2 sets.',
                    target_weight: 'number non-null',
                    target_reps_min: 'number',
                    target_reps_max: 'number',
                    target_rir: 'number|null',
                    target_duration: 'number in seconds',
                    target_distance: 'number',
                    is_warmup: 'boolean',
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
        temperature: 0.7,
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
      refined = normalizeAiDraft(parsed, allowedExercises, userContext);
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
