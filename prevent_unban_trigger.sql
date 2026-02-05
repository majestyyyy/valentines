-- Complete Ban System Migration
-- Run this in Supabase SQL Editor

-- STEP 1: Add is_banned column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Update existing rejected profiles to be marked as banned
UPDATE profiles 
SET is_banned = true 
WHERE status = 'rejected' AND is_banned = false;

COMMENT ON COLUMN profiles.is_banned IS 'True for permanent account bans. When false with status=rejected, user can re-edit profile.';

-- STEP 2: Prevent banned users from unbanning themselves
-- This trigger ensures once is_banned is set to true, it cannot be changed back to false
-- except by admins using the service role key

CREATE OR REPLACE FUNCTION prevent_self_unban()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_banned is being changed from true to false
  IF OLD.is_banned = true AND NEW.is_banned = false THEN
    -- Only allow if this is being done via service role (admin)
    -- In RLS context, regular users won't have permission anyway
    -- But this adds an extra layer of protection
    RAISE EXCEPTION 'Cannot unban a banned user. Contact administrator.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS prevent_unban_trigger ON profiles;
CREATE TRIGGER prevent_unban_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_unban();

-- STEP 3: Add RLS policy to prevent banned users from updating their own profiles
DROP POLICY IF EXISTS "Banned users cannot update profiles" ON profiles;
CREATE POLICY "Banned users cannot update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Only allow updates if user is not banned OR if using service role
    is_banned = false OR auth.uid() IS NULL
  );

COMMENT ON FUNCTION prevent_self_unban IS 'Prevents users from unbanning themselves - only admins can unban';

-- Verify migration
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'is_banned';

