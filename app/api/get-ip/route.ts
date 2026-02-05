/**
 * API endpoint to get client IP address
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Try to get IP from various headers (for proxy/CDN scenarios)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  let ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : realIp || cfConnectingIp || 'unknown';

  return NextResponse.json({ ip });
}
