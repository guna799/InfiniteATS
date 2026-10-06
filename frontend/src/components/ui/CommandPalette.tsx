'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Briefcase,
  Kanban,
  Calendar,
  FileCheck2,
  Settings,
  Bot,
  Sparkles,
  Building2,
  X,
} from 'lucide-react';

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'Talent Pipeline (Live Kanban)', href: '/pipeline', icon: Kanban, category: 'Recruiting' },
    { label: 'Job Requisitions', href: '/requisitions', icon: Briefcase, category: 'Recruiting' },
    { label: 'Candidate Talent Pool', href: '/candidates', icon: Users, category: 'Recruiting' },
    { label: 'Interviews & Scorecards', href: '/interviews', icon: Calendar, category: 'Evaluation' },
    { label: 'Offers & Compensation', href: '/offers', icon: FileCheck2, category: 'Evaluation' },
    { label: 'Preboarding & Onboarding', href: '/onboarding', icon: Sparkles, category: 'Core HR' },
    { label: 'Employee Org Chart', href: '/employees', icon: Building2, category: 'People' },
    { label: 'AI Recruiting Intelligence', href: '/ai-hub', icon: Bot, category: 'Intelligence' },
    { label: 'Analytics & KPIs', href: '/analytics', icon: Briefcase, category: 'Reports' },
    { label: 'Enterprise Administration & RBAC', href: '/settings', icon: Settings, category: 'Admin' },
  ];

  const filteredLinks = quickLinks.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-xl w-full relative z-10 overflow-hidden animate-scaleUp">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search candidates, jobs, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 rounded border">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-50">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Navigation & Actions
          </div>
          {filteredLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(item.href)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100/80 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                    {item.label}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </button>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or pages found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
