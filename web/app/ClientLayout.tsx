'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('rehber_token');
    
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (token && pathname === '/login') {
      router.push('/');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Don't render until client-side hydration to prevent hydration mismatches
  // and flash of protected content
  if (!isMounted) {
    return null; 
  }

  if (!isAuthorized && pathname !== '/login') {
    return null;
  }

  const isLogin = pathname === '/login';

  return (
    <>
      {!isLogin && (
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-md">
                  R
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight">REHBER</span>
                  <span className="ml-2 text-xs bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                    Teacher Portal
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Dashboard
                </Link>
                <Link href="/students" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Students
                </Link>
                <Link href="/interventions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Learning Bands & Interventions
                </Link>
                <Link href="/curriculum" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Curriculum
                </Link>
                <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Admin
                </Link>
                <Link href="/sms-gateway" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  SMS Gateway
                </Link>
                <Link href="/sync-monitor" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                  Sync Monitor
                </Link>
                <LogoutButton />
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  GCS Chak 42 • Online
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={!isLogin ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {children}
      </main>
    </>
  );
}
