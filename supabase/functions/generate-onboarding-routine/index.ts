import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { buildDraftWithOptionalAi } from './pipeline.ts';
import { filterExercisesForAnswers, validateRoutineDraft } from './generator.ts';
import {
  GenerateOnboardingRoutineRequest,
  GenerateOnboardingRoutineResponse,
  GenerationMode,
  OnboardingRoutineAnswers,
  RoutineWeekCount,
  RoutineDraft,
  UserProfileContext,
} from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WEEK_COUNT_BY_MODE: Record<GenerationMode, number> = {
  template: 4,
  ai: 2,
};

function isValidWeekCount(value: unknown): value is RoutineWeekCount {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

function resolveWeekCount(mode: GenerationMode, value: unknown): RoutineWeekCount {
  if (isValidWeekCount(value)) return value;
  return WEEK_COUNT_BY_MODE[mode] as RoutineWeekCount;
}

type StartPayload = {
  action: 'start';
  mode: GenerationMode;
  answers: OnboardingRoutineAnswers;
  week_count?: RoutineWeekCount;
};

type StatusPayload = {
  action: 'status';
  job_id: string;
};

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

interface JobRow {
  id: string;
  status: JobStatus;
  generation_mode_used: GenerateOnboardingRoutineResponse['generation_mode_used'] | null;
  routine_id: string | null;
  routine_name: string | null;
  error_message: string | null;
}

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
    (v.session_minutes === 30 || v.session_minutes === 60 || v.session_minutes === 90) &&
    (v.goal === 'muscle_gain' || v.goal === 'fat_loss' || v.goal === 'general_fitness') &&
    (v.experience === 'beginner' || v.experience === 'intermediate' || v.experience === 'advanced') &&
    (v.equipment === 'full_gym' || v.equipment === 'dumbbells_bench' || v.equipment === 'bodyweight_minimal') &&
    (
      v.focus_muscle === 'none' ||
      v.focus_muscle === 'chest' ||
      v.focus_muscle === 'back' ||
      v.focus_muscle === 'shoulders' ||
      v.focus_muscle === 'arms' ||
      v.focus_muscle === 'biceps' ||
      v.focus_muscle === 'triceps' ||
      v.focus_muscle === 'legs' ||
      v.focus_muscle === 'glutes' ||
      v.focus_muscle === 'core'
    )
  );
}

function isValidRepairContext(value: unknown): value is NonNullable<GenerateOnboardingRoutineRequest['repair_context']> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.validation_errors) && 'previous_output' in v;
}

function isLegacyPayload(value: unknown): value is GenerateOnboardingRoutineRequest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mode === 'template' || v.mode === 'ai') &&
    isValidAnswers(v.answers) &&
    (v.week_count == null || isValidWeekCount(v.week_count)) &&
    (v.repair_context == null || isValidRepairContext(v.repair_context))
  );
}

function isStartPayload(value: unknown): value is StartPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.action === 'start' &&
    (v.mode === 'template' || v.mode === 'ai') &&
    isValidAnswers(v.answers) &&
    (v.week_count == null || isValidWeekCount(v.week_count))
  );
}

function isStatusPayload(value: unknown): value is StatusPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.action === 'status' && typeof v.job_id === 'string' && v.job_id.length > 0;
}

async function authenticateRequest(args: {
  request: Request;
  supabaseUrl: string;
  supabasePublishableKey: string;
}): Promise<{ supabase: ReturnType<typeof createClient>; userId: string; authHeader: string } | null> {
  const { request, supabaseUrl, supabasePublishableKey } = args;
  const authHeader =
    request.headers.get('Authorization') ??
    request.headers.get('authorization') ??
    '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: authHeader
        ? {
            Authorization: authHeader,
          }
        : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (authError || !authData?.user) {
    console.error('auth.getUser failed', {
      message: authError?.message ?? null,
      hasAuthorizationHeader: Boolean(authHeader),
      hasBearerToken: Boolean(token),
    });
    return null;
  }

  return { supabase, userId: authData.user.id, authHeader };
}

