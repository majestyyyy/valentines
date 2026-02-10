-- Set existing user as admin
-- Email: parungao.johnlloyd@ue.edu.ph
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'parungao.johnlloyd@ue.edu.ph';
  hashed_email TEXT;
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users', admin_email;
  END IF;

  RAISE NOTICE 'Found user ID: %', admin_user_id;

  -- Hash the email for privacy
  hashed_email := encode(digest(lower(trim(admin_email)), 'sha256'), 'hex');

  -- Create or update profile with admin role
  INSERT INTO profiles (
    id, 
    email, 
    role, 
    status,
    nickname,
    terms_accepted_at,
    created_at
  )
  VALUES (
    admin_user_id,
    hashed_email,
    'admin',
    'approved',
    'Admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    status = 'approved',
    email = hashed_email;

  RAISE NOTICE '✅ User upgraded to admin successfully!';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Role: admin';
  RAISE NOTICE 'Status: approved';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login at: /abcde/login';
END $$;

-- Verify the admin account
SELECT 
  id,
  email,
  role,
  status,
  nickname,
  created_at
FROM profiles
WHERE email = encode(digest('parungao.johnlloyd@ue.edu.ph', 'sha256'), 'hex');
