# 🔑 How to Rotate Your Supabase Service Role Key

## Step-by-Step Guide

### Step 1: Log into Supabase Dashboard

1. Go to https://supabase.com
2. Click "Sign In"
3. Log into your account
4. Select your project (UE HEART or whatever your project is named)

---

### Step 2: Navigate to API Settings

1. In the left sidebar, click on the **⚙️ Settings** icon (at the bottom)
2. Click on **"API"** in the settings menu

You should now see a page titled "Project API keys"

---

### Step 3: Locate the Service Role Key

You'll see several keys on this page:

- **Project URL** - Your Supabase URL
- **anon public** - Public key (safe to use in client)
- **service_role** - ⚠️ Secret key (should NEVER be in client code)

The service_role section will have:
- A "Reveal" button or masked key like `eyJhbG...` 
- A small eye icon to show/hide the key

---

### Step 4: Generate New Service Role Key

Unfortunately, **Supabase does NOT allow rotating individual keys** from the dashboard directly.

### ⚠️ ALTERNATIVE SOLUTIONS:

#### Option 1: Contact Supabase Support (Recommended)
1. Email support@supabase.com
2. Subject: "URGENT: Need to rotate service_role key - security incident"
3. Explain you need to rotate your service role key due to accidental exposure
4. They can help you rotate it

#### Option 2: Create New Project & Migrate (Nuclear Option)
If the key was compromised:
1. Create a new Supabase project
2. Export your data from old project
3. Import to new project
4. Update your app to use new project credentials
5. Delete old project

#### Option 3: Rotate JWT Secret (Partial Solution)
While you can't rotate just the service role key, you can rotate the JWT secret which will invalidate all existing keys:

**⚠️ WARNING: This will break your app temporarily!**

1. Go to Settings → API → JWT Settings
2. Click "Generate new JWT secret"
3. This will generate NEW keys (including new service_role key)
4. Update your .env files with new keys
5. Redeploy your application

**Steps for JWT Secret Rotation:**

```bash
# In Settings → API → JWT Settings
1. Click "Generate a new JWT secret"
2. Confirm the action (this WILL break existing sessions)
3. Copy the NEW service_role key
4. Update your server-side .env file:
   SUPABASE_SERVICE_ROLE_KEY=<new-key-here>
   # DO NOT use NEXT_PUBLIC_ prefix!
5. Copy the NEW anon key
6. Update your .env file:
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
7. Deploy your application immediately
```

---

### Step 5: Update Your Environment Variables

**CRITICAL: Proper Environment Variable Setup**

Create or update `.env.local` file in your project root:

```bash
# ✅ CORRECT - Public keys (included in browser bundle)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here

# ✅ CORRECT - Server-only keys (NOT included in browser)
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key-here
# ☝️ NO "NEXT_PUBLIC_" prefix!
```

**Add to `.gitignore`:**
```bash
.env.local
.env*.local
.env
```

---

### Step 6: Update Server-Side Code Only

The service role key should ONLY be used in:
- API routes (`app/api/**/*.ts`)
- Server-side code
- Backend scripts

**Example:** Create `app/api/admin/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ✅ CORRECT - Server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // No NEXT_PUBLIC_ prefix!
)

export async function GET() {
  // This runs server-side, key is safe
  const { data } = await supabaseAdmin.from('profiles').select('*')
  return NextResponse.json(data)
}
```

---

### Step 7: Remove Old Key from Code

**Already done in the fixes!** But verify:

1. Check `lib/supabase.ts` - should NOT export `supabaseAdmin`
2. Check all `.env*` files - remove any `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
3. Search codebase for `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

```bash
# Search for any remaining references
grep -r "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE" .
```

If you find any, delete them!

---

### Step 8: Deploy Changes

```bash
# Stage all changes
git add .

# Commit
git commit -m "SECURITY: Remove service role key from client code"

# Deploy to production
git push origin main

# If using Vercel, also update environment variables:
# 1. Go to Vercel Dashboard
# 2. Select your project
# 3. Go to Settings → Environment Variables
# 4. Update NEXT_PUBLIC_SUPABASE_ANON_KEY with new value
# 5. Add SUPABASE_SERVICE_ROLE_KEY (without NEXT_PUBLIC_)
# 6. Redeploy
```

---

## ✅ Verification Checklist

After rotating keys:

- [ ] New service_role key saved securely (NOT in git)
- [ ] `.env.local` updated with new keys
- [ ] `.env.local` added to `.gitignore`
- [ ] No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in code
- [ ] Service role key only in server-side code
- [ ] Code deployed to production
- [ ] Application still works
- [ ] Admin functions still work (via API routes)
- [ ] Old key no longer works (test with old key - should fail)

---

## 🔍 Test That Old Key is Invalidated

Run this in your browser console (with the OLD key):

```javascript
// This should FAIL with the old key
const { createClient } = supabase
const oldClient = createClient(
  'https://your-project.supabase.co',
  'old-service-role-key-here'
)

const { data, error } = await oldClient.from('profiles').select('*')
console.log(error) // Should show "Invalid API key" or similar
```

If it still works → **key not rotated yet!**

---

## 📞 Need Help?

### Supabase Support
- Email: support@supabase.com
- Discord: https://discord.supabase.com
- Docs: https://supabase.com/docs

### For Security Incidents
- Mark email as "URGENT: Security Incident"
- Explain the exposure clearly
- Request immediate key rotation

---

## 🎯 Quick Summary

Since Supabase doesn't have a direct "rotate service key" button:

**Best Option:**
1. Go to Settings → API → JWT Settings
2. Click "Generate a new JWT secret"
3. This creates ALL new keys
4. Update your .env files
5. Redeploy immediately

**Alternative:**
- Contact Supabase support for help rotating just the service_role key

**Critical:**
- NEVER use `NEXT_PUBLIC_` prefix with service_role key
- Only use service_role key in server-side code (API routes)
- Keep it out of git and browser code

---

**Last Updated:** February 11, 2026  
**Priority:** 🔴 CRITICAL
