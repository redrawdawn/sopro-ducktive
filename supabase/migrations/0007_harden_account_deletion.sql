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

  delete from public.app_public_profiles
  where user_id = current_user_id;

  delete from public.app_user_state
  where user_id = current_user_id;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
