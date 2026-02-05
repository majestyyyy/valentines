# Ban System - Complete Lock Down Testing Guide

## Overview
When an admin bans a user through the report system, that user is **PERMANENTLY** blocked from accessing the app at all entry points.

## Ban Enforcement Layers

### Layer 1: Database Level
**File**: `prevent_unban_trigger.sql`
- Database trigger prevents users from changing `is_banned` from true to false
- RLS policy blocks banned users from updating their profiles
- Only service role (admins) can unban users

### Layer 2: Auth Callback
**File**: `app/auth/callback/route.ts`
- Checks `is_banned === true` after OAuth/magic link login
- Signs out banned user immediately
- Redirects to login with `?error=banned` parameter

### Layer 3: Login Page
**File**: `app/page.tsx`
- Password login checks `is_banned === true` BEFORE navigation
- OTP verification checks `is_banned === true` BEFORE navigation
- Shows error message from `?error=banned` parameter
- Signs out banned user before any redirect
- Checks ban status even if profile is incomplete

### Layer 4: Profile Setup Page
**File**: `app/profile-setup/page.tsx`
- `checkBanStatusFirst()` runs on page load (separate useEffect)
- Checks `is_banned === true` before loading profile data
- Signs out + redirects to login immediately

### Layer 5: Profile Edit Page
**File**: `app/profile/page.tsx`
- Checks `is_banned === true` in loadProfile
- Signs out + redirects to login immediately

### Layer 6: Home/Swipe Page
**File**: `app/home/page.tsx`
- Checks `is_banned === true` in checkProfileAndFetch
- Signs out + redirects to login immediately

### Layer 7: Global BanGuard
**File**: `components/BanGuard.tsx`
- Wraps entire app in layout.tsx
- Real-time subscription monitors `is_banned` field
- Auto signs out when ban detected
- Shows prominent red ban screen
- Prevents all app access

## Admin Ban Process

When admin clicks "Ban User" from Reports tab:

1. **Updates Database**:
   ```sql
   UPDATE profiles SET status = 'rejected', is_banned = true WHERE id = userId
   ```

2. **Deletes All User Data**:
   - ✅ Matches
   - ✅ Swipes
   - ✅ Messages
   - ✅ Notifications
   - ✅ Tasks
   - ✅ Reports

3. **Logs Action**:
   - Audit log entry created with admin ID and user ID

4. **Real-time Effect**:
   - BanGuard detects change via Supabase subscription
   - User signed out immediately
   - Ban screen shown

## Testing Checklist

### Test 1: Ban via Reports
- [ ] Login as admin
- [ ] Go to Reports tab
- [ ] Click "Ban User" on a report
- [ ] Verify confirmation dialog shows
- [ ] Confirm ban
- [ ] Verify user's `is_banned = true` in database
- [ ] Verify user's data is deleted

### Test 2: Banned User Login (Password)
- [ ] User tries to login with email/password
- [ ] Login appears to succeed initially
- [ ] Immediately signed out
- [ ] Error message: "Your account has been permanently banned"
- [ ] Cannot proceed to any page

### Test 3: Banned User Login (OTP)
- [ ] User tries to login with magic link
- [ ] Receives OTP code
- [ ] Enters OTP code
- [ ] Verification appears to succeed initially
- [ ] Immediately signed out
- [ ] Error message: "Your account has been permanently banned"
- [ ] Cannot proceed to any page

### Test 4: Banned User OAuth
- [ ] User tries OAuth login (if implemented)
- [ ] Auth callback checks ban status
- [ ] Immediately signed out
- [ ] Redirected to login with error message

### Test 5: Profile Setup Access
- [ ] Banned user somehow gets to /profile-setup
- [ ] Page loads and immediately checks ban
- [ ] Signed out and redirected to login
- [ ] Cannot access form

### Test 6: Direct URL Access
- [ ] Banned user tries to access /home
- [ ] Signed out immediately
- [ ] Redirected to login
- [ ] Cannot access /profile
- [ ] Cannot access /chat
- [ ] Cannot access any protected route

### Test 7: BanGuard Real-time
- [ ] User is logged in
- [ ] Admin bans user in real-time
- [ ] Within seconds, user sees ban screen
- [ ] User is signed out automatically
- [ ] All app access blocked

### Test 8: Database Protection
- [ ] Try to update `is_banned = false` via SQL (as user)
- [ ] Should fail with RLS error
- [ ] Trigger should prevent update
- [ ] Only service role can unban

## Expected Behavior

### ✅ Banned User CANNOT:
- ❌ Log in with password
- ❌ Log in with OTP
- ❌ Log in with OAuth
- ❌ Create new profile
- ❌ Edit existing profile
- ❌ Access home/swipe page
- ❌ Access chat
- ❌ Access any protected route
- ❌ Unban themselves via database
- ❌ Stay logged in

### ✅ Banned User SEES:
- 🛡️ Red ban screen (via BanGuard)
- 🚫 Error message: "Your account has been permanently banned"
- 🔓 Only option: Sign Out button

### ✅ System DOES:
- ✅ Signs out banned user immediately
- ✅ Shows clear ban message
- ✅ Blocks all entry points
- ✅ Protects at database level
- ✅ Real-time ban detection
- ✅ Deletes all user data on ban
- ✅ Logs admin action

## Database Queries for Testing

### Check if user is banned:
```sql
SELECT id, email, is_banned, status, created_at
FROM profiles
WHERE email = 'user@example.com';
```

### List all banned users:
```sql
SELECT id, email, nickname, created_at, is_banned
FROM profiles
WHERE is_banned = true;
```

### Manually ban a user (admin only):
```sql
UPDATE profiles
SET is_banned = true, status = 'rejected'
WHERE email = 'user@example.com';
```

### Try to unban yourself (should fail):
```sql
-- Run this as the banned user (will fail due to RLS)
UPDATE profiles
SET is_banned = false
WHERE id = auth.uid();
-- Error: RLS policy violation
```

### Unban a user (admin via service role only):
```sql
-- Only works with service role key
UPDATE profiles
SET is_banned = false, status = 'approved'
WHERE id = 'user-id-here';
```

## Security Notes

1. **Database Triggers**: Prevent self-unbanning at database level
2. **RLS Policies**: Banned users cannot update their own profiles
3. **Real-time Subscriptions**: BanGuard detects bans instantly
4. **Multiple Checkpoints**: 7 layers of ban enforcement
5. **Immediate Sign Out**: All layers sign out banned users
6. **No Bypass**: Cannot access any route while banned

## Deployment Checklist

Before deploying to production:

- [ ] Run `add_is_banned_field.sql` in Supabase
- [ ] Run `prevent_unban_trigger.sql` in Supabase
- [ ] Verify RLS policies are active
- [ ] Test ban flow end-to-end
- [ ] Verify real-time subscriptions work
- [ ] Test all 7 ban enforcement layers
- [ ] Confirm audit logging works

## Summary

The ban system now has **7 layers of protection**:
1. Database triggers & RLS
2. Auth callback
3. Login page (password + OTP)
4. Profile setup page
5. Profile edit page
6. Home/swipe page
7. Global BanGuard

**Result**: Banned users are completely locked out with no way to access the app.
