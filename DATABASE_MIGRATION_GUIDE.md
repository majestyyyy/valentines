# 🔄 Database Migration Guide

**Date:** February 12, 2026  
**Reason:** Security breach - migrating to fresh database  
**Estimated Time:** 1-2 hours

---

## ✅ Pre-Migration Checklist

- [ ] New Supabase project created
- [ ] Old database data exported
- [ ] Application code already secured (✅ Done)
- [ ] Backup of current .env.local file

---

## Phase 1: Create New Supabase Project

### Step 1: Create Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. **Project Name:** `UE-HEART-Clean` (or your choice)
4. **Database Password:** Generate strong password → **SAVE IT SECURELY!**
5. **Region:** Choose same region as before
6. Click **"Create new project"**
7. ⏰ Wait 2-3 minutes for initialization

### Step 2: Get New Credentials

Once ready, go to **Project Settings** → **API**:

- **Project URL:** `https://xxxxx.supabase.co`
- **anon/public key:** `eyJhbG...` (starts with eyJ)
- **service_role key:** `eyJhbG...` (NEVER use in client code!)

**📝 Save these securely - you'll need them soon**

---

## Phase 2: Export Clean Data from Old Database

### Option A: Export via Supabase Dashboard (Recommended)

**Export Profiles:**

1. Old Database → **SQL Editor** → New query
2. Run this query:

```sql
-- Get all legitimate user profiles
SELECT 
  id::text,
  email,
  nickname,
  college,
  year_level,
  hobbies,
  description,
  gender,
  preferred_gender,
  looking_for,
  photo_urls,
  terms_accepted_at,
  created_at
FROM profiles
WHERE role = 'user' 
  AND is_banned = false
  AND status = 'approved'
ORDER BY created_at DESC;
```

3. Click **"Results"** → **Download CSV**
4. Save as `profiles_export.csv`

**Export Your Admin Accounts:**

```sql
-- Get YOUR legitimate admin accounts only
SELECT 
  id::text,
  email,
  nickname,
  role,
  created_at
FROM profiles
WHERE role = 'admin'
  AND email LIKE '%@ue.edu.ph'  -- Only UE emails
ORDER BY created_at;
```

5. **Manually verify** each admin account is yours
6. Save as `admins_export.csv`

### Option B: Manual Export (If CSV doesn't work)

Just note down:
- Number of users you want to migrate
- List of your legitimate admin emails

**Important:** Don't export swipes, matches, or messages. Users can start fresh after the breach.

---

## Phase 3: Set Up New Database

### Step 1: Apply Secure Schema

1. **NEW Database** → **SQL Editor**
2. Open `MIGRATION_SCHEMA.sql` from your project folder
3. **Copy entire contents** (Ctrl+A, Ctrl+C)
4. **Paste** into SQL Editor
5. Click **"Run"** ▶️
6. ✅ Wait for success messages

**Expected Output:**
```
✅ SECURE DATABASE SCHEMA CREATED SUCCESSFULLY
✅ All security triggers enabled
✅ RLS policies configured
✅ Audit logging active
```

### Step 2: Set Up Storage Buckets

In **NEW Database** → **SQL Editor**, run:

```sql
-- Create profile photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

-- Set up storage policies
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Create Your Admin Account

1. **NEW Database** → **Authentication** → **Users**
2. Click **"Add User"**
3. **Email:** your-admin@ue.edu.ph
4. **Password:** (create strong password)
5. Click **"Create User"**
6. **Copy the User ID** (looks like: `a1b2c3d4-...`)

Now make this user an admin:

```sql
-- Replace 'YOUR-USER-ID-HERE' with the actual ID you copied
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR-USER-ID-HERE';

-- Verify it worked
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

---

## Phase 4: Update Your Application

### Step 1: Update Environment Variables

1. Open `.env.local` in your project
2. **BACKUP the old file first!**
3. Replace with NEW credentials:

```env
# NEW SUPABASE PROJECT CREDENTIALS
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-NEW-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ NEVER ADD THIS - KEEP SERVER-SIDE ONLY:
# SUPABASE_SERVICE_ROLE_KEY=xxx

# Other settings (keep as is)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**🚨 CRITICAL:** 
- ✅ Only use `NEXT_PUBLIC_` for URL and ANON_KEY
- ❌ NEVER add service_role key to .env.local
- ❌ NEVER commit .env.local to git

### Step 2: Test Locally

```bash
# Clean install
rm -rf .next node_modules
npm install

