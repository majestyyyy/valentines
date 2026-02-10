-- Remove message notification system from database
-- This script undoes all changes made by add_message_notifications.sql

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_message_created ON messages;

-- Drop the function
DROP FUNCTION IF EXISTS create_message_notification();

-- Remove message_id and match_id columns from notifications table
ALTER TABLE notifications DROP COLUMN IF EXISTS message_id;
ALTER TABLE notifications DROP COLUMN IF EXISTS match_id;

-- Update the type check constraint to remove 'message'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'match'));

-- Drop indexes that were created for message notifications
DROP INDEX IF EXISTS idx_notifications_message_id;
DROP INDEX IF EXISTS idx_notifications_match_id;

-- Delete all existing message notifications (optional - uncomment if needed)
-- DELETE FROM notifications WHERE type = 'message';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Message notification system has been successfully removed';
END $$;
