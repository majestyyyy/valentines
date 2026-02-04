'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();

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

  // Allow desktop access for admin routes
  const isAdminRoute = pathname?.startsWith('/admin');

  if (!isMobile && !isAdminRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ue-red text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Mobile Only</h1>
        <p className="text-xl">
          yUE Match! is designed exclusively for mobile devices. 
          Please open this application on your phone or reduce your browser window size.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
