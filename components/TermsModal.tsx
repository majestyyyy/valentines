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
  const [acknowledgeResponsibility, setAcknowledgeResponsibility] = useState(false);
  const [agreedSection1, setAgreedSection1] = useState(false);
  const [agreedSection2, setAgreedSection2] = useState(false);
  const [agreedSection3, setAgreedSection3] = useState(false);
  const [agreedSection4, setAgreedSection4] = useState(false);
  const [agreedSection5, setAgreedSection5] = useState(false);
  const [agreedSection6, setAgreedSection6] = useState(false);
  const [agreedSection7, setAgreedSection7] = useState(false);
  const [agreedSection8, setAgreedSection8] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setAcknowledgeResponsibility(false);
      setAgreedSection1(false);
      setAgreedSection2(false);
      setAgreedSection3(false);
      setAgreedSection4(false);
      setAgreedSection5(false);
      setAgreedSection6(false);
      setAgreedSection7(false);
      setAgreedSection8(false);
    }
  }, [isOpen]);

  const allTermsAgreed = agreedSection1 && agreedSection2 && agreedSection3 && agreedSection4 && agreedSection5 && agreedSection6 && agreedSection7 && agreedSection8;

  const handleNext = () => {
    if (!allTermsAgreed) {
      alert('Please check all boxes (Sections 1-8) to continue.');
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
                className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none"
              >
                <div className="space-y-6">
                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">1. ACCEPTANCE OF TERMS</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      By accessing, registering for, or using yUE Match, you explicitly agree to be bound by these Terms of Service, Privacy Policy, and all applicable rules and regulations. If you do not agree with any part of these terms, you must immediately discontinue use of the Platform.
                    </p>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection1}
                        onChange={(e) => setAgreedSection1(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 1
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">2. ELIGIBILITY REQUIREMENTS</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                      <li>Currently enrolled student at University of the East</li>
                      <li>Possess a valid and active @ue.edu.ph email address</li>
                      <li>At least 18 years of age</li>
                    </ul>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection2}
                        onChange={(e) => setAgreedSection2(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 2
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">3. PRIVACY & DATA PROTECTION</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      We collect and process your personal information including:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                      <li><strong>Account Information:</strong> Email address, password of your yUE Match! account</li>
                      <li><strong>Profile Data:</strong> Nickname, gender, college, year level, photos, bio, hobbies</li>
                      <li><strong>Usage Data:</strong> Swipe history, match records, chat messages, profile views</li>
                    </ul>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection3}
                        onChange={(e) => setAgreedSection3(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 3
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
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
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection4}
                        onChange={(e) => setAgreedSection4(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 4
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">5. DISCLAIMERS & LIMITATIONS</h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                      <p className="font-bold text-yellow-900 mb-2">⚠️ Important Disclaimers:</p>
                      <ul className="list-disc pl-6 text-yellow-800 space-y-2">

                        <li><strong>User Responsibility:</strong> You are solely responsible for your interactions, safety, and decisions</li>
                        <li><strong>No Background Checks:</strong> We do not conduct criminal or psychological screening</li>
                        <li><strong>University Disclaimer:</strong> This is a STUDENT-INITIATED project, NOT officially endorsed by UE</li>
                      </ul>
                    </div>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection5}
                        onChange={(e) => setAgreedSection5(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 5
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">6. YOUR RIGHTS</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      Under the Data Privacy Act of 2012, you have the right to:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                      <li>Access your data</li>
                      <li>Correct inaccurate information</li>
                      <li>Delete your account and data</li>
                      <li>Export your information</li>
                      <li>Object to certain data processing</li>
                    </ul>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection6}
                        onChange={(e) => setAgreedSection6(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 6
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">7. ENFORCEMENT</h3>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <p className="font-bold text-red-900 text-lg mb-2">⚠️ Zero Tolerance Policy</p>
                      <p className="text-red-800 leading-relaxed">
                        <strong>Any violation of these terms may result in automatic account ban without prior warning.</strong> We maintain a strict policy to ensure the safety and integrity of our community.
                      </p>
                    </div>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection7}
                        onChange={(e) => setAgreedSection7(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 7
                      </span>
                    </label>
                  </section>

                  <section className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">8. CONTACT INFORMATION</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      <strong>Support:</strong>uemanilausc.official@gmail.com<br />
                      <strong>Response Time:</strong> 24 hours<br />
                      <strong>Immediate Response:</strong><br />
                      • USC Office: SFC Lobby<br />
                      • USC Officer: 0966-568-7430<br />
                    </p>
                    <label className="flex items-start space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-rose-300 transition-colors not-prose">
                      <input
                        type="checkbox"
                        checked={agreedSection8}
                        onChange={(e) => setAgreedSection8(e.target.checked)}
                        className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-800 font-medium text-sm">
                        I have read and agree to Section 8
                      </span>
                    </label>
                  </section>

                  <section className="border-t-2 border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 text-center">
                      Last Updated: February 6, 2026<br />
                      Effective Date: February 6, 2026<br />
                      Version 2.0
                    </p>
                  </section>

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
                  {allTermsAgreed 
                    ? 'You may now proceed to the disclaimer' 
                    : 'Please check all boxes to continue'}
                </p>
                <button
                  onClick={handleNext}
                  disabled={!allTermsAgreed}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    allTermsAgreed
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
