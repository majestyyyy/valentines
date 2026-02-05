-- Add columns to store the last approved version of profile data
-- When a user updates their profile, it goes to pending but others still see the approved snapshot

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS approved_nickname text,
ADD COLUMN IF NOT EXISTS approved_photo_urls text[],
ADD COLUMN IF NOT EXISTS approved_college college_enum,
ADD COLUMN IF NOT EXISTS approved_year_level int,
ADD COLUMN IF NOT EXISTS approved_hobbies text[],
ADD COLUMN IF NOT EXISTS approved_description text,
ADD COLUMN IF NOT EXISTS approved_gender text,
ADD COLUMN IF NOT EXISTS approved_preferred_gender text;

-- For existing approved profiles, copy current data to approved snapshot
UPDATE profiles
SET 
  approved_nickname = nickname,
  approved_photo_urls = photo_urls,
  approved_college = college,
  approved_year_level = year_level,
  approved_hobbies = hobbies,
  approved_description = description,
  approved_gender = gender,
  approved_preferred_gender = preferred_gender
WHERE status = 'approved' 
  AND approved_nickname IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.approved_nickname IS 'Snapshot of last approved profile data shown to other users';