async function persistDraft(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  draft: RoutineDraft;
}): Promise<{ routineId: string; routineName: string }> {
  const { supabase, userId, draft } = args;
  const weekCount = Math.max(1, ...draft.days.map((day) => day.week_index || 1));

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
      week_count: weekCount,
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
          week_index: day.week_index,
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

async function fetchUserContext(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
}): Promise<UserProfileContext | null> {
  const { supabase, userId } = args;
  const { data: userProfile, error: userProfileError } = await supabase
    .from('user_profiles')
    .select('sex, height_cm, weight_kg, height_unit, weight_unit, distance_unit')
    .eq('id', userId)
    .maybeSingle();

  if (userProfileError) {
    console.warn(
      JSON.stringify({
        event: 'routine_generation_profile_context',
        user_id: userId,
        status: 'profile_lookup_failed',
        error_message: userProfileError.message,
      }),
    );
    return null;
  }

  console.log(
    JSON.stringify({
      event: 'routine_generation_profile_context',
      user_id: userId,
      has_sex: Boolean(userProfile?.sex),
      has_height_cm: userProfile?.height_cm != null,
      has_weight_kg: userProfile?.weight_kg != null,
    }),
  );

  if (!userProfile) return null;

  return {
    sex:
      userProfile.sex === 'male' || userProfile.sex === 'female' || userProfile.sex === 'other'
        ? userProfile.sex
        : null,
    height_cm: typeof userProfile.height_cm === 'number' ? userProfile.height_cm : null,
    weight_kg: typeof userProfile.weight_kg === 'number' ? userProfile.weight_kg : null,
    height_unit: userProfile.height_unit === 'in' || userProfile.height_unit === 'cm' ? userProfile.height_unit : null,
    weight_unit: userProfile.weight_unit === 'lbs' || userProfile.weight_unit === 'kg' ? userProfile.weight_unit : null,
    distance_unit: userProfile.distance_unit === 'miles' || userProfile.distance_unit === 'km' ? userProfile.distance_unit : null,
  };
}

async function generateAndPersistRoutine(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  mode: GenerationMode;
  answers: OnboardingRoutineAnswers;
  weekCount: RoutineWeekCount;
  repairContext?: NonNullable<GenerateOnboardingRoutineRequest['repair_context']> | null;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { supabase, userId, mode, answers, weekCount, repairContext } = args;
  const generationWeekCount = 1;
  const userContext = await fetchUserContext({ supabase, userId });

  const exerciseSelect = 'id, name, muscle_group, equipment, exercise_type, difficulty_tier, movement_pattern, user_id';
  const { data: curatedRows, error: curatedError } = await supabase
    .from('exercises')
    .select(exerciseSelect)
    .is('user_id', null)
    .eq('is_ai_routine_candidate', true);

  let exerciseLibrary = curatedRows ?? [];

  if (curatedError) {
    // Backward-compatible fallback when the new column is not available yet.
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('exercises')
      .select(exerciseSelect)
      .is('user_id', null);
    if (fallbackError) {
      throw new Error(`Failed to load exercise library: ${fallbackError.message}`);
    }
    exerciseLibrary = fallbackRows ?? [];
  } else if (exerciseLibrary.length === 0) {
    // Safety net for environments where the flag exists but has not been curated yet.
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('exercises')
      .select(exerciseSelect)
      .is('user_id', null);
    if (fallbackError) {
      throw new Error(`Failed to load exercise library fallback: ${fallbackError.message}`);
    }
    exerciseLibrary = fallbackRows ?? [];

    console.warn(
      JSON.stringify({
        event: 'routine_generation_library_fallback',
        user_id: userId,
        reason: 'no_curated_ai_candidates',
      }),
    );
  }

  const filteredExercises = filterExercisesForAnswers(exerciseLibrary, answers);

  const { draft, generationModeUsed } = await buildDraftWithOptionalAi({
    mode,
    answers,
    exercises: filteredExercises,
    userContext,
    weekCount: generationWeekCount,
    repairContext: repairContext ?? null,
    openAiApiKey: Deno.env.get('OPENAI_API_KEY'),
    openAiModel: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4.1-mini',
  });

  const allowedIds = new Set(filteredExercises.map((item) => item.id));
  const weekOneValidationErrors = validateRoutineDraft(draft, allowedIds, answers.days_per_week, generationWeekCount);
  if (weekOneValidationErrors.length > 0) {
    throw new Error(`Generated week 1 draft invalid: ${weekOneValidationErrors.join('; ')}`);
  }

  const result = await persistDraft({
    supabase,
    userId,
    draft,
  });

  console.log(
    JSON.stringify({
      event: 'routine_generation_persisted',
      user_id: userId,
      requested_mode: mode,
      requested_week_count: weekCount,
      generation_mode_used: generationModeUsed,
      routine_id: result.routineId,
    }),
  );

  return {
    routine_id: result.routineId,
    routine_name: result.routineName,
    generation_mode_used: generationModeUsed,
  };
}

function extractRepairContext(error: unknown): NonNullable<GenerateOnboardingRoutineRequest['repair_context']> | null {
  if (!error || typeof error !== 'object' || !('repairContext' in error)) return null;
  const repairContext = (error as { repairContext?: unknown }).repairContext;
  if (!isValidRepairContext(repairContext)) return null;
  return repairContext;
}

interface ProcessJobArgs {
  supabaseUrl: string;
  supabasePublishableKey: string;
  authHeader: string;
  userId: string;
  jobId: string;
  mode: GenerationMode;
  answers: OnboardingRoutineAnswers;
  weekCount: RoutineWeekCount;
}

