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

    // Filter out notifications from users we're already matched with
    const filteredNotifs = [];
    for (const notif of transformedNotifs) {
      // Check if we're already matched with this user
      const { data: existingMatch } = await (supabase as any)
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${notif.from_user_id}),and(user1_id.eq.${notif.from_user_id},user2_id.eq.${user.id})`)
        .maybeSingle();

      // Only include if not already matched
      if (!existingMatch) {
        filteredNotifs.push(notif);
      } else {
        // Delete the notification since they're already matched
        await (supabase as any)
          .from('notifications')
          .delete()
          .eq('id', notif.id);
      }
    }

    setNotifications(filteredNotifs);
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
        
        // Delete the notification since they're now matched
        await (supabase as any)
          .from('notifications')
          .delete()
          .eq('id', notif.id);
      }
    } else {
      // User swiped LEFT - passed on them
      showModal('info', 'Passed', "Passed! They won't know you saw this.");
      
      // Delete the notification since user rejected them
      await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notif.id);
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const likeNotifications = notifications.filter(n => n.type === 'like');
  const matchNotifications = notifications.filter(n => n.type === 'match');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black drop-shadow-md">Notifications</h1>
            <p className="text-sm text-white/90">
              {notifications.length > 0 
                ? `${notifications.length} ${notifications.length === 1 ? 'notification' : 'notifications'}`
                : 'No new notifications'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Matches Section */}
        {matchNotifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Heart className="text-rose-600" fill="currentColor" size={20} />
              </div>
              Connections
            </h2>
            <div className="space-y-3">
              {matchNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href="/chat"
                  className="bg-white rounded-3xl p-5 shadow-md hover:shadow-xl transition-all flex items-center gap-4 border border-gray-100 active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-rose-200 to-red-200 flex-shrink-0 ring-2 ring-rose-200">
                    {notif.from_profile.photo_urls?.[0] ? (
                      <img
                        src={notif.from_profile.photo_urls[0]}
                        alt={notif.from_profile.nickname || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-600 text-2xl font-bold">
                        {(notif.from_profile.nickname || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {notif.from_profile.nickname || 'Anonymous'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-rose-600 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Connected</span>
                      <span className="text-xs text-gray-400">{getTimeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-rose-100 rounded-full p-3">
                      <Heart className="text-rose-600" fill="currentColor" size={24} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Likes Section */}
        {likeNotifications.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              Secret Admirers
            </h2>
            <div className="space-y-4">
              {likeNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Blurred/Hidden Photo */}
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-rose-300 to-red-400 flex-shrink-0 relative ring-4 ring-rose-100">
                        {notif.from_profile.photo_urls?.[0] ? (
                          <div className="relative w-full h-full">
                            <img
                              src={notif.from_profile.photo_urls[0]}
                              alt="Secret Admirer"
                              className="w-full h-full object-cover blur-2xl scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-400/70 to-red-500/70" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-rose-400 to-red-500" />
                        )}
                        {/* Mystery icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-4xl drop-shadow-lg">❓</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-500 mb-2">
                          Someone likes you from {notif.from_profile.college || 'UE'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{getTimeAgo(notif.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hint Box */}
                   
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-red-100 rounded-full flex items-center justify-center">
                  <Heart size={48} className="text-rose-400" />
                </div>
                <span className="absolute -top-2 -right-2 text-4xl">❓</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-3">No notifications yet</h3>
              <p className="text-gray-500 mb-6">
                Start swiping to connect with others and see who's interested in you!
              </p>
              <Link
                href="/home"
                className="inline-block bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-4 px-8 rounded-full hover:from-rose-700 hover:to-red-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Start Exploring
              </Link>
            </div>
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
