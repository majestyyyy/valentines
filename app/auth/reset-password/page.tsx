'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Heart, Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle the password recovery token from URL hash
    const handleRecoveryToken = async () => {
      try {
        // Check if there's a hash in the URL (recovery token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken) {
          // Exchange the token for a session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('Session error:', error);
            setMessage('Invalid or expired reset link. Please request a new one.');
            return;
          }

          if (data.session) {
            setIsValidSession(true);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          // Check if there's already an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsValidSession(true);
          } else {
            setMessage('Invalid or expired reset link. Please request a new one.');
          }
        }
      } catch (err) {
        console.error('Recovery token error:', err);
        setMessage('An error occurred. Please request a new reset link.');
      }
    };

    handleRecoveryToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      setMessage('Password updated successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setMessage(err.message || 'Failed to reset password. Please try again.');
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
          <p className="text-gray-700 text-lg font-medium">Reset Your Password 🔒</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-pink-200/50">
          {!isValidSession && !success ? (
            // Loading/Invalid Session Message
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <Lock className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Verifying Reset Link...</h2>
              {message && (
                <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {message}
                </div>
              )}
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none transition-all active:scale-95"
              >
                Back to Login
              </button>
            </div>
          ) : success ? (
            // Success Message
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Password Reset! ✅</h2>
              <p className="text-gray-600">
                Your password has been successfully updated.
                <br />
                Redirecting you to login...
              </p>
            </div>
          ) : (
            // Reset Password Form
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-3">
                  <Lock className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Password</h2>
                <p className="text-sm text-gray-500">Choose a strong password for your account</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
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
                  Confirm New Password
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
                  message.includes('successfully')
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
                <Lock className="w-5 h-5" />
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full text-sm text-gray-500 hover:text-pink-500 transition-colors"
              >
                ← Back to login
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
