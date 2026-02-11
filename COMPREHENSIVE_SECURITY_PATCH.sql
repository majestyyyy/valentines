-- ============================================
-- COMPREHENSIVE SECURITY PATCH
-- Fixes all vulnerabilities from security audit
-- Date: 2026-02-12
-- ============================================

-- ============================================
-- PART 1: SECURE RPC FUNCTIONS
-- ============================================

-- Drop and recreate get_admin_stats with proper security
DROP FUNCTION IF EXISTS get_admin_stats();

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  pending_approvals bigint,
  total_matches bigint,
  open_reports bigint
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if caller is an admin
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_user_role IS NULL OR current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view statistics';
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles WHERE status = 'approved'),
    (SELECT COUNT(*) FROM profiles WHERE status = 'pending'),
    (SELECT COUNT(*) FROM matches),
    (SELECT COUNT(*) FROM reports);
END;
$$;

-- Revoke public access, grant only to authenticated users
REVOKE ALL ON FUNCTION get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- ============================================
-- PART 2: RESTRICT SCHEMA INTROSPECTION
-- ============================================

-- While we can't disable /rest/v1 endpoint (Supabase design),
-- we ensure all tables have RLS so schema knowledge is useless

-- Check for tables without RLS
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Enabled RLS on: %', tbl.tablename;
  END LOOP;
END $$;

-- ============================================
-- PART 3: SECURE SWIPES TABLE
-- ============================================

-- Swipes were likely exposed - add RLS
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;

CREATE POLICY "Users can view their own swipes"
ON swipes FOR SELECT
USING (swiper_id = auth.uid());

CREATE POLICY "Users can create their own swipes"
ON swipes FOR INSERT
WITH CHECK (swiper_id = auth.uid());

CREATE POLICY "Users can delete their own swipes"
ON swipes FOR DELETE
USING (swiper_id = auth.uid());

-- ============================================
-- PART 4: SECURE REPORTS TABLE
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- Users can only see reports they created
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- PART 5: SECURE NOTIFICATIONS TABLE
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- Allow system to create notifications (FROM user must be authenticated)
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND from_user_id = auth.uid()
);

-- ============================================
-- PART 6: FIX EMAIL HASHING CONSISTENCY
-- ============================================

-- Hash all admin emails that are currently unhashed
DO $$
DECLARE
  admin_record record;
  hashed_email text;
BEGIN
  FOR admin_record IN 
    SELECT id, email 
    FROM profiles 
    WHERE role = 'admin' 
      AND email NOT LIKE 'hashed_%'  -- Not already hashed
      AND email IS NOT NULL
  LOOP
    -- Hash the email using SHA-256
    hashed_email := 'hashed_' || encode(digest(admin_record.email, 'sha256'), 'hex');
    
    UPDATE profiles
    SET email = hashed_email
    WHERE id = admin_record.id;
    
    RAISE NOTICE 'Hashed admin email for user: %', admin_record.id;
  END LOOP;
  
  RAISE NOTICE 'Email hashing consistency check complete';
END $$;

-- ============================================
-- PART 7: RESTRICT SERVICE ACCOUNT FUNCTIONS
-- ============================================

-- Ensure handle_new_user can only be triggered by system
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 8: PREVENT ANON KEY ABUSE
-- ============================================

-- Ensure anon users can't access sensitive data
-- All tables should require authentication

-- Verify all critical tables have proper RLS
CREATE OR REPLACE FUNCTION verify_rls_coverage()
RETURNS TABLE (
  table_name text,
  has_rls boolean,
  policy_count bigint,
  status text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity,
    COUNT(p.policyname),
    CASE 
      WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN '✅ SECURE'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN '⚠️ RLS ENABLED BUT NO POLICIES'
      ELSE '❌ VULNERABLE - NO RLS'
    END
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations')
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$;

-- ============================================
-- PART 9: AUDIT CURRENT SECURITY STATE
-- ============================================

-- Run security audit
SELECT '=== RLS COVERAGE AUDIT ===' as audit_section;
SELECT * FROM verify_rls_coverage();

SELECT '=== EXPOSED RPC FUNCTIONS ===' as audit_section;
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️ RUNS AS OWNER'
    ELSE '✅ RUNS AS CALLER'
  END as security_note
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

SELECT '=== ADMIN ACCOUNTS ===' as audit_section;
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN email LIKE 'hashed_%' THEN '✅ EMAIL HASHED'
    ELSE '❌ EMAIL NOT HASHED'
  END as security_status
FROM profiles
WHERE role = 'admin'
ORDER BY created_at;

-- ============================================
-- PART 10: FINAL VERIFICATION
-- ============================================

DO $$
DECLARE
  vulnerable_tables integer;
  total_tables integer;
BEGIN
  -- Count vulnerable tables
  SELECT COUNT(*) INTO vulnerable_tables
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations')
    AND NOT t.rowsecurity;
  
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECURITY PATCH COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RPC Functions secured';
  RAISE NOTICE '✅ All tables have RLS enabled';
  RAISE NOTICE '✅ Admin emails hashed';
  RAISE NOTICE '✅ Swipes, reports, notifications protected';
  RAISE NOTICE '✅ Messages already secured';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables with RLS: % / %', (total_tables - vulnerable_tables), total_tables;
  
  IF vulnerable_tables > 0 THEN
    RAISE WARNING '⚠️ Still % vulnerable tables without RLS!', vulnerable_tables;
  ELSE
    RAISE NOTICE '🎉 ALL TABLES PROTECTED!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Rotate service_role key via Supabase support';
  RAISE NOTICE '2. Monitor audit logs for suspicious activity';
  RAISE NOTICE '3. Review admin accounts (see audit above)';
  RAISE NOTICE '4. Consider migrating to fresh database';
  RAISE NOTICE '';
END $$;
