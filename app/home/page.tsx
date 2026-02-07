'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { get3RandomMissions } from '@/lib/missions';
import { Heart, X, MessageCircle, Bell, User, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function HomePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchCount, setMatchCount] = useState(0);
  const [swipedIds, setSwipedIds] = useState<string[]>([]);
  const [unreadLikesCount, setUnreadLikesCount] = useState(0);
  
  // Swipe gesture state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
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

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleReportClick = () => {
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      showModal('warning', 'Missing Information', 'Please provide a reason for reporting this user.');
      return;
    }

    if (!myProfile || !currentProfile) return;

    setReportSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limiterType: 'report',
          identifier: myProfile.id 
        })
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        const resetDate = new Date(rateLimitData.reset);
        showModal('error', 'Too Many Reports', 
          `You can only submit 5 reports per day. Try again at ${resetDate.toLocaleString()}.`);
        setReportSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: myProfile.id,
          reported_id: currentProfile.id,
          reason: reportReason.trim()
        } as any);

      if (error) throw error;

      setShowReportModal(false);
      setReportReason('');
      showModal('success', 'Report Submitted', 'Thank you for your report. Our team will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      showModal('error', 'Report Failed', 'Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    checkProfileAndFetch();
    fetchUnreadLikesCount();
    fetchMatchCount();
  }, []);

  useEffect(() => {
    if (!myProfile) return;

    let currentUserId = myProfile.id;

    // Subscribe to profile changes (new approved profiles or status updates)
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const newProfile = payload.new as Profile;
        
        // Only add if approved, not me, and not already swiped
        if (
          newProfile.status === 'approved' && 
          newProfile.id !== currentUserId &&
          !swipedIds.includes(newProfile.id)
        ) {
          console.log('New approved profile detected:', newProfile);
          setProfiles(prev => [...prev, newProfile]);
          
          // If no current profile, set this as current
          if (!currentProfile) {
            setCurrentProfile(newProfile);
            setPhotoIndex(0);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const updatedProfile = payload.new as Profile;
        
        // If profile just got approved, add to candidates
        if (
          updatedProfile.status === 'approved' && 
          updatedProfile.id !== currentUserId &&
          !swipedIds.includes(updatedProfile.id)
        ) {
          console.log('Profile approved in real-time:', updatedProfile);
          
          // Check if already in list
          setProfiles(prev => {
            const exists = prev.some(p => p.id === updatedProfile.id);
            if (exists) return prev;
            return [...prev, updatedProfile];
          });
          
          // If no current profile, set this as current
          if (!currentProfile) {
            setCurrentProfile(updatedProfile);
            setPhotoIndex(0);
          }
        }
      })
      .subscribe();

    // Subscribe to new matches
    const matchChannel = supabase
      .channel('matches-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        const newMatch = payload.new as Database['public']['Tables']['matches']['Row'];
        
        // Update match count if this involves current user
        if (newMatch.user1_id === currentUserId || newMatch.user2_id === currentUserId) {
          fetchMatchCount();
        }
      })
      .subscribe();

    // Subscribe to new notifications (likes)
    const notifChannel = supabase
      .channel('notifications-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const newNotif = payload.new as Database['public']['Tables']['notifications']['Row'];
        
        // Update unread count if this is for current user and is a like
        if (newNotif.user_id === currentUserId && newNotif.type === 'like') {
          fetchUnreadLikesCount();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [myProfile, currentProfile, swipedIds]);

  const checkProfileAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    // Check if user's profile is approved
    const { data: myProfileData } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!myProfileData) {
      router.push('/profile-setup');
      return;
    }

    if (myProfileData.status === 'pending') {
      router.push('/profile-setup/pending');
      return;
    }

    if (myProfileData.is_banned === true) {
      // Banned user - sign out immediately
      await supabase.auth.signOut();
      router.push('/');
      return;
    }

    if (myProfileData.status !== 'approved') {
      router.push('/');
      return;
    }

    setMyProfile(myProfileData);
    await fetchCandidates(user.id, myProfileData);
    setLoading(false);
  };

  const fetchMatchCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    setMatchCount(matches?.length || 0);
  };

  const fetchUnreadLikesCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'like')
      .eq('is_read', false);

    setUnreadLikesCount(notifications?.length || 0);
  };

  const fetchCandidates = async (userId: string, myProfileData: Profile) => {

    // Get IDs I've already swiped on
    const { data: mySwipes } = await (supabase as any)
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', userId);

    const swiped = mySwipes?.map((s: any) => s.swiped_id) || [];
    swiped.push(userId); // Don't show myself
    setSwipedIds(swiped); // Store in state for real-time filtering

    // Build query
    console.log('Fetching candidates for:', userId);
    console.log('My profile:', myProfileData);
    
    // DEBUG: Check total approved profiles
    const { count } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    console.log('Total approved profiles in DB:', count);

    // Use safe filter format for NOT IN
    const safeIds = `(${swiped.map((id: string) => `"${id}"`).join(',')})`;

    let query = (supabase as any)
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .filter('id', 'not.in', safeIds);
    
    // Apply bidirectional gender matching
    // Show profiles where BOTH conditions are true:
    // 1. Their gender matches what I'm interested in (or I'm interested in Everyone)
    // 2. I match what they're interested in (or they're interested in Everyone)
    
    if (myProfileData.preferred_gender && myProfileData.gender) {
      // Build the mutual interest filter
      // Show them if:
      // - Their gender is what I want (or I want Everyone - legacy)
      // AND
      // - They want my gender (or they want Everyone - legacy)
      
      const myGender = myProfileData.gender;
      const myPreference = myProfileData.preferred_gender;
      
      // They must match what I'm looking for
      if (myPreference !== 'Male' && myPreference !== 'Female' && myPreference !== 'Non-binary') {
        // I'm interested in everyone (legacy "Everyone" or "Other"), so no gender filter
      } else {
        query = query.eq('gender', myPreference);
      }
      
      // And I must match what they're looking for
      query = query.or(`preferred_gender.eq.${myGender},preferred_gender.eq.Everyone`);
    }

    query = query.limit(50); // Increased limit to show more candidates

    const { data: candidates, error } = await query;
    
    if (error) {
        console.error('Error fetching candidates:', error);
    }
    console.log('Candidates found:', candidates?.length, candidates);

    if (candidates && candidates.length > 0) {
      setProfiles(candidates);
      setCurrentProfile(candidates[0]); // SET THE FIRST PROFILE!
      setPhotoIndex(0);
    } else {
      console.log('No candidates found matching criteria.');
      setProfiles([]);
      setCurrentProfile(null);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if this person liked us first (secret admirer check)
    const { data: theirLike } = await (supabase as any)
      .from('swipes')
      .select('*')
      .eq('swiper_id', currentProfile.id)
      .eq('swiped_id', user.id)
      .eq('direction', 'right')
      .single();

    // Optimistically update swiped IDs
    setSwipedIds(prev => [...prev, currentProfile.id]);

    // Optimistically move to next profile
    const nextProfiles = profiles.slice(1);
    setProfiles(nextProfiles);
    setCurrentProfile(nextProfiles.length > 0 ? nextProfiles[0] : null);
    setPhotoIndex(0);
    setIsDescriptionExpanded(false); // Reset description expansion

    // Record swipe in background
    const swipePromise = (supabase as any).from('swipes').insert({
      swiper_id: user.id,
      swiped_id: currentProfile.id,
      direction,
    });

    if (direction === 'right') {
      // Check for match in background
      const matchCheckPromise = (supabase as any)
        .from('swipes')
        .select('*')
        .eq('swiper_id', currentProfile.id)
        .eq('swiped_id', user.id)
        .eq('direction', 'right')
        .single();

      const [, { data: theirSwipe }] = await Promise.all([swipePromise, matchCheckPromise]);
      
      if (theirSwipe) {
        // It's a match! Assign 3 random missions
        const [mission1, mission2, mission3] = get3RandomMissions();
        await (supabase as any).from('matches').insert({
          user1_id: user.id,
          user2_id: currentProfile.id,
          mission_1_id: mission1.id,
          mission_2_id: mission2.id,
          mission_3_id: mission3.id,
          mission_number: 1
        });
        
        setMatchPopup(currentProfile);
        // Match count will update via real-time subscription
        
        // Mark their like notification as read (remove from secret admirers)
        await (supabase as any)
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('from_user_id', currentProfile.id)
          .eq('type', 'like');
      }
    } else {
      // User swiped LEFT
      await swipePromise;
      
      // Check if they were a secret admirer (they liked us but we rejected them)
      if (theirLike) {
        // Show lost match notification
        setMatchPopup({
          ...currentProfile,
          _isLostMatch: true
        } as any);
        
        // Mark their like notification as read (remove from secret admirers)
        await (supabase as any)
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('from_user_id', currentProfile.id)
          .eq('type', 'like');
        
        // Update unread likes count
        fetchUnreadLikesCount();
      }
    }
  };

  // Touch/Mouse handlers for swipe gestures
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const swipeThreshold = 100; // pixels
    
    if (Math.abs(dragOffset.x) > swipeThreshold) {
      // Swipe detected
      if (dragOffset.x > 0) {
        // Swiped right (like)
        handleSwipe('right');
      } else {
        // Swiped left (pass)
        handleSwipe('left');
      }
    }

    // Reset drag state
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  if (matchPopup) {
    // Check if this is a "lost match" notification
    const isLostMatch = (matchPopup as any)._isLostMatch;
    
    if (isLostMatch) {
      // Lost Match Popup (swiped left on someone who liked them)
      return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white overflow-hidden">
          {/* Sad Hearts Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute text-gray-500 opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${Math.random() * 20 + 15}px`,
                }}
              >
                💔
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-md w-full text-center">
            <div className="text-7xl mb-6 animate-bounce">💔</div>
            
            <h1 className="text-4xl font-black text-red-400 mb-4 drop-shadow-lg">
              Missed Connection!
            </h1>
            
            <p className="text-xl mb-6 text-gray-200">
              This was a <span className="font-bold text-yellow-400">secret admirer</span> who liked you first!
            </p>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-600">
              <p className="text-gray-300 mb-2">
                <span className="font-bold text-white">{matchPopup.nickname}</span> from {matchPopup.college}
              </p>
              <p className="text-sm text-gray-400">
                They won't know you passed on them
              </p>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 mb-8">
              <p className="text-yellow-200 text-sm flex items-center justify-center gap-2">
                <span>💡</span>
                <span>Keep swiping to find your perfect match!</span>
              </p>
            </div>
            
            <button 
              onClick={() => setMatchPopup(null)}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl"
            >
              Continue Swiping
            </button>
          </div>
        </div>
      );
    }
    
    // Regular Match Popup
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-rose-600 via-red-500 to-pink-600 flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Heart
              key={i}
              className="absolute text-white opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 30 + 20}px`,
                height: `${Math.random() * 30 + 20}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 4}s`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md w-full">
          <h1 className="text-5xl font-black text-white mb-8 text-center drop-shadow-lg animate-pulse">
            YUE MATCH!
          </h1>
          
          <div className="flex gap-6 items-center justify-center mb-8">
            {/* My Photo */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-300">
                {myProfile?.photo_urls?.[0] ? (
                  <img 
                    src={myProfile.photo_urls[0]} 
                    alt="You" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500 text-white text-3xl font-bold">
                    {myProfile?.nickname?.[0] || 'Y'}
                  </div>
                )}
              </div>
            </div>

            {/* Connection Icon */}
            <div className="flex gap-1">
              <Heart className="text-ue-red fill-ue-red w-12 h-12 animate-bounce" />
        
            </div>

            {/* Match Photo */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-300">
                {matchPopup.photo_urls?.[0] ? (
                  <img 
                    src={matchPopup.photo_urls[0]} 
                    alt={matchPopup.nickname || 'Match'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500 text-white text-3xl font-bold">
                    {matchPopup.nickname?.[0] || 'M'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xl mb-10 text-white drop-shadow-md font-medium">
            You and <span className="font-bold">{matchPopup.nickname}</span> liked each other!
          </p>
          
          <div className="flex flex-col w-full gap-4">
            <Link 
              href="/chat" 
              className="w-full bg-white text-rose-600 hover:bg-gray-100 py-4 rounded-full text-center font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              Send a Message
            </Link>
            <button 
              onClick={() => setMatchPopup(null)}
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white/30 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 text-white"
            >
              Keep Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-600 to-red-500 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <Users className="w-7 h-7 text-white" />
          <h1 className="text-xl font-black text-white drop-shadow-md">yUE Match</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/likes" className="relative p-2 hover:bg-white/20 rounded-full transition-colors group">
            <Bell className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            {unreadLikesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                {unreadLikesCount > 9 ? '9+' : unreadLikesCount}
              </span>
            )}
          </Link>
          <Link href="/chat" className="relative p-2 hover:bg-white/20 rounded-full transition-colors group">
            <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-600 to-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                {matchCount > 9 ? '9+' : matchCount}
              </span>
            )}
          </Link>
          <Link href="/profile" className="p-2 hover:bg-white/20 rounded-full transition-colors group">
            <User className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {currentProfile ? (
          <div className="relative h-full w-full max-w-lg mx-auto">
            {/* Card Container with Swipe Gestures */}
            <div 
              ref={cardRef}
              className="absolute inset-4 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
              style={{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                opacity: isDragging ? 0.9 : 1,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              
              {/* Swipe Indicators */}
              {isDragging && (
                <>
                  {/* HEART indicator */}
                  <div 
                    className="absolute top-12 left-8 z-30 pointer-events-none transition-opacity duration-200"
                    style={{ opacity: Math.max(0, Math.min(1, dragOffset.x / 100)) }}
                  >
                    <div className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-2xl shadow-xl border-4 border-white rotate-12 flex items-center gap-2">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                  {/* X indicator */}
                  <div 
                    className="absolute top-12 right-8 z-30 pointer-events-none transition-opacity duration-200"
                    style={{ opacity: Math.max(0, Math.min(1, -dragOffset.x / 100)) }}
                  >
                    <div className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold text-2xl shadow-xl border-4 border-white -rotate-12 flex items-center gap-2">
                      <X className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}
              
              {/* Photo Indicators */}
              {currentProfile.photo_urls && currentProfile.photo_urls.length > 1 && (
                <div className="absolute top-3 left-3 right-3 flex gap-2 z-20">
                  {currentProfile.photo_urls.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 flex-1 rounded-full transition-all ${
                        idx === photoIndex ? 'bg-white shadow-lg' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Photo Tap Areas */}
              <div className="absolute inset-0 z-10 flex">
                <button 
                  className="w-1/2 h-full focus:outline-none active:bg-black/5" 
                  onClick={() => setPhotoIndex(prev => Math.max(0, prev - 1))} 
                />
                <button 
                  className="w-1/2 h-full focus:outline-none active:bg-black/5" 
                  onClick={() => setPhotoIndex(prev => Math.min((currentProfile.photo_urls?.length || 1) - 1, prev + 1))} 
                />
              </div>

              {/* Photo */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                {currentProfile.photo_urls?.[photoIndex] ? (
                  <img 
                    src={currentProfile.photo_urls[photoIndex]} 
                    alt={currentProfile.nickname || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Heart className="w-20 h-20 mb-2 opacity-20" />
                    <p className="text-sm">No Photo</p>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Profile Info Card */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 text-white z-20 pointer-events-none">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold drop-shadow-lg mb-2">
                      {currentProfile.nickname}
                    </h2>
                    <p className="text-lg opacity-95 flex items-center gap-2">
                      <span className="font-medium">{currentProfile.college}</span>
                      {currentProfile.gender && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="text-base opacity-75">{currentProfile.gender}</span>
                        </>
                      )}
                      {currentProfile.year_level && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="text-base opacity-75">
                            {currentProfile.year_level === 1 ? '1st Year' :
                             currentProfile.year_level === 2 ? '2nd Year' :
                             currentProfile.year_level === 3 ? '3rd Year' :
                             currentProfile.year_level === 4 ? '4th Year' :
                             currentProfile.year_level === 5 ? '5th Year' :
                             currentProfile.year_level === 6 ? '6th Year' :
                             `${currentProfile.year_level}th Year`}
                          </span>
                        </>
                      )}
                    </p>
                    {currentProfile.looking_for && (
                      <p className="text-sm opacity-90 mt-2 flex items-center gap-2">
                        <span className="bg-gradient-to-r from-rose-600 to-red-500 px-3 py-1 rounded-full text-white font-medium shadow-md">
                          {currentProfile.looking_for === 'Study Buddy' ? '📚 Study Buddy' : 
                           currentProfile.looking_for === 'Romantic' ? '💕 Romantic' :
                           currentProfile.looking_for === 'Friendship' ? '🤝 Friendship' :
                           currentProfile.looking_for === 'Networking' ? '💼 Networking' :
                           '✨ Open to Everything'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {currentProfile.description && (
                  <div className="mb-3 pointer-events-auto">
                    <p className={`text-sm opacity-90 drop-shadow break-words whitespace-pre-wrap ${
                      isDescriptionExpanded ? '' : 'line-clamp-2'
                    }`}>
                      {currentProfile.description}
                    </p>
                    {currentProfile.description.length > 100 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                        className="text-xs text-white/90 font-semibold mt-1 hover:text-white transition-colors"
                      >
                        {isDescriptionExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.hobbies.slice(0, 4).map((hobby, idx) => (
                      <span 
                        key={idx} 
                        className="bg-white/25 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Report Button */}
              <div className="absolute top-4 right-4 z-30 pointer-events-auto group">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportClick();
                  }}
                  className="text-xs text-white/70 bg-black/20 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full hover:bg-black/30 transition-colors flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Report
                </button>
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                  Report inappropriate behavior or spam
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-30">
              <button 
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-500 hover:scale-110 active:scale-95 transition-transform border-2 border-gray-100"
              >
                <X size={32} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handleSwipe('right')}
                className="w-20 h-20 bg-gradient-to-r from-rose-600 to-red-500 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <Heart size={36} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="bg-white rounded-3xl p-12 shadow-xl max-w-sm">
              <Users className="w-20 h-20 mx-auto mb-6 text-rose-600 opacity-20" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No More Profiles</h2>
              <p className="text-gray-500">Check back later for new connections!</p>
            </div>
          </div>
        )}
      </main>

      {/* Modal for notifications */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
      >
        {modal.message}
      </Modal>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Report User</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Please tell us why you're reporting this user. Our team will review your report.
            </p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue (e.g., inappropriate content, harassment, spam)..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-ue-red focus:outline-none resize-none"
              maxLength={500}
            />

            <div className="text-xs text-gray-400 text-right">
              {reportReason.length}/500
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
