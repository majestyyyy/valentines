-- Create admin_whitelist table to control who can become admin
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage whitelist
CREATE POLICY "Only admins can view whitelist" ON admin_whitelist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert to whitelist" ON admin_whitelist
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update whitelist" ON admin_whitelist
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to check if email is whitelisted
CREATE OR REPLACE FUNCTION is_admin_whitelisted(check_email text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_whitelist 
    WHERE email = check_email AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON TABLE admin_whitelist IS 'Whitelist of emails allowed to become admins';
COMMENT ON FUNCTION is_admin_whitelisted IS 'Checks if an email is whitelisted for admin access';
