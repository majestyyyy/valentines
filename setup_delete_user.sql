-- Function to delete a user's auth account
-- This function must be run with security definer to have permission to delete from auth.users
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
declare
  user_id uuid;
begin
  -- Get the current user's ID
  user_id := auth.uid();
  
  if user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Delete from auth.users (this will cascade to all related tables)
  delete from auth.users where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function delete_user() to authenticated;
