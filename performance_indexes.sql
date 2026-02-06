-- Performance Indexes for 1,000+ Users
-- Run this in your Supabase SQL Editor

-- ============================================
-- CRITICAL INDEXES FOR MATCHING PERFORMANCE
-- ============================================

-- Profiles table - most important for matching queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_gender ON profiles(preferred_gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status_gender ON profiles(status, gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status_preferred ON profiles(status, preferred_gender);

-- Composite index for the main matching query
-- This covers: status + gender + preferred_gender together
CREATE INDEX IF NOT EXISTS idx_profiles_matching 
  ON profiles(status, gender, preferred_gender) 
  WHERE status = 'approved';

-- ============================================
-- SWIPES TABLE INDEXES
-- ============================================

-- Critical for "already swiped" checks
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_direction ON swipes(swiper_id, direction);

-- For finding mutual swipes (matches)
CREATE INDEX IF NOT EXISTS idx_swipes_mutual ON swipes(swiper_id, swiped_id, direction);

-- ============================================
-- MATCHES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);

-- Composite for faster match lookups
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- For fetching latest messages per match
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON messages(match_id, created_at DESC);

-- ============================================
-- REPORTS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE profiles;
ANALYZE swipes;
ANALYZE matches;
ANALYZE messages;
ANALYZE reports;
ANALYZE notifications;
