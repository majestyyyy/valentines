'use client';

import { useState } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Key } from 'lucide-react';
import type { Database } from '@/types/supabase';

export default function AdminAuth() {
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
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
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
          }
        }
      });

      if (error) throw error;

      // If signup succeeded, sign in and create admin profile
      if (data.user) {
        // Auto sign in if no session
        if (!data.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setMessage('Account created! Please try logging in.');
            setMode('login');
            setLoading(false);
            return;
          }

          if (signInData.session) {
            data.session = signInData.session;
          }
        }

        // Use supabaseAdmin to create admin profile
        const profileData = {
          id: data.user.id,
          email: email,
          role: 'admin',
          status: 'approved',
        };
        
        const { error: upsertError } = await (supabaseAdmin as any)
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });

        if (upsertError) {
          console.error('Error creating admin profile:', upsertError);
          throw upsertError;
        }

        router.push('/admin');
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('No session created after login');
      }

      if (data.user) {
        // Check if user has admin role
        const { data: profile } = await (supabaseAdmin as any)
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          setMessage('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        router.push('/admin');
      }
    } catch (err: any) {
      setMessage(err.message || 'Invalid email or password');
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
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setMessage('');
              }}
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
              onClick={() => {
                setMode('signup');
                setPassword('');
                setConfirmPassword('');
                setMessage('');
              }}
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
                placeholder="admin@gmail.com"
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
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 focus:border-ue-red focus:outline-none transition-colors text-base"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 focus:border-ue-red focus:outline-none transition-colors text-base"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {message && (
              <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-ue-red to-red-700 px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl focus:outline-none disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" />
              {loading ? (mode === 'signup' ? 'Creating Account...' : 'Logging in...') : (mode === 'signup' ? 'Sign Up' : 'Login')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 mt-6 space-y-2">
          <p>🔒 Secure password authentication</p>
          <p>This area is restricted to authorized administrators only.</p>
        </div>
      </div>
    </div>
  );
}
