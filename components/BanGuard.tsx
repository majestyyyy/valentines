'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const checkBanStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check current status
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('status, is_banned')
          .eq('id', user.id)
          .single();

        if (profile?.is_banned) {
          // Immediately sign out banned user
          await supabase.auth.signOut();
          setIsBanned(true);
        }

        // Subscribe to profile changes
        channel = supabase
          .channel(`ban-check-${user.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          }, async (payload) => {
            const newProfile = payload.new as { status: string; is_banned: boolean };
            if (newProfile.is_banned) {
              // Immediately sign out when banned
              await supabase.auth.signOut();
              setIsBanned(true);
            }
          })
          .subscribe();

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking ban status:', error);
        setIsLoading(false);
      }
    };

    checkBanStatus();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return <>{children}</>;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-gray-900 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border-4 border-red-600">
          <div className="text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-red-600 mb-4">
              Account Banned
            </h1>

            {/* Message */}
            <p className="text-gray-700 text-lg mb-2">
              Your account has been banned by an administrator.
            </p>
            <p className="text-gray-600 mb-6">
              You can no longer access yUE Match!. If you believe this was a mistake, please contact support.
            </p>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Info Box */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Reason:</strong> Violation of community guidelines or user report
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 shadow-lg transition-all active:scale-95"
            >
              Sign Out
            </button>

            {/* Footer */}
            <p className="text-xs text-gray-400 mt-6">
              Thank you for using yUE Match! responsibly
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
