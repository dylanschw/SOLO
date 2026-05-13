create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  notes text,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  recurrence text not null default 'daily',
  client_id text not null,
  sync_status text not null default 'synced',
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_item_id uuid references public.routine_items(id) on delete set null,
  task_date date not null,
  title text not null,
  category text,
  notes text,
  status text not null default 'pending',
  sort_order integer not null default 1,
  client_id text not null,
  sync_status text not null default 'synced',
  version integer not null default 1,
  deleted_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.routine_items enable row level security;
alter table public.daily_tasks enable row level security;

create policy "Users can view their own routine items"
on public.routine_items
for select
using (auth.uid() = user_id);

create policy "Users can insert their own routine items"
on public.routine_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own routine items"
on public.routine_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view their own daily tasks"
on public.daily_tasks
for select
using (auth.uid() = user_id);

create policy "Users can insert their own daily tasks"
on public.daily_tasks
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own daily tasks"
on public.daily_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists routine_items_user_id_idx
on public.routine_items(user_id);

create index if not exists daily_tasks_user_id_task_date_idx
on public.daily_tasks(user_id, task_date);

create index if not exists daily_tasks_routine_item_id_idx
on public.daily_tasks(routine_item_id);