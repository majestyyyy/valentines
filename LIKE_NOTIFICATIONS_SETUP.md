# 🔔 Like Notifications - Quick Setup Guide

## ✨ What This Feature Does

When someone swipes right (likes) on a user's profile, the user will:
- Get a **real-time notification** with a bell badge
- See **who liked them** on a dedicated page
- Be able to **like back or pass** directly from notifications
- **Auto-match** if both users like each other

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Go to your **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Copy and paste the entire contents of setup_notifications.sql
```

This creates:
- ✅ `notifications` table
- ✅ Auto-triggers for likes and matches
- ✅ Security policies (RLS)
- ✅ Performance indexes

### Step 2: Enable Real-time

In **Supabase Dashboard** → **Database** → **Replication**:

1. Find the `notifications` table
2. Toggle **Enable** for real-time
3. Save changes

### Step 3: Test the Feature

1. **Create two test accounts**
2. **User A**: Swipe right on User B
3. **User B**: Check the bell icon (should show badge "1")
4. **User B**: Click bell → See User A in "People Who Liked You"
5. **User B**: Click "Like Back" → Creates a match!

---

## 📱 User Experience

### For Users Receiving Likes:

1. **Bell icon lights up** with yellow badge showing count
2. **Click bell** to see `/likes` page
3. **Two sections appear**:
   - **New Matches** - Mutual likes (pink border, click to chat)
   - **People Who Liked You** - Incoming likes with profile info

4. **Two action buttons** for each like:
   - **Pass** (gray) - Skip this person
   - **Like Back** (pink) - Match with them

### For Users Sending Likes:

- Just swipe right as usual
- If the other person likes back, both get a match notification
- Matches appear in the chat list

---

## 🎯 Features Included

✅ **Real-time Updates** - No page refresh needed  
✅ **Notification Badge** - Shows unread like count  
✅ **Profile Preview** - See who liked you before deciding  
✅ **Quick Actions** - Like back or pass in one tap  
✅ **Auto-Matching** - Creates matches automatically  
✅ **Match Notifications** - Both users notified on match  
✅ **Security** - RLS policies protect user data  
✅ **Performance** - Indexed queries for speed  

---

## 📂 Files Created/Modified

**New Files:**
- `/app/likes/page.tsx` - Likes page UI
- `/setup_notifications.sql` - Database migration
- `/LIKE_NOTIFICATIONS.md` - Full documentation

**Modified Files:**
- `/app/home/page.tsx` - Added bell icon with badge
- `/types/supabase.ts` - Added notifications table type

---

## 🔧 Configuration Options

### Change Notification Types

In `setup_notifications.sql`:
```sql
type text check (type in ('like', 'match', 'message')) -- Add more types
```

### Auto-Delete Old Notifications

Add a cron job in Supabase:
```sql
-- Delete read notifications older than 30 days
DELETE FROM notifications 
WHERE is_read = true 
AND created_at < NOW() - INTERVAL '30 days';
```

### Customize Badge Colors

In `app/home/page.tsx`:
```tsx
<span className="bg-yellow-400 ...">  {/* Change to your color */}
  {unreadLikesCount}
</span>
```

---

## 🐛 Troubleshooting

**Notifications not showing?**
- Check SQL migration ran successfully
- Verify real-time is enabled in Supabase
- Check browser console for errors

**Badge not updating?**
- Ensure real-time subscription is active
- Check RLS policies allow reading notifications
- Verify user is logged in

**Duplicate notifications?**
- Check for duplicate swipes
- Ensure unique constraint on swipes table

---

## 📚 Next Steps

1. ✅ Run the SQL migration
2. ✅ Enable real-time in Supabase
3. ✅ Test with two accounts
4. 📖 Read [LIKE_NOTIFICATIONS.md](LIKE_NOTIFICATIONS.md) for detailed docs
5. 🎨 Customize colors/styling to match your brand

---

## 💡 Tips

- **Bell badge is yellow** to stand out from the pink match badge
- **Notifications auto-mark as read** when viewing /likes page
- **Real-time subscriptions** update instantly (no polling needed)
- **Mobile-friendly** design works on all screen sizes

---

**Questions?** Check [LIKE_NOTIFICATIONS.md](LIKE_NOTIFICATIONS.md) for full documentation!

**Last Updated:** February 4, 2026
