-- Add terms acceptance tracking to profiles table
-- This migration adds a timestamp column to track when users accepted terms and privacy policy

-- Add terms_accepted_at column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add comment to column
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted terms and privacy policy';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted 
ON profiles(terms_accepted_at);

-- Note: Existing users will have NULL value and will be prompted to accept terms on next login
