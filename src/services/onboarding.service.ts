import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GenerateOnboardingRoutineRequest,
  GenerateOnboardingRoutineResponse,
  OnboardingRoutineGenerationMode,
} from '../models/onboarding';
import { routineService } from './routine.service';
import { supabase } from './supabase';

const DEFAULT_WEEK_COUNT_BY_MODE: Record<OnboardingRoutineGenerationMode, number> = {
  template: 4,
  ai: 2,
};

const MAX_AI_NEW_CALL_ATTEMPTS = 2;
const PENDING_ROUTINE_GENERATION_KEY = 'pending_routine_generation';
const ROUTINE_GENERATION_POLL_INTERVAL_MS = 2500;
const ROUTINE_GENERATION_STALE_AFTER_MS = 15 * 60 * 1000;

type RepairContext = NonNullable<GenerateOnboardingRoutineRequest['repair_context']>;
type RoutineGenerationContext = 'onboarding' | 'routine';
export type AiRoutineAccessStatus = 'premium' | 'free' | 'locked' | 'in_progress';

interface PendingRoutineGeneration {
  jobId: string;
  context: RoutineGenerationContext;
  payload: GenerateOnboardingRoutineRequest;
  createdAt: string;
}

interface RoutineGenerationJobHeartbeatRow {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  started_at: string | null;
}

type RoutineGenerationJobStatus =
  | { status: 'queued' | 'running' }
  | { status: 'failed'; error: string }
  | { status: 'completed'; result: GenerateOnboardingRoutineResponse };

class RoutineGenerationInvokeError extends Error {
  repairContext: RepairContext | null;

  constructor(message: string, repairContext: RepairContext | null = null) {
    super(message);
    this.name = 'RoutineGenerationInvokeError';
    this.repairContext = repairContext;
  }
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const maybeError = (payload as { error?: unknown }).error;
  return typeof maybeError === 'string' && maybeError.length > 0 ? maybeError : null;
}

function extractRepairContextFromPayload(payload: unknown): RepairContext | null {
  if (!payload || typeof payload !== 'object') return null;
  const maybeRepair = (payload as { repair_context?: unknown }).repair_context;
  if (!maybeRepair || typeof maybeRepair !== 'object') return null;

  const candidate = maybeRepair as {
    validation_errors?: unknown;
    previous_output?: unknown;
  };

  if (!Array.isArray(candidate.validation_errors)) return null;

  return {
    validation_errors: candidate.validation_errors.filter(
      (item): item is string => typeof item === 'string',
    ),
    previous_output: candidate.previous_output,
  };
}

async function readContextErrorMessage(error: unknown): Promise<string | null> {
  if (!error || typeof error !== 'object') return null;

  const context = (
    error as {
      context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
    }
  ).context;

  if (!context) return null;

  try {
    if (typeof context.json === 'function') {
      const payload = await context.json();
      const fromPayload = extractMessageFromPayload(payload);
      if (fromPayload) return fromPayload;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof context.text === 'function') {
      const text = await context.text();
      if (text && text.trim().length > 0) return text;
    }
  } catch {
    // ignore
  }

  return null;
}

async function readContextPayload(error: unknown): Promise<unknown | null> {
  if (!error || typeof error !== 'object') return null;

  const context = (
    error as {
      context?: { json?: () => Promise<unknown> };
    }
  ).context;

  if (!context || typeof context.json !== 'function') return null;

  try {
    return await context.json();
  } catch {
    return null;
  }
}

function isRetryableAiError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('ai draft validation failed') ||
    normalized.includes('generated week 1 draft invalid') ||
    normalized.includes('openai') ||
    normalized.includes('signal has been aborted') ||
    normalized.includes('edge function returned non-2xx status code')
  );
}

function getTargetWeekCount(payload: GenerateOnboardingRoutineRequest): number {
  return payload.week_count ?? DEFAULT_WEEK_COUNT_BY_MODE[payload.mode];
}

function isValidPendingRoutineGeneration(value: unknown): value is PendingRoutineGeneration {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as {
    jobId?: unknown;
    context?: unknown;
    payload?: unknown;
    createdAt?: unknown;
  };

  if (typeof candidate.jobId !== 'string' || candidate.jobId.length === 0) return false;
  if (candidate.context !== 'onboarding' && candidate.context !== 'routine') return false;
  if (typeof candidate.createdAt !== 'string' || candidate.createdAt.length === 0) return false;

  const payload = candidate.payload as Partial<GenerateOnboardingRoutineRequest> | undefined;
  if (!payload || typeof payload !== 'object') return false;
  if (payload.mode !== 'ai' && payload.mode !== 'template') return false;
  if (!payload.answers || typeof payload.answers !== 'object') return false;

  return true;
}

