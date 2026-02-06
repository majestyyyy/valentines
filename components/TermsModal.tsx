'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, X, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acknowledgeResponsibility, setAcknowledgeResponsibility] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setHasScrolledToBottom(false);
      setAcknowledgeResponsibility(false);
    }
  }, [isOpen]);

  // Check scroll position periodically
  useEffect(() => {
    if (currentPage !== 1) return;

    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // If content is already visible (no scroll needed) or scrolled to bottom
      if (scrollHeight <= clientHeight || distanceFromBottom < 100) {
        if (!hasScrolledToBottom) {
          setHasScrolledToBottom(true);
        }
      }
    };

    checkScroll();
    const interval = setInterval(checkScroll, 500);
    
    return () => clearInterval(interval);
  }, [hasScrolledToBottom, currentPage]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // If content is already visible (no scroll needed) or scrolled to bottom
    if (scrollHeight <= clientHeight || distanceFromBottom < 100) {
      if (!hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleNext = () => {
    if (!hasScrolledToBottom) {
      alert('Please scroll to the bottom to read all terms and conditions.');
      return;
    }
    setCurrentPage(2);
  };

  const handleAccept = () => {
    if (!acknowledgeResponsibility) {
      alert('Please acknowledge the disclaimer to continue.');
      return;
    }
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-black">
                {currentPage === 1 ? 'Terms & Privacy Policy' : 'Important Disclaimer'}
              </h2>
              <p className="text-rose-100 text-sm">
                Step {currentPage} of 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentPage === 1 ? (
            // Page 1: Terms & Privacy
            <>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none"
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
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                      <p className="font-bold text-red-900 text-lg mb-2">⚠️ Zero Tolerance Policy</p>
                      <p className="text-red-800 leading-relaxed">
                        <strong>Any violation of these terms may result in automatic account ban without prior warning.</strong> We maintain a strict policy to ensure the safety and integrity of our community.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">8. CONTACT INFORMATION</h3>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Support:</strong>uemanilausc.official@gmail.com<br />
                      <strong>Response Time:</strong> 24 hours<br />
                      <strong>Immediate Response:</strong><br />
                      • USC Office: SFC Lobby<br />
                      • USC Officer: 0966-568-7430<br />
                    </p>
                  </section>

                  <section className="border-t-2 border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 text-center">
                      Last Updated: February 6, 2026<br />
                      Effective Date: February 6, 2026<br />
                      Version 2.0
                    </p>
                  </section>

                  {!hasScrolledToBottom && (
                    <div className="text-center py-4 animate-bounce">
                      <p className="text-rose-600 font-semibold">↓ Scroll down to continue ↓</p>
                    </div>
                  )}

                </div>
              </div>
            </>
          ) : (
            // Page 2: Disclaimer
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="bg-red-50 border-l-4 border-red-500 p-6">
                <div className="flex items-start mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-red-900 text-xl mb-3">IMPORTANT DISCLAIMER</p>
                    <p className="text-red-800 text-lg leading-relaxed">
                      The <strong>Developer</strong>, <strong>University of the East</strong>, and its <strong>Student Council</strong> are <strong>NOT responsible</strong> for any user actions, disputes, safety concerns, harassment, financial loss, or any consequences of relationships formed through this platform.
                    </p>
                    <p className="text-red-800 mt-3">
                      By continuing, you acknowledge that you use this platform entirely at your own risk.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors">
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
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {currentPage === 1 ? (
              <>
                <p className="text-sm text-gray-600">
                  {hasScrolledToBottom 
                    ? 'You may now proceed to the disclaimer' 
                    : 'Please scroll to the bottom to read all terms'}
                </p>
                <button
                  onClick={handleNext}
                  disabled={!hasScrolledToBottom}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    hasScrolledToBottom
                      ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!acknowledgeResponsibility}
                  className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    acknowledgeResponsibility
                      ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                Continue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
