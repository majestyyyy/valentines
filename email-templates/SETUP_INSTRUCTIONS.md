# Email Templates Setup Instructions

This folder contains custom HTML email templates for yUE Match! authentication emails.

## 📧 Available Templates

1. **password-reset-template.html** - Sent when users request password reset
2. **email-verification-template.html** - Sent when new users sign up (OTP verification)

## 🚀 How to Upload Templates to Supabase

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your yUE Match! project
3. Navigate to **Authentication** → **Email Templates** (in the left sidebar)

### Step 2: Upload Password Reset Template

1. In the Email Templates section, select **"Reset Password"** template
2. You'll see a text editor with the default template
3. Open `password-reset-template.html` in a text editor
4. Copy the **entire HTML content**
5. Paste it into the Supabase template editor (replace all existing content)
6. Click **"Save"** at the bottom

### Step 3: Upload Email Verification Template

1. In the Email Templates section, select **"Confirm Signup"** template
2. You'll see a text editor with the default template
3. Open `email-verification-template.html` in a text editor
4. Copy the **entire HTML content**
5. Paste it into the Supabase template editor (replace all existing content)
6. Click **"Save"** at the bottom

## 🔧 Supabase Template Variables

These variables are automatically replaced by Supabase when sending emails:

### Available in All Templates:
- `{{ .SiteURL }}` - Your application URL
- `{{ .ConfirmationURL }}` - The confirmation/action link

### Available in Email Verification Template:
- `{{ .Token }}` - The 6-digit OTP code
- `{{ .TokenHash }}` - Token hash for additional security

### Available in Password Reset Template:
- `{{ .ConfirmationURL }}` - The password reset link

## ✅ Testing Your Templates

### Test Password Reset Email:
1. Go to your app: http://localhost:3000
2. Click **"Forgot Password?"**
3. Enter a valid email address
4. Check your inbox for the styled reset email

### Test Email Verification Email:
1. Go to your app: http://localhost:3000
2. Create a new account with email + password
3. Check your inbox for the styled verification email with OTP code

## 🎨 Customization

### Changing Brand Colors:
Both templates use the yUE Match! brand gradient (pink to red):
```css
background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
```

To change colors:
1. Find all instances of `#ec4899` (pink) and `#ef4444` (red)
2. Replace with your preferred color codes
3. Update the gradient backgrounds

### Changing Support Email:
Both templates reference `support@yuematch.com`. To update:
1. Search for `support@yuematch.com` in each template
2. Replace with your actual support email address

### Changing App Name:
Both templates use "yUE Match!". To update:
1. Search for `yUE Match!` in each template
2. Replace with your preferred app name

## 📱 Mobile Responsiveness

Both templates include responsive CSS that adjusts for mobile devices:
- Header font sizes scale down on small screens
- Button padding adjusts for touch targets
- Container margins adapt to screen width

## 🔒 Security Notes

- Never expose sensitive data in email templates
- The templates only use Supabase's built-in variables
- OTP codes expire in 60 minutes (configurable in Supabase Auth settings)
- Password reset links expire in 60 minutes (configurable in Supabase Auth settings)

## 🛠️ Troubleshooting

### Emails not sending?
1. Check Supabase Auth settings are enabled
2. Verify SMTP configuration in Supabase dashboard
3. Check spam/junk folder
4. Ensure email address is valid and confirmed

### Template not showing correctly?
1. Make sure you saved the template in Supabase dashboard
2. Clear browser cache and test again
3. Check that all HTML tags are properly closed
4. Verify Supabase variables are correct: `{{ .Token }}`, `{{ .ConfirmationURL }}`

### OTP code not displaying?
- Ensure you're using the "Confirm Signup" template (not "Invite User")
- Check that `{{ .Token }}` variable is present in the template
- Verify OTP authentication is enabled in Supabase Auth settings

## 📝 Additional Configuration

### Change OTP Expiration Time:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Email OTP expiry duration"
3. Default is 3600 seconds (60 minutes)
4. Adjust as needed

### Change Password Reset Link Expiration:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Password reset expiry duration"
3. Default is 3600 seconds (60 minutes)
4. Adjust as needed

## 📚 Related Documentation

- [AUTHENTICATION_GUIDE.md](../AUTHENTICATION_GUIDE.md) - Full authentication flow
- [FORGOT_PASSWORD_IMPLEMENTATION.md](../FORGOT_PASSWORD_IMPLEMENTATION.md) - Password reset feature
- [CONFIGURE_OTP_EMAILS.md](../CONFIGURE_OTP_EMAILS.md) - OTP configuration
- [EMAIL_SECURITY.md](../EMAIL_SECURITY.md) - Email security best practices

## ✨ Features Included

### Password Reset Template:
- ✅ Branded header with gradient background
- ✅ Animated heart logo
- ✅ Clear "Reset My Password" button
- ✅ Security warning for suspicious activity
- ✅ Expiration notice (60 minutes)
- ✅ Alternative plain link for accessibility
- ✅ Responsive design for all devices

### Email Verification Template:
- ✅ Branded header with gradient background
- ✅ Animated heart logo
- ✅ Large, readable 6-digit OTP code
- ✅ Step-by-step instructions
- ✅ Alternative "Verify Email" button
- ✅ Expiration notice (60 minutes)
- ✅ Quick tip info box
- ✅ Responsive design for all devices

---

**Last Updated:** January 2026  
**Author:** yUE Match! Development Team  
**Support:** support@yuematch.com
