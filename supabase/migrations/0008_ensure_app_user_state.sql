create table if not exists public.app_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_user_state enable row level security;

drop policy if exists "Users can view their own app state" on public.app_user_state;
create policy "Users can view their own app state" on public.app_user_state
  for select using (user_id = auth.uid());

drop policy if exists "Users can create their own app state" on public.app_user_state;
create policy "Users can create their own app state" on public.app_user_state
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update their own app state" on public.app_user_state;
create policy "Users can update their own app state" on public.app_user_state
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be logged in to delete your account.';
  end if;

  if to_regclass('public.app_public_profiles') is not null then
    delete from public.app_public_profiles
    where user_id = current_user_id;
  end if;

  if to_regclass('public.app_user_state') is not null then
    delete from public.app_user_state
    where user_id = current_user_id;
  end if;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
