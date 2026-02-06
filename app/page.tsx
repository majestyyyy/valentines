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
    }
  }, [searchParams]);

  const handleTermsAccept = async () => {
    if (!pendingUserId) return;

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', pendingUserId);

      if (error) throw error;

      setShowTermsModal(false);
      setPendingUserId(null);
      router.push('/profile-setup');
    } catch (error) {
      console.error('Error accepting terms:', error);
      setMessage('Failed to save your acceptance. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('No session created after login');
      }

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          setMessage('Please verify your email first. Check your inbox for the verification code.');
          setMode('verify');
          return;
        }

        // Check if user has a profile with complete data
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('status, nickname, photo_urls, is_banned, terms_accepted_at')
          .eq('id', data.user.id)
          .single();

        // CRITICAL: Check if user is banned - this MUST be checked FIRST
        // Even if profile is incomplete, if they are banned, block them
        if (profile && profile.is_banned === true) {
          await supabase.auth.signOut();
          setMessage('Your account has been permanently banned. You cannot access this service.');
          setLoading(false);
          return;
        }

        // If no profile OR profile exists but is incomplete (missing nickname or photos)
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
      console.error('Login failed:', err);
      setMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    /* DISABLED FOR TESTING - Email validation
    if (!email.endsWith('@ue.edu.ph')) {
      setMessage('Only @ue.edu.ph emails are allowed.');
      setLoading(false);
      return;
    }
    */

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Verification code sent! Check your email to complete signup.');
        setMode('verify');
      }
    } catch (err: any) {
      console.error('Signup failed:', err);
      setMessage(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    /* DISABLED FOR TESTING - Email validation
    if (!email.endsWith('@ue.edu.ph')) {
      setMessage('Only @ue.edu.ph emails are allowed.');
      setLoading(false);
      return;
    }
    */

    try {
      // Send OTP to email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      setMessage('Check your email! We sent you a 6-digit code.');
      setMode('verify');
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
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtp('');
                  setMessage('');
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
                  placeholder="student@ue.edu.ph"
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
                <p className="text-sm text-gray-500 mt-2">Join yUE Match today!</p>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-bold text-gray-700 mb-2">
                  UE Email Address
                </label>
                <input
                  type="email"
                  id="signup-email"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="student@ue.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="signup-password"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.includes('sent') || message.includes('Verification')
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setPassword('');
                  setConfirmPassword('');
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
                <h2 className="text-2xl font-bold text-gray-800">Welcome Back! 👋</h2>
                <p className="text-sm text-gray-500 mt-2">Log in to continue</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  UE Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="student@ue.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full rounded-xl border-2 border-rose-200 px-4 py-4 focus:border-rose-600 focus:outline-none transition-colors text-base"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {message && !message.includes('sent') && !message.includes('Verification') && (
                <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setPassword('');
                    setMessage('');
                  }}
                  className="text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setPassword('');
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
        <p className="text-center text-sm text-gray-500 mt-8">
          By continuing, you agree to our{' '}
          <a
            href="/terms"
            className="text-rose-600 hover:text-rose-700 underline font-semibold"
          >
            Terms of Service & Privacy Policy
          </a>
        </p>
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
