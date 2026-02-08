-- Fix delete user functions to ensure they work properly
-- Run this in your Supabase SQL Editor

-- 1. Ensure the simple delete_user function exists with proper permissions
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
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

-- 2. Ensure the delete_user_with_cooldown function exists with proper permissions
create or replace function delete_user_with_cooldown()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
  user_email text;
  email_hash_val text;
  deletion_count_val int;
  cooldown_period interval;
  result jsonb;
begin
  -- Get the current user's ID
  user_id := auth.uid();
  
  if user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user email
  select email into user_email
  from auth.users
  where id = user_id;

  -- Create email hash using SHA-256
  email_hash_val := encode(digest(lower(trim(user_email)), 'sha256'), 'hex');
  
  -- Check how many times this email has been deleted
  select coalesce(sum(deletion_count), 0) + 1 into deletion_count_val
  from deleted_accounts
  where email_hash = email_hash_val;

  -- Calculate cooldown period based on deletion count
  -- 1st deletion: 24 hours
  -- 2nd deletion: 7 days
  -- 3rd+ deletion: 30 days
  if deletion_count_val = 1 then
    cooldown_period := interval '24 hours';
  elsif deletion_count_val = 2 then
    cooldown_period := interval '7 days';
  else
    cooldown_period := interval '30 days';
  end if;

  -- Record the deletion
  insert into deleted_accounts (
    email_hash,
    user_id,
    deletion_count,
    can_recreate_at
  ) values (
    email_hash_val,
    user_id,
    deletion_count_val,
    now() + cooldown_period
  );

  -- Log to audit (if you have audit_logs table)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audit_logs') then
    insert into audit_logs (user_id, action, details)
    values (
      user_id,
      'account_deleted',
      jsonb_build_object(
        'deletion_count', deletion_count_val,
        'cooldown_hours', extract(epoch from cooldown_period) / 3600
      )
    );
  end if;

  -- Delete from auth.users (this will cascade to all related tables)
  delete from auth.users where id = user_id;

  return jsonb_build_object(
    'success', true,
    'cooldown_hours', extract(epoch from cooldown_period) / 3600,
    'can_recreate_at', now() + cooldown_period,
    'message', format('Account deleted. You can create a new account after %s.', 
      case 
        when cooldown_period = interval '24 hours' then '24 hours'
        when cooldown_period = interval '7 days' then '7 days'
        else '30 days'
      end
    )
  );
end;
$$;

-- Grant execute permissions
grant execute on function delete_user_with_cooldown() to authenticated;

-- 3. Check if deleted_accounts table exists, if not create it
create table if not exists deleted_accounts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  user_id uuid,
  deletion_count int not null default 1,
  deleted_at timestamptz default now(),
  can_recreate_at timestamptz not null,
  created_at timestamptz default now()
);

-- Add index for faster lookups
create index if not exists idx_deleted_accounts_email_hash on deleted_accounts(email_hash);
create index if not exists idx_deleted_accounts_can_recreate on deleted_accounts(can_recreate_at);

-- Enable RLS
alter table deleted_accounts enable row level security;

-- RLS Policy: Users cannot view deletion records (privacy)
create policy "Deletion records are private"
  on deleted_accounts
  for all
  using (false);

-- 4. Verify the functions are created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user') THEN
    RAISE NOTICE '✅ delete_user() function exists';
  ELSE
    RAISE WARNING '❌ delete_user() function does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_with_cooldown') THEN
    RAISE NOTICE '✅ delete_user_with_cooldown() function exists';
  ELSE
    RAISE WARNING '❌ delete_user_with_cooldown() function does NOT exist';
  END IF;
END $$;
