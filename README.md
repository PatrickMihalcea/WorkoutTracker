# Workout Tracker

A React Native (Expo) app for tracking weekly workout routines with sets, weight, and RIR (Reps in Reserve).

## Tech Stack

- **Expo SDK 54** with TypeScript
- **Expo Router** for file-based navigation
- **Supabase** for auth + PostgreSQL database
- **Zustand** for state management

## Getting Started

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** in your Supabase dashboard
3. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`
4. Copy your project URL and **publishable key** from **Settings > API**

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Install & Run

```bash
cd workout-tracker
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS Simulator / `a` for Android Emulator.

## Deploy Supabase Edge Functions

Use these steps to deploy the functions in `supabase/functions` to your Supabase project.

### 1. Authenticate and link the project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

You can find your project ref in the Supabase dashboard URL, for example:
`https://supabase.com/dashboard/project/<your-project-ref>`.

### 2. Set required function secrets

Set R2 secrets (required for media upload/delete functions):

```bash
npx supabase secrets set \
  R2_ACCOUNT_ID=<r2-account-id> \
  R2_BUCKET=<r2-bucket> \
  R2_ACCESS_KEY_ID=<r2-access-key-id> \
  R2_SECRET_ACCESS_KEY=<r2-secret-access-key> \
  R2_PUBLIC_BASE_URL=<r2-public-base-url> \
  R2_S3_ENDPOINT=<optional-r2-endpoint> \
  --project-ref <your-project-ref>
```

Set OpenAI secrets (optional, used by `generate-onboarding-routine` AI mode):

```bash
npx supabase secrets set \
  OPENAI_API_KEY=<openai-api-key> \
  OPENAI_MODEL=gpt-4.1-mini \
  --project-ref <your-project-ref>
```

Note: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided automatically in Supabase Edge Functions.

### 3. Deploy functions

```bash
npx supabase functions deploy generate-onboarding-routine --project-ref <your-project-ref>
npx supabase functions deploy create-exercise-media-upload-url --project-ref <your-project-ref>
npx supabase functions deploy delete-exercise-media --project-ref <your-project-ref>
npx supabase functions deploy delete-user-media --project-ref <your-project-ref>
```

### 4. Verify deployment

```bash
npx supabase functions list --project-ref <your-project-ref>
```

## Project Structure

```
app/                    # Screens (Expo Router file-based routing)
  (auth)/               # Login & signup
  (tabs)/               # Main tab navigator (Today, Routines, History, Profile)
  workout/              # Active workout modal
src/
  models/               # TypeScript interfaces & enums
  services/             # Supabase API layer
  stores/               # Zustand state stores
  components/           # Reusable UI & workout components
  constants/            # Theme colors, spacing
  utils/                # Date formatting helpers
```

## Features

- Email/password authentication
- Create weekly routines with training days
- Add exercises to each day with target sets/reps
- Log workouts: track weight, reps, and RIR per set
- View previous session data as reference during workouts
- Workout history with duration tracking
