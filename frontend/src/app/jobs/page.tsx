'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  MapPin,
  Search,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  Share2,
  Check,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
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

export const dynamic = 'force-dynamic';

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

function JobsContent() {
  const searchParams = useSearchParams();
  const applyJobIdParam = searchParams.get('applyJobId');
  const { showToast } = useTenant();

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [workplace, setWorkplace] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selected, setSelected] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  const load = async () => {
    try {
      const jobsRes = await fetch('/api/candidate/jobs');
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
        setIsAuthenticated(Boolean(data.isAuthenticated));
        setCurrentUser(data.user || null);

        // If candidate is logged in, try loading profile
        if (data.isAuthenticated) {
          const profileRes = await fetch('/api/candidate/profile');
          if (profileRes.ok) {
            const pData = await profileRes.json();
            setMissingFields(pData.missingFields || []);
          }
        }

        // Auto-open modal if applyJobId is provided
        if (applyJobIdParam && data.jobs?.length > 0) {
          const target = data.jobs.find((j: Job) => j.id === applyJobIdParam || j.reqNumber === applyJobIdParam);
          if (target) {
            setSelected(target);
          }
        }
      }
    } catch {
      setJobs([]);
    }
  };

  useEffect(() => {
    load();
  }, [applyJobIdParam]);

  const departments = useMemo(() => {
    if (!jobs) return [];
    const depts = new Set<string>();
    jobs.forEach((j) => {
      if (j.department?.name) depts.add(j.department.name);
    });
    return Array.from(depts);
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (jobs || []).filter((j) => {
      const matchWorkplace = workplace === 'ALL' || j.workplaceType === workplace;
      const matchDept = selectedDept === 'ALL' || j.department?.name === selectedDept;
      const matchQuery =
        !q ||
        [j.title, j.organization?.name, j.department?.name, j.location?.city, j.location?.country].some((v) =>
          v?.toLowerCase().includes(q)
        );
      return matchWorkplace && matchDept && matchQuery;
    });
  }, [jobs, query, workplace, selectedDept]);

  const openJob = (job: Job) => {
    setSelected(job);
    setCoverLetter('');
    setApplyError(null);
  };

  const handleApplyClick = (job: Job, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      // Authentication-at-Apply: Redirect to login with returnTo preserved
      const targetNext = `/jobs?applyJobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`;
      window.location.assign(`/login?next=${encodeURIComponent(targetNext)}&jobTitle=${encodeURIComponent(job.title)}`);
      return;
    }
    openJob(job);
  };

  const copyShareLink = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(url);
    setCopiedJobId(job.id);
    showToast('Job link copied to clipboard', url);
    setTimeout(() => setCopiedJobId(null), 2500);
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
      showToast('Application submitted successfully!', `${selected.title} at ${selected.organization?.name}`);
      setJobs((prev) => prev?.map((j) => (j.id === selected.id ? { ...j, applicationStatus: 'APPLIED' } : j)) || null);
      setSelected(null);
    } catch {
      setApplyError('Network error. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Public Visitor Header Banner if unauthenticated */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              <h2 className="font-bold text-lg">Public Career Portal</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Open Access
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              Explore open career opportunities at InfiniteCareers. No account needed to browse or search.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Page Title and Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Explore Open Opportunities</h1>
            {jobs && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {jobs.length} Published Roles
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse published requisitions across all departments and locations.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Signed in as <strong>{currentUser?.name || currentUser?.email}</strong></span>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-enterprise space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Search by job title, department, company or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
          >
            <option value="ALL">All Workplace Types</option>
            <option value="REMOTE">Remote Only</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ON_SITE">On-site</option>
          </Select>
          <Select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs === null ? (
        <LoadingState message="Loading available positions..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No open positions match your search"
          description="Try broadening your keywords or clearing the workplace and department filters."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setWorkplace('ALL');
            setSelectedDept('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((job) => {
            const hasApplied = Boolean(job.applicationStatus);
            const statusInfo = job.applicationStatus ? applicantStatus(job.applicationStatus) : null;

            return (
              <div
                key={job.id}
                onClick={() => openJob(job)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {job.reqNumber}
                    </span>
                    <Badge variant="neutral">{humanize(job.workplaceType)}</Badge>
                    <Badge variant="outline">{humanize(job.employmentType)}</Badge>
                    {hasApplied && (
                      <Badge variant={statusInfo?.tone || 'success'}>
                        ✓ {statusInfo?.label || 'Applied'}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {job.organization?.name} • {job.department?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {job.location?.city ? `${job.location.city}, ${job.location.country}` : job.location?.name || 'Multiple Locations'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <DollarSign className="h-3.5 w-3.5" />
                      {salary(job)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    onClick={(e) => copyShareLink(job, e)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    title="Copy shareable job link"
                  >
                    {copiedJobId === job.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openJob(job);
                    }}
                  >
                    View Details
                  </Button>

                  {hasApplied ? (
                    <Link
                      href="/my-applications"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-200 transition"
                    >
                      View Application
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => handleApplyClick(job, e)}
                      className="shadow-sm"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Detail & Application Modal */}
      {selected && (
        <Modal
          isOpen={true}
          onClose={() => setSelected(null)}
          title={selected.title}
          description={`${selected.organization?.name} • ${selected.department?.name} • ${selected.location?.city || selected.location?.name}, ${selected.location?.country || ''}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <FormError message={applyError} />

            {/* Compensation & Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Compensation</span>
                <span className="font-bold text-slate-900 text-sm">{salary(selected)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Workplace</span>
                <span className="font-bold text-slate-900">{humanize(selected.workplaceType)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment</span>
                <span className="font-bold text-slate-900">{humanize(selected.employmentType)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Req Code</span>
                <span className="font-mono font-bold text-slate-900">{selected.reqNumber}</span>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-slate-900">About the Role</h4>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>

            {/* Requirements */}
            {selected.requirements && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-slate-900">Requirements & Qualifications</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {selected.benefits && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-slate-900">Perks & Benefits</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.benefits}</p>
              </div>
            )}

            {/* Application Section */}
            {!selected.applicationStatus && (
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Submit Your Application</h4>

                {isAuthenticated ? (
                  <>
                    {missingFields.length > 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                        <p className="font-semibold">Complete your profile first</p>
                        <p className="text-[11px] text-amber-800">
                          Please fill in: {missingFields.join(', ')} in your profile before applying.
                        </p>
                        <Link href="/profile" className="font-bold underline text-amber-950 block mt-1">
                          Go to Profile ↗
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Textarea
                          label="Cover Note / Intro (Optional)"
                          placeholder="Highlight why your skills and experience make you a great match for this position..."
                          rows={3}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setSelected(null)}>
                            Cancel
                          </Button>
                          <Button isLoading={isApplying} onClick={apply}>
                            Submit Application
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-950 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-sm block">Authentication-at-Apply Required</span>
                        <p className="text-xs text-indigo-800 mt-0.5">
                          To apply for this role, please sign in or create a candidate account. Your application context will be preserved automatically.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleApplyClick(selected)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Sign in to Apply
                      </Button>
                      <Link
                        href={`/register?next=${encodeURIComponent(`/jobs?applyJobId=${selected.id}&jobTitle=${encodeURIComponent(selected.title)}`)}&jobTitle=${encodeURIComponent(selected.title)}`}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition text-xs"
                      >
                        Create Candidate Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading jobs portal..." />}>
      <JobsContent />
    </Suspense>
  );
}
