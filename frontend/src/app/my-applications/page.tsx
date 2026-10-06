'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { applicantStatus } from '@/lib/applicationStatus';

interface MyApplication {
  id: string;
  status: string;
  appliedDate: string;
  updatedAt: string;
  requisition: {
    title: string;
    reqNumber: string;
    organization: { name: string };
    location: { city: string; country: string };
  };
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<MyApplication[] | null>(null);

  useEffect(() => {
    fetch('/api/candidate/applications')
      .then((res) => res.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]));
  }, []);

  if (!applications) return <LoadingState message="Loading your applications..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My applications</h1>
        <p className="text-xs text-slate-500 mt-1">Track where each application stands.</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Browse open jobs and apply with your saved profile."
          icon={ClipboardList}
          actionLabel="Browse jobs"
          onAction={() => router.push('/jobs')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {applications.map((app) => {
            const status = applicantStatus(app.status);
            return (
              <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900">{app.requisition.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {app.requisition.organization.name} · {app.requisition.location.city}, {app.requisition.location.country}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Applied {new Date(app.appliedDate).toLocaleDateString()} · updated {new Date(app.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={status.tone}>{status.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
