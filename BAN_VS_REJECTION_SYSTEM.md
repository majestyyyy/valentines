# Ban vs Profile Rejection System

## Overview
The system now distinguishes between **permanent account bans** and **profile edit rejections**, allowing users to re-edit their profiles after rejection without being permanently banned.

## Database Changes

### New Field: `is_banned`
- **Type**: `BOOLEAN DEFAULT false`
- **Purpose**: Distinguishes between permanent bans and profile edit rejections

#### Field Logic:
- `is_banned = true` → **Permanent Account Ban**
  - User cannot log in
  - User cannot create/edit profiles
  - User cannot access the app
  - Shows "Account Banned" message

- `is_banned = false` AND `status = 'rejected'` → **Profile Edit Rejected**
  - User can log in
  - User can re-edit their profile
  - Admin rejected their profile changes, but account is not banned

## SQL Migration

**File**: `add_is_banned_field.sql`

Run this SQL in your Supabase SQL Editor:

```sql
-- Add is_banned field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Update existing rejected profiles to be marked as banned
UPDATE profiles 
SET is_banned = true 
WHERE status = 'rejected';
```

## Admin Workflows

### 1. Rejecting a Profile Edit (Without Banning)
When an admin wants to reject a user's profile changes but allow them to re-edit:

1. Click "Reject" on the pending profile
2. System sets `status = 'rejected'`
3. System does NOT set `is_banned`
4. User sees their profile was rejected
5. User can edit and resubmit their profile

**Result**: User can log in and fix their profile

### 2. Permanently Banning a User
When an admin wants to permanently ban a user (via Report → Ban):

1. Click "Ban User" on a report
2. System sets `status = 'rejected'` AND `is_banned = true`
3. System deletes all matches, swipes, messages, tasks
4. User is immediately signed out
5. User cannot log in again

**Result**: User is permanently blocked from the app

## Code Changes

### Files Modified:
1. ✅ `/app/page.tsx` - Login checks `is_banned`
2. ✅ `/app/profile/page.tsx` - Profile edit checks `is_banned`
3. ✅ `/app/profile-setup/page.tsx` - Profile creation checks `is_banned`
4. ✅ `/app/home/page.tsx` - Home page checks `is_banned`
5. ✅ `/app/admin/page.tsx` - Ban action sets `is_banned = true`
6. ✅ `/components/BanGuard.tsx` - Global ban check uses `is_banned`

### Key Logic Changes:

#### Before (Old System):
```typescript
// Everything used status='rejected' for both rejections and bans
if (profile.status === 'rejected') {
  // User is blocked from everything
}
```

#### After (New System):
```typescript
// Permanent bans check is_banned
if (profile.is_banned) {
  // User is permanently banned
}

// Profile rejections allow re-editing
if (profile.status === 'rejected' && !profile.is_banned) {
  // User can re-edit their profile
}
```

## User Experience

### Scenario 1: Admin Rejects Profile Edit
1. User edits their profile (changes photo, bio, etc.)
2. Admin sees the edit in "Pending Approvals"
3. Admin clicks "Reject"
4. User's `status` → `'rejected'`, `is_banned` → `false`
5. User can log in normally
6. User sees their profile is still editable
7. User can make changes and resubmit
8. Profile goes back to `pending` status

### Scenario 2: Admin Permanently Bans User
1. Admin sees inappropriate behavior in Reports
2. Admin clicks "Ban User"
3. User's `status` → `'rejected'`, `is_banned` → `true`
4. User is immediately signed out
5. If user tries to log in: "Your account has been banned"
6. User cannot access any part of the app
7. BanGuard shows permanent ban screen

## Testing Checklist

### Test Profile Rejection (Not Ban):
- [ ] Run SQL migration: `add_is_banned_field.sql`
- [ ] User creates a profile
- [ ] Admin rejects the profile (click "Reject" in Pending tab)
- [ ] Verify `status = 'rejected'` and `is_banned = false` in database
- [ ] User logs in successfully
- [ ] User can edit their profile
- [ ] User can resubmit profile

### Test Permanent Ban:
- [ ] User has inappropriate content
- [ ] Another user reports them
- [ ] Admin clicks "Ban User" in Reports tab
- [ ] Verify `status = 'rejected'` and `is_banned = true` in database
- [ ] User is immediately signed out
- [ ] User tries to log in → sees "Account Banned" message
- [ ] Login fails and signs user out
- [ ] BanGuard shows ban screen if somehow they access the app

## Database Queries

### Check all banned users:
```sql
SELECT id, email, nickname, status, is_banned, created_at
FROM profiles
WHERE is_banned = true;
```

### Check rejected profiles (not banned):
```sql
SELECT id, email, nickname, status, is_banned, created_at
FROM profiles
WHERE status = 'rejected' AND is_banned = false;
```

### Manually unban a user:
```sql
UPDATE profiles
SET is_banned = false, status = 'approved'
WHERE id = 'user-id-here';
```

### Manually ban a user:
```sql
UPDATE profiles
SET is_banned = true, status = 'rejected'
WHERE id = 'user-id-here';
```

## Security Notes

1. **Login Protection**: Users with `is_banned = true` are immediately signed out
2. **Profile Protection**: Banned users cannot create or edit profiles
3. **Real-time Updates**: BanGuard subscribes to profile changes and detects bans immediately
4. **Admin Only**: Only admins can set `is_banned` via the admin dashboard
5. **RLS Policies**: Ensure RLS policies allow admins to update `is_banned` field

## Rollback Plan

If you need to revert these changes:

```sql
-- Remove the is_banned field
ALTER TABLE profiles DROP COLUMN IF EXISTS is_banned;

-- Drop the index
DROP INDEX IF EXISTS idx_profiles_is_banned;
```

Then revert the code changes in the 6 modified files.

## Summary

✅ **Fixed**: Users whose profile edits are rejected can now re-edit without being permanently banned  
✅ **Maintained**: Permanent bans still work via the Report → Ban User flow  
✅ **Improved**: Clear separation between temporary rejections and permanent bans  
✅ **User-Friendly**: Users get a second chance to fix their profiles instead of immediate ban
