import { supabase } from '@/lib/supabase';
import { hashEmail } from './hashEmail';

/**
 * Account spam prevention utilities
 * Prevents users from repeatedly creating and deleting accounts
 */

export interface AccountCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  wait_until?: string;
  deletion_count?: number;
  remaining?: number;
}

/**
 * Check if an account can be created with the given email
 * @param email - The email address to check
 * @returns Result indicating if account creation is allowed
 */
export async function canCreateAccount(email: string): Promise<AccountCheckResult> {
  try {
    const emailHash = await hashEmail(email);

    const { data, error } = await supabase
      .rpc('can_create_account', { email_hash_param: emailHash } as any);

    if (error) {
      console.error('Error checking account creation:', error);
      // Default to allowing in case of error (fail open)
      return { allowed: true };
    }

    return data as AccountCheckResult;
  } catch (error) {
    console.error('Error in canCreateAccount:', error);
    return { allowed: true };
  }
}

/**
 * Log an account creation attempt
 * @param email - The email used for account creation
 * @param success - Whether the creation was successful
 * @param failureReason - Optional reason for failure
 */
export async function logAccountCreationAttempt(
  email: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    const emailHash = await hashEmail(email);

    await supabase.rpc('log_account_creation_attempt', {
      email_hash_param: emailHash,
      success_param: success,
      failure_reason_param: failureReason
    } as any);
  } catch (error) {
    console.error('Error logging account creation attempt:', error);
  }
}

/**
 * Delete user account with cooldown tracking
 * @returns Result with cooldown information
 */
export async function deleteUserWithCooldown(): Promise<{
  success: boolean;
  cooldown_hours?: number;
  can_recreate_at?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('delete_user_with_cooldown', undefined as any);

    if (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error in deleteUserWithCooldown:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format cooldown message for user display
 * @param canRecreateAt - ISO timestamp when user can recreate account
 * @returns User-friendly message
 */
export function formatCooldownMessage(canRecreateAt: string): string {
  const recreateDate = new Date(canRecreateAt);
  const now = new Date();
  const diffMs = recreateDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return `You can create a new account in ${diffDays} days.`;
  } else if (diffHours > 1) {
    return `You can create a new account in ${diffHours} hours.`;
  } else {
    return 'You can create a new account soon.';
  }
}

/**
 * Check email limits before account creation
 * @param email - Email to check
 * @returns Check result
 */
export async function performPreSignupChecks(
  email: string
): Promise<AccountCheckResult> {
  // Check email-based restrictions
  const emailCheck = await canCreateAccount(email);
  if (!emailCheck.allowed) {
    return emailCheck;
  }

  return { allowed: true };
}
