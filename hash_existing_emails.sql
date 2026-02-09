-- One-time migration script to hash all existing plaintext emails
-- Run this in Supabase SQL Editor to convert all existing emails to hashes

-- Function to hash emails using SHA-256 (same as hashEmail.ts)
CREATE OR REPLACE FUNCTION hash_email_migration()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  hashed_email TEXT;
BEGIN
  -- Loop through all profiles with plaintext emails (containing @)
  FOR profile_record IN 
    SELECT id, email 
    FROM profiles 
    WHERE email LIKE '%@%'
  LOOP
    -- Hash the email using SHA-256
    hashed_email := encode(digest(lower(trim(profile_record.email)), 'sha256'), 'hex');
    
    -- Update the profile with hashed email
    UPDATE profiles 
    SET email = hashed_email 
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Hashed email for user: %', profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'Migration complete!';
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT hash_email_migration();

-- Drop the function after use (cleanup)
DROP FUNCTION IF EXISTS hash_email_migration();

-- Verify the results
SELECT id, 
       email, 
       CASE 
         WHEN email LIKE '%@%' THEN 'PLAINTEXT (NOT HASHED)'
         ELSE 'HASHED'
       END as email_status
FROM profiles
LIMIT 20;
