# Message Notifications Feature

## Overview
Added real-time message notifications so users get notified when someone sends them a message in the chat.

## Implementation

### 1. Database Changes
**File:** `add_message_notifications.sql`

- Added `'message'` type to notifications table constraint
- Added `message_id` and `match_id` columns to notifications table
- Created trigger function `create_message_notification()` that automatically creates a notification when a message is sent
- Added indexes for better query performance
- Trigger automatically determines the recipient (the other person in the match) and creates a notification

### 2. Frontend Changes

#### Home Page (`app/home/page.tsx`)
- Added `unreadMessagesCount` state to track unread message notifications
- Created `fetchUnreadMessagesCount()` function to query unread message notifications
- Updated real-time subscription to refresh count when new message notifications arrive
- Changed chat icon badge to show unread message count (green badge) instead of match count
- Badge shows "9+" when there are more than 9 unread messages

#### Chat Page (`app/chat/[id]/page.tsx`)
- Added automatic mark-as-read functionality when user opens a chat
- All message notifications for that specific match are marked as read when the chat is opened
- Prevents notification count from staying high after user has seen the messages

## User Experience

1. **Sending Messages:**
   - When User A sends a message to User B
   - A notification is automatically created for User B
   - User B sees the green badge with unread count on the chat icon in the home page

2. **Viewing Messages:**
   - User B clicks on chat icon and opens the conversation with User A
   - All message notifications for that chat are automatically marked as read
   - The badge count decreases accordingly

3. **Real-time Updates:**
   - Notification count updates instantly when new messages arrive
   - Works across all pages using Supabase real-time subscriptions

## Visual Indicators

- **Like Notifications:** Yellow badge on bell icon
- **Message Notifications:** Green badge on chat icon
- Both badges show "9+" when count exceeds 9
- Badges pulse with animation to draw attention

## Setup Instructions

1. Run the SQL migration:
   ```bash
   # In Supabase SQL Editor, run:
   add_message_notifications.sql
   ```

2. Frontend code is already updated in:
   - `app/home/page.tsx`
   - `app/chat/[id]/page.tsx`

3. Test the feature:
   - Have two users match
   - User A sends a message to User B
   - User B should see green badge on chat icon
   - User B opens chat, badge should clear

## Technical Details

### Database Trigger
```sql
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();
```

### Notification Types
- `like` - When someone swipes right on your profile
- `match` - When you match with someone
- `message` - When someone sends you a message (NEW)

### Performance
- Indexed columns: `message_id`, `match_id`, `type`, `user_id`, `is_read`
- Real-time subscriptions use filtered queries to reduce load
- Notifications are automatically deleted when related messages/matches are deleted (CASCADE)
