# Email Rate Limit Tracking Setup

## 1. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of setup_email_tracking.sql
```

Or use the Supabase Dashboard:
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy all content from `setup_email_tracking.sql`
5. Click **Run**

## 2. Files Created

### `lib/emailRateLimit.ts`
- Database tracking functions
- Local storage backup
- Rate limit checking
- Automatic fallback if database fails

### `components/EmailLimitDashboard.tsx`
- Visual dashboard component
- Real-time limit monitoring
- Color-coded status (green/yellow/red)
- Automatic refresh every 2 minutes

### `setup_email_tracking.sql`
- Creates `email_rate_limit` table
- Creates helper functions
- Sets up indexes for performance
- Enables Row Level Security

## 3. Usage

### In Your App (Already Integrated)

The tracking is automatically integrated into:
- ✅ `handleSignup` - Tracks OTP sends
- ✅ `handleResendCode` - Tracks resends
- ✅ Rate limit checks before sending

### Add Dashboard to Admin Page

Add this to any page to see the dashboard:

```tsx
import EmailLimitDashboard from '@/components/EmailLimitDashboard';

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <EmailLimitDashboard />
    </div>
  );
}
```

## 4. Features

### Database Tracking (Primary)
- Accurate count across all devices
- Historical data for 30 days
- Server-side tracking
- Automatic cleanup of old logs

### Local Storage (Backup)
- Works offline
- Client-side only
- Auto-resets daily
- Fallback if database fails

### Rate Limit Protection
- Checks limit before sending
- Shows warning at 80% (400 emails)
- Blocks at 100% (500 emails)
- Shows reset time (midnight PST)

## 5. How It Works

```
User clicks "Sign Up"
    ↓
Check current count from database
    ↓
If < 500: Send OTP + Track in DB + Track locally
If ≥ 500: Show error message
    ↓
User receives OTP
```

## 6. Monitoring

### Check Current Usage
```typescript
import { checkRateLimit } from '@/lib/emailRateLimit';

const stats = await checkRateLimit(500);
console.log(`Used: ${stats.count}/500 (${stats.percentUsed}%)`);
console.log(`Remaining: ${stats.remaining}`);
console.log(`Resets: ${stats.resetTime}`);
```

### View All Sent Emails (SQL)
```sql
SELECT * FROM email_rate_limit 
WHERE sent_at >= CURRENT_DATE AT TIME ZONE 'America/Los_Angeles'
ORDER BY sent_at DESC;
```

### Get Statistics (SQL)
```sql
SELECT * FROM get_email_stats();
```

## 7. Maintenance

### Manual Cleanup (Optional)
```sql
SELECT cleanup_old_email_logs();
```

### Reset Local Count (Browser Console)
```javascript
localStorage.removeItem('email_limit');
```

## 8. Limits

- **Regular Gmail:** 500 emails/day
- **Google Workspace:** 2,000 emails/day
- **SendGrid Free:** 100 emails/day
- **Mailgun Free:** 5,000 emails/month (first 3 months)

## 9. Troubleshooting

**Database tracking not working?**
- Check if SQL script ran successfully
- Verify table exists in Supabase Dashboard → Database → Tables
- Check RLS policies are enabled

**Count seems wrong?**
- Database might be delayed, check local storage count
- Run `SELECT * FROM get_todays_email_count();` in SQL Editor

**Dashboard not updating?**
- Check browser console for errors
- Refresh page to force update
- Verify Supabase connection

## 10. Next Steps

1. ✅ Run `setup_email_tracking.sql` in Supabase
2. ✅ Code is already integrated in `app/page.tsx`
3. 📊 Add `<EmailLimitDashboard />` to your admin page (optional)
4. 🚀 Test by signing up with a test email
5. 📈 Monitor usage in Supabase or dashboard

Your email rate limit tracking is now active! 🎉
