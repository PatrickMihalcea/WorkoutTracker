-- Per-set targets for routine day exercises
create table routine_day_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  routine_day_exercise_id uuid references routine_day_exercises(id) on delete cascade not null,
  set_number integer not null,
  target_weight real not null default 0,
  target_reps_min integer not null default 10,
  target_reps_max integer not null default 10
);

create index idx_rdes_exercise on routine_day_exercise_sets(routine_day_exercise_id);

alter table routine_day_exercise_sets enable row level security;

create policy "Users manage own exercise set targets"
  on routine_day_exercise_sets for all
  using (
    exists (
      select 1 from routine_day_exercises rde
      join routine_days rd on rd.id = rde.routine_day_id
      join routines r on r.id = rd.routine_id
      where rde.id = routine_day_exercise_sets.routine_day_exercise_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from routine_day_exercises rde
      join routine_days rd on rd.id = rde.routine_day_id
      join routines r on r.id = rd.routine_id
      where rde.id = routine_day_exercise_sets.routine_day_exercise_id
        and r.user_id = auth.uid()
    )
  );
