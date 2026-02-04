-- Fix data visibility for testing
-- 1. Approve all existing profiles
update profiles 
set status = 'approved' 
where status = 'pending';

-- 2. Set default gender/preferences for older profiles that might be NULL
-- (Be careful not to overwrite valid data if you have it, but for NULLs we must set something)
update profiles
set gender = 'Male'
where gender is null;

update profiles
set preferred_gender = 'Everyone'
where preferred_gender is null;

-- 3. Verify RLS is not blocking view (Public profiles are viewable by everyone)
-- This policy should already exist from schema.sql, but ensuring it's enabled:
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);
