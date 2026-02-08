'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { ChevronLeft, Send, CheckCircle2, Heart, AlertTriangle, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { validateText } from '@/lib/profanityFilter';
import { sanitizeInput } from '@/lib/security';
import Modal from '@/components/Modal';
import { getMissionById, type Mission } from '@/lib/missions';

type Message = Database['public']['Tables']['messages']['Row'];

export default function ChatRoom() {
  const { id: matchId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [task, setTask] = useState<any | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionNumber, setMissionNumber] = useState(1);
  const [allMissionsCompleted, setAllMissionsCompleted] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePhotoIndex, setProfilePhotoIndex] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [partnerProfile, setPartnerProfile] = useState<{
    nickname: string | null;
    photo_urls: string[] | null;
    college: string | null;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
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

  // Check if user has seen the reminder before
  useEffect(() => {
    const hasSeenReminder = localStorage.getItem('ueHeartChatReminderSeen');
    if (!hasSeenReminder) {
      setShowReminderModal(true);
    }
  }, []);

  const handleReminderClose = () => {
    localStorage.setItem('ueHeartChatReminderSeen', 'true');
    setShowReminderModal(false);
  };

  useEffect(() => {
    if (!matchId) return;

    // 1. Get User and Partner ID
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        
        // Get partner ID from match
        const { data: matchData } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .eq('id', matchId)
          .single() as { data: { user1_id: string; user2_id: string } | null };
        
        if (matchData) {
          const partner = matchData.user1_id === data.user.id 
            ? matchData.user2_id 
            : matchData.user1_id;
          setPartnerId(partner);
          
          // Fetch partner's profile with approved snapshot
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nickname, photo_urls, college, status, approved_nickname, approved_photo_urls, approved_college')
            .eq('id', partner)
            .single() as { data: { 
              nickname: string | null; 
              photo_urls: string[] | null; 
              college: string | null; 
              status: string | null;
              approved_nickname: string | null;
              approved_photo_urls: string[] | null;
              approved_college: string | null;
            } | null };
          
          if (profileData) {
            // If profile is pending, show the approved snapshot (what was last approved)
            if (profileData.status === 'pending' && profileData.approved_nickname) {
              setPartnerProfile({
                nickname: profileData.approved_nickname,
                photo_urls: profileData.approved_photo_urls,
                college: profileData.approved_college
              });
            } else if (profileData.status === 'approved') {
              // Show current data if approved
              setPartnerProfile({
                nickname: profileData.nickname,
                photo_urls: profileData.photo_urls,
                college: profileData.college
              });
            } else {
              // Rejected or no approved snapshot - show placeholder
              setPartnerProfile({
                nickname: 'UE Student',
                photo_urls: null,
                college: 'UE Student'
              });
            }
          }
        }
      }
    });

    // 2. Load Messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    // 3. Load Mission from Match (optional - chat works without missions)
    const setupMission = async () => {
        try {
            // Fetch mission from matches table
            const { data: matchData, error: fetchError } = await (supabase as any)
                .from('matches')
                .select('mission_1_id, mission_2_id, mission_3_id, mission_number, mission_completed')
                .eq('id', matchId)
                .single();
            
            if (fetchError) {
                // Mission columns might not exist yet - that's okay, chat still works
                console.log('Mission system not enabled yet (run add_mission_system.sql):', fetchError.message);
                return;
            }
            
            if (matchData) {
                const currentMissionNum = matchData.mission_number || 1;
                setMissionNumber(currentMissionNum);
                setAllMissionsCompleted(matchData.mission_completed || false);
                
                // Get the current mission ID based on mission_number
                let currentMissionId;
                if (currentMissionNum === 1) {
                    currentMissionId = matchData.mission_1_id;
                } else if (currentMissionNum === 2) {
                    currentMissionId = matchData.mission_2_id;
                } else if (currentMissionNum === 3) {
                    currentMissionId = matchData.mission_3_id;
                }
                
                if (currentMissionId) {
                    const missionDetails = getMissionById(currentMissionId);
                    if (missionDetails) {
                        console.log(`Loaded mission ${currentMissionNum}/3:`, missionDetails);
                        setMission(missionDetails);
                    }
                }
            } else {
                console.log('No mission assigned to this match yet');
            }
        } catch (error) {
            // Catch any unexpected errors - chat should still work
            console.error('Error in setupMission:', error);
        }
    };

    fetchMessages();
    setupMission();

    // 4. Subscribe to real-time updates
    const channel = supabase
      .channel(`match:${matchId}`)
      // Subscribe to new messages
      .on('postgres_changes', { 
         event: 'INSERT', 
         schema: 'public', 
         table: 'messages',
         filter: `match_id=eq.${matchId}`
      }, (payload) => {
         console.log('Real-time message received:', payload);
         const newMsg = payload.new as Message;
         // Add message to UI
         setMessages(current => {
           // Check if message already exists (prevent duplicates)
           const exists = current.some(m => m.id === newMsg.id);
           if (exists) return current;
           return [...current, newMsg];
         });
      })
      // Subscribe to mission updates (when partner completes the mission)
      .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'matches',
         filter: `id=eq.${matchId}`
      }, (payload) => {
         console.log('Real-time mission update:', payload);
         const updatedMatch = payload.new as any;
         
         // Update mission number and completion status
         if (updatedMatch.mission_number !== undefined) {
           const newMissionNum = updatedMatch.mission_number;
           setMissionNumber(newMissionNum);
           
           // Load the new mission
           let newMissionId;
           if (newMissionNum === 1) {
             newMissionId = updatedMatch.mission_1_id;
           } else if (newMissionNum === 2) {
             newMissionId = updatedMatch.mission_2_id;
           } else if (newMissionNum === 3) {
             newMissionId = updatedMatch.mission_3_id;
           }
           
           if (newMissionId) {
             const missionDetails = getMissionById(newMissionId);
             if (missionDetails) {
               setMission(missionDetails);
             }
           }
         }
         
         if (updatedMatch.mission_completed !== undefined) {
           setAllMissionsCompleted(updatedMatch.mission_completed);
         }
      })
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status);
        if (err) console.error('Realtime subscription error:', err);
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error, attempting to reconnect...');
          setTimeout(() => {
            supabase.removeChannel(channel);
            // Will reconnect on next render due to useEffect
          }, 1000);
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };

  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();

    // Validate for harmful words
    const profanityError = validateText(messageContent, 'Message');
    if (profanityError) {
      showModal('error', 'Inappropriate Content', profanityError);
      return;
    }

    // Server-side rate limiting check
    try {
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limiterType: 'message',
          identifier: currentUserId 
        })
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        showModal('error', 'Slow Down', 
          `Too many messages. Wait ${rateLimitData.retryAfter} seconds.`);
        return;
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Continue anyway if rate limit check fails
    }

    // Client-side rate limiting: 10 messages per minute (backup)
    const rateLimitKey = `message_spam_${currentUserId}_${matchId}`;
    const attemptData = localStorage.getItem(rateLimitKey);
    
    if (attemptData) {
      const { attempts, firstAttemptTime } = JSON.parse(attemptData);
      const now = Date.now();
      const timeElapsed = now - firstAttemptTime;
      const oneMinute = 60 * 1000;

      // If within 1 minute window
      if (timeElapsed < oneMinute) {
        if (attempts >= 10) {
          const remainingTime = Math.ceil((oneMinute - timeElapsed) / 1000);
          showModal('warning', 'Slow Down', `Slow down! You can send more messages in ${remainingTime} second(s).`);
          return;
        }
        // Increment attempts
        localStorage.setItem(rateLimitKey, JSON.stringify({
          attempts: attempts + 1,
          firstAttemptTime
        }));
      } else {
        // Reset counter after 1 minute
        localStorage.setItem(rateLimitKey, JSON.stringify({
          attempts: 1,
          firstAttemptTime: now
        }));
      }
    } else {
      // First message in this session
      localStorage.setItem(rateLimitKey, JSON.stringify({
        attempts: 1,
        firstAttemptTime: Date.now()
      }));
    }

    setNewMessage(''); // Clear input immediately

    // Sanitize message content
    const sanitizedMessage = sanitizeInput(messageContent);

    console.log('Original message:', messageContent);
    console.log('Sanitized message:', sanitizedMessage);

    // Send to database (real-time subscription will add it to UI)
    const { error } = await (supabase as any).from('messages').insert({
      match_id: matchId as string,
      sender_id: currentUserId,
      content: sanitizedMessage
    });

    if (error) {
      console.error('Error sending message:', error);
      showModal('error', 'Message Failed', 'Failed to send message. Please try again.');
    }
    // No need to manually add to messages - real-time subscription handles it
  };
  const submitReport = async () => {
    if (!reportReason.trim()) {
      showModal('warning', 'Select Reason', 'Please select a reason for reporting');
      return;
    }

    try {
      // Check rate limit
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limiterType: 'report',
          identifier: currentUserId 
        })
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        const resetDate = new Date(rateLimitData.reset);
        showModal('error', 'Too Many Reports', 
          `You can only submit 5 reports per day. Try again at ${resetDate.toLocaleString()}.`);
        return;
      }

      const { error } = await (supabase as any).from('reports').insert({
        reporter_id: currentUserId,
        reported_id: partnerId,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

      if (error) {
        console.error('Error submitting report:', error);
        showModal('error', 'Report Failed', 'Failed to submit report. Please try again.');
      } else {
        showModal('success', 'Report Submitted', 'Report submitted successfully. Our team will review it.');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      }
    } catch (error) {
      console.error('Error in submitReport:', error);
      showModal('error', 'Report Failed', 'Failed to submit report. Please try again.');
    }
  };
  const completeTask = async () => {
    if (!mission || allMissionsCompleted) return;
    
    // Check if this is the last mission
    if (missionNumber === 3) {
      // Last mission - mark all missions as completed
      const { data, error } = await (supabase as any)
        .from('matches')
        .update({
          mission_completed: true,
          mission_completed_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();
      
      if (data) {
        setAllMissionsCompleted(true);
        console.log('All missions completed!');
      } else if (error) {
        console.error('Error completing final mission:', error);
      }
    } else {
      // Not the last mission - advance to next mission
      const nextMissionNumber = missionNumber + 1;
      
      const { data, error } = await (supabase as any)
        .from('matches')
        .update({
          mission_number: nextMissionNumber
        })
        .eq('id', matchId)
        .select('mission_1_id, mission_2_id, mission_3_id')
        .single();
      
      if (data) {
        setMissionNumber(nextMissionNumber);
        
        // Load next mission
        const nextMissionId = nextMissionNumber === 2 ? data.mission_2_id : data.mission_3_id;
        if (nextMissionId) {
          const nextMission = getMissionById(nextMissionId);
          if (nextMission) {
            setMission(nextMission);
            console.log(`Advanced to mission ${nextMissionNumber}/3:`, nextMission);
          }
        }
      } else if (error) {
        console.error('Error advancing to next mission:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 overflow-hidden" data-scroll-lock="true">
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-600 to-red-500 p-4 shadow-lg flex items-center gap-3 flex-shrink-0 z-20">
        <Link href="/chat" className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft className="text-white" />
        </Link>
        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-3 flex-1 hover:bg-white/20 rounded-xl p-2 transition-colors"
        >
          {partnerProfile?.photo_urls && partnerProfile.photo_urls[0] ? (
            <img
              src={partnerProfile.photo_urls[0]}
              alt={partnerProfile.nickname || 'Partner'}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            </div>
          )}
          <div className="text-left">
            <h1 className="font-bold text-lg text-white drop-shadow">
              {partnerProfile?.nickname || 'Loading...'}
            </h1>
            <p className="text-xs text-white/90">
              {partnerProfile?.college || 'UE Student'}
            </p>
          </div>
        </button>
        <div className="relative group">
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 hover:bg-red-50 rounded-full transition-colors group relative"
            title="Report user"
          >
            <AlertTriangle className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
          </button>
          {/* Tooltip */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
            Report inappropriate behavior or spam
          </div>
        </div>
      </header>

      {/* Match Mission Banner */}
      {mission && !allMissionsCompleted && (
         <div className="p-5 border-b-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top flex-shrink-0 z-10 shadow-lg bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 border-rose-200">
             <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-2xl animate-pulse">{mission.emoji}</span>
                   <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-600 uppercase tracking-wide">
                     Mission {missionNumber}/3
                   </p>
                   
                 </div>
                 <p className="text-base font-semibold text-gray-900">
                    {mission.description}
                 </p>
                 
                 <p className="text-xs text-gray-600 mt-1">Complete together to strengthen your bond! 💪</p>
             </div>
             <button 
                onClick={completeTask}
                className="px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-md whitespace-nowrap bg-gradient-to-r from-rose-600 to-red-500 text-white hover:shadow-xl hover:shadow-rose-200"
             >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {missionNumber === 3 ? 'Complete All' : 'Mark Done'}
                </span>
             </button>
         </div>
      )}
      
      {/* All Missions Completed Banner */}
      {allMissionsCompleted && (
         <div className="p-5 border-b-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top flex-shrink-0 z-10 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
             <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-2xl">🎉</span>
                   <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 uppercase tracking-wide">
                     All Missions Complete!
                   </p>
                 </div>
                 <p className="text-base font-semibold text-gray-900">
                    You've completed all 3 missions together!
                 </p>
                 <p className="text-xs text-green-700 mt-1 font-medium">🌟 Great teamwork! Keep the connection going!</p>
             </div>
             <div className="px-6 py-3 rounded-full font-bold text-sm bg-green-500 text-white shadow-green-200 flex items-center gap-2">
               <CheckCircle2 size={18} />
               3/3 Done!
             </div>
         </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-in fade-in duration-500">
              <div className="text-6xl mb-4 animate-bounce">💬</div>
              <p className="text-gray-400 font-medium">No messages yet</p>
              <p className="text-sm text-gray-300 mt-1">Say hi to break the ice!</p>
            </div>
          )}
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div 
                key={msg.id} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-br-md' 
                    : 'bg-white border-2 border-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3 flex-shrink-0 z-10">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:border-rose-600 focus:bg-white focus:shadow-md focus:scale-[1.02] transition-all duration-200"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 flex items-center justify-center group"
        >
          <Send size={20} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </form>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat Safely!</h2>
              <p className="text-gray-600 text-sm">Please read these important reminders before chatting</p>
            </div>

            <div className="space-y-4 mb-6 text-sm text-gray-700">
              <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
                <span className="text-xl">🚫</span>
                <div>
                  <p className="font-semibold text-red-800 mb-1">Don't Share Sensitive Info</p>
                  <p className="text-red-700 text-xs">Never share passwords, bank details, or personal addresses</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                <span className="text-xl">🤝</span>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Be Respectful</p>
                  <p className="text-blue-700 text-xs">Treat others with kindness and respect at all times</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-semibold text-green-800 mb-1">Meet Safely</p>
                  <p className="text-green-700 text-xs">Always meet in public places and tell a friend</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
                <span className="text-xl">🚩</span>
                <div>
                  <p className="font-semibold text-purple-800 mb-1">Report Concerns</p>
                  <p className="text-purple-700 text-xs">Use the flag button above to report inappropriate behavior</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReminderClose}
              className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-4 rounded-full hover:shadow-xl transition-all active:scale-95"
            >
              I Understand, Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Report User</h2>
                  <p className="text-xs text-gray-500">Help us keep yUE Match! safe</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors"
                >
                  <option value="">Select a reason...</option>
                  <option value="Harassment or bullying">Harassment or bullying</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Spam or scam">Spam or scam</option>
                  <option value="Fake profile">Fake profile</option>
                  <option value="Threatening behavior">Threatening behavior</option>
                  <option value="Offline behavior">Offline behavior concern</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Additional Details (Optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors h-24 resize-none"
                />
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Reports are reviewed by our admin team within 24-48 hours. False reports may result in account suspension.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-full hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileModal && partnerProfile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <div className="sticky top-0 z-10 flex justify-end p-4 bg-gradient-to-b from-black/50 to-transparent">
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Photos */}
            <div className="relative -mt-16">
              {partnerProfile.photo_urls && partnerProfile.photo_urls.length > 0 ? (
                <>
                  <img
                    src={partnerProfile.photo_urls[profilePhotoIndex]}
                    alt={partnerProfile.nickname || 'Profile'}
                    className="w-full h-[500px] object-cover"
                  />
                  
                  {/* Photo Indicators */}
                  {partnerProfile.photo_urls.length > 1 && (
                    <div className="absolute top-4 left-4 right-4 flex gap-2">
                      {partnerProfile.photo_urls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setProfilePhotoIndex(idx)}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            idx === profilePhotoIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {partnerProfile.photo_urls.length > 1 && (
                    <>
                      <button
                        onClick={() => setProfilePhotoIndex((prev) => (prev > 0 ? prev - 1 : partnerProfile.photo_urls!.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setProfilePhotoIndex((prev) => (prev < partnerProfile.photo_urls!.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 rotate-180" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-[500px] bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center">
                  <Heart className="w-32 h-32 text-white/20 fill-white/20" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-3xl font-black text-gray-800 mb-1">
                  {partnerProfile.nickname}
                </h2>
                <p className="text-lg text-gray-600">
                  {partnerProfile.college}
                </p>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-4 rounded-full hover:shadow-lg transition-all active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

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
