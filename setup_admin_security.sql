-- Admin login attempts tracking
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_login_attempts_email_time ON admin_login_attempts(email, attempted_at);

-- Function to check login attempts (max 5 failed attempts in 15 minutes)
CREATE OR REPLACE FUNCTION check_admin_login_attempts(check_email text)
RETURNS boolean AS $$
  SELECT COUNT(*) < 5
  FROM admin_login_attempts
  WHERE email = check_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '15 minutes';
$$ LANGUAGE sql;

-- Function to log login attempt
CREATE OR REPLACE FUNCTION log_admin_login_attempt(
  attempt_email text,
  attempt_success boolean,
  attempt_ip text DEFAULT NULL
)
RETURNS void AS $$
  INSERT INTO admin_login_attempts (email, success, ip_address)
  VALUES (attempt_email, attempt_success, attempt_ip);
$$ LANGUAGE sql;

-- Cleanup old login attempts (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_admin_login_attempts()
RETURNS void AS $$
  DELETE FROM admin_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '7 days';
$$ LANGUAGE sql;

COMMENT ON TABLE admin_login_attempts IS 'Tracks admin login attempts for rate limiting';
