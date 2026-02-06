# Terms Acceptance Implementation Guide

## Overview
A new feature has been implemented that requires users to read and scroll through the Terms & Privacy Policy before creating their profile. Users must also acknowledge important disclaimers in a modal before proceeding.

## What Was Changed

### 1. New Page: Terms Acceptance (`/terms-acceptance`)
- **Location**: `/app/terms-acceptance/page.tsx`
- **Features**:
  - Displays comprehensive terms and privacy policy
  - Scroll tracking - users must scroll to the bottom
  - Visual indicator showing scroll progress
  - "Continue" button only enabled after scrolling to bottom
  - Disclaimer modal with 3 required acknowledgments:
    1. Age verification (18+ years old)
    2. Risk acknowledgment (online dating risks)
    3. Personal responsibility (platform limitations)

### 2. Updated Login Flow (`/app/page.tsx`)
- Modified to check if user has accepted terms
- New flow:
  1. User logs in or signs up
  2. If no terms acceptance → redirect to `/terms-acceptance`
  3. If terms accepted → redirect to `/profile-setup`

### 3. Updated Profile Setup (`/app/profile-setup/page.tsx`)
- Added check to verify terms have been accepted
- If not accepted, redirects to `/terms-acceptance`
- Prevents profile creation without terms acceptance

### 4. Updated MobileGuard (`/components/MobileGuard.tsx`)
- Added exception for `/terms-acceptance` page
- Allows both mobile and desktop access to terms acceptance

### 5. Database Migration (`/add_terms_acceptance.sql`)
- Adds `terms_accepted_at` column to `profiles` table
- Stores timestamp of when user accepted terms
- Creates index for faster queries

## How to Deploy

### Step 1: Run Database Migration
Execute the SQL migration in your Supabase SQL Editor:

```bash
# File: add_terms_acceptance.sql
```

**What it does**:
- Adds `terms_accepted_at` column (nullable timestamp)
- Existing users will have NULL and will be prompted to accept terms on next login

### Step 2: Test the Flow

1. **New User Flow**:
   - Go to login/signup page
   - Sign up with new @ue.edu.ph email
   - After email verification → Should redirect to `/terms-acceptance`
   - Scroll to bottom of terms
   - Click "Continue to Acceptance"
   - Modal appears with 3 checkboxes
   - Check all 3 boxes
   - Click "I Accept - Continue"
   - Should redirect to `/profile-setup`

2. **Existing User Flow**:
   - Log in with existing account
   - If `terms_accepted_at` is NULL → redirect to `/terms-acceptance`
   - Complete terms acceptance
   - Should redirect to `/profile-setup` or `/home` based on profile status

3. **User with Terms Accepted**:
   - Log in
   - Should bypass `/terms-acceptance`
   - Go directly to appropriate page (home or profile-setup)

## User Experience

### Terms Acceptance Page
1. **Header**: "Terms & Privacy Policy" with back button
2. **Scrollable Content**: 
   - 9 sections covering all important aspects
   - Scroll indicator at bottom
   - Cannot continue until scrolled to bottom
3. **Continue Button**: 
   - Disabled (gray) until scrolled to bottom
   - Enabled (rose gradient) after scrolling
4. **Disclaimer Modal**:
   - 3 required checkboxes
   - Safety reminders in red box
   - University disclaimer in blue box
   - "Go Back" or "I Accept" buttons

### Visual Indicators
- ✅ Green checkmark when scrolled to bottom
- ⚠️ Warning icon in disclaimer modal
- 🚨 Red flags section for safety awareness
- Smooth animations and transitions

## Database Schema Update

```sql
-- New column in profiles table
terms_accepted_at: TIMESTAMPTZ (nullable)

-- Example usage:
-- NULL = terms not accepted (user will be prompted)
-- '2026-02-06 10:30:00' = terms accepted on Feb 6, 2026 at 10:30 AM
```

## Important Notes

### For Existing Users
- Existing users with NULL `terms_accepted_at` will be prompted to accept terms on next login
- They cannot access the app until they accept terms
- All their existing data (profile, matches, chats) remains intact

### For New Users
- Must accept terms before creating profile
- Cannot skip or bypass the terms acceptance
- Terms acceptance is tracked with timestamp

### Security Considerations
- Terms acceptance is stored server-side (not just client-side)
- Cannot manipulate localStorage or cookies to bypass
- Database enforces the requirement

## Customization Options

If you want to modify the terms content:
1. Edit `/app/terms-acceptance/page.tsx`
2. Update the sections in the scrollable content area
3. Modify disclaimer text in the modal

If you want to change the number of required acknowledgments:
1. Add/remove checkboxes in the disclaimer modal
2. Update the validation logic in `handleAcceptDisclaimer` function

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] New user signup redirects to terms acceptance
- [ ] Existing user login redirects to terms acceptance (if not accepted)
- [ ] Scroll tracking works correctly
- [ ] Continue button enables only after scrolling to bottom
- [ ] Disclaimer modal shows all checkboxes
- [ ] Cannot accept without checking all boxes
- [ ] Terms acceptance saves to database
- [ ] After acceptance, redirects to profile setup
- [ ] User with accepted terms bypasses terms page
- [ ] Mobile and desktop both work correctly
- [ ] Back button works on terms acceptance page

## Troubleshooting

**Issue**: Users stuck on terms page after accepting
- **Solution**: Check if database update succeeded. Verify `terms_accepted_at` is set.

**Issue**: Scroll tracking not working
- **Solution**: Check browser console for errors. Ensure scrollContainerRef is properly attached.

**Issue**: Disclaimer modal not showing
- **Solution**: Verify `hasScrolledToBottom` state is true before clicking Continue.

**Issue**: Existing users not prompted for terms
- **Solution**: Ensure `terms_accepted_at` column exists and existing rows have NULL value.

## Support

For issues or questions:
- Email: noreply.uewelfare.official@gmail.com
- Check browser console for error messages
- Verify database connection and column exists

---

**Last Updated**: February 6, 2026
**Version**: 1.0
