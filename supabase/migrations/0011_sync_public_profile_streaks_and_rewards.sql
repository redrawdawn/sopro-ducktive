alter table public.app_public_profiles
  add column if not exists streak_last_completed_on date;

create or replace function public.motive_public_profile_streak(account_state jsonb)
returns table(highest_streak integer, last_completed_on date)
language plpgsql
immutable
set search_path = public
as $$
declare
  daily_state jsonb;
  completion_dates_by_task jsonb;
  task jsonb;
  task_dates jsonb;
  task_id text;
  date_text text;
  completion_date date;
  previous_date date;
  task_streak integer;
  task_last_completed_on date;
begin
  highest_streak := 0;
  last_completed_on := null;

  if account_state is null or not (account_state ? 'sopro-ducktive-daily-v1') then
    return next;
    return;
  end if;

  begin
    if jsonb_typeof(account_state -> 'sopro-ducktive-daily-v1') = 'string' then
      daily_state := (account_state ->> 'sopro-ducktive-daily-v1')::jsonb;
    else
      daily_state := account_state -> 'sopro-ducktive-daily-v1';
    end if;
  exception when others then
    return next;
    return;
  end;

  completion_dates_by_task := daily_state -> 'completionDatesByTask';
  if jsonb_typeof(daily_state -> 'tasks') <> 'array'
    or jsonb_typeof(completion_dates_by_task) <> 'object' then
    return next;
    return;
  end if;

  for task in select value from jsonb_array_elements(daily_state -> 'tasks') loop
    task_id := task ->> 'id';
    task_dates := completion_dates_by_task -> task_id;
    if coalesce(task_id, '') = '' or jsonb_typeof(task_dates) <> 'array' then
      continue;
    end if;

    previous_date := null;
    task_streak := 0;
    task_last_completed_on := null;

    for date_text in
      select distinct value
      from jsonb_array_elements_text(task_dates)
      where value ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      order by value
    loop
      begin
        completion_date := date_text::date;
      exception when others then
        continue;
      end;

      if previous_date is not null and completion_date = previous_date + 1 then
        task_streak := task_streak + 1;
      else
        task_streak := 1;
      end if;
      previous_date := completion_date;
      task_last_completed_on := completion_date;
    end loop;

    if task_streak > highest_streak
      or (task_streak = highest_streak and task_last_completed_on > last_completed_on) then
      highest_streak := task_streak;
      last_completed_on := task_last_completed_on;
    end if;
  end loop;

  return next;
end;
$$;

create or replace function public.motive_claimed_reward_count(account_state jsonb)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  claimed_rewards jsonb;
  reward_count bigint;
begin
  if account_state is null or not (account_state ? 'sopro-ducktive-claimed-rewards-v1') then
    return 0;
  end if;

  begin
    if jsonb_typeof(account_state -> 'sopro-ducktive-claimed-rewards-v1') = 'string' then
      claimed_rewards := (account_state ->> 'sopro-ducktive-claimed-rewards-v1')::jsonb;
    else
      claimed_rewards := account_state -> 'sopro-ducktive-claimed-rewards-v1';
    end if;
  exception when others then
    return 0;
  end;

  if jsonb_typeof(claimed_rewards) <> 'array' then
    return 0;
  end if;

  select count(distinct reward_id)
  into reward_count
  from jsonb_array_elements_text(claimed_rewards) as rewards(reward_id)
  where reward_id not in (
    'reward:daily-all',
    'reward:daily-tasks-5',
    'reward:streak-7',
    'reward:weekly-streak-7',
    'reward:tasks-recurring-30'
  );

  return least(coalesce(reward_count, 0), 2147483647)::integer;
end;
$$;

create or replace function public.sync_public_profile_task_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  streak record;
begin
  select * into streak from public.motive_public_profile_streak(new.state);

  update public.app_public_profiles
  set total_tasks_completed = public.motive_total_tasks_completed(new.state),
      highest_streak = coalesce(streak.highest_streak, 0),
      streak_last_completed_on = streak.last_completed_on,
      achievements_count = public.motive_claimed_reward_count(new.state)
  where user_id = new.user_id;

  return new;
end;
$$;

revoke all on function public.motive_public_profile_streak(jsonb) from public;
revoke all on function public.motive_claimed_reward_count(jsonb) from public;
revoke all on function public.sync_public_profile_task_stats() from public;

update public.app_public_profiles as profile
set total_tasks_completed = public.motive_total_tasks_completed(account_state.state),
    highest_streak = streak.highest_streak,
    streak_last_completed_on = streak.last_completed_on,
    achievements_count = public.motive_claimed_reward_count(account_state.state)
from public.app_user_state as account_state
cross join lateral public.motive_public_profile_streak(account_state.state) as streak
where account_state.user_id = profile.user_id;