# Build to check for errors
npm run build

# Run locally
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Sign up with new account
- ✅ Complete profile
- ✅ Upload photo
- ✅ Browse profiles (should see empty - fresh database)

### Step 3: Deploy to Production

```bash
# Commit environment variable changes (but NOT .env.local!)
# Only commit to your deployment platform's environment variables

git add MIGRATION_SCHEMA.sql DATABASE_MIGRATION_GUIDE.md
git commit -m "Add database migration documentation"
git push origin main
```

**For Vercel/Netlify/etc:**
1. Go to your deployment dashboard
2. **Settings** → **Environment Variables**
3. Update:
   - `NEXT_PUBLIC_SUPABASE_URL` → New URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → New anon key
4. **Redeploy** your application

---

## Phase 5: Import Users (Optional)

**⚠️ Decision Point:** Do you want to migrate old users?

### Option A: Fresh Start (Recommended)
- Don't import old users
- Let users re-register
- Cleaner, more secure
- Less risk of importing compromised accounts

### Option B: Import Clean Users

If you have `profiles_export.csv` from Phase 2:

**Important:** Users will need to:
1. Re-register with the SAME email
2. Their profile data will be waiting for them

```sql
-- You can manually insert approved profiles
-- But users still need to authenticate via Supabase Auth
-- This is complex - consider Option A instead
```

---

## Phase 6: Announce Migration

**Send to all users:**

```
Subject: UE HEART - Security Update & Fresh Start

Hi everyone,

We've completed a major security upgrade to keep your data safe. 

What's changed:
✅ New, more secure database
✅ Enhanced security features
✅ All vulnerabilities fixed

What you need to do:
1. Visit [your-app-url]
2. Sign up again with your UE email
3. Complete your profile again

We apologize for the inconvenience, but your security is our top priority.

- UE HEART Team
```

---

## Phase 7: Monitor New Database

### Check Audit Logs Regularly

```sql
-- View all profile changes (admins only)
SELECT 
  pa.changed_at,
  pa.change_type,
  p1.email as changed_profile,
  p2.email as changed_by,
  pa.old_values->>'role' as old_role,
  pa.new_values->>'role' as new_role
FROM profile_audit_log pa
LEFT JOIN profiles p1 ON pa.profile_id = p1.id
LEFT JOIN profiles p2 ON pa.changed_by = p2.id
ORDER BY pa.changed_at DESC
LIMIT 50;
```

### Security Test Checklist

Run these tests in **SQL Editor** to verify security:

```sql
-- Test 1: Try to escalate role (should FAIL)
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM profiles WHERE role = 'user' LIMIT 1);
-- Expected: ERROR: Only administrators can change user roles

-- Test 2: Verify triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
-- Expected: prevent_role_escalation, prevent_profile_tampering, audit_profile_changes

-- Test 3: Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Expected: All tables show rowsecurity = true
```

---

## 🎉 Migration Complete!

You should now have:
- ✅ Fresh, secure database
- ✅ All security features enabled from Day 1
- ✅ No compromised service_role key
- ✅ Audit logging active
- ✅ Application connected to new database

---

## 🔒 Security Maintenance

**Weekly:**
- Check audit logs for suspicious activity
- Review new admin accounts (should only be yours)

**Monthly:**
- Review RLS policies
- Check for unusual data patterns
- Update dependencies: `npm audit fix`

**After ANY security concern:**
- Check audit logs immediately
- Rotate service_role key via Supabase support
- Review recent profile changes

---

## ❓ Troubleshooting

**Problem:** "relation profiles does not exist"  
**Solution:** Re-run MIGRATION_SCHEMA.sql in SQL Editor

**Problem:** Users can't sign up  
**Solution:** Check auth.users trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'`

**Problem:** Photos won't upload  
**Solution:** Verify storage bucket exists and policies are set (Phase 3, Step 2)

**Problem:** Can't update environment variables on deployment  
**Solution:** Check your platform docs:
- Vercel: https://vercel.com/docs/environment-variables
- Netlify: https://docs.netlify.com/environment-variables/overview/

---

## 📞 Support

**Supabase Issues:**  
support@supabase.com

**Application Issues:**  
Check logs in deployment dashboard

**Security Concerns:**  
Immediately rotate keys and check audit logs

---

**Migration Date:** _______________  
**New Project ID:** _______________  
**Admin Accounts Created:** _______________  
**Users Notified:** _______________

