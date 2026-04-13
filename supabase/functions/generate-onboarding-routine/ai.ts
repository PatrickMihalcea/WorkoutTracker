import {
  ExerciseRow,
  OnboardingRoutineAnswers,
  RoutineDraft,
} from './types.ts';
import { validateRoutineDraft } from './generator.ts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT_MS = 12_000;

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

export async function refineDraftWithAi(args: {
  apiKey: string;
  model: string;
  answers: OnboardingRoutineAnswers;
  baseDraft: RoutineDraft;
  allowedExercises: ExerciseRow[];
}): Promise<RoutineDraft> {
  const { apiKey, model, answers, baseDraft, allowedExercises } = args;
  const allowedIds = new Set(allowedExercises.map((item) => item.id));

  const candidateList = allowedExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    equipment: exercise.equipment,
    exercise_type: exercise.exercise_type,
  }));

  const systemPrompt = [
    'You create safe beginner-friendly workout templates.',
    'Return strict JSON only, no markdown.',
    'Use only exercise_id values from the provided candidate list.',
    'Keep exactly the same number of days as the base draft.',
    'Keep each day between 3 and 7 exercises.',
    'Respect provided constraints and preserve a balanced full-program structure.',
    'Apply only a slight emphasis to focus muscle if requested.',
  ].join(' ');

  const userPrompt = JSON.stringify(
    {
      task: 'Refine the base routine template with slight personalization.',
      constraints: {
        library_only: true,
        use_only_these_exercise_ids: true,
        expected_days: baseDraft.days.length,
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
            week_index: 1,
            exercises: [
              {
                exercise_id: 'string',
                sort_order: 'number',
                target_sets: 'number',
                target_reps: 'number',
                sets: [
                  {
                    set_number: 'number',
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
    },
    null,
    2,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
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
      throw new Error(`OpenAI error: ${response.status} ${body}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty response content');

    const maybeJson = extractJsonObject(content);
    if (!maybeJson) throw new Error('OpenAI response did not contain JSON');

    const refined = safeJsonParse<RoutineDraft>(maybeJson);
    if (!refined) throw new Error('OpenAI JSON could not be parsed');

    const errors = validateRoutineDraft(refined, allowedIds, baseDraft.days.length);
    if (errors.length > 0) {
      throw new Error(`AI draft validation failed: ${errors.slice(0, 3).join('; ')}`);
    }

    return refined;
  } finally {
    clearTimeout(timeout);
  }
}
