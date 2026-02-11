-- ============================================
-- CRITICAL SECURITY FIX
-- Date: 2026-02-11
-- Issue: Users can modify other users' profiles and roles
-- ============================================

-- ============================================
-- STEP 1: Strengthen RLS Policies on Profiles
-- ============================================

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Policy 1: Users can ONLY view approved profiles (except their own)
CREATE POLICY "Users can view approved profiles or their own"
ON profiles FOR SELECT
USING (
  id = auth.uid()  -- Can always view own profile
  OR (
    status = 'approved'  -- Can view other approved profiles
    AND id != auth.uid()
  )
);

-- Policy 2: Users can ONLY insert their OWN profile
CREATE POLICY "Users can insert only their own profile"
ON profiles FOR INSERT
WITH CHECK (
  id = auth.uid()
);

-- Policy 3: Users can ONLY update their own profile
-- CRITICAL: This prevents users from updating other profiles
-- Note: Role changes are prevented by the prevent_role_escalation trigger below
CREATE POLICY "Users can update only their own profile"
ON profiles FOR UPDATE
USING (
  id = auth.uid()  -- Can only update if authenticated user ID matches profile ID
)
WITH CHECK (
  id = auth.uid()  -- Double check on the data being updated
);

-- Policy 4: ADMIN-ONLY policy for updating any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- STEP 2: Prevent Role Escalation via Triggers
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS prevent_role_escalation ON profiles;
DROP FUNCTION IF EXISTS prevent_role_escalation();

-- Function to prevent users from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Get the role of the user making the update
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- If the role is being changed
  IF NEW.role != OLD.role THEN
    -- Only admins can change roles
    IF current_user_role != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
    
    -- Prevent self-demotion (admin removing their own admin status)
    IF OLD.id = auth.uid() AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
      RAISE EXCEPTION 'Administrators cannot remove their own admin status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce role escalation prevention
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- ============================================
-- STEP 3: Prevent Nickname/Email Tampering
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS prevent_profile_tampering ON profiles;
DROP FUNCTION IF EXISTS prevent_profile_tampering();

-- Function to prevent unauthorized profile changes
CREATE OR REPLACE FUNCTION prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
  is_updating_own_profile boolean;
BEGIN
  -- Check if user is updating their own profile
  is_updating_own_profile := (auth.uid() = OLD.id);
  
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Only admins can update other users' profiles
  IF NOT is_updating_own_profile AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'You can only update your own profile';
  END IF;

  -- Prevent non-admins from changing sensitive fields
  IF current_user_role != 'admin' THEN
    -- Prevent email changes
    IF NEW.email != OLD.email THEN
      RAISE EXCEPTION 'Email cannot be changed';
    END IF;
    
    -- Prevent status changes (only admins can approve/reject/ban)
    IF NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Only administrators can change profile status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent profile tampering
CREATE TRIGGER prevent_profile_tampering
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_tampering();

-- ============================================
-- STEP 4: Audit Log for Profile Changes
-- ============================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_audit_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  old_values jsonb,
  new_values jsonb,
  change_type text,
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON profile_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Drop existing audit trigger if exists
DROP TRIGGER IF EXISTS audit_profile_changes ON profiles;
DROP FUNCTION IF EXISTS audit_profile_changes();

-- Function to log profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_audit_log (
    profile_id,
    changed_by,
    old_values,
    new_values,
    change_type
  ) VALUES (
    NEW.id,
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW),
    TG_OP
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- ============================================
-- STEP 5: Add Security Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_profile_id ON profile_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON profile_audit_log(changed_by);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ CRITICAL SECURITY FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '✅ RLS policies strengthened';
  RAISE NOTICE '✅ Role escalation prevention enabled';
  RAISE NOTICE '✅ Profile tampering protection enabled';
  RAISE NOTICE '✅ Audit logging enabled';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: You must also update client-side code!';
  RAISE NOTICE '⚠️  Remove (supabase as any) type casts';
  RAISE NOTICE '⚠️  Ensure all updates use auth.uid() only';
END $$;
