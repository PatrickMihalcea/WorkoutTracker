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
