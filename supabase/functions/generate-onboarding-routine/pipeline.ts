import { refineDraftWithAi } from './ai.ts';
import { filterExercisesForAnswers, generateTemplateRoutineDraft } from './generator.ts';
import { ExerciseRow, GenerateOnboardingRoutineResponse, OnboardingRoutineAnswers, UserProfileContext } from './types.ts';

interface BuildDraftArgs {
  mode: 'template' | 'ai';
  answers: OnboardingRoutineAnswers;
  exercises: ExerciseRow[];
  userContext?: UserProfileContext | null;
  weekCount?: number;
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  repairContext?: {
    validation_errors: string[];
    previous_output: unknown;
  } | null;
  aiRefiner?: typeof refineDraftWithAi;
}

export async function buildDraftWithOptionalAi(args: BuildDraftArgs): Promise<{
  draft: ReturnType<typeof generateTemplateRoutineDraft>;
  generationModeUsed: GenerateOnboardingRoutineResponse['generation_mode_used'];
}> {
  const aiRefiner = args.aiRefiner ?? refineDraftWithAi;
  console.log(
    JSON.stringify({
      event: 'routine_generation_build_started',
      requested_mode: args.mode,
      requested_week_count: args.weekCount ?? null,
      has_repair_context: Boolean(args.repairContext),
    }),
  );
  const templateDraft = generateTemplateRoutineDraft(args.answers, args.exercises, args.weekCount ?? 4);

  if (args.mode !== 'ai') {
    console.log(
      JSON.stringify({
        event: 'routine_generation_mode',
        requested_mode: args.mode,
        generation_mode_used: 'template',
        reason: 'requested_template_mode',
      }),
    );
    return { draft: templateDraft, generationModeUsed: 'template' };
  }

  if (!args.openAiApiKey) {
    console.warn(
      JSON.stringify({
        event: 'routine_generation_mode',
        requested_mode: args.mode,
        generation_mode_used: 'fallback_template',
        reason: 'missing_openai_api_key',
      }),
    );
    return { draft: templateDraft, generationModeUsed: 'fallback_template' };
  }

  try {
    const filtered = filterExercisesForAnswers(args.exercises, args.answers);
    const aiSeedDraft = {
      routine_name: templateDraft.routine_name,
      days: [],
    };
    const refined = await aiRefiner({
      apiKey: args.openAiApiKey,
      model: args.openAiModel ?? 'gpt-4.1-mini',
      answers: args.answers,
      baseDraft: aiSeedDraft,
      expectedWeekCount: Math.max(1, Math.floor(args.weekCount ?? 1)),
      repairContext: args.repairContext ?? null,
      allowedExercises: filtered,
      userContext: args.userContext ?? null,
    });
    console.log(
      JSON.stringify({
        event: 'routine_generation_mode',
        requested_mode: args.mode,
        generation_mode_used: 'ai',
        model: args.openAiModel ?? 'gpt-4.1-mini',
      }),
    );
    return { draft: refined, generationModeUsed: 'ai' };
  } catch (error: unknown) {
    const maybeRepairContext =
      error && typeof error === 'object' && 'repairContext' in error
        ? (error as { repairContext?: { validation_errors?: unknown; previous_output?: unknown } }).repairContext
        : null;

    if (
      maybeRepairContext &&
      Array.isArray(maybeRepairContext.validation_errors)
    ) {
      console.warn(
        JSON.stringify({
          event: 'routine_generation_repair_context_bubbled',
          validation_error_count: maybeRepairContext.validation_errors.length,
        }),
      );
      throw error;
    }

    console.error(
      JSON.stringify({
        event: 'routine_generation_mode',
        requested_mode: args.mode,
        generation_mode_used: 'fallback_template',
        reason: 'ai_refinement_failed',
        error_message: error instanceof Error ? error.message : String(error),
      }),
    );
    return { draft: templateDraft, generationModeUsed: 'fallback_template' };
  }
}
