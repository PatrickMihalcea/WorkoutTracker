create table user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  feedback_type text not null check (feedback_type in ('bug_report', 'feature_request', 'general_feedback', 'ui_ux_feedback', 'performance_issue')),
  comment text not null check (char_length(trim(comment)) > 0),
  created_at timestamptz default now() not null
);

create index idx_user_feedback_user_created_at_desc
  on user_feedback(user_id, created_at desc);

alter table user_feedback enable row level security;

create policy "Users can insert own feedback"
  on user_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read own feedback"
  on user_feedback for select
  using (auth.uid() = user_id);
