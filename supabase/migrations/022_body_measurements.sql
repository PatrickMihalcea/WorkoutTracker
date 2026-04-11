create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_on date not null,
  body_weight_kg real,
  waist_cm real,
  body_fat_pct real,
  lean_body_mass_kg real,
  neck_cm real,
  shoulder_cm real,
  chest_cm real,
  left_bicep_cm real,
  right_bicep_cm real,
  left_forearm_cm real,
  right_forearm_cm real,
  abdomen_cm real,
  hips_cm real,
  left_thigh_cm real,
  right_thigh_cm real,
  left_calf_cm real,
  right_calf_cm real,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, logged_on)
);

create index idx_body_measurements_user_logged_on_desc
  on body_measurements(user_id, logged_on desc);

alter table body_measurements enable row level security;

create policy "Users manage own body measurements"
  on body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

