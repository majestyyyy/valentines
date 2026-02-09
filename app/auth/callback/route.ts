import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hashEmail } from '@/lib/hashEmail';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(requestUrl.origin);
    }
    
    // Check profile status after login
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session) {
      // Try to get or create profile
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('status, is_banned, terms_accepted_at, nickname, photo_urls, email')
        .eq('id', session.user.id)
        .single();

      // If no profile exists, create one
      if (fetchError && fetchError.code === 'PGRST116') {
        // Hash the email for privacy
        const emailHash = await hashEmail(session.user.email!);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: emailHash,
            status: 'incomplete'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.redirect(requestUrl.origin);
        }

        profile = newProfile;
      } else if (profile && profile.email && profile.email.includes('@')) {
        // Hash existing plaintext emails (migration for existing users)
        const emailHash = await hashEmail(profile.email);
        await supabase
          .from('profiles')
          .update({ email: emailHash })
          .eq('id', session.user.id);
      }

      // CRITICAL: Check if user is banned first
      if (profile?.is_banned === true) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${requestUrl.origin}/?error=banned`);
      }

      // Check if terms have been accepted
      if (!profile?.terms_accepted_at) {
        return NextResponse.redirect(`${requestUrl.origin}/terms-acceptance`);
      }

      // Check if profile is complete
      if (!profile || !profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
        return NextResponse.redirect(`${requestUrl.origin}/profile-setup`);
      }
      
      if (profile.status === 'pending') {
        console.log('Status pending, redirecting to pending page');
        return NextResponse.redirect(`${requestUrl.origin}/profile-setup/pending`);
      }
      
      if (profile.status === 'approved') {
        console.log('Status approved, redirecting to home');
        return NextResponse.redirect(`${requestUrl.origin}/home`);
      }
    }
  }

  // Generic redirect if something fails or loops
  return NextResponse.redirect(requestUrl.origin);
}
