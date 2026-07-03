create table if not exists public.app_public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Name soon',
  is_public boolean not null default false,
  avatar_config jsonb not null default '{}'::jsonb,
  level integer not null default 1,
  total_xp integer not null default 0,
  achievements_count integer not null default 0,
  medals jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_public_profiles enable row level security;

drop policy if exists "Authenticated users can view public profiles" on public.app_public_profiles;
create policy "Authenticated users can view public profiles" on public.app_public_profiles
  for select to authenticated using (is_public = true or user_id = auth.uid());

drop policy if exists "Users can create their own public profile" on public.app_public_profiles;
create policy "Users can create their own public profile" on public.app_public_profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users can update their own public profile" on public.app_public_profiles;
create policy "Users can update their own public profile" on public.app_public_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can delete their own public profile" on public.app_public_profiles;
create policy "Users can delete their own public profile" on public.app_public_profiles
  for delete to authenticated using (user_id = auth.uid());
