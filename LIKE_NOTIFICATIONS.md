# Like Notifications System

This feature notifies users in real-time when someone likes them (swipes right on their profile).

## 🎯 Features

1. **Real-time Notifications** - Users are instantly notified when someone likes them
2. **Notification Bell Badge** - Shows unread like count in the header
3. **Dedicated Likes Page** - View all people who liked you
4. **Quick Response** - Like back or pass directly from notifications
5. **Auto-Match Detection** - Automatically creates matches when both users like each other

## 📊 Database Setup

### 1. Run the SQL Migration

Execute the SQL file to create the notifications table and triggers:

```bash
# In Supabase SQL Editor, run:
/setup_notifications.sql
```

This will create:
- `notifications` table with RLS policies
- Automatic trigger to create notifications on right swipes
- Automatic trigger to create match notifications
- Indexes for fast queries

### Schema:

```sql
notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),      -- Who receives the notification
  from_user_id uuid REFERENCES profiles(id),  -- Who sent the like/match
  type text ('like' | 'match'),              -- Type of notification
  is_read boolean DEFAULT false,             -- Read status
  created_at timestamp
)
```

## 🔔 How It Works

### 1. When User A Swipes Right on User B:

```
User A swipes right → Swipe recorded in database
                    ↓
                Trigger fires
                    ↓
        Notification created for User B
                    ↓
    Real-time subscription updates User B's UI
                    ↓
        Bell badge shows unread count
```

### 2. When User B Responds:

**If User B also swipes right:**
- Creates a match automatically
- Both users get match notifications
- Match appears in chat list

**If User B swipes left:**
- Notification is removed
- No match is created

## 🎨 User Interface

### Home Page Header

The header now includes:

1. **Bell Icon (Left)** - Shows like notifications
   - Yellow badge for unread likes
   - Real-time updates

2. **Heart Icon (Right)** - Shows matches
   - Pink/red badge for match count

```tsx
<Link href="/likes">
  <Bell /> {/* With badge if unreadLikesCount > 0 */}
</Link>

<Link href="/chat">
  <Heart /> {/* With badge if matchCount > 0 */}
</Link>
```

### Likes Page (`/likes`)

Shows two sections:

1. **New Matches** - People you've matched with
   - Shows profile photo and name
   - Links directly to chat
   - Highlighted with pink border

2. **People Who Liked You** - Incoming likes
   - Shows profile photo, name, college, year
   - Shows description preview
   - Two action buttons:
     - **Pass** (gray) - Swipe left, remove from list
     - **Like Back** (pink) - Swipe right, create match

## 📱 Real-time Updates

The system uses Supabase real-time subscriptions:

```tsx
// Listen for new like notifications
supabase
  .channel('notifications-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    if (payload.new.type === 'like') {
      fetchUnreadLikesCount(); // Update badge
    }
  })
  .subscribe();
```

## 🔐 Security (Row Level Security)

The notifications table has RLS policies:

```sql
-- Users can only view their own notifications
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- System can insert notifications (via triggers)
create policy "System can insert notifications"
  on notifications for insert
  with check (true);
```

## 📖 User Flow Examples

### Example 1: John likes Sarah

```
1. John swipes right on Sarah
2. Database trigger creates notification for Sarah
3. Sarah's bell badge shows "1" immediately (real-time)
4. Sarah clicks bell, sees John's profile in "People Who Liked You"
5. Sarah can:
   - Click "Pass" → John's notification disappears
   - Click "Like Back" → They match, notification moves to "New Matches"
```

### Example 2: Both Like Each Other

```
1. John swipes right on Sarah
   → Sarah gets notification

2. Sarah goes to /likes and clicks "Like Back"
   → Match is created
   → Both get match notifications
   → Match appears in /chat for both users
```

## 🎯 Key Functions

### `fetchUnreadLikesCount()`
```tsx
// Fetches count of unread like notifications
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .eq('type', 'like')
  .eq('is_read', false);

setUnreadLikesCount(data?.length || 0);
```

### `handleSwipeResponse()`
```tsx
// When user responds to a like notification
async handleSwipeResponse(notif, direction) {
  // Record the swipe
  await supabase.from('swipes').insert({
    swiper_id: user.id,
    swiped_id: notif.from_user_id,
    direction
  });

  // If right swipe, check for match
  if (direction === 'right') {
    // Create match if they also swiped right
    const { data: theirSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', notif.from_user_id)
      .eq('swiped_id', user.id)
      .eq('direction', 'right')
      .single();

    if (theirSwipe) {
      await supabase.from('matches').insert({
        user1_id: user.id,
        user2_id: notif.from_user_id
      });
    }
  }
}
```

## 🔧 Configuration

### Notification Types

Currently supports:
- `like` - Someone swiped right on you
- `match` - Mutual like (both swiped right)

Can be extended to:
- `message` - New message received
- `task_completed` - Partner completed a task
- `admin_message` - Admin announcements

### Auto-Mark as Read

Notifications are automatically marked as read when:
- User visits the `/likes` page
- Prevents the badge from showing stale counts

```tsx
// Mark all as read when page loads
useEffect(() => {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}, []);
```

## 📊 Performance Optimizations

1. **Indexed Queries** - Fast lookups by user_id and is_read status
2. **Real-time Subscriptions** - Only updates affected users
3. **Optimistic Updates** - UI updates immediately, syncs in background
4. **Automatic Cleanup** - Can add a cron job to delete old read notifications

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check SQL migration ran successfully**
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

2. **Verify triggers are active**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%swipe%';
   ```

3. **Check real-time is enabled** in Supabase Dashboard:
   - Database → Replication
   - Enable for `notifications` table

### Badge not updating?

1. Check real-time subscription is active in browser console
2. Verify user permissions (RLS policies)
3. Check `fetchUnreadLikesCount()` is being called

### Duplicate notifications?

- Check for duplicate swipes in database
- Ensure unique constraint on `swipes(swiper_id, swiped_id)`

## 🚀 Future Enhancements

1. **Push Notifications** - Use Supabase Edge Functions + Firebase/APNS
2. **Notification Settings** - Let users customize notification types
3. **Notification History** - Archive of all past notifications
4. **Bulk Actions** - "Like All" or "Pass All" buttons
5. **Preview Mode** - Show profile preview in notification popup
6. **Sound/Vibration** - Add sound effects for new likes

## 📝 Related Files

- [/app/home/page.tsx](app/home/page.tsx) - Added bell icon with badge
- [/app/likes/page.tsx](app/likes/page.tsx) - Likes page UI
- [/types/supabase.ts](types/supabase.ts) - Added notifications table type
- [/setup_notifications.sql](setup_notifications.sql) - Database migration

## 🎓 Testing

### Test Scenario 1: Like Notification

1. Create two test accounts (User A, User B)
2. User A swipes right on User B
3. Verify:
   - User B's bell shows badge "1"
   - User B sees User A in /likes page
   - Notification has `type: 'like'` and `is_read: false`

### Test Scenario 2: Match Notification

1. User B clicks "Like Back" on User A
2. Verify:
   - Both users get match notifications
   - Notification type is `'match'`
   - Match appears in chat list
   - Both can send messages

### Test Scenario 3: Real-time Updates

1. Open User B's account in browser
2. In another tab, User A swipes right on User B
3. Verify:
   - User B's bell badge updates without page refresh
   - Shows immediate real-time update

---

**Last Updated:** February 4, 2026  
**Author:** yUE Match! Development Team  
**Version:** 1.0
