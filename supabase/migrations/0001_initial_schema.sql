create extension if not exists "pgcrypto";

create type public.household_role as enum ('owner', 'admin', 'member');
create type public.quest_cadence as enum ('daily', 'weekly', 'one_time');
create type public.quest_status as enum ('active', 'archived');
create type public.xp_source as enum ('quest_completion', 'achievement', 'manual_adjustment');
create type public.achievement_metric as enum ('quest_count', 'daily_quest_count', 'total_xp', 'level');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  invite_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.household_role not null default 'member',
  invited_by uuid references public.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  cadence public.quest_cadence not null default 'one_time',
  xp_value integer not null default 10 check (xp_value >= 0 and xp_value <= 10000),
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  status public.quest_status not null default 'active',
  starts_on date,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  xp_awarded integer not null check (xp_awarded >= 0),
  completed_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  metric public.achievement_metric not null,
  threshold integer not null check (threshold > 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  amount integer not null check (amount <> 0),
  source public.xp_source not null,
  quest_completion_id uuid references public.quest_completions(id) on delete set null,
  achievement_id uuid references public.achievements(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index household_members_user_id_idx on public.household_members(user_id);
create index quests_household_id_idx on public.quests(household_id);
create index quest_completions_user_id_idx on public.quest_completions(user_id);
create index xp_transactions_user_id_idx on public.xp_transactions(user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at before update on public.users
for each row execute function public.touch_updated_at();

create trigger households_touch_updated_at before update on public.households
for each row execute function public.touch_updated_at();

create trigger quests_touch_updated_at before update on public.quests
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.add_household_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (household_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_household_created
after insert on public.households
for each row execute function public.add_household_owner_member();

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.user_total_xp(target_user_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(amount), 0)::integer
  from public.xp_transactions
  where user_id = target_user_id;
$$;

create or replace function public.user_level_from_xp(total_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  current_level integer := 1;
  required_xp integer := 100;
  remaining_xp integer := greatest(total_xp, 0);
begin
  while remaining_xp >= required_xp loop
    remaining_xp := remaining_xp - required_xp;
    current_level := current_level + 1;
    required_xp := round(100 * power(current_level, 1.45));
  end loop;

  return current_level;
end;
$$;

create or replace function public.evaluate_user_achievements(target_user_id uuid, target_household_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  achievement record;
  metric_value integer;
begin
  for achievement in select * from public.achievements loop
    if achievement.metric = 'quest_count' then
      select count(*)::integer into metric_value from public.quest_completions where user_id = target_user_id;
    elsif achievement.metric = 'daily_quest_count' then
      select count(*)::integer into metric_value
      from public.quest_completions qc
      join public.quests q on q.id = qc.quest_id
      where qc.user_id = target_user_id and q.cadence = 'daily';
    elsif achievement.metric = 'total_xp' then
      metric_value := public.user_total_xp(target_user_id);
    elsif achievement.metric = 'level' then
      metric_value := public.user_level_from_xp(public.user_total_xp(target_user_id));
    end if;

    if metric_value >= achievement.threshold then
      insert into public.user_achievements (user_id, achievement_id, household_id)
      values (target_user_id, achievement.id, target_household_id)
      on conflict (user_id, achievement_id) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.complete_quest(target_quest_id uuid)
returns public.quest_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  quest_record public.quests;
  completion public.quest_completions;
begin
  select * into quest_record
  from public.quests
  where id = target_quest_id
    and status = 'active'
    and public.is_household_member(household_id);

  if not found then
    raise exception 'Quest not found or not accessible';
  end if;

  insert into public.quest_completions (quest_id, household_id, user_id, xp_awarded)
  values (quest_record.id, quest_record.household_id, auth.uid(), quest_record.xp_value)
  returning * into completion;

  insert into public.xp_transactions (user_id, household_id, amount, source, quest_completion_id)
  values (auth.uid(), quest_record.household_id, quest_record.xp_value, 'quest_completion', completion.id);

  perform public.evaluate_user_achievements(auth.uid(), quest_record.household_id);

  return completion;
end;
$$;

insert into public.achievements (slug, name, description, metric, threshold, xp_reward) values
  ('first-quest-completed', 'First Quest Completed', 'Complete your first real-life quest.', 'quest_count', 1, 0),
  ('reach-level-5', 'Reach Level 5', 'Earn enough XP to reach level 5.', 'level', 5, 0),
  ('reach-level-10', 'Reach Level 10', 'Earn enough XP to reach level 10.', 'level', 10, 0),
  ('complete-7-daily-quests', 'Complete 7 Daily Quests', 'Complete seven daily quests.', 'daily_quest_count', 7, 0),
  ('complete-30-quests', 'Complete 30 Quests', 'Complete thirty quests of any type.', 'quest_count', 30, 0),
  ('earn-1000-xp', 'Earn 1,000 XP', 'Earn one thousand total XP.', 'total_xp', 1000, 0)
on conflict (slug) do nothing;

alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.quests enable row level security;
alter table public.quest_completions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.xp_transactions enable row level security;

create policy "Users can view their own profile" on public.users
  for select using (id = auth.uid());
create policy "Users can update their own profile" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can view households" on public.households
  for select using (public.is_household_member(id));
create policy "Authenticated users can create households" on public.households
  for insert with check (owner_id = auth.uid());
create policy "Owners and admins can update households" on public.households
  for update using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = id and hm.user_id = auth.uid() and hm.role in ('owner', 'admin')
    )
  );

create policy "Members can view household members" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "Users can join or owners can add members" on public.household_members
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.household_members hm
      where hm.household_id = household_id and hm.user_id = auth.uid() and hm.role in ('owner', 'admin')
    )
  );

create policy "Members can view quests" on public.quests
  for select using (public.is_household_member(household_id));
create policy "Members can create quests" on public.quests
  for insert with check (created_by = auth.uid() and public.is_household_member(household_id));
create policy "Members can update quests" on public.quests
  for update using (public.is_household_member(household_id));
create policy "Members can delete quests" on public.quests
  for delete using (public.is_household_member(household_id));

create policy "Members can view completions" on public.quest_completions
  for select using (public.is_household_member(household_id));
create policy "Members can create their own completions" on public.quest_completions
  for insert with check (user_id = auth.uid() and public.is_household_member(household_id));

create policy "Authenticated users can view achievements" on public.achievements
  for select using (auth.role() = 'authenticated');

create policy "Users can view unlocked achievements in their households" on public.user_achievements
  for select using (user_id = auth.uid() or public.is_household_member(household_id));

create policy "Users can view household XP transactions" on public.xp_transactions
  for select using (user_id = auth.uid() or public.is_household_member(household_id));
create policy "Users can create their own XP transactions" on public.xp_transactions
  for insert with check (user_id = auth.uid() and (household_id is null or public.is_household_member(household_id)));
