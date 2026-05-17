create table if not exists public.supplement_medication_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('supplement', 'medication')),
  name text not null check (length(btrim(name)) > 0),
  dose_amount numeric(10,2) check (dose_amount is null or (dose_amount >= 0 and dose_amount < 1000000)),
  dose_unit text,
  frequency text not null default 'daily',
  preferred_time time,
  notes text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, client_id)
);

create index if not exists supplement_medication_items_user_active_idx
on public.supplement_medication_items(user_id, item_type, is_archived, lower(name))
where deleted_at is null;

alter table public.supplement_medication_items enable row level security;

drop policy if exists supplement_medication_items_select_own on public.supplement_medication_items;
create policy supplement_medication_items_select_own
on public.supplement_medication_items
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists supplement_medication_items_insert_own on public.supplement_medication_items;
create policy supplement_medication_items_insert_own
on public.supplement_medication_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists supplement_medication_items_update_own on public.supplement_medication_items;
create policy supplement_medication_items_update_own
on public.supplement_medication_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_supplement_medication_items_updated_at on public.supplement_medication_items;
create trigger set_supplement_medication_items_updated_at
before update on public.supplement_medication_items
for each row
execute function private.set_updated_at();

create table if not exists public.supplement_medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  log_date date not null,
  status text not null default 'pending' check (status in ('taken', 'skipped', 'missed', 'pending')),
  taken_at timestamptz,
  skipped_at timestamptz,
  missed_at timestamptz,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'apple_health', 'apple_watch', 'imported')),
  external_source_id text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint supplement_medication_logs_item_owner_fk
    foreign key (item_id, user_id)
    references public.supplement_medication_items(id, user_id)
    on delete cascade,
  unique (user_id, client_id)
);

create unique index if not exists supplement_medication_logs_user_item_date_key
on public.supplement_medication_logs(user_id, item_id, log_date)
where deleted_at is null;

create index if not exists supplement_medication_logs_user_date_idx
on public.supplement_medication_logs(user_id, log_date desc)
where deleted_at is null;

create index if not exists supplement_medication_logs_item_date_idx
on public.supplement_medication_logs(item_id, log_date desc)
where deleted_at is null;

alter table public.supplement_medication_logs enable row level security;

drop policy if exists supplement_medication_logs_select_own on public.supplement_medication_logs;
create policy supplement_medication_logs_select_own
on public.supplement_medication_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists supplement_medication_logs_insert_own on public.supplement_medication_logs;
create policy supplement_medication_logs_insert_own
on public.supplement_medication_logs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists supplement_medication_logs_update_own on public.supplement_medication_logs;
create policy supplement_medication_logs_update_own
on public.supplement_medication_logs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_supplement_medication_logs_updated_at on public.supplement_medication_logs;
create trigger set_supplement_medication_logs_updated_at
before update on public.supplement_medication_logs
for each row
execute function private.set_updated_at();

alter table public.reminder_preferences
drop constraint if exists reminder_preferences_reminder_type_check;

alter table public.reminder_preferences
add constraint reminder_preferences_reminder_type_check
check (
  reminder_type in (
    'workout',
    'meal_breakfast',
    'meal_lunch',
    'meal_dinner',
    'weigh_in',
    'sleep',
    'scheduling',
    'water',
    'creatine',
    'supplement',
    'medication'
  )
);
