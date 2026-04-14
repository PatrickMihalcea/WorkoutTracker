create table routine_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mode text not null check (mode in ('template', 'ai')),
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  answers jsonb not null,
  week_count integer not null check (week_count >= 1),
  generation_mode_used text check (generation_mode_used in ('template', 'ai', 'fallback_template')),
  routine_id uuid references routines(id) on delete set null,
  routine_name text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_routine_generation_jobs_user_created
  on routine_generation_jobs (user_id, created_at desc);

create index idx_routine_generation_jobs_status
  on routine_generation_jobs (status);

alter table routine_generation_jobs enable row level security;

create policy "Users manage own routine generation jobs"
  on routine_generation_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
