/**
 * Session Security Management
 * Handles session timeout, device tracking, and session refresh
 */

import { supabase } from './supabase';
import { logAuditEvent } from './auditLog';

// Session timeout duration (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Session refresh interval (check every 5 minutes)
const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Admin session timeout (15 minutes for higher security)
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000;

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

interface SessionMetadata {
  lastActivity: number;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  sessionStart: number;
  isAdmin: boolean;
}

/**
 * Get current device information
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Get client IP address (requires server-side implementation)
 */
export async function getClientIP(): Promise<string | undefined> {
  try {
    const response = await fetch('/api/get-ip');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return undefined;
  }
}

/**
 * Initialize session tracking
 */
export async function initializeSessionTracking(isAdmin: boolean = false): Promise<void> {
  const metadata: SessionMetadata = {
    lastActivity: Date.now(),
    deviceInfo: getDeviceInfo(),
    ipAddress: await getClientIP(),
    sessionStart: Date.now(),
    isAdmin
  };

  // Store session metadata in localStorage
  localStorage.setItem('session_metadata', JSON.stringify(metadata));

  // Start activity monitoring
  startActivityMonitoring(isAdmin);

  // Log session start
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await logAuditEvent({
      event_type: 'session_started',
      user_id: user.id,
      details: {
        device: metadata.deviceInfo,
        ip: metadata.ipAddress,
        isAdmin
      },
      ip_address: metadata.ipAddress
    });
  }
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  const metadataStr = localStorage.getItem('session_metadata');
  if (!metadataStr) return;

  const metadata: SessionMetadata = JSON.parse(metadataStr);
  metadata.lastActivity = Date.now();
  localStorage.setItem('session_metadata', JSON.stringify(metadata));
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
  const metadataStr = localStorage.getItem('session_metadata');
  if (!metadataStr) return false;

  const metadata: SessionMetadata = JSON.parse(metadataStr);
  const timeout = metadata.isAdmin ? ADMIN_SESSION_TIMEOUT : SESSION_TIMEOUT;
  const timeSinceActivity = Date.now() - metadata.lastActivity;

  return timeSinceActivity > timeout;
}

/**
 * Get session duration
 */
export function getSessionDuration(): number {
  const metadataStr = localStorage.getItem('session_metadata');
  if (!metadataStr) return 0;

  const metadata: SessionMetadata = JSON.parse(metadataStr);
  return Date.now() - metadata.sessionStart;
}

/**
 * Handle session timeout
 */
export async function handleSessionTimeout(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const metadataStr = localStorage.getItem('session_metadata');
    const metadata: SessionMetadata | null = metadataStr ? JSON.parse(metadataStr) : null;

    await logAuditEvent({
      event_type: 'session_timeout',
      user_id: user.id,
      details: {
        duration: getSessionDuration(),
        lastActivity: metadata?.lastActivity
      },
      ip_address: metadata?.ipAddress
    });
  }

  // Sign out user
  await supabase.auth.signOut();
  
  // Clear session metadata
  localStorage.removeItem('session_metadata');
  
  // Redirect to login
  window.location.href = '/';
}

/**
 * Refresh session token
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('Session refresh failed:', error);
      return false;
    }

    // Update last activity
    updateLastActivity();
    
    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
}

/**
 * Start monitoring user activity and session timeout
 */
export function startActivityMonitoring(isAdmin: boolean = false): void {
  // Update activity on user interactions
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  activityEvents.forEach(event => {
    window.addEventListener(event, updateLastActivity, { passive: true });
  });

  // Check session timeout periodically
  const checkInterval = setInterval(async () => {
    if (isSessionExpired()) {
      clearInterval(checkInterval);
      await handleSessionTimeout();
      return;
    }

    // Refresh token proactively
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Refresh if session will expire in next 5 minutes
      const expiresAt = data.session.expires_at;
      if (expiresAt && (expiresAt * 1000 - Date.now()) < REFRESH_CHECK_INTERVAL) {
        await refreshSession();
      }
    }
  }, REFRESH_CHECK_INTERVAL);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(checkInterval);
    activityEvents.forEach(event => {
      window.removeEventListener(event, updateLastActivity);
    });
  });
}

/**
 * Detect suspicious session changes (e.g., device change)
 */
export async function detectSuspiciousActivity(): Promise<boolean> {
  const metadataStr = localStorage.getItem('session_metadata');
  if (!metadataStr) return false;

  const storedMetadata: SessionMetadata = JSON.parse(metadataStr);
  const currentDevice = getDeviceInfo();

  // Check if device info has changed significantly
  const deviceChanged = (
    storedMetadata.deviceInfo.userAgent !== currentDevice.userAgent ||
    storedMetadata.deviceInfo.platform !== currentDevice.platform
  );

  if (deviceChanged) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await logAuditEvent({
        event_type: 'suspicious_activity',
        user_id: user.id,
        details: {
          reason: 'Device information changed during session',
          originalDevice: storedMetadata.deviceInfo,
          currentDevice: currentDevice
        },
        ip_address: storedMetadata.ipAddress
      });
    }

    return true;
  }

  return false;
}

/**
 * End session and cleanup
 */
export async function endSession(isAdmin: boolean = false): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // Only log admin sessions
  if (user && isAdmin) {
    const ipAddress = await getClientIP();
    await logAuditEvent({
      event_type: 'admin_logout',
      user_id: user.id,
      details: {
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress
    });
  }

  await supabase.auth.signOut();
  localStorage.removeItem('session_metadata');
}

/**
 * Get session info for display
 */
export function getSessionInfo(): SessionMetadata | null {
  const metadataStr = localStorage.getItem('session_metadata');
  if (!metadataStr) return null;
  return JSON.parse(metadataStr);
}
