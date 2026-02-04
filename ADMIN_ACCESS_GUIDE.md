# Admin Dashboard Access Guide

## 🔐 How to Access the Admin Dashboard (OTP-Based)

### Step 1: Admin Signup (First Time Only)

1. **Navigate to Admin Portal**
   ```
   http://localhost:3000/admin/login
   ```

2. **Click "Sign Up" tab**

3. **Enter Your Email**
   - Enter your admin email (e.g., `admin@ue.edu.ph`)
   - Click **"Sign Up with OTP"**

4. **Check Your Email**
   - You'll receive a 6-digit OTP code
   - Enter the code in the verification screen
   - Click **"Verify & Sign In"**

5. **Auto-Admin Role**
   - Your account is automatically created with admin privileges
   - You'll be redirected to the admin dashboard

### Step 2: Admin Login (Every Time)

1. **Navigate to Admin Portal**
   ```
   http://localhost:3000/admin/login
   ```

2. **Click "Login" tab**

3. **Enter Your Email**
   - Enter your admin email
   - Click **"Login with OTP"**

4. **Verify OTP**
   - Check your email for the 6-digit code
   - Enter the code
   - Click **"Verify & Sign In"**

5. **Access Dashboard**
   - You'll be redirected to `/admin` dashboard
   - No password needed - just OTP!

---

## ✨ Features

### 🔒 Enhanced Security
- ✅ **No passwords to remember** - OTP-based authentication
- ✅ **Email verification required** - Every login requires fresh OTP
- ✅ **Automatic admin role** - Signup process sets admin privileges
- ✅ **Secure sessions** - Supabase manages authentication

### 📊 Dashboard Capabilities
- View real-time statistics
- Approve/reject pending profiles
- Manage user reports
- Ban violating users
- Logout securely

---

## 🛠️ Setup Checklist

- [ ] Run `setup_admin.sql` in Supabase SQL Editor (sets up permissions)
- [ ] Navigate to `/admin/login`
- [ ] Click "Sign Up" tab
- [ ] Enter your admin email
- [ ] Check email for OTP code
- [ ] Verify OTP
- [ ] Access admin dashboard!

---

## 🔑 Important URLs

| Page | URL | Description |
|------|-----|-------------|
| **Admin Portal** | `/admin/login` | Signup & Login with OTP |
| **Admin Dashboard** | `/admin` | Main admin panel (requires auth) |

---

## ⚠️ Security Features

1. **OTP Required Every Login**: No saved passwords, fresh OTP each time
2. **Email Verification**: Only verified email owners can login
3. **Automatic Admin Role**: Signup process grants admin privileges
4. **Session Management**: Supabase handles secure sessions
5. **Logout Available**: Securely end session anytime

---

## 🐛 Troubleshooting

**Didn't receive OTP?**
- Check spam/junk folder
- Verify email is correct
- Wait 60 seconds and try again
- Check Supabase email settings

**Invalid OTP error?**
- Make sure to enter all 6 digits
- OTP expires after 60 minutes
- Request a new OTP if needed

**Can't access dashboard?**
- Verify OTP was entered correctly
- Check that you're logged in (not redirected back)
- Check browser console for errors

---

## 📝 SQL Setup

Run this in Supabase SQL Editor:

\`\`\`sql
-- Run the setup_admin.sql file
-- It sets up all necessary RLS policies and permissions
\`\`\`

No manual user role updates needed - the OTP signup handles everything!

---

## 🎯 Quick Start

1. Go to `http://localhost:3000/admin/login`
2. Click **"Sign Up"**
3. Enter your email
4. Check email → Enter OTP
5. Start managing UE HEART! 🚀
