# Rate Limiting Configuration

This app uses rate limiting to prevent abuse and protect against attacks.

## Current Limits

### Authentication (Login/Signup)
- **Limit**: 5 attempts per 15 minutes per IP address
- **Purpose**: Prevent brute force attacks
- **Applies to**: All auth operations

### Profile Submissions
- **Limit**: 3 submissions per hour per user
- **Purpose**: Prevent spam profile updates
- **Applies to**: Profile creation and edits

### Message Sending
- **Limit**: 60 messages per minute per user
- **Purpose**: Prevent chat spam
- **Applies to**: All chat messages

### Report Submissions
- **Limit**: 5 reports per day per user
- **Purpose**: Prevent report abuse
- **Applies to**: User reports

### General API
- **Limit**: 100 requests per minute per IP
- **Purpose**: Prevent API abuse
- **Applies to**: All API endpoints

## Setup (Production)

For production deployments, configure Upstash Redis:

1. Create account at https://upstash.com
2. Create a Redis database
3. Add environment variables to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Development Mode

Without Redis configuration, the app uses in-memory rate limiting (single-instance only).

## Error Responses

When rate limited, users receive:
- HTTP 429 (Too Many Requests)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- JSON body with error details and retry time
