-- Function to automatically sign out banned users
-- This should be called from the admin panel when banning a user

CREATE OR REPLACE FUNCTION sign_out_banned_user(banned_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's status to banned
  UPDATE profiles
  SET status = 'banned'
  WHERE id = banned_user_id;
  
  -- Note: To actually invalidate the auth session, you need to call
  -- supabase.auth.admin.deleteUser() from the admin panel
  -- This SQL function only updates the status
END;
$$;

-- Grant execute permission to authenticated users (admin panel will use this)
GRANT EXECUTE ON FUNCTION sign_out_banned_user TO authenticated;

-- ============================================
-- ADMIN PANEL INTEGRATION NOTES
-- ============================================
-- When you ban a user in the admin panel, call:
--
-- 1. Update their status to 'banned':
--    await supabase.rpc('sign_out_banned_user', { banned_user_id: userId })
--
-- 2. Delete their auth session (requires service role key):
--    await supabaseAdmin.auth.admin.deleteUser(userId)
--
-- This will:
-- - Set their profile status to 'banned'
-- - Invalidate all their active sessions
-- - RLS policies will prevent them from accessing any data
-- - Middleware will redirect them to the banned page
-- - They will be completely locked out of the app
