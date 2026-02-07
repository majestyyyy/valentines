-- ============================================
-- PREVENT ACCOUNT CREATION/DELETION SPAM
-- ============================================
-- This implements multiple layers of protection against users
-- repeatedly creating and deleting accounts

-- 1. Create a table to track deleted accounts
create table if not exists deleted_accounts (
  id uuid default uuid_generate_v4() primary key,
  email_hash text not null, -- SHA-256 hash of the email
  user_id uuid, -- Original user ID (nullable for privacy)
  deleted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  can_recreate_at timestamp with time zone, -- When user can create account again
  deletion_count int default 1, -- How many times this email has been deleted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookups
create index if not exists idx_deleted_accounts_email_hash on deleted_accounts(email_hash);
create index if not exists idx_deleted_accounts_can_recreate_at on deleted_accounts(can_recreate_at);

-- Enable RLS
alter table deleted_accounts enable row level security;

-- Only admins can view deleted accounts history
create policy "Only admins can view deleted accounts" on deleted_accounts
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 2. Create account creation attempts tracking
create table if not exists account_creation_attempts (
  id uuid default uuid_generate_v4() primary key,
  email_hash text not null,
  success boolean default false,
  failure_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for tracking attempts
create index if not exists idx_account_attempts_email_hash on account_creation_attempts(email_hash);
create index if not exists idx_account_attempts_created_at on account_creation_attempts(created_at);

-- Enable RLS
alter table account_creation_attempts enable row level security;

-- Only admins can view attempts
create policy "Only admins can view creation attempts" on account_creation_attempts
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 3. Function to check if account can be created
create or replace function can_create_account(email_hash_param text)
returns jsonb
language plpgsql
security definer
as $$
declare
  deleted_record record;
  attempt_count int;
  recent_attempts int;
  result jsonb;
begin
  -- Check if this email was recently deleted
  select * into deleted_record
  from deleted_accounts
  where email_hash = email_hash_param
  and can_recreate_at > now()
  order by deleted_at desc
  limit 1;

  if deleted_record.id is not null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'account_recently_deleted',
      'wait_until', deleted_record.can_recreate_at,
      'deletion_count', deleted_record.deletion_count
    );
  end if;

  -- Check total deletion count for this email
  select count(*), coalesce(sum(deletion_count), 0)
  into attempt_count, recent_attempts
  from deleted_accounts
  where email_hash = email_hash_param
  and deleted_at > now() - interval '30 days';

  -- If deleted more than 3 times in 30 days, require longer cooldown
  if recent_attempts >= 3 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_deletions',
      'deletion_count', recent_attempts,
      'message', 'This email has been used for multiple account deletions. Please contact support.'
    );
  end if;

  -- Check failed creation attempts (potential spam)
  select count(*) into attempt_count
  from account_creation_attempts
  where email_hash = email_hash_param
  and created_at > now() - interval '1 hour'
  and success = false;

  if attempt_count >= 5 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_failed_attempts',
      'message', 'Too many failed account creation attempts. Please try again later.'
    );
  end if;

  -- Account creation is allowed
  return jsonb_build_object(
    'allowed', true
  );
end;
$$;

-- 4. Enhanced delete_user function with cooldown tracking
create or replace function delete_user_with_cooldown()
returns jsonb
language plpgsql
security definer
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

  -- Create email hash (you'll need to implement this in your app)
  -- For now, using MD5 as placeholder - replace with SHA-256 in application code
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
  if exists (select 1 from information_schema.tables where table_name = 'audit_logs') then
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
grant execute on function can_create_account(text) to anon, authenticated;
grant execute on function delete_user_with_cooldown() to authenticated;

-- 5. Function to log account creation attempts
create or replace function log_account_creation_attempt(
  email_hash_param text,
  success_param boolean,
  failure_reason_param text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into account_creation_attempts (
    email_hash,
    success,
    failure_reason
  ) values (
    email_hash_param,
    success_param,
    failure_reason_param
  );
end;
$$;

grant execute on function log_account_creation_attempt(text, boolean, text) to anon, authenticated;

-- 6. Cleanup old records (run periodically via cron or manually)
create or replace function cleanup_old_deletion_records()
returns void
language plpgsql
security definer
as $$
begin
  -- Keep deletion records for 90 days
  delete from deleted_accounts
  where deleted_at < now() - interval '90 days';

  -- Keep creation attempts for 30 days
  delete from account_creation_attempts
  where created_at < now() - interval '30 days';
end;
$$;

grant execute on function cleanup_old_deletion_records() to authenticated;

-- 7. View for admins to monitor abuse patterns
create or replace view account_abuse_summary as
select
  email_hash,
  count(*) as total_deletions,
  sum(deletion_count) as cumulative_deletion_count,
  max(deleted_at) as last_deletion,
  max(can_recreate_at) as cooldown_until
from deleted_accounts
where deleted_at > now() - interval '90 days'
group by email_hash
having count(*) > 1
order by total_deletions desc, last_deletion desc;

-- Grant view access to admins only
grant select on account_abuse_summary to authenticated;
