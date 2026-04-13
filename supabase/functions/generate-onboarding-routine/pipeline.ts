import { refineDraftWithAi } from './ai.ts';
import { filterExercisesForAnswers, generateTemplateRoutineDraft } from './generator.ts';
import { ExerciseRow, GenerateOnboardingRoutineResponse, OnboardingRoutineAnswers } from './types.ts';

interface BuildDraftArgs {
  mode: 'template' | 'ai';
  answers: OnboardingRoutineAnswers;
  exercises: ExerciseRow[];
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  aiRefiner?: typeof refineDraftWithAi;
}

export async function buildDraftWithOptionalAi(args: BuildDraftArgs): Promise<{
  draft: ReturnType<typeof generateTemplateRoutineDraft>;
  generationModeUsed: GenerateOnboardingRoutineResponse['generation_mode_used'];
}> {
  const aiRefiner = args.aiRefiner ?? refineDraftWithAi;
  const templateDraft = generateTemplateRoutineDraft(args.answers, args.exercises);

  if (args.mode !== 'ai') {
    return { draft: templateDraft, generationModeUsed: 'template' };
  }

  if (!args.openAiApiKey) {
    return { draft: templateDraft, generationModeUsed: 'fallback_template' };
  }

  try {
    const filtered = filterExercisesForAnswers(args.exercises, args.answers);
    const refined = await aiRefiner({
      apiKey: args.openAiApiKey,
      model: args.openAiModel ?? 'gpt-4.1-mini',
      answers: args.answers,
      baseDraft: templateDraft,
      allowedExercises: filtered,
    });
    return { draft: refined, generationModeUsed: 'ai' };
  } catch {
    return { draft: templateDraft, generationModeUsed: 'fallback_template' };
  }
}
