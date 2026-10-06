'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Building2,
  Sparkles,
  Search,
  ChevronDown,
  Bell,
  LogOut,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { NotificationCenter } from './NotificationCenter';

export default function Navbar() {
  const { organization, currentUser, logout } = useTenant();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full glass-nav border-b border-slate-200/80 bg-white/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">Infinite<span className="text-indigo-600">Careers</span></span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200/60">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-tight font-medium hidden md:block">
                One Intelligent Hiring Platform
              </p>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden md:block" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 text-xs font-semibold text-slate-800">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            <span className="truncate max-w-[160px]">{organization?.name || 'Loading Org...'}</span>
          </div>
        </div>

        {/* Middle: Global Search Command Palette Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search platform...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono font-bold text-slate-400 border shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Bell Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {/* Signed-in user menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition text-xs">
              <img
                src={currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=4f46e5&color=fff`}
                alt=""
                className="h-8 w-8 rounded-full border border-indigo-200 object-cover"
              />
              <div className="text-left hidden sm:block">
                <span className="font-semibold block leading-tight text-slate-900">{currentUser?.name}</span>
                <span className="text-[10px] text-indigo-600">{currentUser?.role?.replace(/_/g, ' ')}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            <div className="absolute top-full right-0 pt-1.5 w-60 hidden group-hover:block group-focus-within:block z-50">
              <div className="p-2 bg-white rounded-xl shadow-xl border border-slate-200">
                <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Global Command Palette Component */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </header>
  );
}
