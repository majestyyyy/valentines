'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Heart, ArrowLeft, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Notification {
  id: string;
  from_user_id: string;
  type: 'like' | 'match';
  is_read: boolean;
  created_at: string;
  from_profile: Profile;
}

export default function LikesPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    // Get my profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setMyProfile(profile);
    }

    // Fetch notifications with profile info
    const { data: notifs, error } = await (supabase as any)
      .from('notifications')
      .select(`
        id,
        from_user_id,
        type,
        is_read,
        created_at,
        from_profile:from_user_id (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    // Transform data to match our interface
    const transformedNotifs = (notifs || []).map((notif: any) => ({
      id: notif.id,
      from_user_id: notif.from_user_id,
      type: notif.type,
      is_read: notif.is_read,
      created_at: notif.created_at,
      from_profile: notif.from_profile
    }));

    setNotifications(transformedNotifs);
    setLoading(false);

    // Mark all as read
    if (notifs && notifs.length > 0) {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
  };

  const handleSwipeResponse = async (notif: Notification, direction: 'left' | 'right') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already swiped
    const { data: existingSwipe } = await (supabase as any)
      .from('swipes')
      .select('*')
      .eq('swiper_id', user.id)
      .eq('swiped_id', notif.from_user_id)
      .single();

    if (existingSwipe) {
      showModal('info', 'Already Responded', 'You already responded to this person!');
      return;
    }

    // Record the swipe
    await (supabase as any).from('swipes').insert({
      swiper_id: user.id,
      swiped_id: notif.from_user_id,
      direction,
    });

    if (direction === 'right') {
      // Check if they swiped right on us (which we know they did from the notification)
      const { data: theirSwipe } = await (supabase as any)
        .from('swipes')
        .select('*')
        .eq('swiper_id', notif.from_user_id)
        .eq('swiped_id', user.id)
        .eq('direction', 'right')
        .single();

      if (theirSwipe) {
        // Create match
        await (supabase as any).from('matches').insert({
          user1_id: user.id,
          user2_id: notif.from_user_id
        });

        // Show reveal message with their name
        showModal('success', "It's a Match!", `It's a match with ${notif.from_profile.nickname || 'your admirer'}! 💕 Check your messages!`);
      }
    } else {
      // Passed on them
      showModal('info', 'Passed', "Passed! They won't know you saw this.");
    }

    // Remove from list
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-red-100 flex items-center justify-center">
        <div className="text-pink-600 text-xl">Loading...</div>
      </div>
    );
  }

  const likeNotifications = notifications.filter(n => n.type === 'like');
  const matchNotifications = notifications.filter(n => n.type === 'match');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-red-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Matches Section */}
        {matchNotifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Heart className="text-pink-500" fill="currentColor" size={24} />
              New Matches
            </h2>
            <div className="space-y-3">
              {matchNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href="/chat"
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition flex items-center gap-4 border-2 border-pink-300"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-red-200 flex-shrink-0">
                    {notif.from_profile.photo_urls?.[0] ? (
                      <img
                        src={notif.from_profile.photo_urls[0]}
                        alt={notif.from_profile.nickname || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-pink-500 text-2xl">
                        {(notif.from_profile.nickname || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {notif.from_profile.nickname || 'Anonymous'}
                    </h3>
                    <p className="text-pink-600 font-semibold">It's a Match! 💕</p>
                    <p className="text-sm text-gray-500">{getTimeAgo(notif.created_at)}</p>
                  </div>
                  <Heart className="text-pink-500 flex-shrink-0" fill="currentColor" size={32} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Likes Section */}
        {likeNotifications.length > 0 && (
          <div>
           
            <div className="space-y-3">
              {likeNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition relative overflow-hidden"
                >
                  {/* Mysterious gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 to-purple-50/80 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                      {/* Blurred/Hidden Photo */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-300 to-purple-400 flex-shrink-0 relative">
                        {notif.from_profile.photo_urls?.[0] ? (
                          <div className="relative w-full h-full">
                            <img
                              src={notif.from_profile.photo_urls[0]}
                              alt="Secret Admirer"
                              className="w-full h-full object-cover blur-xl scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/60 to-purple-500/60" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500" />
                        )}
                        {/* Mystery icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-3xl">❓</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                          Secret Admirer 💕
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {notif.from_profile.college ? `From ${notif.from_profile.college}` : 'From your campus'}
                        </p>
                        <p className="text-sm text-gray-500">{getTimeAgo(notif.created_at)}</p>
                      </div>
                    </div>

                    {/* Teaser message instead of description */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-3 border-2 border-pink-300">
                      <p className="text-gray-800 text-sm text-center font-semibold mb-1">
                        Someone from {notif.from_profile.college || 'your campus'} is interested in you! 💫
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-20">
            <div className="relative inline-block mb-4">
              <Heart size={64} className="text-gray-300" />
              <span className="absolute -top-2 -right-2 text-3xl">❓</span>
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">No secret admirers yet</h3>
            <p className="text-gray-500">
              When someone likes you, they'll appear here as a mystery!
            </p>
            <Link
              href="/home"
              className="inline-block mt-6 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 px-8 rounded-full hover:from-pink-600 hover:to-red-600 transition"
            >
              Start Swiping
            </Link>
          </div>
        )}
      </div>

      {/* Modal for notifications */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
      >
        {modal.message}
      </Modal>
    </div>
  );
}
