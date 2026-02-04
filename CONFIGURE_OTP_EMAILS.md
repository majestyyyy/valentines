# Configure Supabase to Send OTP Codes (Not Magic Links)

## ⚠️ Important: Supabase Email Template Configuration

By default, Supabase sends **magic links** instead of **6-digit OTP codes**. You need to configure your Supabase project to send the actual codes.

---

## 🔧 Steps to Enable OTP Codes in Emails

### 1. Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Edit the "Magic Link" Template

1. Find the **"Magic Link"** template
2. Click **Edit**

### 3. Update Email Template to Show OTP

Replace the **entire email template** (both subject and body) with this:

**Subject Line:**
```
Your UE HEART Verification Code
```

**Email Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UE HEART Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%); min-height: 100vh;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 24px; box-shadow: 0 20px 60px rgba(211, 47, 47, 0.15); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #D32F2F 0%, #c62828 100%); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background: white; border-radius: 50%; margin-bottom: 20px; padding: 20px;">
                <div style="font-size: 40px;">❤️</div>
              </div>
              <h1 style="margin: 0; color: white; font-size: 36px; font-weight: 900; letter-spacing: 1px;">UE HEART</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">University of the East</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 28px; font-weight: 700; text-align: center;">
                Your Verification Code
              </h2>
              
              <!-- Message -->
              <p style="margin: 0 0 30px 0; color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                Enter this code to verify your UE HEART account:
              </p>
              
              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #fce4ec 0%, #ffebee 100%); border: 3px dashed #D32F2F; border-radius: 16px; padding: 30px; display: inline-block; margin: 0 auto;">
                      <div style="font-size: 56px; font-weight: 900; letter-spacing: 12px; color: #D32F2F; font-family: 'Courier New', monospace; text-align: center;">
                        {{ .Token }}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Warning -->
              <div style="margin: 30px 0 0 0; padding: 20px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px;">
                <p style="margin: 0; color: #e65100; font-size: 14px; font-weight: 600;">
                  ⏰ This code will expire in 60 seconds
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="margin: 30px 0 0 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #1a1a1a;">🔒 Security Notice:</strong>
                </p>
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  Never share this code with anyone. UE HEART staff will never ask for your verification code.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #fafafa; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999; font-size: 13px; text-align: center; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                © 2026 UE HEART • University of the East
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
```

### 4. Save the Template

Click **Save** to apply the changes.

---

## 📧 What the Email Will Look Like

**Before (Default):**
- Plain text with clickable link
- No branding
- Generic appearance

**After (Styled):**
- Beautiful gradient background (pink to purple)
- UE HEART branding with heart logo
- Large, bold OTP code in UE red color
- Professional card layout with shadows
- Security warnings and expiry notice
- Fully responsive design
- Mobile-friendly

---

## 🎯 Alternative: Use Custom SMTP (Recommended)

For more control over email appearance:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure your email provider (Gmail, SendGrid, etc.)
4. Customize email templates with full HTML/CSS control

---

## ✅ Testing

After configuration:

1. Go to `/` (main login page)
2. Enter your @ue.edu.ph email
3. Click "Continue with Email"
4. Check inbox - should see **8-digit code** (not a link)
5. Copy code and enter in verification screen
6. Complete profile setup
7. Wait for admin approval

**For Admin Access:**

1. Go to `/admin/login`
2. Follow the same OTP flow
3. Admin accounts are auto-promoted after verification

---

## 🐛 Still Receiving Links?

If you're still getting magic links after updating the template:

1. **Clear Supabase Cache**: Wait 5 minutes for changes to propagate
2. **Check Template**: Ensure you edited the correct template
3. **Test with New Email**: Try a different email address
4. **Browser Console**: Check for any errors in browser console
5. **Supabase Logs**: Check Auth logs in Supabase dashboard

---

## 💡 Why This Happens

Supabase's `signInWithOtp()` function name is misleading - by default it sends magic links with tokens embedded in URLs. To get actual OTP codes displayed in emails, you must customize the email template to show the `{{ .Token }}` variable.

The code in our app is already correct - this is purely an email template configuration issue in Supabase.
