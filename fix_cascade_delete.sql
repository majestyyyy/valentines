-- Fix Cascade Delete for User Deletion
-- This allows users to be deleted from Supabase without foreign key constraint errors

-- ============================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================

-- Drop swipes foreign keys
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS swipes_swiper_id_fkey;
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS swipes_swiped_id_fkey;

-- Drop matches foreign keys
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user2_id_fkey;

-- Drop messages sender foreign key
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Drop reports foreign keys
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_id_fkey;

-- ============================================
-- ADD FOREIGN KEYS WITH CASCADE DELETE
-- ============================================

-- Swipes table - delete swipes when user is deleted
ALTER TABLE swipes 
  ADD CONSTRAINT swipes_swiper_id_fkey 
  FOREIGN KEY (swiper_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE swipes 
  ADD CONSTRAINT swipes_swiped_id_fkey 
  FOREIGN KEY (swiped_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Matches table - delete matches when either user is deleted
ALTER TABLE matches 
  ADD CONSTRAINT matches_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches 
  ADD CONSTRAINT matches_user2_id_fkey 
  FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Messages table - delete messages when sender is deleted
ALTER TABLE messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Reports table - delete reports when reporter or reported user is deleted
ALTER TABLE reports 
  ADD CONSTRAINT reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reports 
  ADD CONSTRAINT reports_reported_id_fkey 
  FOREIGN KEY (reported_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================
-- VERIFY CASCADE DELETE SETUP
-- ============================================

-- Query to verify all foreign keys have cascade delete
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;

-- Expected output:
-- All rows should show delete_rule = 'CASCADE'
