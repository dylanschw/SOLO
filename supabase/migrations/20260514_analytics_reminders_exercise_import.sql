alter table public.recipes
add column if not exists is_favorite boolean not null default false;

alter table public.meal_prep_templates
add column if not exists total_calories integer check (total_calories is null or total_calories between 0 and 200000);

alter table public.meal_prep_templates
add column if not exists total_protein_g numeric(8,2) check (total_protein_g is null or total_protein_g between 0 and 10000);

alter table public.meal_prep_templates
add column if not exists total_carbs_g numeric(8,2) check (total_carbs_g is null or total_carbs_g between 0 and 20000);

alter table public.meal_prep_templates
add column if not exists total_fat_g numeric(8,2) check (total_fat_g is null or total_fat_g between 0 and 10000);

alter table public.exercises
add column if not exists is_archived boolean not null default false;

alter table public.exercises
add column if not exists movement_pattern text;

alter table public.exercises
add column if not exists primary_muscle text;

alter table public.exercises
add column if not exists alternate_group text;

create index if not exists exercises_user_archived_name_idx
on public.exercises(user_id, is_archived, lower(name))
where deleted_at is null;

create table if not exists public.reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (
    reminder_type in (
      'workout',
      'meal_breakfast',
      'meal_lunch',
      'meal_dinner',
      'weigh_in',
      'sleep',
      'scheduling',
      'water',
      'creatine'
    )
  ),
  is_enabled boolean not null default false,
  reminder_time time,
  days_of_week integer[] not null default array[0,1,2,3,4,5,6],
  notes text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, reminder_type),
  unique (user_id, client_id)
);

create index if not exists reminder_preferences_user_type_idx
on public.reminder_preferences(user_id, reminder_type)
where deleted_at is null;

alter table public.reminder_preferences enable row level security;

drop policy if exists reminder_preferences_select_own on public.reminder_preferences;
create policy reminder_preferences_select_own
on public.reminder_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists reminder_preferences_insert_own on public.reminder_preferences;
create policy reminder_preferences_insert_own
on public.reminder_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists reminder_preferences_update_own on public.reminder_preferences;
create policy reminder_preferences_update_own
on public.reminder_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_reminder_preferences_updated_at on public.reminder_preferences;
create trigger set_reminder_preferences_updated_at
before update on public.reminder_preferences
for each row
execute function private.set_updated_at();

create table if not exists public.workout_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'previous_workout_csv' check (source in ('previous_workout_csv')),
  imported_at timestamptz not null default timezone('utc', now()),
  workout_count integer not null default 0 check (workout_count >= 0),
  set_count integer not null default 0 check (set_count >= 0),
  notes text,
  reverted_at timestamptz,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

alter table public.workout_import_batches enable row level security;

drop policy if exists workout_import_batches_select_own on public.workout_import_batches;
create policy workout_import_batches_select_own
on public.workout_import_batches
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists workout_import_batches_insert_own on public.workout_import_batches;
create policy workout_import_batches_insert_own
on public.workout_import_batches
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists workout_import_batches_update_own on public.workout_import_batches;
create policy workout_import_batches_update_own
on public.workout_import_batches
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_workout_import_batches_updated_at on public.workout_import_batches;
create trigger set_workout_import_batches_updated_at
before update on public.workout_import_batches
for each row
execute function private.set_updated_at();

alter table public.workout_sessions
add column if not exists import_batch_id uuid references public.workout_import_batches(id) on delete set null;

alter table public.workout_sets
add column if not exists import_batch_id uuid references public.workout_import_batches(id) on delete set null;

create index if not exists workout_sessions_import_batch_idx
on public.workout_sessions(user_id, import_batch_id)
where import_batch_id is not null;

create index if not exists workout_sets_import_batch_idx
on public.workout_sets(user_id, import_batch_id)
where import_batch_id is not null;
