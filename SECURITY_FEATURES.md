# Security Enhancements Guide

## Overview
This document describes the file upload validation and session security features implemented in yUE Match!.

---

## 1. File Upload Validation

### Features Implemented

#### 1.1 File Type Validation
- **MIME Type Check**: Validates file extensions match allowed types
- **Magic Bytes Verification**: Verifies actual file content matches declared type
- **Allowed Formats**: JPEG, PNG, WebP, GIF
- **Prevents**: Malicious files disguised as images

#### 1.2 File Size Validation
- **Maximum Size**: 5MB per image
- **Prevents**: 
  - DoS attacks via large file uploads
  - Storage quota exhaustion
  - Bandwidth abuse

#### 1.3 Image Dimensions Validation
- **Minimum**: 200x200 pixels
- **Maximum**: 4096x4096 pixels
- **Prevents**:
  - Low-quality/unusable images
  - Memory exhaustion attacks
  - Image bomb attacks

#### 1.4 Malicious Content Scanning
Scans uploaded files for:
- Embedded JavaScript code
- Event handlers (onclick, onerror, etc.)
- Iframe/embed/object tags
- eval() calls
- document.cookie access
- innerHTML manipulation

#### 1.5 Filename Sanitization
- Removes path traversal characters (`/`, `\`)
- Strips special characters
- Limits filename length to 100 characters
- **Prevents**: Directory traversal attacks

### Usage

```typescript
import { validateImageFile } from '@/lib/fileValidation';

// In file input handler
const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    
    // Validate file before accepting
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      e.target.value = ''; // Clear input
      return;
    }
    
    // File is safe to use
    setPhoto(file);
  }
};
```

### Integration Points
- **Profile Setup** (`/app/profile-setup/page.tsx`)
- **Profile Edit** (`/app/profile/page.tsx`)

Both pages now validate all uploaded images before:
1. Displaying preview
2. Uploading to Supabase Storage

---

## 2. Session Security

### Features Implemented

#### 2.1 Session Timeout
- **User Sessions**: 30 minutes of inactivity
- **Admin Sessions**: 15 minutes of inactivity (stricter)
- **Auto-logout**: Triggered on timeout with audit logging

#### 2.2 Activity Monitoring
Tracks user activity via:
- Mouse clicks (`mousedown`)
- Keyboard input (`keydown`)
- Scrolling (`scroll`)
- Touch events (`touchstart`)

Updates `lastActivity` timestamp on each interaction.

#### 2.3 Session Refresh
- **Auto-refresh**: Checks every 5 minutes
- **Proactive**: Refreshes token if expiring in next 5 minutes
- **Prevents**: Unexpected session expiration during active use

#### 2.4 Device Tracking
Captures and stores:
- User Agent
- Platform (OS)
- Language
- Screen Resolution
- Timezone
- IP Address (via `/api/get-ip`)

#### 2.5 Suspicious Activity Detection
Detects and logs:
- Device information changes mid-session
- User Agent changes
- Platform changes

**Use Case**: Detect session hijacking or device switching.

#### 2.6 Audit Logging
Logs these session events:
- `session_started` - User logs in
- `session_ended` - User logs out
- `session_timeout` - Session expired due to inactivity
- `suspicious_activity` - Device change detected

### Usage

#### Automatic Setup
Session tracking initializes automatically via `SessionGuard` component in `app/layout.tsx`:

```typescript
import SessionGuard from '@/components/SessionGuard';

<SessionGuard>
  {children}
</SessionGuard>
```

#### Manual Control

```typescript
import { 
  initializeSessionTracking,
  endSession,
  getSessionInfo,
  isSessionExpired
} from '@/lib/sessionSecurity';

// Initialize session (called automatically)
await initializeSessionTracking(isAdmin);

// Check if session expired
if (isSessionExpired()) {
  await handleSessionTimeout();
}

// Get current session info
const session = getSessionInfo();
console.log(`Session duration: ${session?.sessionStart}`);

// Clean logout
await endSession(); // Logs audit event + signs out
```

### Integration Points
1. **Root Layout** (`/app/layout.tsx`)
   - `SessionGuard` wraps all pages
   - Initializes tracking on mount
   - Monitors for suspicious activity

2. **Admin Dashboard** (`/app/admin/page.tsx`)
   - Logout uses `endSession()`
   - 15-minute admin timeout

3. **Profile Page** (`/app/profile/page.tsx`)
   - Logout uses `endSession()`
   - Delete account uses `endSession()`

4. **IP Detection** (`/app/api/get-ip/route.ts`)
   - Returns client IP from headers
   - Supports proxies/CDNs (x-forwarded-for, cf-connecting-ip)

---

## 3. Security Event Types

### Audit Log Events

| Event Type | Description | Logged By |
|------------|-------------|-----------|
| `session_started` | User login | SessionGuard |
| `session_ended` | User logout | endSession() |
| `session_timeout` | Inactivity timeout | handleSessionTimeout() |
| `suspicious_activity` | Device change | detectSuspiciousActivity() |
| `profile_approved` | Admin approved profile | Admin Dashboard |
| `profile_rejected` | Admin rejected profile | Admin Dashboard |
| `user_banned` | Admin banned user | Admin Dashboard |
| `report_submitted` | User reported another | Report Modal |
| `rate_limit_exceeded` | Spam attempt blocked | Rate Limit API |

---

## 4. Configuration

### File Upload Limits

Edit `/lib/fileValidation.ts`:

```typescript
// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Image dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;
```

### Session Timeouts

Edit `/lib/sessionSecurity.ts`:

```typescript
// Session timeout duration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Admin session timeout (15 minutes)
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000;

