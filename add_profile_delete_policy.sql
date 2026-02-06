-- Add Delete Policy for Profiles
-- Allows users to delete their own profile

-- Add delete policy for profiles
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Verify all policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';
