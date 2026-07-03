alter table public.app_public_profiles
  add column if not exists highest_streak integer not null default 0;
