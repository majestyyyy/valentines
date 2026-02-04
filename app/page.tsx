'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Key, Lock } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

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
          .select('status, nickname, photo_urls')
          .eq('id', data.user.id)
          .single();

        // If no profile OR profile exists but is incomplete (missing nickname or photos)
        if (!profile || !profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
          router.push('/profile-setup');
        } else if (profile.status === 'pending') {
          router.push('/profile-setup/pending');
        } else if (profile.status === 'approved') {
          router.push('/home');
        } else if (profile.status === 'rejected') {
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

    /* Email validation
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
        // Check if user has a profile with complete data
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('status, nickname, photo_urls')
          .eq('id', data.user.id)
          .single();

        // If no profile OR profile exists but is incomplete (missing nickname or photos)
        if (!profile || !profile.nickname || !profile.photo_urls || profile.photo_urls.length === 0) {
          // New user or incomplete profile, redirect to profile setup
          router.push('/profile-setup');
        } else if (profile.status === 'pending') {
          // Profile is complete and under review
          router.push('/profile-setup/pending');
        } else if (profile.status === 'approved') {
          // Approved, go to home
          router.push('/home');
        } else if (profile.status === 'rejected') {
          // Rejected/Banned - redirect to home where BanGuard will handle the ban UI
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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-rose-50 to-red-50">
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mb-6 shadow-2xl animate-pulse">
            <Heart className="w-14 h-14 text-white fill-white" />
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent mb-4 drop-shadow-lg">yUE Match!</h1>
          <p className="text-gray-700 text-lg font-medium">Find your match within the campus 💕</p>
        </div>

        {/* Login/Signup/Verify Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-pink-200/50">
          {mode === 'verify' ? (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-3">
                  <Mail className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email 💌</h2>
                <p className="text-sm text-gray-500">We sent an 8-digit code to <strong>{email}</strong></p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-bold text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 focus:border-ue-red focus:outline-none transition-colors text-center text-2xl font-bold tracking-widest"
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
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                className="w-full text-sm text-gray-500 hover:text-pink-500 transition-colors"
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
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-4 focus:border-pink-500 focus:outline-none transition-colors text-base"
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
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-4 focus:border-pink-500 focus:outline-none transition-colors text-base"
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
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-4 focus:border-pink-500 focus:outline-none transition-colors text-base"
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
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                className="w-full text-sm text-gray-500 hover:text-pink-500 transition-colors"
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
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-4 focus:border-pink-500 focus:outline-none transition-colors text-base"
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
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-4 focus:border-pink-500 focus:outline-none transition-colors text-base"
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
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setPassword('');
                  setMessage('');
                }}
                className="w-full text-sm text-gray-500 hover:text-pink-500 transition-colors"
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
            className="text-red-600 hover:text-red-700 underline font-semibold"
          >
            Terms of Service & Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
