'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Heart, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    checkProfileAndFetch();
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

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(matchChannel);
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

    if (myProfileData.status === 'rejected') {
      router.push('/profile-setup?rejected=true');
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
    
    // Only apply gender filters if user has a specific preference (not "Everyone")
    if (myProfileData.preferred_gender !== 'Everyone') {
      // Filter by preferred gender: show only profiles matching my preference
      query = query.eq('gender', myProfileData.preferred_gender);
      
      // Filter by mutual interest: show only profiles that prefer my gender OR prefer Everyone
      if (myProfileData.gender) {
        query = query.or(`preferred_gender.eq.Everyone,preferred_gender.eq.${myProfileData.gender}`);
      }
    }
    // If user prefers "Everyone", show all genders without restriction

    query = query.limit(10);

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

    // Optimistically update swiped IDs
    setSwipedIds(prev => [...prev, currentProfile.id]);

    // Optimistically move to next profile
    const nextProfiles = profiles.slice(1);
    setProfiles(nextProfiles);
    setCurrentProfile(nextProfiles.length > 0 ? nextProfiles[0] : null);
    setPhotoIndex(0);

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
        // It's a match!
        await (supabase as any).from('matches').insert({
          user1_id: user.id,
          user2_id: currentProfile.id
        });
        
        setMatchPopup(currentProfile);
        // Match count will update via real-time subscription
      }
    } else {
      await swipePromise;
    }
  };

  if (matchPopup) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-ue-red/20 via-pink-500/20 to-purple-500/20 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        {/* Animated Hearts Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Heart
              key={i}
              className="absolute text-ue-red fill-ue-red opacity-30 animate-float"
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
          <h1 className="text-5xl font-black text-ue-red mb-8 text-center drop-shadow-lg animate-pulse">
            IT'S A MATCH!
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

            {/* Heart Icon */}
            <Heart className="text-ue-red fill-ue-red w-12 h-12 animate-bounce" />

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
            You and <span className="font-bold text-ue-red">{matchPopup.nickname}</span> liked each other!
          </p>
          
          <div className="flex flex-col w-full gap-4">
            <Link 
              href="/chat" 
              className="w-full bg-ue-red hover:bg-red-700 py-4 rounded-full text-center font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              Send a Message
            </Link>
            <button 
              onClick={() => setMatchPopup(null)}
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white/30 py-4 rounded-full font-bold text-lg transition-all hover:scale-105"
            >
              Keep Swiping
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ue-red border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-pink-100 via-rose-50 to-red-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-500 to-red-500 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <Heart className="w-7 h-7 text-white fill-white" />
          <h1 className="text-xl font-black text-white drop-shadow-md">yUE Match!</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/chat" className="relative p-2 hover:bg-white/20 rounded-full transition-colors group">
            <Heart className="w-6 h-6 text-white fill-white group-hover:scale-110 transition-transform" />
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-ue-red to-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                {matchCount > 9 ? '9+' : matchCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {currentProfile ? (
          <div className="relative h-full w-full max-w-lg mx-auto">
            {/* Card Container */}
            <div className="absolute inset-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
              
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
                    <h2 className="text-3xl font-bold drop-shadow-lg">
                      {currentProfile.nickname}
                      <span className="text-2xl font-normal ml-2">{currentProfile.year_level}</span>
                    </h2>
                    <p className="text-lg opacity-95 mt-1 flex items-center gap-2">
                      <span className="font-medium">{currentProfile.college}</span>
                      {currentProfile.gender && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="text-base opacity-75">{currentProfile.gender}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {currentProfile.description && (
                  <p className="text-sm opacity-90 mb-3 line-clamp-2 drop-shadow">
                    {currentProfile.description}
                  </p>
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const reason = prompt("Why are you reporting this user?");
                  if (reason) {
                    (supabase as any).from('reports').insert({
                      reporter_id: (supabase.auth.getUser() as any).id, 
                      reported_id: currentProfile.id,
                      reason: reason
                    }).then(() => alert("Report submitted"));
                  }
                }}
                className="absolute top-4 right-4 z-30 pointer-events-auto text-xs text-white/70 bg-black/20 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full hover:bg-black/30 transition-colors"
              >
                Report
              </button>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-30">
              <button 
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-transform border-2 border-gray-100"
              >
                <X size={32} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handleSwipe('right')}
                className="w-20 h-20 bg-ue-red rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <Heart size={36} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="bg-white rounded-3xl p-12 shadow-xl max-w-sm">
              <Heart className="w-20 h-20 mx-auto mb-6 text-ue-red opacity-20" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No More Profiles</h2>
              <p className="text-gray-500">Check back later for new matches!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
