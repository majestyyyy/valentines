import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a Redis client (fallback to in-memory if no Redis URL)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * In-memory rate limiter (fallback when Redis is not configured)
 * Note: This only works in development and single-instance deployments
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(identifier: string, limit: number, window: number): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const key = identifier;
    const existing = this.store.get(key);

    // Clean up expired entries
    if (existing && existing.resetAt < now) {
      this.store.delete(key);
    }

    const current = existing && existing.resetAt >= now ? existing : null;

    if (!current) {
      // First request in this window
      this.store.set(key, { count: 1, resetAt: now + window });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + window
      };
    }

    if (current.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetAt
      };
    }

    // Increment count
    current.count++;
    this.store.set(key, current);

    return {
      success: true,
      limit,
      remaining: limit - current.count,
      reset: current.resetAt
    };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Rate limiter for authentication attempts (login/signup)
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@ratelimit/auth',
    })
  : {
      limit: (identifier: string) => inMemoryLimiter.limit(identifier, 5, 15 * 60 * 1000)
    };

/**
 * Rate limiter for profile submissions
 * 3 submissions per hour per user
 */
export const profileRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@ratelimit/profile',
    })
  : {
      limit: (identifier: string) => inMemoryLimiter.limit(identifier, 3, 60 * 60 * 1000)
    };

/**
 * Rate limiter for message sending
 * 60 messages per minute per user
 */
export const messageRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@ratelimit/message',
    })
  : {
      limit: (identifier: string) => inMemoryLimiter.limit(identifier, 60, 60 * 1000)
    };

/**
 * Rate limiter for report submissions
 * 5 reports per day per user
 */
export const reportRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '24 h'),
      analytics: true,
      prefix: '@ratelimit/report',
    })
  : {
      limit: (identifier: string) => inMemoryLimiter.limit(identifier, 5, 24 * 60 * 60 * 1000)
    };

/**
 * Rate limiter for general API requests
 * 100 requests per minute per IP
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@ratelimit/api',
    })
  : {
      limit: (identifier: string) => inMemoryLimiter.limit(identifier, 100, 60 * 1000)
    };

/**
 * Helper function to get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Helper function to check rate limit and return appropriate response
 */
export async function checkRateLimit(
  identifier: string,
  limiter: typeof authRateLimiter
): Promise<{ allowed: boolean; response?: Response }> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
          }
        }
      )
    };
  }

  return { allowed: true };
}
