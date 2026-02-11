-- ============================================
-- SECURE DATABASE SCHEMA FOR NEW SUPABASE PROJECT
-- Date: 2026-02-12
-- This includes ALL security fixes from the start
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create specific types
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE profile_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
CREATE TYPE college_enum AS ENUM ('CAS', 'CCSS', 'CBA', 'CEDUC', 'CDENT', 'CENG');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  nickname text,
  photo_urls text[],
  college college_enum,
  year_level int,
  hobbies text[],
  description text,
  gender text CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Other')),
  preferred_gender text CHECK (preferred_gender IN ('Male', 'Female', 'Non-binary', 'Other', 'Everyone')),
  looking_for text CHECK (looking_for IN ('Romantic', 'Friendship', 'Study Buddy', 'Networking', 'Everyone')),
  role app_role DEFAULT 'user',
  status profile_status DEFAULT 'pending',
  is_banned boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  approved_nickname text,
  approved_photo_urls text[],
  approved_college college_enum,
  approved_year_level int,
  approved_hobbies text[],
  approved_description text,
  approved_gender text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURE RLS POLICIES
-- ============================================

-- Policy 1: Users can view approved profiles or their own
CREATE POLICY "Users can view approved profiles or their own"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR (
    status = 'approved'
    AND id != auth.uid()
  )
);

-- Policy 2: Users can only insert their own profile
CREATE POLICY "Users can insert only their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Policy 3: Users can only update their own profile
CREATE POLICY "Users can update only their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 4: Admins can update any profile
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
-- SECURITY TRIGGERS
-- ============================================

-- Trigger 1: Prevent Role Escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
BEGIN
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF NEW.role != OLD.role THEN
    IF current_user_role != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
    
    IF OLD.id = auth.uid() AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
      RAISE EXCEPTION 'Administrators cannot remove their own admin status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- Trigger 2: Prevent Profile Tampering
CREATE OR REPLACE FUNCTION prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
  is_updating_own_profile boolean;
BEGIN
  is_updating_own_profile := (auth.uid() = OLD.id);
  
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_updating_own_profile AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'You can only update your own profile';
  END IF;

  IF current_user_role != 'admin' THEN
    IF NEW.email != OLD.email THEN
      RAISE EXCEPTION 'Email cannot be changed';
    END IF;
    
    IF NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Only administrators can change profile status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_profile_tampering
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_tampering();

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE profile_audit_log (
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

ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON profile_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Trigger 3: Audit Profile Changes
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

CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- ============================================
-- OTHER TABLES
-- ============================================

-- Swipes table
CREATE TABLE swipes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  swiper_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  direction text CHECK (direction IN ('left', 'right')) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(swiper_id, swiped_id)
);

ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Matches table
CREATE TABLE matches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('like', 'match')) NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_profile_id ON profile_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON profile_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================
-- NEW USER SIGNUP HANDLER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ SECURE DATABASE SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '✅ All security triggers enabled';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Audit logging active';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Set up storage buckets';
  RAISE NOTICE '2. Import clean data';
  RAISE NOTICE '3. Create admin accounts';
  RAISE NOTICE '4. Update application .env variables';
END $$;
