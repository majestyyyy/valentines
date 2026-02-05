-- Row Level Security Policies to Block Banned Users
-- This prevents banned users from accessing ANY data at the database level
-- Even if they bypass client-side redirects, they cannot query data

-- ============================================
-- STEP 1: Drop ALL existing policies to start fresh
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    -- Drop all policies on matches table  
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'matches') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON matches';
    END LOOP;
    
    -- Drop all policies on messages table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
    END LOOP;
    
    -- Drop all policies on tasks table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON tasks';
    END LOOP;
    
    -- Drop all policies on swipes table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'swipes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON swipes';
    END LOOP;
    
    -- Drop all policies on reports table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reports') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON reports';
    END LOOP;
    
    -- Drop all policies on notifications table (if exists)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notifications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON notifications';
    END LOOP;
END $$;

-- ============================================
-- PROFILES TABLE: Block banned users from viewing/updating profiles
-- ============================================

-- Policy: Users can ALWAYS view their own profile (even if banned, so they can see ban message)
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can INSERT their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile ONLY if they are NOT banned
CREATE POLICY "Users can update their own profile if not banned"
ON profiles FOR UPDATE
USING (
  auth.uid() = id 
  AND status != 'banned'
);

-- Policy: Non-banned users can view other approved profiles for swiping
-- Simplified to avoid infinite recursion
CREATE POLICY "Non-banned users can view approved profiles"
ON profiles FOR SELECT
USING (
  auth.uid() != id
  AND status = 'approved'
);

-- Policy: Users can view profiles they have interacted with (notifications, matches)
CREATE POLICY "Users can view profiles in their interactions"
ON profiles FOR SELECT
USING (
  auth.uid() != id
  AND (
    -- Profiles in notifications they received
    id IN (SELECT from_user_id FROM notifications WHERE user_id = auth.uid())
    OR
    -- Profiles in their matches
    id IN (
      SELECT user1_id FROM matches WHERE user2_id = auth.uid()
      UNION
      SELECT user2_id FROM matches WHERE user1_id = auth.uid()
    )
  )
);

-- ============================================
-- MATCHES TABLE: Block banned users from accessing matches
-- ============================================

DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Non-banned users can view their matches" ON matches;
DROP POLICY IF EXISTS "Non-banned users can insert matches" ON matches;
DROP POLICY IF EXISTS "Non-banned users can update matches" ON matches;

-- Policy: Users can view matches ONLY if they are NOT banned
CREATE POLICY "Non-banned users can view their matches"
ON matches FOR SELECT
USING (
  (user1_id = auth.uid() OR user2_id = auth.uid())
);

-- Policy: Users can insert matches ONLY if they are NOT banned
CREATE POLICY "Non-banned users can insert matches"
ON matches FOR INSERT
WITH CHECK (
  (user1_id = auth.uid() OR user2_id = auth.uid())
);

-- Policy: Users can update matches ONLY if they are NOT banned
CREATE POLICY "Non-banned users can update matches"
ON matches FOR UPDATE
USING (
  (user1_id = auth.uid() OR user2_id = auth.uid())
);

-- ============================================
-- MESSAGES TABLE: Block banned users from accessing messages
-- ============================================

DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages;
DROP POLICY IF EXISTS "Non-banned users can view their messages" ON messages;
DROP POLICY IF EXISTS "Non-banned users can insert messages" ON messages;

-- Policy: Users can view messages ONLY if they are NOT banned
CREATE POLICY "Non-banned users can view their messages"
ON messages FOR SELECT
USING (
  match_id IN (
    SELECT id FROM matches 
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Policy: Users can insert messages ONLY if they are NOT banned
CREATE POLICY "Non-banned users can insert messages"
ON messages FOR INSERT
WITH CHECK (
  match_id IN (
    SELECT id FROM matches 
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- ============================================
-- TASKS TABLE: Block banned users from accessing missions
-- ============================================

DROP POLICY IF EXISTS "Users can view tasks for their matches" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for their matches" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their matches" ON tasks;
DROP POLICY IF EXISTS "Non-banned users can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Non-banned users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Non-banned users can update tasks" ON tasks;

-- Policy: Users can view tasks ONLY if they are NOT banned
CREATE POLICY "Non-banned users can view their tasks"
ON tasks FOR SELECT
USING (
  match_id IN (
    SELECT id FROM matches 
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Policy: Users can insert tasks ONLY if they are NOT banned
CREATE POLICY "Non-banned users can insert tasks"
ON tasks FOR INSERT
WITH CHECK (
  match_id IN (
    SELECT id FROM matches 
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Policy: Users can update tasks ONLY if they are NOT banned
CREATE POLICY "Non-banned users can update tasks"
ON tasks FOR UPDATE
USING (
  match_id IN (
    SELECT id FROM matches 
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- ============================================
-- SWIPES TABLE: Block banned users from swiping
-- ============================================

DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can insert swipes" ON swipes;
DROP POLICY IF EXISTS "Non-banned users can view their swipes" ON swipes;
DROP POLICY IF EXISTS "Non-banned users can insert swipes" ON swipes;

-- Policy: Users can view swipes ONLY if they are NOT banned
CREATE POLICY "Non-banned users can view their swipes"
ON swipes FOR SELECT
USING (
  swiper_id = auth.uid()
);

-- Policy: Users can insert swipes ONLY if they are NOT banned
CREATE POLICY "Non-banned users can insert swipes"
ON swipes FOR INSERT
WITH CHECK (
  swiper_id = auth.uid()
);

-- ============================================
-- REPORTS TABLE: Allow users to submit reports
-- ============================================

DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- Policy: Users can insert reports
CREATE POLICY "Users can insert reports"
ON reports FOR INSERT
WITH CHECK (
  reporter_id = auth.uid()
);

-- Policy: Users can view their own submitted reports
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (
  reporter_id = auth.uid()
);

-- ============================================
-- NOTIFICATIONS TABLE: Allow users to view their notifications
-- ============================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (
  user_id = auth.uid()
);

-- Policy: System can insert notifications
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (
  user_id = auth.uid()
);

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. Run add_banned_status.sql FIRST before running this file
-- 2. These policies will make ALL data inaccessible to banned users
-- 3. Banned users can still view their own profile (to see ban message)
-- 4. Banned users cannot access matches, messages, tasks, or swipes
-- 5. The middleware will redirect banned users to /profile-setup/banned
-- 6. Test by setting a user's status to 'banned' and trying to access the app
