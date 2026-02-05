'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, ShieldOff } from 'lucide-react';

export default function BannedPage() {
  const router = useRouter();

  useEffect(() => {
    checkBannedStatus();
  }, []);

  const checkBannedStatus = async () => {
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

    // If status changed (no longer banned), redirect appropriately
    if (profile?.status !== 'banned') {
      if (profile?.status === 'approved') {
        router.push('/home');
      } else if (profile?.status === 'pending') {
        router.push('/profile-setup/pending');
      } else if (profile?.status === 'rejected') {
        router.push('/profile-setup?rejected=true');
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <ShieldOff className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Account Banned
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Your account has been permanently banned from yUE Match due to violations of our community guidelines.
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-left">
              <p className="text-sm text-red-800 font-semibold mb-2">
                Possible reasons for ban:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Harassment or threatening behavior</li>
                <li>• Sharing inappropriate content</li>
                <li>• Multiple community guideline violations</li>
                <li>• Fake profile or impersonation</li>
                <li>• Spam or scam activities</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This decision is final. If you believe this was a mistake, please contact support at{' '}
                <a href="mailto:admin@ueheart.app" className="text-ue-red font-semibold hover:underline">
                  admin@ueheart.app
                </a>
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-800 text-white py-4 rounded-full font-bold hover:bg-gray-900 transition-colors"
          >
            Sign Out
          </button>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              yUE Match - University of the East Dating App
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
