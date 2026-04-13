# generate-onboarding-routine

Creates a user's first active routine during onboarding.

## Required Supabase secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Optional OpenAI secrets

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)

If `OPENAI_API_KEY` is missing or the AI request fails, the function automatically falls back to template generation.
