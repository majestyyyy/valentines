-- Email rate limit tracking table
CREATE TABLE IF NOT EXISTS email_rate_limit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT now(),
  email_type text NOT NULL CHECK (email_type IN ('otp', 'verification', 'notification')),
  recipient text NOT NULL,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_email_sent_at ON email_rate_limit(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_type ON email_rate_limit(email_type);

-- Function to get today's email count (PST timezone)
CREATE OR REPLACE FUNCTION get_todays_email_count()
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM email_rate_limit
  WHERE sent_at >= CURRENT_DATE AT TIME ZONE 'America/Los_Angeles'
  AND success = true;
$$ LANGUAGE sql;

-- Function to get email stats for dashboard
CREATE OR REPLACE FUNCTION get_email_stats()
RETURNS TABLE (
  total_today integer,
  successful_today integer,
  failed_today integer,
  otp_count integer,
  verification_count integer,
  notification_count integer
) AS $$
  SELECT 
    COUNT(*)::integer as total_today,
    COUNT(*) FILTER (WHERE success = true)::integer as successful_today,
    COUNT(*) FILTER (WHERE success = false)::integer as failed_today,
    COUNT(*) FILTER (WHERE email_type = 'otp')::integer as otp_count,
    COUNT(*) FILTER (WHERE email_type = 'verification')::integer as verification_count,
    COUNT(*) FILTER (WHERE email_type = 'notification')::integer as notification_count
  FROM email_rate_limit
  WHERE sent_at >= CURRENT_DATE AT TIME ZONE 'America/Los_Angeles';
$$ LANGUAGE sql;

-- Optional: Cleanup old records (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void AS $$
  DELETE FROM email_rate_limit
  WHERE sent_at < NOW() - INTERVAL '30 days';
$$ LANGUAGE sql;

-- Enable RLS (Row Level Security)
ALTER TABLE email_rate_limit ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role
CREATE POLICY "Allow all for service role" ON email_rate_limit
  FOR ALL
  USING (true);

COMMENT ON TABLE email_rate_limit IS 'Tracks email sending for rate limit monitoring';
COMMENT ON FUNCTION get_todays_email_count() IS 'Returns count of successful emails sent today (PST timezone)';
COMMENT ON FUNCTION get_email_stats() IS 'Returns detailed email statistics for today';
COMMENT ON FUNCTION cleanup_old_email_logs() IS 'Removes email logs older than 30 days';
