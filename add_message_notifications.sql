-- Add message notification type to notifications table
-- This allows users to get notified when they receive a new message

-- Update the type check constraint to include 'message'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'match', 'message'));

-- Function to create notification when someone sends a message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  match_record RECORD;
BEGIN
  -- Get the match record to find the other user
  SELECT * INTO match_record FROM matches WHERE id = NEW.match_id;
  
  IF match_record IS NOT NULL THEN
    -- Determine who is receiving the message (the other person in the match)
    IF match_record.user1_id = NEW.sender_id THEN
      recipient_id := match_record.user2_id;
    ELSE
      recipient_id := match_record.user1_id;
    END IF;
    
    -- Create notification for the recipient
    INSERT INTO notifications (user_id, from_user_id, type, message_id, match_id)
    VALUES (recipient_id, NEW.sender_id, 'message', NEW.id, NEW.match_id)
    ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add columns to notifications table for message tracking (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'message_id') THEN
    ALTER TABLE notifications ADD COLUMN message_id UUID REFERENCES messages(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'match_id') THEN
    ALTER TABLE notifications ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger to auto-create notification when message is sent
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- Add index for better performance when querying message notifications
CREATE INDEX IF NOT EXISTS idx_notifications_message_id ON notifications(message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_match_id ON notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

COMMENT ON TRIGGER on_message_created ON messages IS 'Automatically creates a notification when a message is sent';
COMMENT ON FUNCTION create_message_notification IS 'Creates a message notification for the recipient';
