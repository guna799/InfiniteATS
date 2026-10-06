'use client';

import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CandidateShell from './CandidateShell';
import { usePathname } from 'next/navigation';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useRealtimeEvents();

  const startsWith = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  // Sign-in pages, the careers preview and the offer portal render without the internal ATS chrome
  if (startsWith('/login') || startsWith('/register') || startsWith('/careers') || startsWith('/portal/candidate')) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  if (startsWith('/jobs') || startsWith('/profile') || startsWith('/my-applications')) {
    return <CandidateShell>{children}</CandidateShell>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
