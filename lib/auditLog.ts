import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

// Admin client with elevated permissions for audit logging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Event types for audit logging
 */
export type AuditEventType = 
  | 'admin_login'
  | 'admin_logout'
  | 'profile_approved'
  | 'profile_rejected'
  | 'user_banned'
  | 'report_submitted'
  | 'report_resolved'
  | 'profile_created'
  | 'profile_updated'
  | 'auth_failed'
  | 'rate_limit_exceeded'
  | 'unauthorized_access';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event
 * @param entry - Audit log entry details
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type: entry.event_type,
        user_id: entry.user_id || null,
        target_id: entry.target_id || null,
        details: entry.details || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Log admin action (approve/reject profile)
 */
export async function logAdminAction(
  action: 'approved' | 'rejected',
  adminId: string,
  targetUserId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: action === 'approved' ? 'profile_approved' : 'profile_rejected',
    user_id: adminId,
    target_id: targetUserId,
    details: {
      action,
      timestamp: new Date().toISOString(),
      ...details
    }
  });
}

/**
 * Log user ban
 */
export async function logUserBan(
  adminId: string,
  bannedUserId: string,
  reason?: string,
  reportId?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'user_banned',
    user_id: adminId,
    target_id: bannedUserId,
    details: {
      reason: reason || 'Admin action',
      report_id: reportId,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log authentication failure
 */
export async function logAuthFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'auth_failed',
    details: {
      email,
      timestamp: new Date().toISOString()
    },
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  userId: string,
  limiterType: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'rate_limit_exceeded',
    user_id: userId,
    details: {
      limiter_type: limiterType,
      timestamp: new Date().toISOString()
    },
    ip_address: ipAddress
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  userId: string | null,
  path: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'unauthorized_access',
    user_id: userId || undefined,
    details: {
      path,
      timestamp: new Date().toISOString()
    },
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

/**
 * Get recent audit logs (admin only)
 */
export async function getAuditLogs(limit: number = 100) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:user_id (nickname, email),
      target:target_id (nickname, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:user_id (nickname, email),
      target:target_id (nickname, email)
    `)
    .or(`user_id.eq.${userId},target_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs by event type
 */
export async function getAuditLogsByType(
  eventType: AuditEventType,
  limit: number = 100
) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:user_id (nickname, email),
      target:target_id (nickname, email)
    `)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs by type:', error);
    return [];
  }

  return data || [];
}
