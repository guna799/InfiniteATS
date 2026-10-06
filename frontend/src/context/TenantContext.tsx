'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  title?: string;
  avatarUrl?: string;
  department?: { id: string; name: string; code: string };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  timezone: string;
  subscriptionTier: string;
  settings?: string;
  departments?: Array<{ id: string; name: string; code: string }>;
  businessUnits?: Array<{ id: string; name: string; code: string }>;
  locations?: Array<{ id: string; name: string; type: string; city: string; country: string }>;
}

interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface TenantContextType {
  organization: Organization | null;
  organizations: Array<{ id: string; name: string; slug: string; logoUrl?: string; subscriptionTier: string }>;
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  sessionKind: 'staff' | 'candidate' | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionKind, setSessionKind] = useState<'staff' | 'candidate' | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSessionKind(data.kind);
        setOrganization(data.organization || null);
        setOrganizations(data.organizations || []);
        setCurrentUser(data.currentUser);
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  };

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <TenantContext.Provider
      value={{
        organization,
        organizations,
        currentUser,
        users,
        isLoading,
        sessionKind,
        refreshSession: fetchSession,
        logout,
        showToast,
      }}
    >
      {children}
      {/* Global Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-100 border-rose-700/50'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-100 border-amber-700/50'
                : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.message && <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
