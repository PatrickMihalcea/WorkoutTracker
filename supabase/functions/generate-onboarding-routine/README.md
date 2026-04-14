# generate-onboarding-routine

Creates a user's first active routine during onboarding.

## Invocation modes

The function supports async job processing to avoid long request timeouts.

- `POST { action: "start", mode, answers }` -> returns `202` with `job_id`
- `POST { action: "status", job_id }` -> returns `queued` / `running` / `failed` / `completed`

Legacy direct payload (`{ mode, answers }`) still works and runs synchronously.

Week defaults:

- `template` mode: 4 weeks
- `ai` mode: 2 weeks

## Required Supabase secrets

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (preferred) or `SUPABASE_ANON_KEY` (legacy)

## Optional OpenAI secrets

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)

If `OPENAI_API_KEY` is missing or the AI request fails, the function automatically falls back to template generation.
