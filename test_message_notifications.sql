-- Test Suite for Message Notifications
-- This script tests the automatic notification creation when messages are sent
-- Run this in Supabase SQL Editor after setting up add_message_notifications.sql

-- ====================
-- SETUP TEST DATA
-- ====================

-- Create two test users (if they don't exist)
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID := gen_random_uuid();
BEGIN
  -- Clean up any existing test data
  DELETE FROM notifications WHERE user_id IN (user1_id, user2_id);
  DELETE FROM messages WHERE match_id IN (SELECT id FROM matches WHERE user1_id IN (user1_id, user2_id) OR user2_id IN (user1_id, user2_id));
  DELETE FROM matches WHERE user1_id IN (user1_id, user2_id) OR user2_id IN (user1_id, user2_id);
  DELETE FROM profiles WHERE id IN (user1_id, user2_id);

  -- Insert test profiles
  INSERT INTO profiles (id, email, nickname, status, photo_urls, college)
  VALUES 
    (user1_id, 'testuser1@test.com', 'Test User 1', 'approved', ARRAY['https://example.com/photo1.jpg'], 'CAS'),
    (user2_id, 'testuser2@test.com', 'Test User 2', 'approved', ARRAY['https://example.com/photo2.jpg'], 'CBA')
  ON CONFLICT (id) DO NOTHING;

  -- Create a test match between the two users
  INSERT INTO matches (id, user1_id, user2_id)
  VALUES (test_match_id, user1_id, user2_id);

  RAISE NOTICE 'Test data created:';
  RAISE NOTICE '  User 1 ID: %', user1_id;
  RAISE NOTICE '  User 2 ID: %', user2_id;
  RAISE NOTICE '  Match ID: %', test_match_id;
END $$;

-- ====================
-- TEST 1: Basic Notification Creation
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID;
  test_message_id UUID;
  notification_count INT;
BEGIN
  -- Get the match ID
  SELECT id INTO test_match_id FROM matches WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 1: Basic Notification Creation ===';
  
  -- User 1 sends a message to User 2
  INSERT INTO messages (match_id, sender_id, content)
  VALUES (test_match_id, user1_id, 'Hello, this is a test message!')
  RETURNING id INTO test_message_id;

  RAISE NOTICE 'Message sent from User 1 to User 2';
  RAISE NOTICE 'Message ID: %', test_message_id;

  -- Wait a moment for trigger to execute
  PERFORM pg_sleep(0.5);

  -- Check if notification was created for User 2
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE user_id = user2_id
    AND from_user_id = user1_id
    AND type = 'message'
    AND message_id = test_message_id;

  IF notification_count = 1 THEN
    RAISE NOTICE '✅ PASS: Notification created for User 2';
  ELSE
    RAISE NOTICE '❌ FAIL: Expected 1 notification, found %', notification_count;
  END IF;

  -- Verify notification has correct match_id
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE message_id = test_message_id AND match_id = test_match_id
  ) THEN
    RAISE NOTICE '✅ PASS: Notification has correct match_id';
  ELSE
    RAISE NOTICE '❌ FAIL: Notification missing or has incorrect match_id';
  END IF;
END $$;

-- ====================
-- TEST 2: Multiple Messages Create Multiple Notifications
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID;
  notification_count INT;
  initial_count INT;
BEGIN
  SELECT id INTO test_match_id FROM matches WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 2: Multiple Messages ===';

  -- Count existing notifications
  SELECT COUNT(*) INTO initial_count
  FROM notifications
  WHERE user_id = user2_id AND type = 'message';

  RAISE NOTICE 'Initial notification count: %', initial_count;

  -- Send 3 messages
  INSERT INTO messages (match_id, sender_id, content)
  VALUES 
    (test_match_id, user1_id, 'Message 1'),
    (test_match_id, user1_id, 'Message 2'),
    (test_match_id, user1_id, 'Message 3');

  PERFORM pg_sleep(0.5);

  -- Check if 3 new notifications were created
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE user_id = user2_id AND type = 'message';

  IF notification_count = initial_count + 3 THEN
    RAISE NOTICE '✅ PASS: 3 new notifications created (Total: %)', notification_count;
  ELSE
    RAISE NOTICE '❌ FAIL: Expected % notifications, found %', initial_count + 3, notification_count;
  END IF;
END $$;

-- ====================
-- TEST 3: Reverse Direction (User 2 sends to User 1)
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID;
  notification_count INT;
BEGIN
  SELECT id INTO test_match_id FROM matches WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 3: Reverse Direction (User 2 → User 1) ===';

  -- User 2 sends a message to User 1
  INSERT INTO messages (match_id, sender_id, content)
  VALUES (test_match_id, user2_id, 'Reply from User 2');

  PERFORM pg_sleep(0.5);

  -- Check if notification was created for User 1
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE user_id = user1_id
    AND from_user_id = user2_id
    AND type = 'message';

  IF notification_count >= 1 THEN
    RAISE NOTICE '✅ PASS: Notification created for User 1';
  ELSE
    RAISE NOTICE '❌ FAIL: No notification found for User 1';
  END IF;
