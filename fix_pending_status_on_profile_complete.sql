-- Fix profile status to only be 'pending' after profile is completed
-- This ensures admin only sees profiles that are fully filled out with images

-- Step 1: Add a new status type that includes 'incomplete'
-- First, create a new enum type with the additional status
DO $$ 
BEGIN
    -- Check if incomplete is already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'incomplete' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'profile_status')
    ) THEN
        ALTER TYPE profile_status ADD VALUE 'incomplete';
    END IF;
END $$;

-- Step 2: Update default status to 'incomplete' for new profiles
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'incomplete'::profile_status;

-- Step 3: Update the trigger function to set status as 'incomplete'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, status)
  VALUES (new.id, new.email, 'incomplete');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update existing incomplete profiles (profiles without nickname or photos) to 'incomplete' status
UPDATE profiles 
SET status = 'incomplete'
WHERE status = 'pending' 
  AND (nickname IS NULL OR photo_urls IS NULL OR array_length(photo_urls, 1) < 1);

COMMENT ON TYPE profile_status IS 'incomplete: profile not yet filled out, pending: awaiting admin approval, approved: active profile, rejected: needs changes, banned: permanently banned';
