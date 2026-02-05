# Audit Logging System

Complete security audit trail for tracking critical system events and admin actions.

## Overview

The audit logging system automatically records security-critical events for:
- **Compliance**: Meet legal/regulatory requirements
- **Investigation**: Trace who did what and when
- **Accountability**: Prevent admin abuse
- **Security**: Detect suspicious patterns
- **Debugging**: Understand user issues

## Database Schema

### Table: `audit_logs`

```sql
- id: UUID (primary key)
- event_type: text (type of event)
- user_id: UUID (who performed the action)
- target_id: UUID (who was affected)
- details: JSONB (event-specific context)
- ip_address: text (client IP)
- user_agent: text (browser info)
- created_at: timestamp
```

### Indexes
- `user_id` - Find all actions by a user
- `target_id` - Find all actions affecting a user
- `event_type` - Filter by event type
- `created_at` - Time-based queries

## Event Types

### Admin Actions
- `profile_approved` - Admin approved pending profile
- `profile_rejected` - Admin rejected profile
- `user_banned` - Admin banned user
- `admin_login` - Admin logged in
- `admin_logout` - Admin logged out

### User Actions (Auto-logged)
- `profile_created` - New profile created
- `profile_updated` - Profile edited
- `profile_status_change` - Status changed
- `report_submitted` - User reported another user

### Security Events
- `auth_failed` - Failed login attempt
- `rate_limit_exceeded` - Too many requests
- `unauthorized_access` - Blocked access attempt

## Automatic Triggers

### 1. Profile Updates
Automatically logs when profiles are modified:
```sql
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON profiles
```
Tracks: status changes, nickname changes, photo updates

### 2. Ban Actions
Automatically logs when users are banned:
```sql
CREATE TRIGGER audit_ban_actions
  AFTER UPDATE ON profiles
  WHEN (status = 'rejected')
```

### 3. Report Submissions
Automatically logs report submissions:
```sql
CREATE TRIGGER audit_report_submissions
  AFTER INSERT ON reports
```

## Manual Logging (lib/auditLog.ts)

### Log Admin Action
```typescript
import { logAdminAction } from '@/lib/auditLog';

await logAdminAction(
  'approved',      // or 'rejected'
  adminId,         // admin user ID
  targetUserId,    // affected user ID
  { reason: '...' } // optional details
);
```

### Log User Ban
```typescript
import { logUserBan } from '@/lib/auditLog';

await logUserBan(
  adminId,
  bannedUserId,
  'Violated ToS',
  reportId
);
```

### Log Rate Limit Exceeded
```typescript
import { logRateLimitExceeded } from '@/lib/auditLog';

await logRateLimitExceeded(
  userId,
  'profile',  // limiter type
  ipAddress
);
```

### Log Unauthorized Access
```typescript
import { logUnauthorizedAccess } from '@/lib/auditLog';

await logUnauthorizedAccess(
  userId,
  '/admin',    // attempted path
  ipAddress,
  userAgent
);
```

## Querying Audit Logs

### Get Recent Logs (Admin Only)
```typescript
import { getAuditLogs } from '@/lib/auditLog';

const logs = await getAuditLogs(100); // last 100 events
```

### Get User Activity
```typescript
import { getUserAuditLogs } from '@/lib/auditLog';

const userLogs = await getUserAuditLogs(userId, 50);
```

### Get Logs by Type
```typescript
import { getAuditLogsByType } from '@/lib/auditLog';

const banLogs = await getAuditLogsByType('user_banned', 100);
```

## Security & Privacy

### Row Level Security (RLS)
- Only admins can view audit logs
- All users can create logs (via triggers)
- Service role key used for programmatic access

### Data Retention
- Logs stored indefinitely by default
- Consider implementing cleanup policy:
  ```sql
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  ```

### Sensitive Data
- Never log passwords or tokens
- Hash email addresses if needed
- Minimize PII in details field

## Integration Status

✅ **Implemented:**
- Database schema and triggers
- Helper functions (lib/auditLog.ts)
- Admin profile approval/rejection logging
- Admin ban action logging
- Rate limit exceeded logging

⏳ **Optional Enhancements:**
- Admin dashboard tab to view logs
- Real-time log streaming
- Export logs to CSV/JSON
- Search and filter UI
- Analytics dashboard

## Setup Instructions

1. **Run SQL Migration**
   ```bash
   # Copy content from create_audit_logs.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

2. **Verify Tables Created**
   ```sql
   SELECT * FROM audit_logs LIMIT 1;
   ```

3. **Test Logging**
   ```typescript
   // Approve a profile in admin dashboard
   // Check audit_logs table for entry
   ```

## Example Log Entries

### Profile Approved
```json
{
  "event_type": "profile_approved",
  "user_id": "admin-uuid",
  "target_id": "user-uuid",
  "details": {
    "action": "Profile approved",
    "admin_email": "admin@ue.edu.ph"
  },
  "created_at": "2026-02-05T10:30:00Z"
}
```

### User Banned
```json
{
  "event_type": "user_banned",
  "user_id": "admin-uuid",
  "target_id": "banned-user-uuid",
  "details": {
    "reason": "User banned from report",
    "report_id": "report-uuid"
  },
  "created_at": "2026-02-05T11:45:00Z"
}
```

### Rate Limit Exceeded
```json
{
  "event_type": "rate_limit_exceeded",
  "user_id": "user-uuid",
  "details": {
    "limiter_type": "message"
  },
  "ip_address": "192.168.1.100",
  "created_at": "2026-02-05T12:00:00Z"
}
```

## Best Practices

1. **Log Important Events Only** - Don't log every click
2. **Include Context** - Add relevant details in JSON
3. **Protect Privacy** - Minimize PII
4. **Regular Review** - Check logs for suspicious activity
5. **Retention Policy** - Archive/delete old logs
6. **Monitoring** - Set up alerts for critical events

## Compliance Notes

This audit system helps meet requirements for:
- GDPR (data access tracking)
- SOC 2 (security event logging)
- HIPAA (access audit trails)
- ISO 27001 (security monitoring)

Always consult legal/compliance team for specific requirements.