function getRoutineGenerationJobHeartbeatMs(job: Pick<RoutineGenerationJobHeartbeatRow, 'created_at' | 'updated_at' | 'started_at'>): number {
  const timestamp = job.updated_at || job.started_at || job.created_at;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRoutineGenerationJobStale(job: Pick<RoutineGenerationJobHeartbeatRow, 'created_at' | 'updated_at' | 'started_at'>): boolean {
  const heartbeatMs = getRoutineGenerationJobHeartbeatMs(job);
  if (!heartbeatMs) return false;
  return Date.now() - heartbeatMs > ROUTINE_GENERATION_STALE_AFTER_MS;
}

async function expireStaleRoutineGenerationJob(args: {
  jobId: string;
  userId: string;
}): Promise<void> {
  const { jobId, userId } = args;
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('routine_generation_jobs')
    .update({
      status: 'failed',
      error_message: 'Routine generation timed out. Please try again.',
      completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .in('status', ['queued', 'running']);

  if (error) throw error;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to create a routine.');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function readPendingRoutineGeneration(): Promise<PendingRoutineGeneration | null> {
  const raw = await AsyncStorage.getItem(PENDING_ROUTINE_GENERATION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidPendingRoutineGeneration(parsed)) {
      await AsyncStorage.removeItem(PENDING_ROUTINE_GENERATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    await AsyncStorage.removeItem(PENDING_ROUTINE_GENERATION_KEY);
    return null;
  }
}

async function writePendingRoutineGeneration(pending: PendingRoutineGeneration): Promise<void> {
  await AsyncStorage.setItem(PENDING_ROUTINE_GENERATION_KEY, JSON.stringify(pending));
}

async function clearPendingRoutineGeneration(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_ROUTINE_GENERATION_KEY);
}

async function invokeGenerateRoutine(args: {
  payload: GenerateOnboardingRoutineRequest;
  headers: Record<string, string>;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { payload, headers } = args;

  const { data, error } = await supabase.functions.invoke('generate-onboarding-routine', {
    body: {
      mode: payload.mode,
      answers: payload.answers,
      week_count: 1,
      repair_context: payload.repair_context,
    },
    headers,
  });

  if (error) {
    const contextPayload = await readContextPayload(error);
    const contextRepair = extractRepairContextFromPayload(contextPayload);
    const contextMessage = await readContextErrorMessage(error);
    const payloadMessage = extractMessageFromPayload(data ?? contextPayload);
    const payloadRepair = extractRepairContextFromPayload(data ?? contextPayload);
    const message =
      contextMessage ?? payloadMessage ?? error.message ?? 'Routine generation failed.';
    throw new RoutineGenerationInvokeError(message, payloadRepair ?? contextRepair);
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('routine_id' in data) ||
    !('routine_name' in data) ||
    !('generation_mode_used' in data)
  ) {
    throw new Error('Routine generation returned an unexpected response.');
  }

  return data as GenerateOnboardingRoutineResponse;
}

async function invokeFastFallbackRoutine(args: {
  payload: GenerateOnboardingRoutineRequest;
  headers: Record<string, string>;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { payload, headers } = args;

  const generated = await invokeGenerateRoutine({
    payload: {
      ...payload,
      mode: 'template',
      week_count: 1,
      repair_context: undefined,
    },
    headers,
  });

  return {
    ...generated,
    generation_mode_used: 'fallback_template',
  };
}

async function invokeStartRoutineGenerationJob(args: {
  payload: GenerateOnboardingRoutineRequest;
  headers: Record<string, string>;
}): Promise<{ job_id: string; status: 'queued' | 'running' }> {
  const { payload, headers } = args;
  const { data, error } = await supabase.functions.invoke('generate-onboarding-routine', {
    body: {
      action: 'start',
      mode: payload.mode,
      answers: payload.answers,
      week_count: getTargetWeekCount(payload),
    },
    headers,
  });

  if (error) {
    const contextPayload = await readContextPayload(error);
    const contextMessage = await readContextErrorMessage(error);
    const payloadMessage = extractMessageFromPayload(data ?? contextPayload);
    throw new Error(
      contextMessage ?? payloadMessage ?? error.message ?? 'Could not start routine generation.',
    );
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('job_id' in data) ||
    typeof data.job_id !== 'string' ||
    !('status' in data) ||
    (data.status !== 'queued' && data.status !== 'running')
  ) {
    throw new Error('Routine generation job returned an unexpected response.');
  }

  return {
    job_id: data.job_id,
    status: data.status,
  };
}

async function invokeRoutineGenerationJobStatus(args: {
  jobId: string;
  headers: Record<string, string>;
}): Promise<RoutineGenerationJobStatus> {
  const { jobId, headers } = args;
  const { data, error } = await supabase.functions.invoke('generate-onboarding-routine', {
    body: {
      action: 'status',
      job_id: jobId,
    },
    headers,
  });

  if (error) {
    const contextPayload = await readContextPayload(error);
    const contextMessage = await readContextErrorMessage(error);
    const payloadMessage = extractMessageFromPayload(data ?? contextPayload);
    throw new Error(
      contextMessage ?? payloadMessage ?? error.message ?? 'Could not check routine generation status.',
    );
  }

  if (!data || typeof data !== 'object' || !('status' in data)) {
    throw new Error('Routine generation status returned an unexpected response.');
  }

  if (data.status === 'queued' || data.status === 'running') {
    return { status: data.status };
  }

  if (data.status === 'failed') {
    return {
      status: 'failed',
      error: extractMessageFromPayload(data) ?? 'Routine generation failed.',
    };
  }

  if (
    data.status === 'completed' &&
    'routine_id' in data &&
    typeof data.routine_id === 'string' &&
    'routine_name' in data &&
    typeof data.routine_name === 'string' &&
    'generation_mode_used' in data
  ) {
    return {
      status: 'completed',
      result: data as GenerateOnboardingRoutineResponse,
    };
  }

  throw new Error('Routine generation status returned an unexpected response.');
}

async function ensureAdditionalWeeks(args: {
  routineId: string;
  targetWeekCount: number;
}): Promise<void> {
  const { routineId, targetWeekCount } = args;
  if (targetWeekCount <= 1) return;

  await routineService.buildRoutineWeeksFromBaseline({
    routineId,
    baselineWeekIndex: 1,
    totalWeekCount: targetWeekCount,
  });
}

async function finalizeCompletedRoutineGeneration(args: {
  pending: PendingRoutineGeneration;
  result: GenerateOnboardingRoutineResponse;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { pending, result } = args;

  await ensureAdditionalWeeks({
    routineId: result.routine_id,
    targetWeekCount: getTargetWeekCount(pending.payload),
  });

  await clearPendingRoutineGeneration();
  return result;
}

async function waitForRoutineGenerationCompletion(args: {
  pending: PendingRoutineGeneration;
  headers: Record<string, string>;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { pending, headers } = args;

  for (;;) {
    const status = await invokeRoutineGenerationJobStatus({
      jobId: pending.jobId,
      headers,
    });

    if (status.status === 'queued' || status.status === 'running') {
      await new Promise((resolve) => setTimeout(resolve, ROUTINE_GENERATION_POLL_INTERVAL_MS));
      continue;
    }

    if (status.status === 'failed') {
      await clearPendingRoutineGeneration();
      throw new Error(status.error);
    }

    if (status.status !== 'completed') {
      throw new Error('Routine generation status returned an unexpected response.');
    }

    return finalizeCompletedRoutineGeneration({
      pending,
      result: status.result,
    });
  }
}

async function generateFirstRoutineForeground(
  payload: GenerateOnboardingRoutineRequest,
): Promise<GenerateOnboardingRoutineResponse> {
  const targetWeekCount = getTargetWeekCount(payload);
  const headers = await getAuthHeaders();

  const maxAttempts = payload.mode === 'ai' ? MAX_AI_NEW_CALL_ATTEMPTS : 1;
  let generated: GenerateOnboardingRoutineResponse | null = null;
  let lastError: Error | null = null;
  let repairContext: RepairContext | null = payload.repair_context ?? null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      generated = await invokeGenerateRoutine({
        payload: {
          ...payload,
          week_count: 1,
          repair_context: repairContext ?? undefined,
        },
        headers,
      });
      break;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (error instanceof RoutineGenerationInvokeError && error.repairContext) {
        repairContext = error.repairContext;
      }

      const shouldRetry =
        payload.mode === 'ai' &&
        attempt < maxAttempts &&
        isRetryableAiError(err.message);

      if (!shouldRetry) {
        break;
      }

      console.warn(
        `[onboarding] AI generation attempt ${attempt}/${maxAttempts} failed; retrying as a new call: ${err.message}`,
      );
    }
  }

  if (!generated) {
    if (payload.mode === 'ai' && !__DEV__) {
      console.warn(
        `[onboarding] AI routine generation failed after ${maxAttempts} attempt(s); falling back to fast generation: ${lastError?.message ?? 'unknown error'}`,
      );
      generated = await invokeFastFallbackRoutine({ payload, headers });
    } else {
      throw lastError ?? new Error('Routine generation failed.');
    }
  }

  await ensureAdditionalWeeks({
    routineId: generated.routine_id,
    targetWeekCount,
  });

  return generated;
}

async function generateFirstRoutineInBackground(args: {
  payload: GenerateOnboardingRoutineRequest;
  context: RoutineGenerationContext;
}): Promise<GenerateOnboardingRoutineResponse> {
  const { payload, context } = args;
  const headers = await getAuthHeaders();
  const started = await invokeStartRoutineGenerationJob({ payload, headers });
  const pending: PendingRoutineGeneration = {
    jobId: started.job_id,
    context,
    payload,
    createdAt: new Date().toISOString(),
  };

  await writePendingRoutineGeneration(pending);
  return waitForRoutineGenerationCompletion({ pending, headers });
}

export const onboardingService = {
  async getAiRoutineAccessStatus(args?: {
    isPremium?: boolean;
  }): Promise<AiRoutineAccessStatus> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      throw new Error('You must be signed in to create a routine.');
    }

    const [{ data: generationJob, error: generationJobError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('routine_generation_jobs')
        .select('id, status, created_at, updated_at, started_at')
        .eq('user_id', userId)
        .eq('mode', 'ai')
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('ai_generation_credits, ai_generation_credits_refilled_at')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (generationJobError) throw generationJobError;
    if (profileError) throw profileError;

    const typedGenerationJob = generationJob as RoutineGenerationJobHeartbeatRow | null;

    if (typedGenerationJob?.status === 'queued' || typedGenerationJob?.status === 'running') {
      if (isRoutineGenerationJobStale(typedGenerationJob)) {
        await expireStaleRoutineGenerationJob({
          jobId: typedGenerationJob.id,
          userId,
        });
        await clearPendingRoutineGeneration();
      } else {
        return 'in_progress';
      }
    }

    const credits = profile?.ai_generation_credits ?? 0;
    if (credits > 0) {
      return args?.isPremium ? 'premium' : 'free';
    }

    if (args?.isPremium) {
      const now = new Date();
      const refilledAt = profile?.ai_generation_credits_refilled_at
        ? new Date(profile.ai_generation_credits_refilled_at)
        : null;
      const refillDue = !refilledAt
        || refilledAt.getUTCFullYear() !== now.getUTCFullYear()
        || refilledAt.getUTCMonth() !== now.getUTCMonth();

      if (refillDue) {
        return 'premium';
      }
    }

    return 'locked';
  },

  async getPendingRoutineGeneration(): Promise<PendingRoutineGeneration | null> {
    return readPendingRoutineGeneration();
  },

  async waitForPendingRoutineGenerationCompletion(args?: {
    pending?: PendingRoutineGeneration;
  }): Promise<GenerateOnboardingRoutineResponse> {
    const pending = args?.pending ?? await readPendingRoutineGeneration();
    if (!pending) {
      throw new Error('No routine generation is currently in progress.');
    }

    const headers = await getAuthHeaders();
    return waitForRoutineGenerationCompletion({ pending, headers });
  },

  async resumePendingRoutineGeneration(): Promise<
    | { status: 'none' }
    | { status: 'running'; pending: PendingRoutineGeneration }
    | { status: 'failed'; pending: PendingRoutineGeneration; error: Error }
    | { status: 'completed'; pending: PendingRoutineGeneration; result: GenerateOnboardingRoutineResponse }
  > {
    const pending = await readPendingRoutineGeneration();
    if (!pending) return { status: 'none' };

    const headers = await getAuthHeaders();
    const status = await invokeRoutineGenerationJobStatus({
      jobId: pending.jobId,
      headers,
    });

    if (status.status === 'queued' || status.status === 'running') {
      return {
        status: 'running',
        pending,
      };
    }

    if (status.status === 'failed') {
      await clearPendingRoutineGeneration();
      return {
        status: 'failed',
        pending,
        error: new Error(status.error),
      };
    }

    if (status.status !== 'completed') {
      throw new Error('Routine generation status returned an unexpected response.');
    }

    const result = await finalizeCompletedRoutineGeneration({
      pending,
      result: status.result,
    });

    return {
      status: 'completed',
      pending,
      result,
    };
  },

  async generateFirstRoutine(
    payload: GenerateOnboardingRoutineRequest,
    options?: { context?: RoutineGenerationContext },
  ): Promise<GenerateOnboardingRoutineResponse> {
    const context = options?.context ?? 'routine';

    if (payload.mode === 'ai' && !__DEV__) {
      try {
        return await generateFirstRoutineInBackground({
          payload,
          context,
        });
      } catch (error) {
        console.warn(
          `[onboarding] Falling back to foreground generation after background job setup failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return generateFirstRoutineForeground(payload);
  },
};
