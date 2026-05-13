update public.daily_tasks
set status = 'pending'
where status not in ('pending', 'completed', 'skipped', 'missed');

alter table public.daily_tasks
drop constraint if exists daily_tasks_status_check;

alter table public.daily_tasks
add constraint daily_tasks_status_check
check (status in ('pending', 'completed', 'skipped', 'missed'));
