'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TermsModal from '@/components/TermsModal';
import { Heart } from 'lucide-react';
import { hashEmail } from '@/lib/hashEmail';

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
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('terms_accepted_at, status, nickname, photo_urls, email')
        .eq('id', session.user.id)
        .single();

      // Hash existing plaintext emails
      if (profile && profile.email && profile.email.includes('@')) {
        const emailHash = await hashEmail(profile.email);
        await (supabase as any)
          .from('profiles')
          .update({ email: emailHash })
          .eq('id', session.user.id);
      }

      if (profile && profile.terms_accepted_at) {
        // Terms already accepted - check profile status
        if (profile.status === 'approved') {
          router.push('/home');
          return;
        } else if (profile.status === 'pending') {
          router.push('/profile-setup/pending');
          return;
        } else if (!profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
          // Profile incomplete
          router.push('/profile-setup');
          return;
        } else {
          // Has profile but not approved yet
          router.push('/profile-setup/pending');
          return;
        }
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
      // SECURITY FIX: Get fresh authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // SECURITY FIX: Use session user ID, not state variable
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

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
