'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeSessionTracking, detectSuspiciousActivity, handleSessionTimeout } from '@/lib/sessionSecurity';

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setupSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is admin (checking current route)
        const isAdmin = window.location.pathname.startsWith('/admin');
        
        // Initialize session tracking
        await initializeSessionTracking(isAdmin);
        
        // Check for suspicious activity
        const isSuspicious = await detectSuspiciousActivity();
        if (isSuspicious) {
          console.warn('Suspicious session activity detected');
          // Optionally force re-authentication for high-security scenarios
          // await handleSessionTimeout();
        }
      }
    };

    setupSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isAdmin = window.location.pathname.startsWith('/admin');
        await initializeSessionTracking(isAdmin);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('session_metadata');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
