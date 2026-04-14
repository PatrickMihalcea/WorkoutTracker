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

type RepairContext = NonNullable<GenerateOnboardingRoutineRequest['repair_context']>;

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

export const onboardingService = {
  async generateFirstRoutine(
    payload: GenerateOnboardingRoutineRequest,
  ): Promise<GenerateOnboardingRoutineResponse> {
    const targetWeekCount = payload.week_count ?? DEFAULT_WEEK_COUNT_BY_MODE[payload.mode];

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('You must be signed in to create a routine.');
    }

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

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
          throw err;
        }

        console.warn(
          `[onboarding] AI generation attempt ${attempt}/${maxAttempts} failed; retrying as a new call: ${err.message}`,
        );
      }
    }

    if (!generated) {
      throw lastError ?? new Error('Routine generation failed.');
    }

    await ensureAdditionalWeeks({
      routineId: generated.routine_id,
      targetWeekCount,
    });

    return generated;
  },
};