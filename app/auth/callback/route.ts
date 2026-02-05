import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
    
    // Check profile status after login
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, is_banned')
        .eq('id', session.user.id)
        .single();

      // CRITICAL: Check if user is banned first
      if (profile?.is_banned === true) {
        // Sign out banned user immediately
        await supabase.auth.signOut();
        return NextResponse.redirect(`${requestUrl.origin}/?error=banned`);
      }

      if (!profile) {
        return NextResponse.redirect(`${requestUrl.origin}/profile-setup`);
      }
      
      if (profile.status === 'pending') {
        return NextResponse.redirect(`${requestUrl.origin}/profile-setup/pending`);
      }
      
      if (profile.status === 'approved') {
        return NextResponse.redirect(`${requestUrl.origin}/home`);
      }
    }
  }

  // Generic redirect if something fails or loops
  return NextResponse.redirect(requestUrl.origin);
}
