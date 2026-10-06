'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, CheckCircle2, DollarSign, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { FormError } from '@/components/auth/AuthCard';
import { useTenant } from '@/context/TenantContext';
import { applicantStatus } from '@/lib/applicationStatus';

interface Job {
  id: string;
  reqNumber: string;
  title: string;
  employmentType: string;
  workplaceType: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  description: string;
  requirements: string;
  benefits: string | null;
  createdAt: string;
  organization: { id: string; name: string; slug: string; logoUrl: string | null };
  department: { name: string };
  location: { name: string; city: string; country: string };
  applicationStatus: string | null;
}

const humanize = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function salary(job: Job) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.currency || 'USD', maximumFractionDigits: 0 });
  return `${fmt.format(job.minSalary)} – ${fmt.format(job.maxSalary)}`;
}

export default function JobsPage() {
  const { showToast } = useTenant();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [workplace, setWorkplace] = useState('ALL');
  const [selected, setSelected] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const load = async () => {
    const [jobsRes, profileRes] = await Promise.all([fetch('/api/candidate/jobs'), fetch('/api/candidate/profile')]);
    if (jobsRes.ok) setJobs((await jobsRes.json()).jobs);
    if (profileRes.ok) setMissingFields((await profileRes.json()).missingFields || []);
  };

  useEffect(() => {
    load().catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (jobs || []).filter(
      (j) =>
        (workplace === 'ALL' || j.workplaceType === workplace) &&
        (!q ||
          [j.title, j.organization.name, j.department.name, j.location.city, j.location.country].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [jobs, query, workplace]);

  const openJob = (job: Job) => {
    setSelected(job);
    setCoverLetter('');
    setApplyError(null);
  };

  const apply = async () => {
    if (!selected) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      const res = await fetch('/api/candidate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requisitionId: selected.id, coverLetter: coverLetter || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyError(data.error || 'Could not submit your application');
        return;
      }
      showToast('Application submitted', `${selected.title} at ${selected.organization.name}`);
      setJobs((prev) => prev?.map((j) => (j.id === selected.id ? { ...j, applicationStatus: 'APPLIED' } : j)) || null);
      setSelected(null);
    } catch {
      setApplyError('Could not submit your application');
    } finally {
      setIsApplying(false);
    }
  };

  if (!jobs) return <LoadingState message="Loading open jobs..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Open jobs</h1>
        <p className="text-xs text-slate-500 mt-1">{jobs.length} open positions across hiring companies.</p>
      </div>

      {missingFields.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Finish your profile before applying — missing {missingFields.join(', ').toLowerCase()}.{' '}
          <Link href="/profile" className="font-semibold underline">
            Complete profile
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by title, company, team or location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="sm:w-48">
          <Select value={workplace} onChange={(e) => setWorkplace(e.target.value)} aria-label="Workplace type">
            <option value="ALL">All workplaces</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ON_SITE">On-site</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching jobs" description="Try a different search or check back soon." icon={Briefcase} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => {
            const status = job.applicationStatus ? applicantStatus(job.applicationStatus) : null;
            return (
              <button
                key={job.id}
                onClick={() => openJob(job)}
                className="text-left bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-slate-900">{job.title}</h2>
                    <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" /> {job.organization.name}
                    </p>
                  </div>
                  {status && <Badge variant={status.tone}>{status.label}</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location.city}, {job.location.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {humanize(job.employmentType)} · {humanize(job.workplaceType)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> {salary(job)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{job.description}</p>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected ? `${selected.organization.name} · ${selected.department.name} · ${selected.reqNumber}` : undefined}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{selected.location.city}, {selected.location.country}</Badge>
              <Badge variant="neutral">{humanize(selected.employmentType)}</Badge>
              <Badge variant="neutral">{humanize(selected.workplaceType)}</Badge>
              <Badge variant="neutral">{salary(selected)}</Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">About the role</h3>
              <p className="whitespace-pre-line">{selected.description}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Requirements</h3>
              <p className="whitespace-pre-line">{selected.requirements}</p>
            </div>
            {selected.benefits && (
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Benefits</h3>
                <p className="whitespace-pre-line">{selected.benefits}</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-3">
              {selected.applicationStatus ? (
                <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> You applied for this job — {applicantStatus(selected.applicationStatus).label.toLowerCase()}.
                </p>
              ) : missingFields.length > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-amber-800">Complete your profile to apply: {missingFields.join(', ')}.</p>
                  <Link href="/profile">
                    <Button type="button">Complete profile</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Textarea
                    label="Cover letter (optional)"
                    rows={4}
                    maxLength={5000}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why are you a great fit for this role?"
                  />
                  <FormError message={applyError} />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">Your profile and resume will be shared with {selected.organization.name}.</p>
                    <Button onClick={apply} isLoading={isApplying}>
                      Submit application
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
