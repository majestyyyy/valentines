# Google OAuth Setup Guide

Follow these steps to enable Google Sign-In for your app.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Enter project name: `UE Heart` (or any name)
4. Click **Create**
5. Wait for project to be created, then select it

---

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**

**Fill in the required fields:**
- App name: `yUE Match`
- User support email: Your email
- Developer contact email: Your email
- Click **Save and Continue**

**Scopes:** Click **Save and Continue** (keep default)

**Test users:** 
- Click **Add Users**
- Add a few @ue.edu.ph emails for testing
- Click **Save and Continue**

Click **Back to Dashboard**

---

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `UE Heart Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-domain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://your-project-ref.supabase.co/auth/v1/callback
```

5. Click **Create**
6. **Copy the Client ID and Client Secret** (you'll need these next)

---

## Step 4: Configure Supabase

1. Open your Supabase Dashboard
2. Go to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle **Enable Sign in with Google** to ON

**Paste your credentials:**
- **Client ID**: Paste from Google Cloud Console
- **Client Secret**: Paste from Google Cloud Console

**Optional Settings:**
- Skip nonce check: OFF (keep default)
- Authorized Client IDs: Leave empty
- Allowed Client IDs: Leave empty

5. Click **Save**

---

## Step 5: Get Your Supabase Callback URL

**How to find your callback URL:**

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** (gear icon at bottom left)
4. Click **API** in the sidebar
5. Look for **Project URL** - it will look like:
   - `https://abcdefghijk.supabase.co`
6. Your callback URL is this URL + `/auth/v1/callback`

**Example:**
- If Project URL is: `https://abcdefghijk.supabase.co`
- Your callback URL is: `https://abcdefghijk.supabase.co/auth/v1/callback`

**Copy this exact URL** - you'll need it for Step 6!

---

## Step 6: Update Google Cloud Redirect URIs

1. Go back to Google Cloud Console → **Credentials**
2. Click on your OAuth client ID
3. Under **Authorized redirect URIs**, add the callback URL you got from Step 5
   - It should look like: `https://abcdefghijk.supabase.co/auth/v1/callback`
   - Replace with YOUR actual Supabase Project URL + `/auth/v1/callback`
4. Click **Save**

---

## Step 7: Test the Setup

1. Start your Next.js app: `npm run dev`
2. Go to `http://localhost:3000`
3. Click **Sign in with Google** or **Continue with Google**
4. Select your @ue.edu.ph account
5. You should be redirected back and logged in

---

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure the redirect URI in Google Cloud exactly matches your Supabase callback URL
- Check for typos, extra slashes, or http vs https

### "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen configuration
- Add yourself as a test user

### Users can't sign in with non-UE emails
- This is expected! The `hd: 'ue.edu.ph'` parameter restricts to UE emails only
- If you want to allow all emails, remove that parameter from the code

### Not redirecting after Google login
- Check your callback route at `/app/auth/callback/route.ts`
- Make sure it handles the session and redirects properly

---

## Production Checklist

Before launching:

✅ Switch OAuth consent screen to **Production** (publish the app)
✅ Update redirect URIs to include production domain
✅ Add production domain to authorized JavaScript origins
✅ Test with multiple UE email accounts
✅ Verify callback URL is correct

---

## Restrict to UE Emails Only

The code already includes domain restriction:
```typescript
hd: 'ue.edu.ph' // Only allows UE emails
```

This is set in both `handleLogin` and `handleSignup` functions in `app/page.tsx`.

---

You're all set! 🎉
