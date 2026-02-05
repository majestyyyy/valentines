'use client';

import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { logAdminAction, logUserBan, getAuditLogs } from '@/lib/auditLog';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'logs'>('pending');
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<(Report & { reporter: Profile, reported: Profile })[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedReport, setSelectedReport] = useState<(Report & { reporter: Profile, reported: Profile }) | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalMatches: 0,
    openReports: 0
  });

  useEffect(() => {
    checkAdmin();
    fetchPendingUsers();
    fetchReports();
    fetchStats();

    // Subscribe to real-time updates for pending profiles
    const profilesChannel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles',
        filter: 'status=eq.pending'
      }, (payload) => {
        setPendingUsers(current => [...current, payload.new as Profile]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const updated = payload.new as Profile;
        if (updated.status !== 'pending') {
          setPendingUsers(current => current.filter(u => u.id !== updated.id));
        }
      })
      .subscribe();

    // Subscribe to real-time updates for reports
    const reportsChannel = supabase
      .channel('admin-reports')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports'
      }, async (payload) => {
        const newReport = payload.new as Report;
        const { data: reporter } = await (supabase as any).from('profiles').select('*').eq('id', newReport.reporter_id).single();
        const { data: reported } = await (supabase as any).from('profiles').select('*').eq('id', newReport.reported_id).single();
        
        if (reporter && reported) {
          setReports(current => [...current, { ...newReport, reporter, reported }]);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'reports'
      }, (payload) => {
        setReports(current => current.filter(r => r.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, []);
  const fetchStats = async () => {
    const { data: users } = await (supabaseAdmin as any).from('profiles').select('status', { count: 'exact' });
    const { data: matches, count: matchCount } = await (supabaseAdmin as any).from('matches').select('*', { count: 'exact', head: true });
    
    const pending = users?.filter((u: any) => u.status === 'pending').length || 0;
    const approved = users?.filter((u: any) => u.status === 'approved').length || 0;
    
    setStats({
      totalUsers: approved,
      pendingApprovals: pending,
      totalMatches: matchCount || 0,
      openReports: reports.length
    });
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin/login');
      return;
    }
    
    // Use supabaseAdmin to bypass RLS and get profile
    const { data: profile } = await (supabaseAdmin as any)
       .from('profiles')
       .select('role, email')
       .eq('id', user.id)
       .single() as { data: { role: string; email: string } | null };
    
    setUserEmail(profile?.email || 'Admin User');
    
    if (profile?.role === 'admin') {
      setIsAdmin(true);
    } else {
      router.push('/admin/login');
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      router.push('/admin/login');
    }
  };

  const fetchPendingUsers = async () => {
    const { data } = await (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .eq('status', 'pending');
    
    if (data) setPendingUsers(data);
    setLoading(false);
  };

  const fetchReports = async () => {
    const { data: reportData } = await (supabaseAdmin as any).from('reports').select('*');
    
    if (reportData && reportData.length > 0) {
        const enriched = await Promise.all(reportData.map(async (r: any) => {
            const { data: reporter } = await (supabaseAdmin as any).from('profiles').select('*').eq('id', r.reporter_id).single();
            const { data: reported } = await (supabaseAdmin as any).from('profiles').select('*').eq('id', r.reported_id).single();
            return {
                ...r,
                reporter: reporter!,
                reported: reported!
            };
        }));
        setReports(enriched);
    }
  };

  const handleValidation = async (userId: string, status: 'approved' | 'rejected') => {
    // Optimistic update
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1, totalUsers: status === 'approved' ? prev.totalUsers + 1 : prev.totalUsers }));
    
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Update profile status
      await (supabaseAdmin as any).from('profiles').update({ status }).eq('id', userId);

      // Log the admin action
      if (adminId) {
        await logAdminAction(status, adminId, userId, {
          action: status === 'approved' ? 'Profile approved' : 'Profile rejected',
          admin_email: user?.email
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Revert on error
      fetchPendingUsers();
      fetchStats();
    }
  };

  const handleBan = async (userId: string, reportId: string) => {
    if(!confirm("Ban this user?")) return;
    
    // Optimistic update
    setReports(prev => prev.filter(r => r.id !== reportId));
    setStats(prev => ({ ...prev, openReports: prev.openReports - 1 }));
    
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Get all matches for this user
      const { data: matches } = await (supabaseAdmin as any)
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      // Delete all matches involving this user
      if (matches && matches.length > 0) {
        await (supabaseAdmin as any)
          .from('matches')
          .delete()
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      }

      // Ban the user
      await (supabaseAdmin as any).from('profiles').update({ status: 'rejected' }).eq('id', userId);
      await (supabaseAdmin as any).from('reports').delete().eq('id', reportId);

      // Log the ban action
      if (adminId) {
        await logUserBan(adminId, userId, 'User banned from report', reportId);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      // Revert on error
      fetchReports();
      fetchStats();
    }
  };

  const loadChatMessages = async (reporterId: string, reportedId: string) => {
    setLoadingMessages(true);
    try {
      // First, find the match between these two users
      const { data: match } = await (supabaseAdmin as any)
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${reporterId},user2_id.eq.${reportedId}),and(user1_id.eq.${reportedId},user2_id.eq.${reporterId})`)
        .single();

      if (!match) {
        console.log('No match found between users');
        setChatMessages([]);
        setLoadingMessages(false);
        return;
      }

      // Get all messages for this match
      const { data: messages, error } = await (supabaseAdmin as any)
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
      }

      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-ue-red border-t-transparent"></div>
    </div>
  );
  
  if (!isAdmin) return null; // Will redirect in useEffect

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-ue-red to-red-700 shadow-lg p-4 md:p-6 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 flex items-center gap-3">
              <span className="text-3xl md:text-4xl">🛡️</span>
              Admin Dashboard
            </h1>
            <p className="text-white/80 text-sm">Manage users and reports</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 md:px-4 py-2 md:py-3 border border-white/20 flex-1 md:flex-initial">
              <div className="flex items-center gap-2 text-xs md:text-sm text-white">
                <User className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-medium truncate">{userEmail}</span>
              </div>
              <div className="text-xs text-green-300 font-bold mt-0.5">● Admin Access</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg border border-white/30 text-sm md:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="text-4xl">👥</div>
              <div className="text-4xl font-black">{stats.totalUsers}</div>
            </div>
            <div className="text-sm font-semibold opacity-90">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="text-4xl">⏳</div>
              <div className="text-4xl font-black">{stats.pendingApprovals}</div>
            </div>
            <div className="text-sm font-semibold opacity-90">Pending Approvals</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="text-4xl">💕</div>
              <div className="text-4xl font-black">{stats.totalMatches}</div>
            </div>
            <div className="text-sm font-semibold opacity-90">Total Matches</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="text-4xl">⚠️</div>
              <div className="text-4xl font-black">{stats.openReports}</div>
            </div>
            <div className="text-sm font-semibold opacity-90">Open Reports</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-3 mb-8 bg-white rounded-3xl p-2 shadow-lg border-2 border-gray-100">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all duration-300 ${activeTab === 'pending' ? 'bg-gradient-to-r from-ue-red to-red-600 text-white shadow-xl scale-105' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📋</span>
              <span>Pending Approvals</span>
              {stats.pendingApprovals > 0 && (
                <span className="ml-2 bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.pendingApprovals}
                </span>
              )}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all duration-300 ${activeTab === 'reports' ? 'bg-gradient-to-r from-ue-red to-red-600 text-white shadow-xl scale-105' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span>Reports</span>
              {stats.openReports > 0 && (
                <span className="ml-2 bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.openReports}
                </span>
              )}
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('logs');
              fetchAuditLogs();
            }}
            className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all duration-300 ${activeTab === 'logs' ? 'bg-gradient-to-r from-ue-red to-red-600 text-white shadow-xl scale-105' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📋</span>
              <span>Audit Logs</span>
            </div>
          </button>
        </div>
      
      {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingUsers.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-gray-500 font-medium">No pending profiles</p>
                <p className="text-sm text-gray-400 mt-1">All caught up!</p>
              </div>
            )}
            
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:border-ue-red/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex gap-4 mb-4">
                  <div 
                    className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden flex-shrink-0 shadow-md cursor-pointer hover:ring-4 hover:ring-ue-red/30 transition-all"
                    onClick={() => setSelectedProfile(user)}
                  >
                    {user.photo_urls?.[0] ? (
                      <img src={user.photo_urls[0]} className="w-full h-full object-cover" alt={user.nickname || 'User'} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {user.nickname?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-800">{user.nickname}</h3>
                    <p className="text-sm text-gray-600 mt-1">{user.college} - Year {user.year_level}</p>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-semibold">Gender:</span> {user.gender} • 
                      <span className="font-semibold ml-2">Prefers:</span> {user.preferred_gender}
                    </p>
                  </div>
                </div>
                
                {user.hobbies && user.hobbies.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Hobbies</p>
                    <div className="flex flex-wrap gap-2">
                      {user.hobbies.map((hobby, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.description && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bio</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">{user.description}</p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedProfile(user)}
                  className="w-full mb-4 py-3 border-2 border-ue-red text-ue-red rounded-2xl font-bold hover:bg-ue-red hover:text-white transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg"
                >
                  <span className="text-lg">👁️</span> View Full Profile
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleValidation(user.id, 'rejected')}
                    className="py-4 border-2 border-red-500 text-red-600 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-95 shadow-md hover:shadow-xl"
                  >
                    <span className="text-lg">❌</span> Reject
                  </button>
                  <button 
                    onClick={() => handleValidation(user.id, 'approved')}
                    className="py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
                  >
                    <span className="text-lg">✅</span> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}

      {activeTab === 'reports' && (
          <div className="space-y-6">
            {reports.length === 0 && (
              <div className="bg-white rounded-3xl p-16 text-center shadow-lg">
                <div className="text-7xl mb-4">😊</div>
                <p className="text-gray-700 font-bold text-xl mb-2">No reports filed</p>
                <p className="text-sm text-gray-500">Community is doing great!</p>
              </div>
            )}

            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-red-200 hover:shadow-2xl hover:border-red-400 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-red-600 text-xl mb-1">{report.reason}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span>📅</span> {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 space-y-3 mb-5 border border-gray-200 shadow-inner">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-600">Reporter:</span>
                    <span className="text-gray-800">{report.reporter?.nickname}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-600">Reported User:</span>
                    <span className="text-gray-800 font-bold">{report.reported?.nickname}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button 
                    onClick={() => setSelectedProfile(report.reported)}
                    className="py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">👤</span> View Profile
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedReport(report);
                      loadChatMessages(report.reporter_id, report.reported_id);
                    }}
                    className="py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-bold hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">💬</span> View Chat
                  </button>
                </div>
                
                <button 
                  onClick={() => handleBan(report.reported_id, report.id)}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold hover:from-red-700 hover:to-red-800 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🚫</span> Ban User
                </button>
              </div>
            ))}
          </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          {loadingLogs ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-ue-red border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-700 font-bold text-lg">No audit logs yet</p>
              <p className="text-sm text-gray-500 mt-1">Admin actions will be tracked here</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h3 className="font-bold text-lg">Security Audit Trail</h3>
                    <p className="text-sm opacity-90">Last {auditLogs.length} events</p>
                  </div>
                </div>
              </div>

              {auditLogs.map((log: any) => (
                <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      log.event_type.includes('ban') ? 'bg-red-100' :
                      log.event_type.includes('approved') ? 'bg-green-100' :
                      log.event_type.includes('rejected') ? 'bg-orange-100' :
                      log.event_type.includes('report') ? 'bg-yellow-100' :
                      log.event_type.includes('rate_limit') ? 'bg-purple-100' :
                      'bg-blue-100'
                    }`}>
                      <span className="text-2xl">
                        {log.event_type.includes('ban') ? '🚫' :
                         log.event_type.includes('approved') ? '✅' :
                         log.event_type.includes('rejected') ? '❌' :
                         log.event_type.includes('report') ? '⚠️' :
                         log.event_type.includes('rate_limit') ? '⏱️' :
                         '📝'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800 capitalize">
                            {log.event_type.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        {log.user && (
                          <p className="text-gray-600">
                            <span className="font-semibold">Admin:</span> {log.user.nickname || log.user.email}
                          </p>
                        )}
                        {log.target && (
                          <p className="text-gray-600">
                            <span className="font-semibold">Target:</span> {log.target.nickname || log.target.email}
                          </p>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold text-xs">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto border border-gray-200">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                        {log.ip_address && (
                          <p className="text-gray-500 text-xs">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedProfile(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-ue-red to-red-700 p-6 text-white rounded-t-3xl shadow-lg z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👤</span>
                  <h2 className="text-2xl font-black">Profile Review</h2>
                </div>
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                >
                  <span className="text-3xl font-bold">×</span>
                </button>
              </div>
              <p className="text-white/80 text-sm">Review user information and photos</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Photos */}
              {selectedProfile.photo_urls && selectedProfile.photo_urls.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                    <span>📸</span> Profile Photos
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProfile.photo_urls.map((url, idx) => (
                      <div key={idx} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt={`Photo ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 space-y-4 shadow-inner border border-gray-200">
                <h3 className="font-black text-lg text-gray-800 mb-3 flex items-center gap-2">
                  <span>ℹ️</span> Basic Information
                </h3>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Nickname</span>
                  <span className="text-sm text-gray-800 font-semibold">{selectedProfile.nickname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Email</span>
                  <span className="text-sm text-gray-800">{selectedProfile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">College</span>
                  <span className="text-sm text-gray-800 font-semibold">{selectedProfile.college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Year Level</span>
                  <span className="text-sm text-gray-800">{selectedProfile.year_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Gender</span>
                  <span className="text-sm text-gray-800">{selectedProfile.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Looking For</span>
                  <span className="text-sm text-gray-800">{selectedProfile.preferred_gender}</span>
                </div>
              </div>

              {/* Hobbies */}
              {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3">Hobbies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.hobbies.map((hobby, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedProfile.description && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3">Bio</p>
                  <p className="text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                    {selectedProfile.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    handleValidation(selectedProfile.id, 'rejected');
                    setSelectedProfile(null);
                  }}
                  className="py-4 border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95"
                >
                  ❌ Reject Profile
                </button>
                <button 
                  onClick={() => {
                    handleValidation(selectedProfile.id, 'approved');
                    setSelectedProfile(null);
                  }}
                  className="py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg transition-all active:scale-95"
                >
                  ✅ Approve Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => { setSelectedReport(null); setChatMessages([]); }}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white rounded-t-3xl shadow-lg z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💬</span>
                  <div>
                    <h2 className="text-2xl font-black">Chat History</h2>
                    <p className="text-sm text-white/80 mt-1">
                      {selectedReport.reporter?.nickname} ↔️ {selectedReport.reported?.nickname}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedReport(null); setChatMessages([]); }}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                >
                  <span className="text-3xl font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Report Details */}
            <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-b-2 border-red-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-red-600 text-xl mb-2">{selectedReport.reason}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6">
              {loadingMessages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-gray-500 font-medium">No messages found</p>
                  <p className="text-sm text-gray-400 mt-1">These users haven't chatted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message) => {
                    const isReporter = message.sender_id === selectedReport.reporter_id;
                    const isReported = message.sender_id === selectedReport.reported_id;
                    
                    return (
                      <div key={message.id} className={`flex ${isReporter ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isReporter 
                            ? 'bg-gray-100 text-gray-800' 
                            : isReported 
                            ? 'bg-red-100 text-red-900 border-2 border-red-300' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold opacity-70">
                              {isReporter ? selectedReport.reporter?.nickname : selectedReport.reported?.nickname}
                              {isReported && ' (Reported)'}
                            </span>
                          </div>
                          <p className="text-sm break-words">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t-2 border-gray-200">
                <button 
                  onClick={() => {
                    setSelectedReport(null);
                    setChatMessages([]);
                  }}
                  className="py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 active:scale-95 shadow-md"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleBan(selectedReport.reported_id, selectedReport.id);
                    setSelectedReport(null);
                    setChatMessages([]);
                  }}
                  className="py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold hover:from-red-700 hover:to-red-800 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🚫</span> Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