// Refresh check interval (5 minutes)
const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000;
```

---

## 5. Testing

### File Upload Validation

1. **Valid Image Test**
   ```
   - Upload a normal JPEG/PNG (< 5MB, > 200x200px)
   - Should succeed
   ```

2. **Invalid Type Test**
   ```
   - Rename a .txt file to .jpg
   - Upload it
   - Should fail: "File content does not match image format"
   ```

3. **Size Test**
   ```
   - Upload a 10MB image
   - Should fail: "File size exceeds maximum allowed size"
   ```

4. **Dimensions Test**
   ```
   - Upload a 100x100px image
   - Should fail: "Image dimensions are too small"
   ```

5. **Malicious Content Test**
   ```
   - Create image with embedded <script> tag
   - Should fail: "File contains potentially malicious content"
   ```

### Session Security

1. **Timeout Test**
   ```
   - Login to app
   - Wait 30+ minutes without interaction
   - Next action should trigger auto-logout
   ```

2. **Admin Timeout Test**
   ```
   - Login to admin panel
   - Wait 15+ minutes
   - Should auto-logout (stricter than user timeout)
   ```

3. **Activity Test**
   ```
   - Login to app
   - Interact every 5 minutes (click, scroll, type)
   - Session should NOT timeout
   ```

4. **Audit Log Test**
   ```
   - Login/logout multiple times
   - Go to Admin → Audit Logs tab
   - Should see session_started and session_ended events
   ```

5. **Device Change Test**
   ```
   - Login on Chrome
   - Copy session token to Firefox (developer tools)
   - Should log suspicious_activity event
   ```

---

## 6. Security Best Practices

### For Developers

1. **Always Validate Client-Side AND Server-Side**
   - Client-side: Better UX (instant feedback)
   - Server-side: Actual security (client can be bypassed)

2. **Never Trust File Extensions**
   - Always check magic bytes
   - Verify MIME type matches content

3. **Limit Session Duration**
   - Shorter for admin/sensitive operations
   - Longer for regular users

4. **Log Security Events**
   - All admin actions
   - Failed authentication attempts
   - Suspicious activities
   - Rate limit violations

5. **Monitor Audit Logs**
   - Review logs regularly
   - Set up alerts for suspicious patterns
   - Investigate anomalies

### For Admins

1. **Review Audit Logs Weekly**
   - Check for unusual patterns
   - Investigate suspicious_activity events
   - Monitor rate_limit_exceeded events

2. **Session Management**
   - Clear inactive sessions regularly
   - Force logout on security concerns
   - Implement 2FA (recommended next step)

3. **File Upload Monitoring**
   - Check storage usage
   - Review rejected uploads
   - Investigate repeated validation failures

---

## 7. Next Steps (Recommended)

1. **Two-Factor Authentication (2FA)**
   - Add TOTP-based 2FA for admin accounts
   - Library: `speakeasy` + `qrcode`

2. **Server-Side File Validation**
   - Add Supabase Edge Function to validate uploads
   - Run virus scanning (ClamAV)
   - Generate safe thumbnails

3. **Enhanced Monitoring**
   - Set up alerts for high-frequency events
   - Dashboard for security metrics
   - Failed login attempt tracking

4. **CSRF Protection**
   - Add CSRF tokens to state-changing operations
   - Already protected by Supabase RLS

5. **Content Security Policy (CSP) Updates**
   - Already implemented in `next.config.js`
   - Review and tighten as needed

---

## 8. Troubleshooting

### File Upload Issues

**Problem**: Valid images rejected
```
Solution: Check file size < 5MB and dimensions between 200x200 and 4096x4096
```

**Problem**: "Magic bytes" error on valid images
```
Solution: Ensure file isn't corrupted. Try re-exporting from image editor.
```

### Session Issues

**Problem**: Users logged out too frequently
```
Solution: Increase SESSION_TIMEOUT in /lib/sessionSecurity.ts
```

**Problem**: Session timeout not working
```
Solution: 
1. Check SessionGuard is in layout.tsx
2. Verify localStorage has 'session_metadata'
3. Check browser console for errors
```

**Problem**: IP address shows as 'unknown'
```
Solution: 
1. Check /api/get-ip/route.ts is deployed
2. Verify headers: x-forwarded-for or x-real-ip
3. May show 'unknown' in local development
```

---

## 9. Files Modified/Created

### New Files
- `/lib/fileValidation.ts` - File upload security
- `/lib/sessionSecurity.ts` - Session management
- `/components/SessionGuard.tsx` - Session tracking wrapper
- `/app/api/get-ip/route.ts` - IP detection endpoint

### Modified Files
- `/app/profile-setup/page.tsx` - Added file validation
- `/app/profile/page.tsx` - Added file validation + session cleanup
- `/app/admin/page.tsx` - Added session cleanup
- `/app/layout.tsx` - Added SessionGuard wrapper

---

## 10. Performance Impact

### File Validation
- **Client-side only**: No server load
- **Time**: ~50-200ms per file
- **User Experience**: Instant feedback on invalid files

### Session Tracking
- **Storage**: ~1KB localStorage per session
- **CPU**: Negligible (event listeners + 5min interval)
- **Network**: 1 request on mount for IP detection
- **Audit Logs**: 1 insert per login/logout

---

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs for errors
3. Check browser console for client-side errors
4. Contact development team

Last Updated: February 5, 2026
