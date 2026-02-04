'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    checkStatus();
    
    // Subscribe to real-time profile updates
    const channel = supabase
      .channel('profile-status-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${getUserId()}`
      }, (payload) => {
        const newStatus = (payload.new as any).status;
        console.log('Profile status changed to:', newStatus);
        handleStatusChange(newStatus);
      })
      .subscribe();

    // Poll status every 5 seconds as backup
    const interval = setInterval(checkStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  };

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status) {
      handleStatusChange(profile.status);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    
    if (newStatus === 'approved') {
      // Approved! Redirect to home
      router.push('/home');
    } else if (newStatus === 'rejected') {
      // Rejected, redirect to edit profile
      router.push('/profile-setup?rejected=true');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        {/* Animated Clock Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-yellow-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">⏳</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-3">Profile Under Review</h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your profile is currently being reviewed by our admin team. 
          You'll be automatically redirected once approved!
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 text-left mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 What happens next:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Admin reviews your profile</li>
            <li>Approval happens within 24 hours</li>
            <li>You'll be redirected automatically</li>
            <li>No need to refresh this page</li>
          </ul>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
          <span>Checking status...</span>
        </div>
      </div>
    </div>
  );
}
