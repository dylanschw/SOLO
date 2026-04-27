create extension if not exists pgcrypto;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in ('gain_weight', 'lose_weight', 'maintain_weight', 'performance', 'health')),
  target_bodyweight_kg numeric(6,2),
  target_date date,
  notes text,
  is_active boolean not null default true,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.bodyweight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg < 500),
  notes text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('manual', 'calculated')),
  goal_type text not null check (goal_type in ('gain_weight', 'lose_weight', 'maintain_weight')),
  calories integer not null check (calories between 800 and 8000),
  protein_g integer not null check (protein_g between 0 and 500),
  carbs_g integer check (carbs_g between 0 and 1000),
  fat_g integer check (fat_g between 0 and 400),
  effective_from date not null default current_date,
  is_active boolean not null default true,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_count integer not null default 0 check (meal_count between 0 and 20),
  calories integer check (calories between 0 and 20000),
  protein_g integer check (protein_g between 0 and 1000),
  carbs_g integer check (carbs_g between 0 and 2000),
  fat_g integer check (fat_g between 0 and 1000),
  notes text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  rotation_length_days integer not null default 7 check (rotation_length_days between 1 and 31),
  is_active boolean not null default false,
  is_archived boolean not null default false,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 31),
  name text not null,
  notes text,
  is_rest_day boolean not null default false,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id),
  unique (program_id, day_number)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  equipment text,
  notes text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.planned_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order integer not null default 0,
  set_type text not null default 'straight' check (set_type in ('straight', 'top_set_backoff', 'warmup', 'custom')),
  planned_sets integer not null default 3 check (planned_sets between 1 and 20),
  min_reps integer check (min_reps between 1 and 100),
  max_reps integer check (max_reps between 1 and 100),
  rest_seconds integer check (rest_seconds between 0 and 1200),
  target_rpe numeric(3,1) check (target_rpe >= 1 and target_rpe <= 10),
  backoff_percent numeric(5,2) check (backoff_percent >= 0 and backoff_percent <= 100),
  notes text,
  progression_rule text,
  deload_rule text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.workout_programs(id) on delete set null,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  session_date date not null default current_date,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  notes text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  planned_exercise_id uuid references public.planned_exercises(id) on delete set null,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number integer not null check (set_number between 1 and 50),
  set_type text not null default 'working' check (set_type in ('warmup', 'working', 'top', 'backoff', 'drop')),
  weight_kg numeric(7,2) check (weight_kg >= 0 and weight_kg < 1000),
  reps integer check (reps >= 0 and reps <= 200),
  rpe numeric(3,1) check (rpe >= 1 and rpe <= 10),
  completed boolean not null default false,
  notes text,
  client_id text not null,
  version integer not null default 1,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create index if not exists user_goals_user_id_idx on public.user_goals(user_id);
create index if not exists bodyweight_entries_user_date_idx on public.bodyweight_entries(user_id, entry_date desc);
create index if not exists nutrition_targets_user_active_idx on public.nutrition_targets(user_id, is_active);
create index if not exists nutrition_logs_user_date_idx on public.nutrition_logs(user_id, log_date desc);
create index if not exists workout_programs_user_active_idx on public.workout_programs(user_id, is_active);
create index if not exists workout_days_program_idx on public.workout_days(program_id, day_number);
create index if not exists exercises_user_name_idx on public.exercises(user_id, name);
create index if not exists planned_exercises_day_order_idx on public.planned_exercises(workout_day_id, sort_order);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, session_date desc);
create index if not exists workout_sets_session_idx on public.workout_sets(workout_session_id, set_number);

alter table public.user_goals enable row level security;
alter table public.bodyweight_entries enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workout_days enable row level security;
alter table public.exercises enable row level security;
alter table public.planned_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

create or replace function private.create_user_owned_policies(table_name text)
returns void
language plpgsql
security definer
as $$
begin
  execute format('drop policy if exists %I_select_own on public.%I', table_name, table_name);
  execute format('drop policy if exists %I_insert_own on public.%I', table_name, table_name);
  execute format('drop policy if exists %I_update_own on public.%I', table_name, table_name);
  execute format('drop policy if exists %I_delete_own on public.%I', table_name, table_name);

  execute format(
    'create policy %I_select_own on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
    table_name,
    table_name
  );

  execute format(
    'create policy %I_insert_own on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
    table_name,
    table_name
  );

  execute format(
    'create policy %I_update_own on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
    table_name,
    table_name
  );

  execute format(
    'create policy %I_delete_own on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
    table_name,
    table_name
  );
end;
$$;

select private.create_user_owned_policies('user_goals');
select private.create_user_owned_policies('bodyweight_entries');
select private.create_user_owned_policies('nutrition_targets');
select private.create_user_owned_policies('nutrition_logs');
select private.create_user_owned_policies('workout_programs');
select private.create_user_owned_policies('workout_days');
select private.create_user_owned_policies('exercises');
select private.create_user_owned_policies('planned_exercises');
select private.create_user_owned_policies('workout_sessions');
select private.create_user_owned_policies('workout_sets');

drop trigger if exists set_user_goals_updated_at on public.user_goals;
create trigger set_user_goals_updated_at before update on public.user_goals for each row execute function private.set_updated_at();

drop trigger if exists set_bodyweight_entries_updated_at on public.bodyweight_entries;
create trigger set_bodyweight_entries_updated_at before update on public.bodyweight_entries for each row execute function private.set_updated_at();

drop trigger if exists set_nutrition_targets_updated_at on public.nutrition_targets;
create trigger set_nutrition_targets_updated_at before update on public.nutrition_targets for each row execute function private.set_updated_at();

drop trigger if exists set_nutrition_logs_updated_at on public.nutrition_logs;
create trigger set_nutrition_logs_updated_at before update on public.nutrition_logs for each row execute function private.set_updated_at();

drop trigger if exists set_workout_programs_updated_at on public.workout_programs;
create trigger set_workout_programs_updated_at before update on public.workout_programs for each row execute function private.set_updated_at();

drop trigger if exists set_workout_days_updated_at on public.workout_days;
create trigger set_workout_days_updated_at before update on public.workout_days for each row execute function private.set_updated_at();

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at before update on public.exercises for each row execute function private.set_updated_at();

drop trigger if exists set_planned_exercises_updated_at on public.planned_exercises;
create trigger set_planned_exercises_updated_at before update on public.planned_exercises for each row execute function private.set_updated_at();

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at before update on public.workout_sessions for each row execute function private.set_updated_at();

drop trigger if exists set_workout_sets_updated_at on public.workout_sets;
create trigger set_workout_sets_updated_at before update on public.workout_sets for each row execute function private.set_updated_at();