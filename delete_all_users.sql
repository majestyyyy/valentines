-- ⚠️ WARNING: This will delete ALL users and ALL data
-- Use this to reset your database before official launch
-- Run this in Supabase SQL Editor

-- 1. Delete all users from auth.users
-- This will cascade delete all related data (profiles, swipes, matches, messages, etc.)
DO $$
DECLARE
  user_count int;
BEGIN
  -- Count users before deletion
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE 'Found % users to delete', user_count;
  
  -- Delete all users
  DELETE FROM auth.users;
  
  RAISE NOTICE '✅ Successfully deleted all users';
END $$;

-- 2. Clear spam prevention tables (optional - if you want to allow previously deleted emails to sign up)
TRUNCATE TABLE deleted_accounts CASCADE;
TRUNCATE TABLE account_creation_attempts CASCADE;

-- 3. Clear any orphaned storage files (optional)
-- Note: You may need to manually delete files in Supabase Storage > photos bucket

-- 4. Verify deletion
DO $$
DECLARE
  remaining_users int;
  remaining_profiles int;
BEGIN
  SELECT COUNT(*) INTO remaining_users FROM auth.users;
  SELECT COUNT(*) INTO remaining_profiles FROM profiles;
  
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Remaining auth users: %', remaining_users;
  RAISE NOTICE 'Remaining profiles: %', remaining_profiles;
  
  IF remaining_users = 0 AND remaining_profiles = 0 THEN
    RAISE NOTICE '✅ All users successfully deleted!';
  ELSE
    RAISE WARNING '⚠️ Some data may remain. Check manually.';
  END IF;
END $$;
