-- Setup Admin Users and Permissions
-- Run this in your Supabase SQL Editor

-- IMPORTANT: Before running this, add your service_role key to your .env.local file:
-- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
-- Get it from: Supabase Dashboard → Project Settings → API → service_role key
-- WARNING: This key bypasses RLS - keep it secure and NEVER commit to git!

-- First, update the reports table schema to include details field if needed
ALTER TABLE reports ADD COLUMN IF NOT EXISTS details text;

-- NOTE: Admin accounts are now created via OTP signup at /admin/login
-- No need to manually update user roles here
-- The OTP signup process automatically sets role = 'admin'

-- If you need to manually promote an existing user to admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@ue.edu.ph';

-- Drop any existing recursive policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Note: Admin operations will use the service_role key or SECURITY DEFINER functions
-- to bypass RLS policies instead of using recursive policies

-- RLS for reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

-- Allow users to create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Allow users to view their own reports and admins to view all (checked in application layer)
CREATE POLICY "Users can view reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

-- Admin delete will be handled via service_role key

-- Add realtime for reports (if not already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reports;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already added, ignore error
  END;
END $$;

-- Function to get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  pending_approvals bigint,
  total_matches bigint,
  open_reports bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles WHERE status = 'approved'),
    (SELECT COUNT(*) FROM profiles WHERE status = 'pending'),
    (SELECT COUNT(*) FROM matches),
    (SELECT COUNT(*) FROM reports);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
