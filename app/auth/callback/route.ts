import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  console.log('Callback triggered, code:', code ? 'exists' : 'missing');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      console.log('Session exchanged successfully');
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(requestUrl.origin);
    }
    
    // Check profile status after login
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', session ? 'Session exists' : 'No session', sessionError);
    
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('User email:', session.user.email);
      
      // Try to get or create profile
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('status, is_banned, terms_accepted_at, nickname, photo_urls')
        .eq('id', session.user.id)
        .single();

      console.log('Profile fetch result:', profile, fetchError);

      // If no profile exists, create one
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('Creating new profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            status: 'incomplete'
          })
          .select()
          .single();

        console.log('Profile creation result:', newProfile, createError);

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.redirect(requestUrl.origin);
        }

        profile = newProfile;
      }

      // CRITICAL: Check if user is banned first
      if (profile?.is_banned === true) {
        console.log('User is banned, signing out');
        await supabase.auth.signOut();
        return NextResponse.redirect(`${requestUrl.origin}/?error=banned`);
      }

      // Check if terms have been accepted
      if (!profile?.terms_accepted_at) {
        console.log('Terms not accepted, redirecting to terms-acceptance');
        return NextResponse.redirect(`${requestUrl.origin}/terms-acceptance`);
      }

      // Check if profile is complete
      if (!profile || !profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
        console.log('Profile incomplete, redirecting to profile-setup');
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
  console.log('Fallback redirect to origin');
  return NextResponse.redirect(requestUrl.origin);
}
