-- ============================================
-- SECURE MESSAGES - PRIVACY PROTECTION
-- Date: 2026-02-12
-- Prevents unauthorized access to private conversations
-- ============================================

-- Enable RLS on messages table (if not already enabled)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can only view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only send messages to their matches" ON messages;
DROP POLICY IF EXISTS "Admins cannot view messages" ON messages;

-- ============================================
-- RLS POLICIES FOR MESSAGES
-- ============================================

-- Policy 1: Users can only view messages from their own matches
CREATE POLICY "Users can only view their own messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Policy 2: Users can only send messages to their matches
CREATE POLICY "Users can only send messages to their matches"
ON messages FOR INSERT
WITH CHECK (
  -- Must be the sender
  sender_id = auth.uid()
  AND
  -- Must be in a valid match
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Policy 3: Users cannot update messages
-- (No update policy = messages are immutable after sending)

-- Policy 4: Users can delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- ============================================
-- BLOCK ADMIN ACCESS TO MESSAGES (PRIVACY)
-- ============================================

-- Even admins should NOT be able to read private messages
-- Messages are visible ONLY to the two matched users

-- To verify admins are blocked, test with:
-- SELECT * FROM messages; (as admin user - should return empty)

-- ============================================
-- SECURE MATCHES TABLE TOO
-- ============================================

-- Ensure matches table also has RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own matches" ON matches;

-- Users can only see matches they're part of
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Users cannot manually create matches (system creates them via swipes)
-- Only through application logic

-- Users can delete their own matches (unmatch feature)
CREATE POLICY "Users can delete their own matches"
ON matches FOR DELETE
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================
-- SECURE TASKS TABLE
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks from their matches" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their matches" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their matches" ON tasks;

CREATE POLICY "Users can view tasks from their matches"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = tasks.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can create tasks in their matches"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update tasks in their matches"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = tasks.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete tasks in their matches"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = tasks.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- ============================================
-- AUDIT: CHECK SECURITY
-- ============================================

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ VULNERABLE' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('messages', 'matches', 'tasks')
ORDER BY tablename;

-- List all message policies
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  CASE qual
    WHEN NULL THEN 'No restriction'
    ELSE 'Restricted'
  END as has_restriction
FROM pg_policies
WHERE tablename IN ('messages', 'matches', 'tasks')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ MESSAGE PRIVACY PROTECTION ENABLED';
  RAISE NOTICE '✅ Users can only see messages from their own matches';
  RAISE NOTICE '✅ Admins CANNOT access private messages';
  RAISE NOTICE '✅ Matches, tasks also secured';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Privacy Features:';
  RAISE NOTICE '  - Messages visible only to match participants';
  RAISE NOTICE '  - No admin access to private conversations';
  RAISE NOTICE '  - Messages cannot be edited after sending';
  RAISE NOTICE '  - Users can delete their own messages';
END $$;
