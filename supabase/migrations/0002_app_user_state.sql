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
