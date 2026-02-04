# Email Security Implementation - UE HEART

## Overview
The application uses **SHA-256 hashing** for authentication while storing **plain emails** in the profiles table for administrative purposes.

## How It Works

### 🔐 Authentication Layer (Supabase Auth)
- **Hashed Email**: Uses SHA-256 hash for all Supabase authentication
- **Security**: Even if auth database is compromised, actual emails remain hidden
- **Example**:
  - User enters: `student@ue.edu.ph`
  - Stored in Auth: `3a7bd3e2360a3d29eea436fcfb7e44c0b649a26b98f9ed3c05d3a39b0e0b5d1c`

### 👁️ Database Layer (Profiles Table)
- **Plain Email**: Stored in `profiles.email` field for admin visibility
- **Purpose**: Allows administrators to identify and contact users
- **Storage Flow**:
  1. User enters email during login → stored temporarily in localStorage
  2. After OTP verification → retrieved from localStorage
  3. Saved to profiles table → localStorage cleared

## Security Benefits

✅ **Authentication Security**: Auth table only contains hashed emails  
✅ **Admin Functionality**: Admins can still view real student emails  
✅ **Best of Both Worlds**: Secure auth + practical administration  
✅ **GDPR Consideration**: Auth layer doesn't expose PII directly  

## Data Flow

### User Registration/Login:
```
1. User enters: student@ue.edu.ph
2. System hashes: 3a7bd3e2360a3d29... (SHA-256)
3. Supabase Auth stores: 3a7bd3e2360a3d29...
4. Plain email stored in localStorage: student@ue.edu.ph
5. Profile created with plain email: student@ue.edu.ph
6. localStorage cleared
```

### Admin View:
```
- Profiles table email field: student@ue.edu.ph ✅ (visible)
- Auth table email field: 3a7bd3e2360a3d29... 🔒 (hashed)
```

## Files Modified

- **lib/hashEmail.ts** - SHA-256 hashing utility
- **app/page.tsx** - User login with hashed auth + localStorage
- **app/admin/login/page.tsx** - Admin login with hashed auth + localStorage  
- **app/profile-setup/page.tsx** - Retrieves plain email from localStorage
- **app/admin/page.tsx** - Displays plain emails from profiles table

## Security Notes

⚠️ **Profiles table contains plain emails** - Ensure proper RLS (Row Level Security) policies  
⚠️ **Admin dashboard requires admin role** - Already implemented with service_role key  
⚠️ **localStorage is temporary** - Cleared immediately after profile creation  

## Future Enhancements

Consider implementing:
- Email encryption at rest in profiles table (AES-256)
- Admin activity logging for email access
- Email masking (show only partial: st***nt@ue.edu.ph)
- Additional authentication factors (2FA)
