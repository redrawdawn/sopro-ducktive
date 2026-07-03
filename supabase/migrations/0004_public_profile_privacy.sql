alter table public.app_public_profiles
  add column if not exists is_public boolean not null default false;

drop policy if exists "Authenticated users can view public profiles" on public.app_public_profiles;
create policy "Authenticated users can view public profiles" on public.app_public_profiles
  for select to authenticated using (is_public = true or user_id = auth.uid());
