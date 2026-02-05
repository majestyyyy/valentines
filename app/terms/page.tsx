'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Terms & Privacy</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 prose prose-sm max-w-none">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-2">yUE Match!</h2>
            <p className="text-gray-600">Terms of Service & Privacy Policy</p>
            <p className="text-sm text-gray-500 mt-2">Last Updated: February 3, 2026</p>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h3>
            <p className="text-gray-700 mb-3">
              By accessing or using yUE Match!, you agree to be bound by these Terms of Service and Privacy Policy.
            </p>
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Eligibility Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Must be a currently enrolled UE student</li>
                <li>Must have a valid @ue.edu.ph email address</li>
                <li>Must be at least 18 years old</li>
                <li>One account per person only</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">2. Community Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">❌ Prohibited Conduct</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Harassment or bullying</li>
                  <li>• Fake profiles or impersonation</li>
                  <li>• Explicit or inappropriate content</li>
                  <li>• Sharing others' private information</li>
                  <li>• Commercial use or spam</li>
                  <li>• Threats or violence</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">✅ Expected Behavior</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Be respectful and kind</li>
                  <li>• Be honest and authentic</li>
                  <li>• Use recent, accurate photos</li>
                  <li>• Communicate appropriately</li>
                  <li>• Report concerning behavior</li>
                  <li>• Accept rejection gracefully</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">3. Privacy & Data Protection</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">What We Collect:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  • Email address (@ue.edu.ph) • Nickname/Display name • College and year level
                  • Gender and preferences • Profile photos (max 2) • Hobbies and bio
                  • Swipe history and match data • Chat messages and task completions
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">How We Use Your Data:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Create and manage your profile</li>
                <li>Match you with compatible users</li>
                <li>Facilitate communication between matches</li>
                <li>Improve app functionality</li>
                <li>Ensure safety and enforce guidelines</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">🔒 We Will NEVER:</h4>
              <ul className="text-sm text-blue-900 space-y-1">
                <li>✗ Sell your personal information to third parties</li>
                <li>✗ Share your data with advertisers</li>
                <li>✗ Use your photos for marketing without consent</li>
                <li>✗ Disclose your information except as required by law</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Your Privacy Rights:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: '📂', text: 'Access your data' },
                  { icon: '✏️', text: 'Correct information' },
                  { icon: '🗑️', text: 'Delete account' },
                  { icon: '📤', text: 'Export data' },
                  { icon: '🚫', text: 'Opt-out processing' },
                  { icon: '⚙️', text: 'Restrict usage' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs text-gray-700">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">4. Data Security</h3>
            <p className="text-gray-700 mb-3">
              We implement industry-standard security measures including:
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">Encrypted data transmission (HTTPS/TLS)</span>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">Secure authentication systems</span>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">Regular security audits</span>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">Access controls and monitoring</span>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> No system is 100% secure. Never share sensitive information in chats.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">5. Safety Guidelines</h3>
            
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Meeting in Person:</h4>
              <div className="bg-orange-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Tell friends/family where you're going</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Meet in public, well-lit places</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Arrange your own transportation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Stay sober and alert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Trust your instincts - leave if uncomfortable</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-red-100 border-l-4 border-red-600 p-4">
              <h4 className="font-semibold text-red-800 mb-2">🚨 Red Flags - Report Immediately:</h4>
              <ul className="text-sm text-red-900 space-y-1">
                <li>• Asks for money or financial help</li>
                <li>• Pressures for personal information</li>
                <li>• Makes you uncomfortable or fearful</li>
                <li>• Threatens or blackmails you</li>
                <li>• Shares explicit content without consent</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">6. Reporting & Enforcement</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">First Offense:</p>
                <p className="text-sm text-gray-700">Warning and content removal</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">Second Offense:</p>
                <p className="text-sm text-gray-700">Temporary suspension (7 days)</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">Third Offense:</p>
                <p className="text-sm text-gray-700">Permanent ban</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">7. Philippines Data Privacy Act Compliance</h3>
            <p className="text-gray-700 mb-3">
              yUE Match! complies with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and follows best practices from international standards including GDPR principles and ISO 27001.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">8. Contact Information</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800">General Support:</p>
                <p className="text-sm text-gray-600">noreply.uewelfare.official@gmail.com</p>
                <p className="text-xs text-gray-500">Response time: 24-48 hours</p>
              </div>
            
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ IMPORTANT DISCLAIMER ⚠️</h3>
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
              <h4 className="font-bold text-red-800 text-lg mb-3">Limitation of Liability</h4>
              <p className="text-gray-800 mb-4 leading-relaxed">
                <strong>yUE Match!</strong> is a platform designed to facilitate connections between University of the East students. 
                The application serves solely as a medium for communication and does not control or monitor the interactions between users.
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-gray-800 mb-3 font-semibold">The Developer and University of the East Student Council are NOT responsible for:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Relationship problems, conflicts, or emotional distress arising from user interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Any disputes, arguments, or disagreements between matched users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Physical, emotional, or psychological harm resulting from in-person meetings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Financial losses, scams, or fraudulent activities between users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Misrepresentation of information by users on their profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Any consequences, damages, or problems arising from the use of this application</span>
                  </li>
                </ul>
              </div>
              <div className="bg-red-100 rounded-lg p-4">
                <p className="text-red-900 font-semibold text-center">
                  BY USING THIS PLATFORM, YOU ACKNOWLEDGE AND ACCEPT THAT YOU ENGAGE WITH OTHER USERS 
                  ENTIRELY AT YOUR OWN RISK AND DISCRETION. Users are responsible for their own safety, 
                  decisions, and actions both online and offline.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t-2 border-gray-200 pt-6 mt-8">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 text-center">
              <p className="text-gray-800 font-semibold mb-2">
                By using yUE Match!, you acknowledge that you have read, understood, and agreed to these Terms of Service and Privacy Policy.
              </p>
              <p className="text-sm text-gray-600">
                Questions or concerns? Contact us at <span className="text-red-600 font-semibold">noreply.uewelfare.official@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>For the complete detailed terms, please refer to the full documentation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
