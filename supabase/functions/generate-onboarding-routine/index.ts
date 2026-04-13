import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import {
  filterExercisesForAnswers,
  validateRoutineDraft,
} from './generator.ts';
import { buildDraftWithOptionalAi } from './pipeline.ts';
import {
  GenerateOnboardingRoutineRequest,
  GenerateOnboardingRoutineResponse,
  OnboardingRoutineAnswers,
  RoutineDraft,
} from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isValidAnswers(value: unknown): value is OnboardingRoutineAnswers {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    (v.days_per_week === 3 || v.days_per_week === 4 || v.days_per_week === 5) &&
    (v.session_minutes === 30 || v.session_minutes === 45 || v.session_minutes === 60) &&
    (v.goal === 'muscle_gain' || v.goal === 'strength' || v.goal === 'fat_loss' || v.goal === 'general_fitness') &&
    (v.experience === 'beginner' || v.experience === 'intermediate' || v.experience === 'advanced') &&
    (v.equipment === 'full_gym' || v.equipment === 'dumbbells_bench' || v.equipment === 'bodyweight_minimal') &&
    (
      v.focus_muscle === 'none' ||
      v.focus_muscle === 'chest' ||
      v.focus_muscle === 'back' ||
      v.focus_muscle === 'shoulders' ||
      v.focus_muscle === 'arms' ||
      v.focus_muscle === 'legs' ||
      v.focus_muscle === 'glutes' ||
      v.focus_muscle === 'core'
    )
  );
}

function isValidPayload(value: unknown): value is GenerateOnboardingRoutineRequest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (v.mode === 'template' || v.mode === 'ai') && isValidAnswers(v.answers);
}

async function persistDraft(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  draft: RoutineDraft;
}): Promise<{ routineId: string; routineName: string }> {
  const { supabase, userId, draft } = args;

  const { error: deactivateError } = await supabase
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', userId);
  if (deactivateError) throw deactivateError;

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({
      user_id: userId,
      name: draft.routine_name,
      is_active: true,
      week_count: 1,
      current_week: 1,
      current_week_started_at: new Date().toISOString(),
    })
    .select('id, name')
    .single();
  if (routineError) throw routineError;

  try {
    for (const day of draft.days) {
      const { data: createdDay, error: dayError } = await supabase
        .from('routine_days')
        .insert({
          routine_id: routine.id,
          day_of_week: day.day_of_week,
          label: day.label,
          week_index: 1,
        })
        .select('id')
        .single();
      if (dayError) throw dayError;

      for (let index = 0; index < day.exercises.length; index += 1) {
        const exercise = day.exercises[index];
        const sets = [...exercise.sets].sort((a, b) => a.set_number - b.set_number);

        const { data: createdEntry, error: entryError } = await supabase
          .from('routine_day_exercises')
          .insert({
            routine_day_id: createdDay.id,
            exercise_id: exercise.exercise_id,
            sort_order: index,
            target_sets: sets.length,
            target_reps: sets[0]?.target_reps_min ?? 8,
          })
          .select('id')
          .single();
        if (entryError) throw entryError;

        const setRows = sets.map((setRow, setIndex) => ({
          routine_day_exercise_id: createdEntry.id,
          set_number: setIndex + 1,
          target_weight: setRow.target_weight,
          target_reps_min: setRow.target_reps_min,
          target_reps_max: setRow.target_reps_max,
          target_rir: setRow.target_rir,
          target_duration: setRow.target_duration,
          target_distance: setRow.target_distance,
          is_warmup: setRow.is_warmup ?? false,
        }));

        const { error: setsError } = await supabase
          .from('routine_day_exercise_sets')
          .insert(setRows);
        if (setsError) throw setsError;
      }
    }
  } catch (error) {
    await supabase.from('routines').delete().eq('id', routine.id);
    throw error;
  }

  return { routineId: routine.id, routineName: routine.name };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Supabase environment variables are not configured.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }
  if (!isValidPayload(body)) {
    return jsonResponse({ error: 'Invalid payload shape.' }, 400);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
const token = authHeader.replace(/^Bearer\s+/i, '');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: authHeader,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

if (!token) {
  return jsonResponse({ error: 'Missing bearer token' }, 401);
}

const { data: authData, error: authError } = await supabase.auth.getUser(token);

if (authError || !authData?.user) {
  console.error('auth.getUser failed', authError);
  return jsonResponse(
    { error: authError?.message ?? 'Unauthorized' },
    401
  );
}

const userId = authData.user.id;

  const { data: exerciseRows, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment, exercise_type, secondary_muscles, user_id')
    .is('user_id', null);
  if (exercisesError) {
    return jsonResponse({ error: `Failed to load exercise library: ${exercisesError.message}` }, 500);
  }

  const { draft, generationModeUsed } = await buildDraftWithOptionalAi({
    mode: body.mode,
    answers: body.answers,
    exercises: exerciseRows,
    openAiApiKey: Deno.env.get('OPENAI_API_KEY'),
    openAiModel: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4.1-mini',
  });

  const allowedIds = new Set(filterExercisesForAnswers(exerciseRows, body.answers).map((item) => item.id));
  const validationErrors = validateRoutineDraft(draft, allowedIds, body.answers.days_per_week);
  if (validationErrors.length > 0) {
    return jsonResponse({ error: `Generated draft invalid: ${validationErrors[0]}` }, 500);
  }

  try {
    const result = await persistDraft({
      supabase,
      userId,
      draft,
    });

    return jsonResponse({
      routine_id: result.routineId,
      routine_name: result.routineName,
      generation_mode_used: generationModeUsed,
    } satisfies GenerateOnboardingRoutineResponse);
  } catch (error: unknown) {
    return jsonResponse(
      { error: (error as Error).message || 'Failed to persist generated routine.' },
      500,
    );
  }
});
