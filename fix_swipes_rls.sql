-- Fix Swipes Table RLS Policies
-- This adds Row Level Security policies for the swipes table

-- Enable RLS on swipes table if not already enabled
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can insert their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view swipes where they are swiped on" ON swipes;

-- Policy 1: Users can view swipes they made
CREATE POLICY "Users can view their own swipes"
ON swipes
FOR SELECT
TO authenticated
USING (
  swiper_id = auth.uid()
);

-- Policy 2: Users can view swipes where they were swiped on (to check for matches)
CREATE POLICY "Users can view swipes where they are swiped on"
ON swipes
FOR SELECT
TO authenticated
USING (
  swiped_id = auth.uid()
);

-- Policy 3: Users can insert their own swipes
CREATE POLICY "Users can insert their own swipes"
ON swipes
FOR INSERT
TO authenticated
WITH CHECK (
  swiper_id = auth.uid()
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'swipes';
