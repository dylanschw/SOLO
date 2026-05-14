alter table public.workout_sets
add column if not exists load_type text not null default 'weighted';

alter table public.workout_sets
add column if not exists assist_weight_kg numeric(7,2) check (assist_weight_kg >= 0 and assist_weight_kg < 1000);

alter table public.workout_sets
add column if not exists added_weight_kg numeric(7,2) check (added_weight_kg >= 0 and added_weight_kg < 1000);

alter table public.workout_sets
drop constraint if exists workout_sets_set_type_check;

alter table public.workout_sets
add constraint workout_sets_set_type_check
check (set_type in ('warmup', 'working', 'top', 'backoff', 'drop', 'skipped'));

alter table public.workout_sets
drop constraint if exists workout_sets_load_type_check;

alter table public.workout_sets
add constraint workout_sets_load_type_check
check (load_type in ('weighted', 'bodyweight', 'no_weight', 'assisted', 'added_weight'));

-- Keep one active bodyweight entry per user/day. Older duplicates are soft-deleted
-- instead of destroyed so no historical data is silently lost.
with ranked_bodyweight_entries as (
  select
    id,
    row_number() over (
      partition by user_id, entry_date
      order by updated_at desc, created_at desc, id desc
    ) as duplicate_rank
  from public.bodyweight_entries
  where deleted_at is null
)
update public.bodyweight_entries
set deleted_at = timezone('utc', now())
where id in (
  select id
  from ranked_bodyweight_entries
  where duplicate_rank > 1
);

create unique index if not exists bodyweight_entries_user_active_date_key
on public.bodyweight_entries(user_id, entry_date)
where deleted_at is null;

create table if not exists public.daily_wellness_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  water_goal_ml integer not null default 3000 check (water_goal_ml between 0 and 20000),
  water_logged_ml integer not null default 0 check (water_logged_ml between 0 and 20000),
  creatine_completed boolean not null default false,
  notes text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, entry_date),
  unique (user_id, client_id)
);

alter table public.daily_wellness_entries enable row level security;

drop policy if exists daily_wellness_entries_select_own on public.daily_wellness_entries;
create policy daily_wellness_entries_select_own
on public.daily_wellness_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists daily_wellness_entries_insert_own on public.daily_wellness_entries;
create policy daily_wellness_entries_insert_own
on public.daily_wellness_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists daily_wellness_entries_update_own on public.daily_wellness_entries;
create policy daily_wellness_entries_update_own
on public.daily_wellness_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists daily_wellness_entries_user_date_idx
on public.daily_wellness_entries(user_id, entry_date desc);

drop trigger if exists set_daily_wellness_entries_updated_at on public.daily_wellness_entries;
create trigger set_daily_wellness_entries_updated_at
before update on public.daily_wellness_entries
for each row
execute function private.set_updated_at();
