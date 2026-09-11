alter table public.app_public_profiles
  add column if not exists total_tasks_completed integer not null default 0;

create or replace function public.motive_total_tasks_completed(account_state jsonb)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  daily_state jsonb;
  completion_dates_by_task jsonb;
  completion_count bigint;
begin
  if account_state is null or not (account_state ? 'sopro-ducktive-daily-v1') then
    return 0;
  end if;

  begin
    if jsonb_typeof(account_state -> 'sopro-ducktive-daily-v1') = 'string' then
      daily_state := (account_state ->> 'sopro-ducktive-daily-v1')::jsonb;
    else
      daily_state := account_state -> 'sopro-ducktive-daily-v1';
    end if;
  exception when others then
    return 0;
  end;

  completion_dates_by_task := daily_state -> 'completionDatesByTask';
  if jsonb_typeof(completion_dates_by_task) <> 'object' then
    return 0;
  end if;

  select coalesce(sum(task_completion_count), 0)
  into completion_count
  from (
    select count(distinct dates.completion_date) as task_completion_count
    from jsonb_each(completion_dates_by_task) as task
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(task.value) = 'array' then task.value else '[]'::jsonb end
    ) as dates(completion_date)
    group by task.key
  ) as task_totals;

  return least(completion_count, 2147483647)::integer;
end;
$$;

create or replace function public.sync_public_profile_task_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_public_profiles
  set total_tasks_completed = public.motive_total_tasks_completed(new.state)
  where user_id = new.user_id;

  return new;
end;
$$;

revoke all on function public.sync_public_profile_task_stats() from public;

drop trigger if exists sync_public_profile_task_stats_on_backup on public.app_user_state;
create trigger sync_public_profile_task_stats_on_backup
  after insert or update of state on public.app_user_state
  for each row execute function public.sync_public_profile_task_stats();

update public.app_public_profiles as profile
set total_tasks_completed = public.motive_total_tasks_completed(account_state.state)
from public.app_user_state as account_state
where account_state.user_id = profile.user_id;
