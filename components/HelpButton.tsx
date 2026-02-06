'use client';

import { useState } from 'react';
import { HelpCircle, X, Mail, Phone, MapPin } from 'lucide-react';

export default function HelpButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-rose-600 to-red-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all active:scale-95"
        aria-label="Help & Contact"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-6 flex items-center justify-between sticky top-0">
              <div className="flex items-center">
                <HelpCircle className="w-7 h-7 mr-3" />
                <h2 className="text-2xl font-black">Help & Support</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions, concerns, or need assistance, feel free to reach out to us through any of the following channels:
                </p>
              </div>

              {/* Email Support */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-rose-100 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Email Support</h4>
                    <a 
                      href="mailto:uemanilausc.official@gmail.com"
                      className="text-rose-600 hover:text-rose-700 underline break-all"
                    >
                      uemanilausc.official@gmail.com
                    </a>
                    <p className="text-sm text-gray-500 mt-2">Response Time: 24-48 hours</p>
                  </div>
                </div>
              </div>

              {/* Phone Contact */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-rose-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Phone Support</h4>
                    <a 
                      href="tel:09665687430"
                      className="text-rose-600 hover:text-rose-700 font-semibold text-lg"
                    >
                      09665687430
                    </a>
                    <p className="text-sm text-gray-500 mt-2">Available for immediate assistance</p>
                  </div>
                </div>
              </div>

              {/* Office Visit */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-rose-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Visit Us</h4>
                    <p className="text-gray-700">USC Office</p>
                    <p className="text-gray-600">Located at SFC Lobby</p>
                    <p className="text-sm text-gray-500 mt-2">Walk-in for immediate response</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
