'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCheck2,
  Calendar,
  Settings,
  X,
  Mail,
  Smartphone,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'offer' | 'interview' | 'requisition' | 'system';
}

export function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'PREFERENCES'>('NOTIFICATIONS');
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Offer Letter Accepted & Signed',
      message: 'Rakshitha Shetty accepted the Staff ML Infrastructure Engineer offer (₹48L base + ₹5L bonus).',
      timestamp: '10 mins ago',
      isRead: false,
      type: 'offer',
    },
    {
      id: 'notif-2',
      title: 'Interview Scorecard Submitted',
      message: 'Prajwal Gowda submitted a Strong Yes rating for Venkata Karthik Guntupalli (System Design Round).',
      timestamp: '1 hour ago',
      isRead: false,
      type: 'interview',
    },
    {
      id: 'notif-3',
      title: 'Requisition Approval Requested',
      message: 'REQ-BLR-2026-104 (Senior Product Designer) submitted for executive authorization.',
      timestamp: '3 hours ago',
      isRead: true,
      type: 'requisition',
    },
    {
      id: 'notif-4',
      title: 'High AI Talent Match Detected',
      message: 'Aditya Kapoor scored 93% match score for Lead Product Manager position.',
      timestamp: 'Yesterday',
      isRead: true,
      type: 'system',
    },
  ]);

  // Preferences State
  const [emailDigest, setEmailDigest] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [pushScorecards, setPushScorecards] = useState(true);
  const [pushOffers, setPushOffers] = useState(true);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="md">
      <div className="space-y-4 text-xs">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`font-bold pb-1 transition border-b-2 -mb-3 ${
                activeTab === 'NOTIFICATIONS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Notifications {unreadCount > 0 && <span className="ml-1 text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('PREFERENCES')}
              className={`font-bold pb-1 transition border-b-2 -mb-3 ml-3 ${
                activeTab === 'PREFERENCES'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Preferences
            </button>
          </div>

          {activeTab === 'NOTIFICATIONS' && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tab 1: Notification Feed */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-2 pt-2 divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl transition space-y-1 ${
                  !n.isRead ? 'bg-indigo-50/50 border border-indigo-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Notification Preferences */}
        {activeTab === 'PREFERENCES' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">Email & Slack Channels</h3>
              
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Daily Talent Summary Digest</span>
                  <span className="text-[11px] text-slate-500">Recap of candidates, interviews, and requisitions</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="rounded text-indigo-600 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Slack Channel Broadcasts</span>
                  <span className="text-[11px] text-slate-500">Instant notifications in #talent-hires</span>
                </div>
                <input
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="rounded text-indigo-600 h-4 w-4"
                />
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h3 className="font-bold text-slate-900">Push & Real-time Alerts</h3>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Offer Letter Events</span>
                  <span className="text-[11px] text-slate-500">Alerts when candidate views or signs offer</span>
                </div>
                <input
                  type="checkbox"
                  checked={pushOffers}
                  onChange={(e) => setPushOffers(e.target.checked)}
                  className="rounded text-indigo-600 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Interview Scorecards</span>
                  <span className="text-[11px] text-slate-500">Alerts when panel interviewer submits scorecard</span>
                </div>
                <input
                  type="checkbox"
                  checked={pushScorecards}
                  onChange={(e) => setPushScorecards(e.target.checked)}
                  className="rounded text-indigo-600 h-4 w-4"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
