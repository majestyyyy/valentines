-- ⚡ Performance Optimization Script
-- Run this in Supabase SQL Editor for immediate performance improvements

-- ==========================================
-- 1. CRITICAL DATABASE INDEXES
-- ==========================================

-- Swipes table indexes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_swiped 
ON swipes(swiper_id, swiped_id);

CREATE INDEX IF NOT EXISTS idx_swipes_direction 
ON swipes(swiper_id, direction) 
WHERE direction = 'right';

-- Matches table indexes
CREATE INDEX IF NOT EXISTS idx_matches_user1 
ON matches(user1_id);

CREATE INDEX IF NOT EXISTS idx_matches_user2 
ON matches(user2_id);

CREATE INDEX IF NOT EXISTS idx_matches_created 
ON matches(created_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_time 
ON messages(match_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status) 
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_profiles_approved_id 
ON profiles(id) 
WHERE status = 'approved';

-- Notifications table indexes (already created, but verify)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- Reports table index
CREATE INDEX IF NOT EXISTS idx_reports_created 
ON reports(created_at DESC);

-- ==========================================
-- 2. CREATE EFFICIENT VIEWS FOR COMMON QUERIES
-- ==========================================

-- View for match details (eliminates N+1 queries)
CREATE OR REPLACE VIEW match_details AS
SELECT 
  m.id,
  m.user1_id,
  m.user2_id,
  m.created_at,
  m.mission_1_id,
  m.mission_2_id,
  m.mission_3_id,
  m.mission_number,
  m.mission_completed,
  m.mission_completed_at,
  p1.nickname as user1_nickname,
  p1.photo_urls as user1_photos,
  p1.college as user1_college,
  p2.nickname as user2_nickname,
  p2.photo_urls as user2_photos,
  p2.college as user2_college
FROM matches m
LEFT JOIN profiles p1 ON m.user1_id = p1.id
LEFT JOIN profiles p2 ON m.user2_id = p2.id;

-- Grant access to the view
GRANT SELECT ON match_details TO authenticated;

-- ==========================================
-- 3. OPTIMIZE CASCADE DELETES
-- ==========================================

-- Ensure foreign keys have proper indexes for cascade deletes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_fk ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped_fk ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_fk ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_fk ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_fk ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_fk ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_fk ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_fk ON notifications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_fk ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_fk ON reports(reported_id);

-- ==========================================
-- 4. ADD QUERY OPTIMIZATION FUNCTIONS
-- ==========================================

-- Function to get unread likes count efficiently
CREATE OR REPLACE FUNCTION get_unread_likes_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = user_uuid
      AND type = 'like'
      AND is_read = false
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_unread_likes_count(UUID) TO authenticated;

-- Function to get match count efficiently
CREATE OR REPLACE FUNCTION get_match_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM matches
    WHERE user1_id = user_uuid OR user2_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_match_count(UUID) TO authenticated;

-- ==========================================
-- 5. OPTIMIZE STORAGE WITH VACUUM
-- ==========================================

-- Analyze tables for query planner
ANALYZE profiles;
ANALYZE swipes;
ANALYZE matches;
ANALYZE messages;
ANALYZE notifications;

-- ==========================================
-- 6. VERIFY INDEX CREATION
-- ==========================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '=== OPTIMIZATION COMPLETE ===';
  RAISE NOTICE '✅ Created/verified % indexes', index_count;
  RAISE NOTICE '✅ Created match_details view';
  RAISE NOTICE '✅ Created optimization functions';
  RAISE NOTICE '✅ Analyzed tables for query planner';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is now optimized!';
END $$;
