# Setup Custom SMTP to Avoid Email Rate Limits

Using custom SMTP will give you much higher email sending limits and avoid Supabase's default rate limits.

---

## 🎯 Option 1: Gmail SMTP (Easiest)

### Step 1: Create App Password in Gmail

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required for app passwords)
3. Go to **Security** → **App passwords** 
   - Or visit: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)** → Enter "UE HEART"
5. Click **Generate**
6. **Copy the 16-character password** (you'll need this)

### Step 2: Configure SMTP in Supabase

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Click **Enable Custom SMTP**
4. Enter these settings:

```
Sender email:     your-gmail@gmail.com
Sender name:      UE HEART
Host:             smtp.gmail.com
Port:             587
Username:         your-gmail@gmail.com
Password:         [paste your 16-char app password]
```

5. Click **Save**

### Step 3: Test

1. Go to your app at `http://localhost:3000`
2. Try to login with OTP
3. Check your inbox - you should receive the email within seconds

### Gmail Limits:
- ✅ **500 emails/day** (free Gmail)
- ✅ **2,000 emails/day** (Google Workspace)

---

## 🚀 Option 2: SendGrid (Best for Production)

SendGrid offers **100 emails/day free**, then paid plans for more.

### Step 1: Create SendGrid Account

1. Sign up at https://sendgrid.com
2. Verify your email
3. Complete sender verification

### Step 2: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "UE HEART"
4. Select **Full Access**
5. Click **Create & View**
6. **Copy the API key** (shown only once!)

### Step 3: Configure in Supabase

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter these settings:

```
Sender email:     noreply@yourdomain.com
Sender name:      UE HEART
Host:             smtp.sendgrid.net
Port:             587
Username:         apikey
Password:         [paste your SendGrid API key]
```

5. Click **Save**

### SendGrid Limits:
- ✅ **100 emails/day** (Free)
- ✅ **40,000 emails/month** (Essentials - $19.95/mo)
- ✅ **100,000 emails/month** (Pro - $89.95/mo)

---

## 📧 Option 3: Mailgun (Good Alternative)

Mailgun offers **5,000 emails/month free** for first 3 months.

### Step 1: Create Mailgun Account

1. Sign up at https://www.mailgun.com
2. Verify your email
3. Add and verify your domain (or use sandbox for testing)

### Step 2: Get SMTP Credentials

1. Go to **Sending** → **Domain settings**
2. Click **SMTP credentials**
3. Note your **SMTP username** and **password**

### Step 3: Configure in Supabase

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Enable **Custom SMTP**
3. Enter these settings:

```
Sender email:     noreply@yourdomain.com
Sender name:      UE HEART
Host:             smtp.mailgun.org
Port:             587
Username:         [your Mailgun SMTP username]
Password:         [your Mailgun SMTP password]
```

4. Click **Save**

### Mailgun Limits:
- ✅ **5,000 emails/month free** (first 3 months)
- ✅ **50,000 emails/month** (Foundation - $35/mo)

---

## ⚡ Quick Start (Gmail)

**5-Minute Setup:**

1. **Gmail App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Enable 2-Step Verification if asked
   - Generate app password for "UE HEART"
   - Copy the 16-character code

2. **Supabase SMTP:**
   - Dashboard → Settings → Authentication → SMTP Settings
   - Enable Custom SMTP
   - Host: `smtp.gmail.com` / Port: `587`
   - Email & Username: `your-gmail@gmail.com`
   - Password: [paste app password]
   - Save

3. **Test:**
   - Go to your app
   - Try OTP login
   - Check inbox for email

---

## 🔧 Troubleshooting

### Emails not sending?

1. **Check SMTP credentials** - Make sure password is correct
2. **Check spam folder** - Emails might be filtered
3. **Enable "Less secure app access"** (Gmail only, if app password doesn't work)
4. **Check Supabase logs** - Dashboard → Authentication → Logs
5. **Test SMTP connection** - Use online SMTP tester tools

### Still getting rate limit errors?

1. **Wait 60 minutes** - Rate limits reset hourly
2. **Use different email** - Try with Gmail instead of your current provider
3. **Check SendGrid/Mailgun status** - Visit their status pages

### Emails going to spam?

1. **Verify sender domain** - Use SPF/DKIM records
2. **Warm up your sender** - Start with low volume, increase gradually
3. **Use professional content** - Avoid spam trigger words
4. **Add unsubscribe link** - Required for bulk emails

---

## 📊 Comparison

| Provider | Free Limit | Setup Time | Recommended For |
|----------|-----------|------------|----------------|
| **Gmail** | 500/day | 5 mins | Testing, small apps |
| **SendGrid** | 100/day | 10 mins | Production, scaling |
| **Mailgun** | 5,000/mo | 15 mins | High volume |
| **Supabase Default** | 3-4/hour | 0 mins | Demo only ❌ |

---

## ✅ Recommended: Gmail SMTP

For UE HEART, I recommend starting with **Gmail SMTP** because:

1. ✅ **Free 500 emails/day** - More than enough for campus app
2. ✅ **5-minute setup** - Just create app password
3. ✅ **Reliable delivery** - Gmail has excellent reputation
4. ✅ **No domain required** - Use your Gmail directly
5. ✅ **Easy testing** - Send test emails immediately

Later, when you launch publicly, migrate to SendGrid for professional sender domain.

---

## 🚨 Important Notes

1. **Never commit SMTP passwords to Git** - Keep them in `.env` only
2. **Use environment variables** - Don't hardcode credentials
3. **Monitor your sending** - Watch for bounces and complaints
4. **Respect rate limits** - Don't send too fast
5. **Keep email templates professional** - Avoid spam triggers

---

## 🎓 Next Steps

1. ✅ Set up Gmail App Password (5 mins)
2. ✅ Configure Supabase SMTP settings (2 mins)
3. ✅ Test OTP login flow (1 min)
4. ✅ Enjoy unlimited emails! 🎉

Your OTP code is already working - you just need to configure SMTP to lift the rate limits!
