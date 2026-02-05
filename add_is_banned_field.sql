-- Add is_banned field to distinguish between profile edit rejections and account bans
-- is_banned = true: Permanent account ban (blocks everything)
-- status = 'rejected' with is_banned = false: Profile edit rejected (can re-edit)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Update existing rejected profiles to be marked as banned
-- (assuming current rejected users are actual bans)
UPDATE profiles 
SET is_banned = true 
WHERE status = 'rejected';

COMMENT ON COLUMN profiles.is_banned IS 'True for permanent account bans. When false with status=rejected, user can re-edit profile.';
