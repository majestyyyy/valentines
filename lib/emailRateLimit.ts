import { supabase } from './supabase';

// Database tracking functions
export async function trackEmailSent(
  emailType: 'otp' | 'verification' | 'notification',
  recipient: string,
  success: boolean = true
) {
  try {
    await supabase
      .from('email_rate_limit')
      .insert({
        email_type: emailType,
        recipient: recipient,
        success: success
      });
  } catch (error) {
    console.error('Failed to track email in database:', error);
  }
  
  // Also track locally as backup
  trackEmailLocally();
}

export async function getTodaysEmailCount(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_todays_email_count');
    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Failed to get email count from database:', error);
    // Fallback to local count
    return getTodaysLocalCount();
  }
}

export async function checkRateLimit(limit: number = 500): Promise<{
  canSend: boolean;
  count: number;
  remaining: number;
  percentUsed: number;
  resetTime: string;
}> {
  const count = await getTodaysEmailCount();
  const remaining = Math.max(0, limit - count);
  const percentUsed = (count / limit) * 100;
  
  // Calculate reset time (midnight PST)
  const now = new Date();
  const pstOffset = -8; // PST is UTC-8
  const resetDate = new Date(now);
  resetDate.setUTCHours(24 + pstOffset, 0, 0, 0); // Next midnight PST
  
  return {
    canSend: count < limit,
    count,
    remaining,
    percentUsed,
    resetTime: resetDate.toLocaleString()
  };
}

// Local storage tracking functions (backup/fallback)
export function trackEmailLocally(): number {
  if (typeof window === 'undefined') return 0;
  
  const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  const stored = localStorage.getItem('email_limit');
  const data = stored ? JSON.parse(stored) : { date: today, count: 0 };
  
  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }
  
  data.count++;
  localStorage.setItem('email_limit', JSON.stringify(data));
  
  return data.count;
}

export function getTodaysLocalCount(): number {
  if (typeof window === 'undefined') return 0;
  
  const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  const stored = localStorage.getItem('email_limit');
  const data = stored ? JSON.parse(stored) : { date: today, count: 0 };
  
  return data.date === today ? data.count : 0;
}

export function resetLocalCount(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('email_limit');
}
