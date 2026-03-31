-- User profiles: stores onboarding data and preferences
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  name text,
  bio text,
  sex text not null default 'other' check (sex in ('male', 'female', 'other')),
  birthday date,
  height_cm real,
  weight_kg real,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lbs')),
  height_unit text not null default 'cm' check (height_unit in ('cm', 'in')),
  distance_unit text not null default 'km' check (distance_unit in ('km', 'miles')),
  onboarding_complete boolean not null default false,
  created_at timestamptz default now() not null
);

-- Case-insensitive unique display names
create unique index idx_profiles_display_name on user_profiles (lower(display_name));

-- RLS
alter table user_profiles enable row level security;

create policy "Users manage own profile"
  on user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
