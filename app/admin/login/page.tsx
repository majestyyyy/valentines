'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Key } from 'lucide-react';

export default function AdminAuth() {
  const [mode, setMode] = useState<'signup' | 'login' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Send OTP to email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            role: 'admin', // Set admin role metadata
          }
        }
      });

      if (error) throw error;

      setMessage('OTP sent to your email! Please check your inbox.');
      setMode('verify');
    } catch (err: any) {
      setMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Send OTP for login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      setMessage('OTP sent to your email! Please check your inbox.');
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
      // Verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        console.error('OTP Verification Error:', error);
        throw error;
      }

      if (!data.session) {
        throw new Error('No session created after verification');
      }

      if (data.user) {
        console.log('User verified:', data.user.id);
        
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single() as { data: { role: string } | null, error: any };

        if (profileError) {
          console.log('Profile not found, creating admin profile');
          // Profile doesn't exist yet, create it with admin role
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              role: 'admin',
              status: 'approved',
            } as any);

          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          console.log('Admin profile created, redirecting...');
          router.push('/admin');
        } else if (profile?.role === 'admin') {
          console.log('Existing admin found, redirecting...');
          router.push('/admin');
        } else {
          console.log('Updating user to admin role');
          // Not an admin, update to admin role
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', status: 'approved' })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating role:', updateError);
            throw updateError;
          }
          
          console.log('User promoted to admin, redirecting...');
          router.push('/admin');
        }
      } else {
        throw new Error('No user data returned after verification');
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      setMessage(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-ue-red to-red-700 rounded-full mb-4 shadow-2xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">yUE Match! Administration</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {mode === 'verify' ? (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
                <p className="text-sm text-gray-500">We sent an 8-digit code to <strong>{email}</strong></p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-bold text-gray-700 mb-2">
                  Enter OTP Code
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
                  message.includes('sent') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 8}
                className="w-full rounded-full bg-gradient-to-r from-ue-red to-red-700 px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtp('');
                  setMessage('');
                }}
                className="w-full text-sm text-gray-500 hover:text-ue-red transition-colors"
              >
                ← Back to login
              </button>
            </form>
          ) : (
            // Login/Signup Form
            <>
              <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all ${
                    mode === 'login' 
                      ? 'bg-white text-ue-red shadow-sm' 
                      : 'text-gray-500'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all ${
                    mode === 'signup' 
                      ? 'bg-white text-ue-red shadow-sm' 
                      : 'text-gray-500'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 focus:border-ue-red focus:outline-none transition-colors text-base"
                    placeholder="admin@ue.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${
                    message.includes('sent') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-ue-red to-red-700 px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  {loading ? 'Sending OTP...' : mode === 'signup' ? 'Sign Up with OTP' : 'Login with OTP'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 mt-6 space-y-2">
          <p>✉️ OTP will be sent to your email</p>
          <p>This area is restricted to authorized administrators only.</p>
        </div>
      </div>
    </div>
  );
}
