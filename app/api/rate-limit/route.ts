import { NextRequest, NextResponse } from 'next/server';
import { 
  authRateLimiter, 
  profileRateLimiter, 
  messageRateLimiter, 
  reportRateLimiter,
  getClientIp 
} from '@/lib/rateLimit';
import { logRateLimitExceeded } from '@/lib/auditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limiterType, identifier } = body;

    if (!limiterType || !identifier) {
      return NextResponse.json(
        { error: 'Missing limiterType or identifier' },
        { status: 400 }
      );
    }

    // Select the appropriate rate limiter
    let limiter;
    switch (limiterType) {
      case 'auth':
        limiter = authRateLimiter;
        break;
      case 'profile':
        limiter = profileRateLimiter;
        break;
      case 'message':
        limiter = messageRateLimiter;
        break;
      case 'report':
        limiter = reportRateLimiter;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid limiter type' },
          { status: 400 }
        );
    }

    // Check rate limit
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    // Log rate limit exceeded events
    if (!success) {
      const ipAddress = getClientIp(request);
      await logRateLimitExceeded(identifier, limiterType, ipAddress);
    }

    return NextResponse.json({
      allowed: success,
      limit,
      remaining,
      reset,
      retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000)
    }, {
      status: success ? 200 : 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
