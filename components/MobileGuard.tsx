'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Heart, Monitor, Smartphone } from 'lucide-react';

export default function MobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();
  
  // Check sessionStorage synchronously during initialization
  const [showLanding, setShowLanding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize landing state immediately on mount
  useEffect(() => {
    // Check if we should show landing
    const shouldShowLanding = pathname === '/' && !sessionStorage.getItem('hasSeenLanding');
    setShowLanding(shouldShowLanding);
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Update landing visibility based on path changes
    const isAppRoute = pathname && (
      pathname.startsWith('/home') || 
      pathname.startsWith('/chat') || 
      pathname.startsWith('/profile-setup') ||
      pathname === '/terms'
    );
    
    if (isAppRoute) {
      setShowLanding(false);
      sessionStorage.setItem('hasSeenLanding', 'true');
    } else if (pathname === '/' && isReady) {
      const hasSeenLanding = sessionStorage.getItem('hasSeenLanding');
      setShowLanding(!hasSeenLanding);
    }
  }, [pathname, isReady]);

  useEffect(() => {
    // Basic check for screen width
    const checkMobile = () => {
      if (window.innerWidth > 768) {
        setIsMobile(false);
      } else {
        setIsMobile(true);
      }
    };
    
    // Initial check
    checkMobile();

    // Listen to resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Allow desktop access for admin routes and terms page
  const isAdminRoute = pathname?.startsWith('/admin');
  const isTermsPage = pathname === '/terms';

  // Desktop Landing Page
  if (!isMobile && !isAdminRoute && !isTermsPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl w-full relative z-10">
          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-rose-600 to-red-500 p-12 text-center relative">
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="relative z-10">
                <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl border-4 border-white/30">
                  <Heart className="w-14 h-14 text-white fill-white" />
                </div>
                <h1 className="text-6xl font-black text-white mb-3 drop-shadow-lg">
                  yUE Match
                </h1>
                <p className="text-white/90 text-xl font-medium">
                  Connect with UE Students 🎓
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-12">
              {/* Mobile-Only Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-10 border-2 border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/20 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4 shadow-lg">
                    <Smartphone className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Mobile-First Experience</h2>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed max-w-2xl mx-auto">
                    yUE Match is optimized for mobile devices to deliver the best swiping and matching experience. 
                    Access this app on your smartphone to start connecting!
                  </p>
                  <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Please switch to mobile</span>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 h-full border-2 border-rose-100 hover:border-rose-300 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-r from-rose-600 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Heart className="w-8 h-8 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Find Connections</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Romantic relationships, friendships, study partners, and professional networking
                    </p>
                  </div>
                </div>

                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 h-full border-2 border-rose-100 hover:border-rose-300 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-r from-rose-600 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-3xl">🎓</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">UE Exclusive</h3>
                    <p className="text-gray-600 leading-relaxed">
                      A verified community exclusively for University of the East students
                    </p>
                  </div>
                </div>

                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 h-full border-2 border-rose-100 hover:border-rose-300 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-r from-rose-600 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-3xl">✨</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Safe & Secure</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Admin-moderated community with verified profiles and privacy protection
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Badges */}
              <div className="flex flex-wrap justify-center gap-4 pt-8 border-t-2 border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-lg">🔒</span>
                  <span className="text-sm font-semibold text-gray-700">Secure</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm font-semibold text-gray-700">UE Verified</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-semibold text-gray-700">Real Connections</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-lg">📱</span>
                  <span className="text-sm font-semibold text-gray-700">Mobile Only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <p className="text-center mt-6 text-gray-500 text-sm">
            For the optimal experience, please access yUE Match from your mobile device
          </p>
        </div>
      </div>
    );
  }

  // Mobile Landing Page - only render after client mount to prevent hydration mismatch
  if (isReady && isMobile && showLanding && !isAdminRoute && !isTermsPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 flex flex-col relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-rose-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-300/20 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          {/* Logo */}
          <div className="w-32 h-32 bg-gradient-to-r from-rose-600 to-red-500 rounded-full mb-6 flex items-center justify-center shadow-2xl animate-pulse border-4 border-white/50">
            <Heart className="w-16 h-16 text-white fill-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-500 mb-3 text-center">
            yUE Match
          </h1>
          
          <p className="text-gray-600 text-center text-lg mb-12 font-medium">
            Connect with UE Students 🎓
          </p>

          {/* Feature Cards */}
          <div className="space-y-4 mb-12 w-full max-w-md">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-rose-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1 text-lg">Find Connections</h3>
                  <p className="text-sm text-gray-600">Romantic, friends, study buddies & networking</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-rose-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-3xl">🎓</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1 text-lg">UE Exclusive</h3>
                  <p className="text-sm text-gray-600">Only for University of the East students</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-rose-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-3xl">✨</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1 text-lg">Safe & Verified</h3>
                  <p className="text-sm text-gray-600">Admin-moderated community</p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <button
            onClick={() => {
              sessionStorage.setItem('hasSeenLanding', 'true');
              setShowLanding(false);
            }}
            className="w-full max-w-md bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-5 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 text-lg"
          >
            Get Started
          </button>
        </div>
        {/* Footer */}
        <div className="px-6 py-6 text-center relative z-10">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-rose-600 underline font-semibold">
              Terms & Privacy Policy
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Don't render children until we've determined whether to show landing
  // This prevents the flash when transitioning
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
