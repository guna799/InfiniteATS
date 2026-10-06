'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, ClipboardList, LogOut, Sparkles, UserCircle } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';

const NAV = [
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/my-applications', label: 'My Applications', icon: ClipboardList },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
];

// Layout for signed-in applicants
export default function CandidateShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, logout } = useTenant();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 gap-4">
          <Link href="/jobs" className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline font-bold text-base tracking-tight">
              Infinite<span className="text-indigo-600">Careers</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:block text-xs text-slate-600 truncate max-w-[180px]">{currentUser?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
