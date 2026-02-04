# Authentication System Guide

## Overview

yUE Match! now uses a **password-based authentication system with OTP email verification** for new signups. This provides a balance between security and user convenience.

---

## Authentication Flow

### 🆕 Sign Up (New Users)

1. **User enters credentials**:
   - Email address (@ue.edu.ph)
   - Password (minimum 6 characters)
   - Confirm password

2. **System sends OTP**:
   - 6-digit verification code sent to email
   - Code expires after 60 minutes
   - User must verify email to complete signup

3. **User verifies email**:
   - Enters 6-digit OTP from email
   - Account is created and verified
   - Redirected to profile setup

### 🔐 Login (Returning Users)

1. **User enters credentials**:
   - Email address
   - Password

2. **Instant access**:
   - No OTP required
   - Direct login after password verification
   - Redirected based on profile status:
     - No profile → Profile Setup
     - Pending profile → Pending page
     - Approved profile → Home/Swipe page
     - Rejected/Banned → Ban notice

---

## Key Features

### ✅ Benefits

- **One-time verification**: OTP only needed during signup
- **Faster logins**: Password-only login for returning users
- **Email verification**: Ensures valid email addresses
- **Secure passwords**: Bcrypt hashing by Supabase
- **Session persistence**: Users stay logged in across sessions

### 🔒 Security Features

- **Password hashing**: Secure bcrypt encryption
- **OTP expiration**: Time-limited verification codes
- **Email validation**: Restricted to @ue.edu.ph domain (configurable)
- **Session management**: Automatic timeout and refresh
- **CSRF protection**: Built into Supabase Auth

---

## User Interface

### Login Page
- Clean, modern design with gradient backgrounds
- Email and password input fields
- "Log In" button
- "Don't have an account? Sign up" link

### Signup Page
- Email, password, and confirm password fields
- Password strength indicator (future enhancement)
- "Sign Up" button
- "Already have an account? Log in" link

### OTP Verification Page
- 6-digit code input field
- Email address display (shows where code was sent)
- "Verify & Continue" button
- "← Back to login" link
- Resend code option (future enhancement)

---

## Technical Implementation

### Sign Up Flow
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  }
});
```

### Login Flow
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### OTP Verification
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});
```

---

## Configuration

### Supabase Email Settings

1. **Email Templates** (Dashboard → Authentication → Email Templates):
   - Customize "Confirm Signup" template
   - Update branding and styling
   - Modify OTP code display

2. **Email Provider** (Dashboard → Project Settings → Auth):
   - Use Supabase's built-in SMTP (default)
   - Or configure custom SMTP (Gmail, SendGrid, etc.)

3. **Email Rate Limiting**:
   - Configure max emails per hour
   - Prevent spam and abuse

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## User Experience Flow

```
┌─────────────────┐
│   Landing Page  │ (Login)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Login │  │Signup │
└───┬──┘  └──┬────┘
    │         │
    │    ┌────▼─────────┐
    │    │ OTP Verify   │
    │    └────┬─────────┘
    │         │
    └────┬────┘
         │
    ┌────▼──────────┐
    │ Check Profile │
    └────┬──────────┘
         │
    ┌────┴────────────────┐
    │                     │
┌───▼────────┐  ┌────────▼────────┐
│ No Profile │  │ Has Profile     │
│ → Setup    │  │ → Status Check  │
└────────────┘  └────────┬────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Pending │    │Approved │    │Rejected │
    │  Page   │    │  Home   │    │  Ban    │
    └─────────┘    └─────────┘    └─────────┘
```

---

## Email Templates

### OTP Verification Email

Subject: **Verify your yUE Match! account**

```
Hi there! 👋

Welcome to yUE Match! - the exclusive dating app for UE students.

Your verification code is:

    [ 123456 ]

This code expires in 60 minutes.

If you didn't request this code, please ignore this email.

Happy matching! 💕
yUE Match! Team
```

---

## Password Requirements

- **Minimum length**: 6 characters
- **Maximum length**: 72 characters (bcrypt limit)
- **Allowed characters**: Any printable characters
- **Recommendations**:
  - Use a mix of letters, numbers, and symbols
  - Avoid common passwords
  - Don't reuse passwords from other sites

---

## Future Enhancements

### Planned Features
- [ ] Password reset/forgot password flow
- [ ] Password strength indicator
- [ ] Remember me option
- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Email change verification
- [ ] Resend OTP button
- [ ] Login activity log
- [ ] Device management
- [ ] Biometric login (mobile)

---

## Troubleshooting

### Common Issues

**"Invalid email or password"**
- Check email spelling
- Verify password is correct
- Ensure caps lock is off
- Try password reset (when implemented)

**"Please verify your email first"**
- Check inbox for verification email
- Check spam/junk folder
- Request new verification code
- Contact support if not received

**"Passwords do not match"**
- Ensure password and confirm password are identical
- Check for extra spaces
- Verify typing accuracy

**"Password must be at least 6 characters"**
- Use a longer password
- Meet minimum security requirements

---

## Security Best Practices

### For Users
- ✅ Use a strong, unique password
- ✅ Don't share your password
- ✅ Log out on shared devices
- ✅ Verify the website URL
- ❌ Don't use common passwords
- ❌ Don't reuse passwords

### For Administrators
- ✅ Monitor failed login attempts
- ✅ Implement rate limiting
- ✅ Review authentication logs
- ✅ Keep Supabase updated
- ✅ Use strong service role keys
- ✅ Enable 2FA on admin accounts

---

## Migration from Old System

### Previous System
- Passwordless OTP-only authentication
- OTP required for every login
- No password storage

### New System
- Password + OTP verification for signup
- Password-only for login
- OTP only for email verification

### User Impact
- **Existing users**: Will need to create a password on next login (when password reset is implemented)
- **New users**: Create password during signup
- **Better UX**: Faster logins, no waiting for OTP emails

---

## Support

For authentication issues:
- Check this guide first
- Review error messages carefully
- Contact admin support if needed
- Report bugs via GitHub issues

---

**Last Updated**: February 4, 2026  
**Version**: 2.0 (Password + OTP)
