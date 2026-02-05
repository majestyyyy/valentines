-- Create Audit Logs Table for Security Tracking
-- Run this in your Supabase SQL Editor

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (checked in application layer with service_role)
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow system to insert logs (will use service_role key)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically log profile updates
CREATE OR REPLACE FUNCTION log_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Only log if status changed or profile was edited
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.nickname IS DISTINCT FROM NEW.nickname) OR
     (OLD.description IS DISTINCT FROM NEW.description) OR
     (OLD.photo_urls IS DISTINCT FROM NEW.photo_urls) THEN
    
    INSERT INTO audit_logs (
      event_type,
      user_id,
      target_id,
      details
    ) VALUES (
      CASE 
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'profile_status_change'
        ELSE 'profile_update'
      END,
      auth.uid(),
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_nickname', OLD.nickname,
        'new_nickname', NEW.nickname,
        'changed_fields', ARRAY(
          SELECT key FROM jsonb_each(to_jsonb(NEW)) 
          WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS audit_profile_updates ON profiles;
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_update();

-- Function to log ban actions
CREATE OR REPLACE FUNCTION log_ban_action()
RETURNS trigger AS $$
BEGIN
  -- Log when user is banned (status changes to rejected and they had matches)
  IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    INSERT INTO audit_logs (
      event_type,
      user_id,
      target_id,
      details
    ) VALUES (
      'user_banned',
      auth.uid(),
      NEW.id,
      jsonb_build_object(
        'previous_status', OLD.status,
        'nickname', NEW.nickname,
        'email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ban actions
DROP TRIGGER IF EXISTS audit_ban_actions ON profiles;
CREATE TRIGGER audit_ban_actions
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'rejected')
  EXECUTE FUNCTION log_ban_action();

-- Function to log report submissions
CREATE OR REPLACE FUNCTION log_report_submission()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (
    event_type,
    user_id,
    target_id,
    details
  ) VALUES (
    'report_submitted',
    NEW.reporter_id,
    NEW.reported_id,
    jsonb_build_object(
      'reason', NEW.reason,
      'report_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for report submissions
DROP TRIGGER IF EXISTS audit_report_submissions ON reports;
CREATE TRIGGER audit_report_submissions
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION log_report_submission();

-- Add realtime for audit_logs (optional - for live admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;

-- Create a view for easy admin access
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT 
  al.id,
  al.event_type,
  al.created_at,
  al.details,
  al.ip_address,
  al.user_agent,
  u.nickname as user_nickname,
  u.email as user_email,
  t.nickname as target_nickname,
  t.email as target_email
FROM audit_logs al
LEFT JOIN profiles u ON al.user_id = u.id
LEFT JOIN profiles t ON al.target_id = t.id
ORDER BY al.created_at DESC;

COMMENT ON TABLE audit_logs IS 'Security audit trail for tracking critical system events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event: profile_update, user_banned, report_submitted, admin_login, etc.';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.target_id IS 'User who was affected by the action';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with event-specific details';
