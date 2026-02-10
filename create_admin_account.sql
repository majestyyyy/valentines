-- Create Admin Account
-- Username: majestyyy
-- Password: 123456
-- Run this in Supabase SQL Editor

-- ====================
-- METHOD 1: Using Supabase Dashboard (RECOMMENDED)
-- ====================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Email: majestyyy@gmail.com
-- 4. Password: 123456
-- 5. Auto Confirm User: YES (check this)
-- 6. Click "Create user"
-- 7. Copy the user ID from the Users table
-- 8. Run the SQL below with the copied user ID

-- ====================
-- METHOD 2: Direct SQL Insert (Advanced)
-- ====================

-- Step 1: Create the auth user
-- Note: Replace 'your-user-id-here' with actual UUID after creating user in dashboard
-- Or use the auto-generated ID from the INSERT

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'majestyyy@gmail.com';
  hashed_email TEXT;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;

  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE 'User already exists with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Please create user manually in Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication → Users';
    RAISE NOTICE '2. Click "Add User"';
    RAISE NOTICE '3. Email: %', admin_email;
    RAISE NOTICE '4. Password: 123456';
    RAISE NOTICE '5. Auto Confirm User: YES';
    RAISE NOTICE '6. After creating, run this script again';
    RETURN;
  END IF;

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

  RAISE NOTICE '✅ Admin account created successfully!';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: 123456';
  RAISE NOTICE 'Login at: /abcde/login';
END $$;

-- ====================
-- VERIFICATION
-- ====================

-- Check if admin profile exists
SELECT 
  id,
  email,
  role,
  status,
  nickname,
  created_at
FROM profiles
WHERE role = 'admin';

-- ====================
-- MANUAL PROFILE CREATION (If user already exists in auth.users)
-- ====================

-- If you already created the user in Supabase Dashboard, run this:
-- Replace 'YOUR-USER-ID-HERE' with the actual user ID

/*
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
  'YOUR-USER-ID-HERE'::uuid,  -- Replace with actual user ID
  encode(digest('majestyyy@gmail.com', 'sha256'), 'hex'),
  'admin',
  'approved',
  'Admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  status = 'approved';
*/

-- ====================
-- POST-CREATION STEPS
-- ====================

-- 1. Test login at: http://localhost:3000/abcde/login
-- 2. Email: majestyyy@gmail.com
-- 3. Password: 123456
-- 4. You should be redirected to the admin dashboard

RAISE NOTICE '';
RAISE NOTICE '=========================';
RAISE NOTICE 'ADMIN ACCOUNT SETUP';
RAISE NOTICE '=========================';
RAISE NOTICE 'Email: majestyyy@gmail.com';
RAISE NOTICE 'Password: 123456';
RAISE NOTICE 'Login URL: /abcde/login';
RAISE NOTICE '=========================';
