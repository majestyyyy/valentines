'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TermsAcceptancePage() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [acknowledgeResponsibility, setAcknowledgeResponsibility] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      // Check if user already has terms accepted
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('terms_accepted_at')
        .eq('id', session.user.id)
        .single();

      if (profile?.terms_accepted_at) {
        // Already accepted, redirect to profile setup
        router.push('/profile-setup');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Check scroll position periodically and on mount
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom < 100 && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    };

    // Check immediately
    checkScroll();

    // Also set up an interval to check periodically
    const interval = setInterval(checkScroll, 500);
    
    return () => clearInterval(interval);
  }, [hasScrolledToBottom]);

  // Track scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider scrolled to bottom if within 100px of the bottom
    const scrolledToBottom = distanceFromBottom < 100;

    console.log('Scroll info:', { scrollTop, scrollHeight, clientHeight, distanceFromBottom, scrolledToBottom });

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleContinue = () => {
    if (!hasScrolledToBottom) {
      alert('Please scroll to the bottom to read all terms and conditions.');
      return;
    }
    setShowDisclaimerModal(true);
  };

  const handleAcceptDisclaimer = async () => {
    if (!acknowledgeResponsibility) {
      alert('Please acknowledge the disclaimer to continue.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      // Update profile with terms acceptance
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      // Redirect to profile setup
      router.push('/profile-setup');
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Failed to save your acceptance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-rose-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <div className="flex items-center">
            <Heart className="w-6 h-6 text-rose-600 mr-2" />
            <h1 className="text-xl font-black text-rose-600">yUE Match</h1>
          </div>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-8">
            <h2 className="text-3xl font-black mb-2">Terms & Privacy Policy</h2>
            <p className="text-rose-100">Please read carefully before continuing</p>
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-[60vh] overflow-y-scroll p-8 prose prose-sm max-w-none"
          >
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. ACCEPTANCE OF TERMS</h3>
                <p className="text-gray-700 leading-relaxed">
                  By accessing, registering for, or using yUE Match, you explicitly agree to be bound by these Terms of Service, Privacy Policy, and all applicable rules and regulations. If you do not agree with any part of these terms, you must immediately discontinue use of the Platform.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. ELIGIBILITY REQUIREMENTS</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Currently enrolled student at University of the East</li>
                  <li>Possess a valid and active @ue.edu.ph email address</li>
                  <li>At least 18 years of age</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. PRIVACY & DATA PROTECTION</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We collect and process your personal information including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Account Information:</strong> Email address, password (encrypted)</li>
                  <li><strong>Profile Data:</strong> Nickname, gender, college, year level, photos, bio, hobbies</li>
                  <li><strong>Usage Data:</strong> Swipe history, match records, chat messages, profile views</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. PROHIBITED CONDUCT</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="font-bold text-red-800 mb-2">Strictly Prohibited:</p>
                  <ul className="list-disc pl-6 text-red-700 space-y-1">
                    <li>Harassment, bullying, or threatening other users</li>
                    <li>Creating fake profiles or impersonating others</li>
                    <li>Nudity or sexually explicit material</li>
                    <li>Hate speech or discrimination</li>
                    <li>Soliciting money or financial information</li>
                    <li>Sharing others' private information without consent</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="font-bold text-red-900">⚠️ If you experience any of the above behaviors, report immediately through the in-app reporting system.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. DISCLAIMERS & LIMITATIONS</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <p className="font-bold text-yellow-900 mb-2">⚠️ Important Disclaimers:</p>
                  <ul className="list-disc pl-6 text-yellow-800 space-y-2">
                    <li><strong>User Responsibility:</strong> You are solely responsible for your interactions, safety, and decisions</li>
                    <li><strong>No Background Checks:</strong> We do not conduct criminal or psychological screening</li>
                    <li><strong>University Disclaimer:</strong> This is a STUDENT-INITIATED project, NOT officially endorsed by UE</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. YOUR RIGHTS</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Under the Data Privacy Act of 2012, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Access your data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export your information</li>
                  <li>Object to certain data processing</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. ENFORCEMENT</h3>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Violations may result in:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>First Offense: Warning and content removal</li>
                  <li>Second Offense: Temporary suspension (7 days)</li>
                  <li>Third Offense: Permanent ban</li>
                  <li>Severe violations: Immediate ban without warning</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. CONTACT INFORMATION</h3>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Support:</strong> uemanilausc.official@gmail.com<br />
                  <strong>Response Time:</strong> 24-48 hours<br />
                  <strong>Immediate Response:</strong><br />
                  • Visit USC Office located at SFC Lobby<br />
                  • Call 09665687430<br />
                </p>
              </section>

              {/* Scroll indicator */}
              {!hasScrolledToBottom && (
                <div className="text-center py-4 animate-bounce">
                  <p className="text-rose-600 font-semibold">↓ Scroll down to continue ↓</p>
                </div>
              )}

              {hasScrolledToBottom && (
                <div className="text-center py-4">
                  <p className="text-green-600 font-semibold">✓ You have reached the end</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Continue Button */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {hasScrolledToBottom 
                  ? 'You may now proceed to accept the terms' 
                  : 'Please scroll to the bottom to read all terms and conditions'}
              </p>
              <button
                onClick={handleContinue}
                disabled={!hasScrolledToBottom}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${
                  hasScrolledToBottom
                    ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:shadow-lg hover:scale-105'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-6 sticky top-0">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-black">Important Disclaimer</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="font-bold text-red-900 mb-3">⚠️ IMPORTANT DISCLAIMER</p>
                <p className="text-red-800 text-lg leading-relaxed">
                  The <strong>Developer</strong>, <strong>University of the East</strong>, and its <strong>Student Council</strong> are <strong>NOT responsible</strong> for any user actions, disputes, safety concerns, harassment, financial loss, or any consequences of relationships formed through this platform.
                </p>
                <p className="text-red-800 mt-3">
                  By continuing, you acknowledge that you use this platform entirely at your own risk.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgeResponsibility}
                    onChange={(e) => setAcknowledgeResponsibility(e.target.checked)}
                    className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-gray-700 text-base">
                    I have read and understood the disclaimer above, and I agree to use this platform at my own risk.
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDisclaimerModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleAcceptDisclaimer}
                  disabled={!acknowledgeResponsibility}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    acknowledgeResponsibility
                      ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  I Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
