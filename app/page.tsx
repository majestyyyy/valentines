'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Mail, Key, Lock, Smartphone, Monitor } from 'lucide-react';
import TermsModal from '@/components/TermsModal';

export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check if redirected due to ban
    const error = searchParams.get('error');
    if (error === 'banned') {
      setMessage('Your account has been permanently banned. You cannot access this service.');
    } else if (error === 'invalid-email') {
      setMessage('Only @ue.edu.ph email addresses are allowed. Please sign in with your UE Gmail account.');
    }
  }, [searchParams]);

  // Handle password recovery redirect
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      // Redirect to reset password page with the hash intact
      router.push(`/auth/reset-password${window.location.hash}`);
    }
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleTermsAccept = async () => {
    if (!pendingUserId) return;

    try {
      // Ensure we have an active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessage('Session expired. Please sign in again.');
        setShowTermsModal(false);
        setPendingUserId(null);
        return;
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', pendingUserId);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      setShowTermsModal(false);
      setPendingUserId(null);
      router.push('/profile-setup');
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      setMessage(error.message || 'Failed to save your acceptance. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Sign in with Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/terms-modal`,
          queryParams: {
            access_type: 'offline',
            hd: 'ue.edu.ph' // Restrict to UE email domain
          }
        }
      });

      if (error) throw error;

      // Google will redirect automatically
    } catch (err: any) {
      console.error('Login failed:', err);
      setMessage(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Sign in with Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/terms-modal`,
          queryParams: {
            access_type: 'offline',
            hd: 'ue.edu.ph' // Restrict to UE email domain
          }
        }
      });

      if (error) throw error;

      // Google will redirect automatically
    } catch (err: any) {
      console.error('Signup failed:', err);
      setMessage(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email.endsWith('@ue.edu.ph')) {
      setMessage('Only UE student is allowed.');
      setLoading(false);
      return;
    }

    try {
      // OTP DISABLED - Skip email sending
      console.log('⚠️ OTP sending disabled for login');
      setMessage('⚠️ OTP disabled - please use signup or contact admin');
    } catch (err: any) {
      setMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      setLoading(false);
      return;
    }

    // Rate limiting: Check if user has exceeded password reset attempts
    const rateLimitKey = `password_reset_${email}`;
    const attemptData = localStorage.getItem(rateLimitKey);
    
    if (attemptData) {
      const { count, lastAttempt } = JSON.parse(attemptData);
      const timeSinceLastAttempt = Date.now() - lastAttempt;
      const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // If less than 5 minutes since last attempt and already sent 3 times
      if (timeSinceLastAttempt < cooldownPeriod && count >= 3) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 60000);
        setMessage(`Too many attempts. Please wait ${remainingTime} minute(s) before trying again.`);
        setLoading(false);
        return;
      }
      
      // Reset counter if cooldown period has passed
      if (timeSinceLastAttempt >= cooldownPeriod) {
        localStorage.removeItem(rateLimitKey);
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      // Update rate limit counter
      const currentData = localStorage.getItem(rateLimitKey);
      const newCount = currentData ? JSON.parse(currentData).count + 1 : 1;
      localStorage.setItem(rateLimitKey, JSON.stringify({
        count: newCount,
        lastAttempt: Date.now()
      }));

      setMessage('Password reset link sent! Check your email.');
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setMessage(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      setMessage('✅ Verification code resent! Check your email.');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      console.error('Resend failed:', err);
      setMessage(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('No session created after verification');
      }

      if (data.user) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('status, nickname, photo_urls, is_banned, terms_accepted_at')
          .eq('id', data.user.id)
          .single();

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          setMessage('Your account has been permanently banned. You cannot access this service.');
          setLoading(false);
          return;
        }

        if (!profile || !profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
          // Check if terms have been accepted
          if (!profile?.terms_accepted_at) {
            // Show terms modal
            setPendingUserId(data.user.id);
            setShowTermsModal(true);
          } else {
            router.push('/profile-setup');
          }
        } else if (profile.status === 'pending') {
          router.push('/profile-setup/pending');
        } else if (profile.status === 'approved') {
          router.push('/home');
        } else {
          setMessage('Your account status is unclear. Please contact support.');
        }
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      setMessage(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Desktop users see landing page suggesting mobile use
  // Mobile users go straight to login/signup
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center border-2 border-gray-200">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
            <h1 className="text-5xl font-black text-gray-800 mb-3">
              yUE Match
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with UE Students
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8 mb-8 border-2 border-blue-200">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mobile-Only Experience</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              yUE Match is exclusively designed for mobile devices to provide the best swiping and matching experience. 
              Please access this app on your smartphone to get started.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Open this page on your mobile device</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 text-gray-700 bg-gray-50 rounded-xl p-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-gray-200">
                <Heart className="w-6 h-6 text-blue-600 fill-blue-600" />
              </div>
              <p className="text-left">Find romantic connections, friends, study buddies, and networking opportunities</p>
            </div>
            <div className="flex items-center gap-4 text-gray-700 bg-gray-50 rounded-xl p-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-gray-200">
                <span className="text-2xl">🎓</span>
              </div>
              <p className="text-left">Exclusive to University of the East students</p>
            </div>
            <div className="flex items-center gap-4 text-gray-700 bg-gray-50 rounded-xl p-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-gray-200">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-left">Safe, verified community with admin moderation</p>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              🔒 Secure • 🎯 UE Verified • 💬 Real Connections
            </p>
            <p className="text-xs text-gray-400">
              For the best experience, please use a mobile device
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Auth Page
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-red-50 to-pink-50">
      <div className="w-full max-w-md relative z-10">{/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-600 to-red-500 rounded-full mb-6 shadow-2xl animate-pulse">
            <Heart className="w-14 h-14 text-white fill-white" />
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent mb-4 drop-shadow-lg">yUE Match</h1>
          <p className="text-gray-700 text-lg font-medium">Connect with students across campus 🎓</p>
        </div>

        {/* Login/Signup/Verify Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-rose-200/50">{mode === 'verify' ? (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-3">
                  <Mail className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email 📧</h2>
                <p className="text-sm text-gray-500">We sent an 8-digit code to <strong>{email}</strong></p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-bold text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-center text-2xl font-bold tracking-widest"
                  placeholder="00000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  required
                />
                <div className="mt-2 text-left">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline transition-all"
                  >
                    {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.includes('Check') || message.includes('sent')
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 8}
                className="w-full rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtp('');
                  setMessage('');
                  setResendCooldown(0);
                }}
                className="w-full text-sm text-gray-500 hover:text-rose-600 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          ) : mode === 'forgot-password' ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-3">
                  <Key className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password? 🔑</h2>
                <p className="text-sm text-gray-500">No worries! We'll send you reset instructions.</p>
              </div>

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-bold text-gray-700 mb-2">
                  UE Email Address
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="surname.firstname@ue.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.includes('sent') || message.includes('link')
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
                className="w-full text-sm text-gray-500 hover:text-rose-600 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          ) : mode === 'signup' ? (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create Account ✨</h2>
                <p className="text-sm text-gray-500 mt-2">Sign in with your UE Gmail account</p>
              </div>

              {message && (
                <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white border-2 border-gray-300 px-6 py-4 text-base font-bold text-gray-700 shadow-lg hover:shadow-xl hover:border-rose-600 focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
                className="w-full text-sm text-gray-500 hover:text-rose-600 transition-colors"
              >
                Already have an account? <span className="font-bold">Log in</span>
              </button>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Hi, Warrior! 👋</h2>
                <p className="text-sm text-gray-500 mt-2">Makakahabol ka pa sa Valentines! <br></br>Kaya log in na!</p>
              </div>

              {message && (
                <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white border-2 border-gray-300 px-6 py-4 text-base font-bold text-gray-700 shadow-lg hover:shadow-xl hover:border-rose-600 focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connecting to Google...' : 'Sign in with Google'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setMessage('');
                }}
                className="w-full text-sm text-gray-500 hover:text-rose-600 transition-colors"
              >
                Don't have an account? <span className="font-bold">Sign up</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">        
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-200">
            <span>Powered by</span>
            <span className="font-bold text-rose-600">UE Manila - University Student Council</span>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => {
          setShowTermsModal(false);
          setPendingUserId(null);
        }}
        onAccept={handleTermsAccept}
      />
    </main>
  );
}
