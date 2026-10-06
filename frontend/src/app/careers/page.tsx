'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2,
  Check,
  Globe,
  SlidersHorizontal,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { FormError } from '@/components/auth/AuthCard';

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
}

const humanize = (val: string) => val.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function salary(job: Job) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.currency || 'USD', maximumFractionDigits: 0 });
  return `${fmt.format(job.minSalary)} – ${fmt.format(job.maxSalary)}`;
}

function CareersContent() {
  const searchParams = useSearchParams();
  const initialOrgSlug = searchParams.get('orgSlug') || 'ALL';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>(initialOrgSlug);
  const [query, setQuery] = useState('');
  const [workplace, setWorkplace] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let url = '/api/public/jobs';
      if (selectedOrg && selectedOrg !== 'ALL') {
        url += `?orgSlug=${encodeURIComponent(selectedOrg)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error(err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedOrg]);

  const organizations = useMemo(() => {
    const orgs = new Map<string, { slug: string; name: string }>();
    jobs.forEach((j) => {
      if (j.organization) {
        orgs.set(j.organization.slug, { slug: j.organization.slug, name: j.organization.name });
      }
    });
    return Array.from(orgs.values());
  }, [jobs]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    jobs.forEach((j) => {
      if (j.department?.name) depts.add(j.department.name);
    });
    return Array.from(depts);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
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

  const handleApplyClick = (job: Job, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Authentication-at-Apply: Redirect to login with return target
    const target = `/jobs?applyJobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`;
    window.location.assign(`/login?next=${encodeURIComponent(target)}&jobTitle=${encodeURIComponent(job.title)}`);
  };

  const copyShareLink = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">InfiniteCareers</span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Enterprise Career Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/login"
              className="px-3.5 py-2 text-slate-700 hover:text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Join Talent Community</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Find Your Next Calling
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Build the Future with InfiniteCareers
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover opportunities across high-growth engineering, product, infrastructure, and healthcare teams. No account required to explore open roles.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 -mt-8 space-y-6 relative z-20">
        {/* Search & Filter Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search roles, skills, or locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />

            <Select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              <option value="ALL">All Companies</option>
              {organizations.map((o) => (
                <option key={o.slug} value={o.slug}>{o.name}</option>
              ))}
            </Select>

            <Select
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
            >
              <option value="ALL">All Workplace Modes</option>
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

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold">
            Showing <strong>{filteredJobs.length}</strong> open positions
          </span>
          <span>Authentication required only when submitting your application</span>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <LoadingState message="Discovering published positions..." />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            title="No matching roles found"
            description="Try changing your search terms or clearing company and department filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setQuery('');
              setSelectedOrg('ALL');
              setWorkplace('ALL');
              setSelectedDept('ALL');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-300 hover:shadow-lg transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {job.reqNumber}
                    </span>
                    <Badge variant="neutral">{humanize(job.workplaceType)}</Badge>
                    <Badge variant="outline">{humanize(job.employmentType)}</Badge>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {job.organization?.name}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {job.department?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {job.location?.city ? `${job.location.city}, ${job.location.country}` : job.location?.name || 'Multiple Locations'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <DollarSign className="h-3.5 w-3.5" />
                      {salary(job)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    onClick={(e) => copyShareLink(job, e)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    title="Copy direct job link"
                  >
                    {copiedId === job.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    onClick={(e) => handleApplyClick(job, e)}
                    className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Public Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          description={`${selectedJob.organization?.name} • ${selectedJob.department?.name} • ${selectedJob.location?.city || selectedJob.location?.name}, ${selectedJob.location?.country || ''}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Compensation</span>
                <span className="font-bold text-slate-900 text-sm">{salary(selectedJob)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Workplace Mode</span>
                <span className="font-bold text-slate-900">{humanize(selectedJob.workplaceType)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment Type</span>
                <span className="font-bold text-slate-900">{humanize(selectedJob.employmentType)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Requisition ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedJob.reqNumber}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-slate-900">About the Role</h4>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
            </div>

            {/* Requirements */}
            {selectedJob.requirements && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-slate-900">Requirements & Qualifications</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {selectedJob.benefits && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-slate-900">Perks & Benefits</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.benefits}</p>
              </div>
            )}

            {/* Apply Banner */}
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-sm block">Ready to take the next step?</span>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Sign in or create an applicant account to submit your resume.
                </p>
              </div>
              <Button size="sm" onClick={() => handleApplyClick(selectedJob)}>
                Apply Now ↗
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function CareersPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading Career Portal..." />}>
      <CareersContent />
    </Suspense>
  );
}
