'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Users,
  Calendar,
  FileCheck2,
  UserPlus,
  Network,
  BarChart3,
  Bot,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isAi?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();

  const navGroups: NavGroup[] = [
    {
      title: 'Platform',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Recruiting',
      items: [
        { name: 'Requisitions', href: '/requisitions', icon: Briefcase },
        { name: 'Applications & Pipeline', href: '/pipeline', icon: Kanban, badge: 'Live' },
        { name: 'Candidates & Pool', href: '/candidates', icon: Users },
        { name: 'Interviews & Scorecards', href: '/interviews', icon: Calendar },
        { name: 'Offers & Compensation', href: '/offers', icon: FileCheck2 },
        { name: 'AI Recruiting Hub', href: '/ai-hub', icon: Bot, isAi: true },
      ],
    },
    {
      title: 'Onboarding & Preboarding',
      items: [
        { name: 'Preboarding & Onboarding', href: '/onboarding', icon: UserPlus },
      ],
    },
    {
      title: 'People & Organization',
      items: [
        { name: 'Employee Directory & Org Chart', href: '/employees', icon: Network },
      ],
    },
    {
      title: 'Workflows & Automation',
      items: [
        { name: 'Workflow Engine & Approvals', href: '/workflows', icon: Sparkles },
      ],
    },
    {
      title: 'Reports & Analytics',
      items: [
        { name: 'Hiring Funnel & Analytics', href: '/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Organization & RBAC', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.isAi ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-700'}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${isActive ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                        {item.badge}
                      </span>
                    )}

                    {item.isAi && (
                      <Sparkles className={`h-3 w-3 ${isActive ? 'text-white' : 'text-indigo-500 animate-pulse'}`} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise SLA banner / Tagline footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-xl p-3 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Hiring Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            "From First Application to First Day — One Intelligent Hiring Platform."
          </p>
        </div>
      </div>
    </aside>
  );
}