async function processRoutineJob(args: ProcessJobArgs): Promise<void> {
  const { supabaseUrl, supabasePublishableKey, authHeader, userId, jobId, mode, answers, weekCount } = args;
  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: authHeader
        ? {
            Authorization: authHeader,
          }
        : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const startedAt = new Date().toISOString();

  await supabase
    .from('routine_generation_jobs')
    .update({
      status: 'running',
      started_at: startedAt,
      updated_at: startedAt,
    })
    .eq('id', jobId)
    .eq('user_id', userId);

  try {
    let generated: GenerateOnboardingRoutineResponse;

    try {
      generated = await generateAndPersistRoutine({
        supabase,
        userId,
        mode,
        answers,
        weekCount,
      });
    } catch (error: unknown) {
      if (mode !== 'ai') {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        JSON.stringify({
          event: 'routine_generation_job_ai_fallback',
          user_id: userId,
          job_id: jobId,
          error_message: message,
        }),
      );

      const fallbackGenerated = await generateAndPersistRoutine({
        supabase,
        userId,
        mode: 'template',
        answers,
        weekCount,
      });

      generated = {
        ...fallbackGenerated,
        generation_mode_used: 'fallback_template',
      };
    }

    const completedAt = new Date().toISOString();
    await supabase
      .from('routine_generation_jobs')
      .update({
        status: 'completed',
        generation_mode_used: generated.generation_mode_used,
        routine_id: generated.routine_id,
        routine_name: generated.routine_name,
        error_message: null,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', jobId)
      .eq('user_id', userId);
  } catch (error: unknown) {
    const completedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);

    await supabase
      .from('routine_generation_jobs')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', jobId)
      .eq('user_id', userId);

    console.error(
      JSON.stringify({
        event: 'routine_generation_job_failed',
        user_id: userId,
        job_id: jobId,
        requested_mode: mode,
        error_message: message,
      }),
    );
  }
}

function scheduleJob(job: ProcessJobArgs): void {
  const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil: (task: Promise<unknown>) => void } }).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(processRoutineJob(job));
    return;
  }

  void processRoutineJob(job);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabasePublishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabasePublishableKey) {
    return jsonResponse({ error: 'Supabase environment variables are not configured.' }, 500);
  }

  const auth = await authenticateRequest({
    request,
    supabaseUrl,
    supabasePublishableKey,
  });
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  if (isStartPayload(body)) {
    const nowIso = new Date().toISOString();
    const weekCount = resolveWeekCount(body.mode, body.week_count);
    const { data: createdJob, error: createJobError } = await auth.supabase
      .from('routine_generation_jobs')
      .insert({
        user_id: auth.userId,
        mode: body.mode,
        status: 'queued',
        answers: body.answers,
        week_count: weekCount,
        updated_at: nowIso,
      })
      .select('id, status')
      .single();

    if (createJobError) {
      return jsonResponse({ error: `Failed to create generation job: ${createJobError.message}` }, 500);
    }

    scheduleJob({
      supabaseUrl,
      supabasePublishableKey,
      authHeader: auth.authHeader,
      userId: auth.userId,
      jobId: createdJob.id,
      mode: body.mode,
      answers: body.answers,
      weekCount,
    });

    return jsonResponse(
      {
        job_id: createdJob.id,
        status: createdJob.status,
      },
      202,
    );
  }

  if (isStatusPayload(body)) {
    const { data: job, error: jobError } = await auth.supabase
      .from('routine_generation_jobs')
      .select('id, status, generation_mode_used, routine_id, routine_name, error_message')
      .eq('id', body.job_id)
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (jobError) {
      return jsonResponse({ error: `Failed to fetch generation job: ${jobError.message}` }, 500);
    }
    if (!job) {
      return jsonResponse({ error: 'Job not found' }, 404);
    }

    const typedJob = job as JobRow;
    if (typedJob.status === 'completed' && typedJob.routine_id && typedJob.routine_name && typedJob.generation_mode_used) {
      return jsonResponse({
        status: 'completed',
        routine_id: typedJob.routine_id,
        routine_name: typedJob.routine_name,
        generation_mode_used: typedJob.generation_mode_used,
      });
    }

    if (typedJob.status === 'failed') {
      return jsonResponse({
        status: 'failed',
        error: typedJob.error_message ?? 'Routine generation failed.',
      });
    }

    return jsonResponse({
      status: typedJob.status,
    });
  }

  if (isLegacyPayload(body)) {
    try {
      const generated = await generateAndPersistRoutine({
        supabase: auth.supabase,
        userId: auth.userId,
        mode: body.mode,
        answers: body.answers,
        weekCount: resolveWeekCount(body.mode, body.week_count),
        repairContext: body.repair_context ?? null,
      });
      return jsonResponse(generated satisfies GenerateOnboardingRoutineResponse);
    } catch (error: unknown) {
      const repairContext = extractRepairContext(error);
      return jsonResponse(
        {
          error: (error as Error).message || 'Failed to generate routine.',
          ...(repairContext ? { repair_context: repairContext } : {}),
        },
        500,
      );
    }
  }

  return jsonResponse({ error: 'Invalid payload shape.' }, 400);
});