END $$;

-- ====================
-- TEST 4: Mark Notifications as Read
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID;
  unread_count INT;
  read_count INT;
BEGIN
  SELECT id INTO test_match_id FROM matches WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 4: Mark as Read Functionality ===';

  -- Check unread count before
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = user2_id
    AND type = 'message'
    AND is_read = false;

  RAISE NOTICE 'Unread notifications for User 2: %', unread_count;

  -- Mark all message notifications as read for this match (simulating opening the chat)
  UPDATE notifications
  SET is_read = true
  WHERE user_id = user2_id
    AND match_id = test_match_id
    AND type = 'message'
    AND is_read = false;

  -- Check read count after
  SELECT COUNT(*) INTO read_count
  FROM notifications
  WHERE user_id = user2_id
    AND match_id = test_match_id
    AND type = 'message'
    AND is_read = true;

  IF read_count = unread_count THEN
    RAISE NOTICE '✅ PASS: All % notifications marked as read', unread_count;
  ELSE
    RAISE NOTICE '❌ FAIL: Expected % read, found %', unread_count, read_count;
  END IF;

  -- Verify unread count is now 0 for this match
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = user2_id
    AND match_id = test_match_id
    AND type = 'message'
    AND is_read = false;

  IF unread_count = 0 THEN
    RAISE NOTICE '✅ PASS: No unread notifications remaining';
  ELSE
    RAISE NOTICE '❌ FAIL: Still have % unread notifications', unread_count;
  END IF;
END $$;

-- ====================
-- TEST 5: Cascade Delete (Notifications deleted when message deleted)
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_match_id UUID;
  test_message_id UUID;
  notification_exists BOOLEAN;
BEGIN
  SELECT id INTO test_match_id FROM matches WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 5: Cascade Delete ===';

  -- Create a new message
  INSERT INTO messages (match_id, sender_id, content)
  VALUES (test_match_id, user1_id, 'Message to be deleted')
  RETURNING id INTO test_message_id;

  PERFORM pg_sleep(0.5);

  -- Verify notification exists
  SELECT EXISTS(
    SELECT 1 FROM notifications WHERE message_id = test_message_id
  ) INTO notification_exists;

  RAISE NOTICE 'Notification exists before delete: %', notification_exists;

  -- Delete the message
  DELETE FROM messages WHERE id = test_message_id;

  -- Check if notification was also deleted
  SELECT EXISTS(
    SELECT 1 FROM notifications WHERE message_id = test_message_id
  ) INTO notification_exists;

  IF NOT notification_exists THEN
    RAISE NOTICE '✅ PASS: Notification deleted when message deleted (CASCADE)';
  ELSE
    RAISE NOTICE '❌ FAIL: Notification still exists after message deletion';
  END IF;
END $$;

-- ====================
-- TEST SUMMARY
-- ====================

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  total_notifications INT;
  user1_notifications INT;
  user2_notifications INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================';
  RAISE NOTICE '=== TEST SUMMARY ===';
  RAISE NOTICE '======================';

  SELECT COUNT(*) INTO total_notifications FROM notifications WHERE type = 'message';
  SELECT COUNT(*) INTO user1_notifications FROM notifications WHERE user_id = user1_id AND type = 'message';
  SELECT COUNT(*) INTO user2_notifications FROM notifications WHERE user_id = user2_id AND type = 'message';

  RAISE NOTICE 'Total message notifications: %', total_notifications;
  RAISE NOTICE 'User 1 received: %', user1_notifications;
  RAISE NOTICE 'User 2 received: %', user2_notifications;

  -- Show sample notification details
  RAISE NOTICE '';
  RAISE NOTICE 'Sample Notification Details:';
  PERFORM (
    SELECT RAISE NOTICE '  User: %, From: %, Read: %, Match: %', 
      user_id, from_user_id, is_read, match_id
    FROM notifications 
    WHERE type = 'message' 
    LIMIT 1
  );
END $$;

-- ====================
-- CLEANUP (Optional - comment out to keep test data)
-- ====================

-- Uncomment below to clean up test data after testing
/*
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  DELETE FROM notifications WHERE user_id IN (user1_id, user2_id);
  DELETE FROM messages WHERE match_id IN (SELECT id FROM matches WHERE user1_id IN (user1_id, user2_id) OR user2_id IN (user1_id, user2_id));
  DELETE FROM matches WHERE user1_id IN (user1_id, user2_id) OR user2_id IN (user1_id, user2_id);
  DELETE FROM profiles WHERE id IN (user1_id, user2_id);
  
  RAISE NOTICE '';
  RAISE NOTICE 'Test data cleaned up successfully';
END $$;
*/
