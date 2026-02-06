'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { ChevronLeft, Heart } from 'lucide-react';
import Link from 'next/link';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Match = Database['public']['Tables']['matches']['Row'] & {
  partner: Profile
};

export default function ChatList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentUserId: string;

    const fetchMatches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      currentUserId = user.id;

      // Fetch matches where I am user1 or user2
      const { data: matchData, error } = await (supabase as any)
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchData) {
        // Hydrate with partner details
        const enrichedMatches = await Promise.all(matchData.map(async (m: any) => {
          const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id;
          const { data: partner } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();
          
          return { ...m, partner: partner! };
        }));
        setMatches(enrichedMatches);
      }
      setLoading(false);
    };

    fetchMatches();

    // Subscribe to new matches in real-time
    const channel = supabase
      .channel('matches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, async (payload) => {
        const newMatch = payload.new as Database['public']['Tables']['matches']['Row'];
        
        // Check if this match involves current user
        if (newMatch.user1_id === currentUserId || newMatch.user2_id === currentUserId) {
          // Fetch partner details
          const partnerId = newMatch.user1_id === currentUserId ? newMatch.user2_id : newMatch.user1_id;
          const { data: partner } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();
          
          if (partner) {
            setMatches(current => [...current, { ...newMatch, partner }]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50">
      <header className="p-6 bg-gradient-to-r from-rose-600 to-red-500 shadow-lg flex items-center sticky top-0 z-10">
        <Link href="/home" className="mr-4 p-2 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft className="text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white drop-shadow-md">Messages 💕</h1>
          <p className="text-sm text-white/90">Your matches and conversations</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-rose-600 opacity-20" />
                  <p className="text-gray-500 font-medium">No matches yet</p>
                  <p className="text-sm text-gray-400 mt-1">Keep swiping to find your match!</p>
                </div>
              )}
              
              {matches.map(match => (
              <Link 
                href={`/chat/${match.id}`} 
                key={match.id} 
                className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 hover:shadow-md active:scale-98"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white shadow-md">
                  {match.partner?.photo_urls?.[0] ? (
                    <img src={match.partner.photo_urls[0]} alt={match.partner.nickname || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {match.partner?.nickname?.[0] || 'M'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{match.partner?.nickname}</h3>
                  <p className="text-sm text-gray-500">Tap to start chatting 💬</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
