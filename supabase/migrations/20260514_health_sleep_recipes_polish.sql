alter table public.health_metric_entries
add column if not exists sleep_start_time time;

alter table public.health_metric_entries
add column if not exists sleep_end_time time;

alter table public.health_metric_entries
add column if not exists sleep_quality integer;

alter table public.health_metric_entries
drop constraint if exists health_metric_entries_sleep_quality_check;

alter table public.health_metric_entries
add constraint health_metric_entries_sleep_quality_check
check (sleep_quality is null or sleep_quality between 1 and 5);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories integer check (calories is null or calories between 0 and 20000),
  protein_g numeric(8,2) check (protein_g is null or protein_g between 0 and 1000),
  carbs_g numeric(8,2) check (carbs_g is null or carbs_g between 0 and 2000),
  fat_g numeric(8,2) check (fat_g is null or fat_g between 0 and 1000),
  servings numeric(6,2) not null default 1 check (servings > 0 and servings <= 100),
  ingredients text,
  instructions text,
  notes text,
  category text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create index if not exists recipes_user_name_idx
on public.recipes(user_id, lower(name))
where deleted_at is null;

alter table public.recipes enable row level security;

drop policy if exists recipes_select_own on public.recipes;
create policy recipes_select_own
on public.recipes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists recipes_insert_own on public.recipes;
create policy recipes_insert_own
on public.recipes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists recipes_update_own on public.recipes;
create policy recipes_update_own
on public.recipes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function private.set_updated_at();

create table if not exists public.meal_prep_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meals_covered text,
  days_planned integer not null default 1 check (days_planned between 1 and 31),
  meals_text text,
  grocery_notes text,
  prep_notes text,
  notes text,
  client_id text not null,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'conflict')),
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create index if not exists meal_prep_templates_user_name_idx
on public.meal_prep_templates(user_id, lower(name))
where deleted_at is null;

alter table public.meal_prep_templates enable row level security;

drop policy if exists meal_prep_templates_select_own on public.meal_prep_templates;
create policy meal_prep_templates_select_own
on public.meal_prep_templates
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists meal_prep_templates_insert_own on public.meal_prep_templates;
create policy meal_prep_templates_insert_own
on public.meal_prep_templates
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists meal_prep_templates_update_own on public.meal_prep_templates;
create policy meal_prep_templates_update_own
on public.meal_prep_templates
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_meal_prep_templates_updated_at on public.meal_prep_templates;
create trigger set_meal_prep_templates_updated_at
before update on public.meal_prep_templates
for each row
execute function private.set_updated_at();
