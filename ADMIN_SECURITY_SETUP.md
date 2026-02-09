# Admin Security Setup

## 1. Run SQL Scripts in Supabase

### Admin Whitelist (Required)
Run [setup_admin_whitelist.sql](setup_admin_whitelist.sql) in Supabase SQL Editor to create the whitelist system.

### Admin Login Security (Required)
Run [setup_admin_security.sql](setup_admin_security.sql) in Supabase SQL Editor for rate limiting.

---

## 2. Add Your Admin Email to Whitelist

After running the SQL scripts, add your email to the whitelist:

```sql
-- Replace with your actual admin email
INSERT INTO admin_whitelist (email, is_active)
VALUES ('your-admin@ue.edu.ph', true);
```

---

## 3. Security Features Implemented

### ✅ Email Whitelist
- Only pre-approved emails can create admin accounts
- Prevents unauthorized admin signup
- Managed through database table

### ✅ Rate Limiting
- Max 5 failed login attempts per 15 minutes
- Prevents brute force attacks
- Auto-resets after cooldown period

### ✅ UE Email Validation
- Non-@ue.edu.ph emails are rejected for regular users
- Admins can use any email but must be whitelisted

### ✅ Session Security
- Auto-logout after inactivity
- Secure session management
- Audit logging for all admin actions

### ✅ Role-Based Access
- Admin role required for dashboard access
- RLS policies enforce permissions
- Supabase service role used carefully

---

## 4. How to Add More Admins

```sql
-- Add a new admin email to whitelist
INSERT INTO admin_whitelist (email, is_active, created_by)
VALUES ('newadmin@ue.edu.ph', true, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- View all whitelisted admins
SELECT * FROM admin_whitelist WHERE is_active = true;

-- Deactivate an admin (don't delete - keep audit trail)
UPDATE admin_whitelist 
SET is_active = false 
WHERE email = 'oldadmin@ue.edu.ph';
```

---

## 5. Monitor Security

```sql
-- Check recent login attempts
SELECT email, success, attempted_at 
FROM admin_login_attempts 
ORDER BY attempted_at DESC 
LIMIT 20;

-- Check failed login attempts by email
SELECT email, COUNT(*) as failed_attempts
FROM admin_login_attempts
WHERE success = false 
  AND attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY failed_attempts DESC;

-- Cleanup old attempts (run monthly)
SELECT cleanup_admin_login_attempts();
```

---

## 6. Important Notes

⚠️ **Never share admin credentials**
⚠️ **Use strong passwords (12+ characters)**
⚠️ **Enable 2FA when available**
⚠️ **Regularly review admin_whitelist**
⚠️ **Monitor audit logs for suspicious activity**

---

## 7. Emergency Access Recovery

If locked out due to failed attempts, wait 15 minutes or run:

```sql
-- Clear failed attempts for specific email (emergency only)
DELETE FROM admin_login_attempts 
WHERE email = 'your-admin@ue.edu.ph' 
  AND success = false;
```

---

You're now secured! 🔒
