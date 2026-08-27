alter table public.app_public_profiles
  add column if not exists total_tasks_completed integer not null default 0;
