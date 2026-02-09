'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TermsModal from '@/components/TermsModal';
import { Heart } from 'lucide-react';

export default function TermsModalPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      // Validate UE email
      const email = session.user.email;
      if (!email || !email.endsWith('@ue.edu.ph')) {
        // Not a UE email - sign them out
        await supabase.auth.signOut();
        router.push('/?error=invalid-email');
        return;
      }

      // Check if user already accepted terms
      const { data: profile } = await supabase
        .from('profiles')
        .select('terms_accepted_at')
        .eq('id', session.user.id)
        .single();

      if (profile?.terms_accepted_at) {
        // Already accepted, go to profile setup
        router.push('/profile-setup');
        return;
      }

      setUserId(session.user.id);
      setShowModal(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleAccept = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      router.push('/profile-setup');
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Failed to save your acceptance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
      <TermsModal
        isOpen={showModal}
        onClose={() => {
          // Prevent closing - they must accept
        }}
        onAccept={handleAccept}
      />
    </div>
  );
}
