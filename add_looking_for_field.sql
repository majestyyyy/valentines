-- Add looking_for field to profiles table
-- This allows users to specify what type of connection they're seeking

-- Add the column with ENUM type
ALTER TABLE profiles 
ADD COLUMN looking_for TEXT DEFAULT 'Romantic' CHECK (looking_for IN ('Romantic', 'Friendship', 'Study Buddy', 'Networking', 'Everyone'));

-- Create index for faster filtering
CREATE INDEX idx_profiles_looking_for ON profiles(looking_for);

-- Update existing profiles to have a default value
UPDATE profiles SET looking_for = 'Romantic' WHERE looking_for IS NULL;

-- Verify the change
SELECT id, nickname, looking_for FROM profiles LIMIT 5;
