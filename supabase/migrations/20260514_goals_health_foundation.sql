create table if not exists public.goal_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (
    metric in (
      'bodyweight',
      'calories',
      'protein',
      'workouts_per_week',
      'water',
      'sleep',
      'steps',
      'resting_heart_rate'
    )
  ),
  target_value numeric(10,2) not null check (target_value >= 0),
  unit text not null,
  period text not null default 'daily' check (period in ('daily', 'weekly', 'target')),
  target_date date,
  notes text,
  is_active boolean not null default true,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create unique index if not exists goal_targets_user_active_metric_key
on public.goal_targets(user_id, metric)
where deleted_at is null and is_active = true;

create index if not exists goal_targets_user_metric_idx
on public.goal_targets(user_id, metric);

alter table public.goal_targets enable row level security;

drop policy if exists goal_targets_select_own on public.goal_targets;
create policy goal_targets_select_own
on public.goal_targets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists goal_targets_insert_own on public.goal_targets;
create policy goal_targets_insert_own
on public.goal_targets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists goal_targets_update_own on public.goal_targets;
create policy goal_targets_update_own
on public.goal_targets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_goal_targets_updated_at on public.goal_targets;
create trigger set_goal_targets_updated_at
before update on public.goal_targets
for each row
execute function private.set_updated_at();

create table if not exists public.health_metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null check (
    metric_type in (
      'sleep_hours',
      'steps',
      'resting_heart_rate',
      'calories_burned',
      'water_ml',
      'creatine'
    )
  ),
  metric_date date not null,
  value numeric(10,2) not null check (value >= 0),
  unit text not null,
  source text not null default 'manual' check (source in ('manual', 'apple_health', 'apple_watch', 'imported')),
  notes text,
  external_id text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create index if not exists health_metric_entries_user_date_idx
on public.health_metric_entries(user_id, metric_date desc);

create index if not exists health_metric_entries_user_type_date_idx
on public.health_metric_entries(user_id, metric_type, metric_date desc);

alter table public.health_metric_entries enable row level security;

drop policy if exists health_metric_entries_select_own on public.health_metric_entries;
create policy health_metric_entries_select_own
on public.health_metric_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists health_metric_entries_insert_own on public.health_metric_entries;
create policy health_metric_entries_insert_own
on public.health_metric_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists health_metric_entries_update_own on public.health_metric_entries;
create policy health_metric_entries_update_own
on public.health_metric_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_health_metric_entries_updated_at on public.health_metric_entries;
create trigger set_health_metric_entries_updated_at
before update on public.health_metric_entries
for each row
execute function private.set_updated_at();
