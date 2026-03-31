-- Exercises: reusable exercise definitions
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  muscle_group text not null,
  equipment text not null default 'barbell',
  created_at timestamptz default now() not null
);

create index idx_exercises_user on exercises(user_id);

-- Routines: weekly workout plans
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_active boolean default false not null,
  created_at timestamptz default now() not null
);

create index idx_routines_user on routines(user_id);

-- Routine Days: each day in a routine
create table routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 1 and 7),
  label text not null,
  unique(routine_id, day_of_week)
);

create index idx_routine_days_routine on routine_days(routine_id);

-- Routine Day Exercises: exercises assigned to a day with targets
create table routine_day_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid references routine_days(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  sort_order integer not null default 0,
  target_sets integer not null default 3,
  target_reps integer not null default 10
);

create index idx_rde_day on routine_day_exercises(routine_day_id);

-- Workout Sessions: actual workout logs
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_day_id uuid references routine_days(id) on delete set null,
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled'))
);

create index idx_sessions_user on workout_sessions(user_id);
create index idx_sessions_started on workout_sessions(started_at desc);

-- Set Logs: individual sets within a session
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null,
  weight real not null default 0,
  reps_performed integer not null default 0,
  rir integer,
  is_warmup boolean not null default false
);

create index idx_set_logs_session on set_logs(session_id);
create index idx_set_logs_exercise on set_logs(exercise_id);

-- Row Level Security
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_days enable row level security;
alter table routine_day_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table set_logs enable row level security;

-- Exercises: users see only their own
create policy "Users manage own exercises"
  on exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Routines: users see only their own
create policy "Users manage own routines"
  on routines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Routine Days: access via routine ownership
create policy "Users manage own routine days"
  on routine_days for all
  using (
    exists (
      select 1 from routines
      where routines.id = routine_days.routine_id
        and routines.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from routines
      where routines.id = routine_days.routine_id
        and routines.user_id = auth.uid()
    )
  );

-- Routine Day Exercises: access via routine day -> routine ownership
create policy "Users manage own routine day exercises"
  on routine_day_exercises for all
  using (
    exists (
      select 1 from routine_days
      join routines on routines.id = routine_days.routine_id
      where routine_days.id = routine_day_exercises.routine_day_id
        and routines.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from routine_days
      join routines on routines.id = routine_days.routine_id
      where routine_days.id = routine_day_exercises.routine_day_id
        and routines.user_id = auth.uid()
    )
  );

-- Workout Sessions: users see only their own
create policy "Users manage own workout sessions"
  on workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Set Logs: access via session ownership
create policy "Users manage own set logs"
  on set_logs for all
  using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = set_logs.session_id
        and workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = set_logs.session_id
        and workout_sessions.user_id = auth.uid()
    )
  );
