'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Calendar,
  ShieldCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';

export const dynamic = 'force-dynamic';

interface JobDetail {
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
  openingsCount: number;
  createdAt: string;
  organization: { id: string; name: string; slug: string; logoUrl: string | null };
  department: { name: string };
  location: { name: string; city: string; country: string };
}

const humanize = (val: string) => val.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function salary(job: JobDetail) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.currency || 'USD', maximumFractionDigits: 0 });
  return `${fmt.format(job.minSalary)} – ${fmt.format(job.maxSalary)}`;
}

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/jobs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data.job || null);
        } else {
          setJob(null);
        }
      } catch (err) {
        console.error(err);
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  const handleApply = () => {
    if (!job) return;
    const target = `/jobs?applyJobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`;
    window.location.assign(`/login?next=${encodeURIComponent(target)}&jobTitle=${encodeURIComponent(job.title)}`);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <LoadingState message="Loading position details..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <EmptyState
          title="Position Not Found"
          description="This job posting may have been closed, filled, or is no longer accepting applications."
          actionLabel="Browse Open Roles"
          onAction={() => window.location.assign('/careers')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/careers"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Open Positions</span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <Button size="sm" onClick={handleApply}>
              <span>Apply Now</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* Main Job Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                {job.reqNumber}
              </span>
              <Badge variant="neutral">{humanize(job.workplaceType)}</Badge>
              <Badge variant="outline">{humanize(job.employmentType)}</Badge>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {job.organization?.name}
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Building2 className="h-4 w-4 text-slate-400" />
              {job.department?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {job.location?.city ? `${job.location.city}, ${job.location.country}` : job.location?.name || 'Multiple Locations'}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <DollarSign className="h-4 w-4" />
              {salary(job)}
            </span>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-enterprise space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* About Company & Team */}
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>About {job.organization?.name}</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              We are an enterprise-grade organization building modern solutions. Join our {job.department?.name} department to solve high-impact challenges.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 border-t pt-6">
            <h2 className="text-base font-bold text-slate-900">Role Overview</h2>
            <p className="whitespace-pre-wrap text-slate-600 text-xs sm:text-sm leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="space-y-2 border-t pt-6">
              <h2 className="text-base font-bold text-slate-900">Requirements & Qualifications</h2>
              <p className="whitespace-pre-wrap text-slate-600 text-xs sm:text-sm leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="space-y-2 border-t pt-6">
              <h2 className="text-base font-bold text-slate-900">Benefits & Perks</h2>
              <p className="whitespace-pre-wrap text-slate-600 text-xs sm:text-sm leading-relaxed">
                {job.benefits}
              </p>
            </div>
          )}

          {/* Authentication-at-Apply Callout Banner */}
          <div className="border-t pt-6">
            <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-300" />
                  <h3 className="font-bold text-base text-white">Ready to apply for {job.title}?</h3>
                </div>
                <p className="text-xs text-indigo-200">
                  Authentication is required to submit your profile. Your application context will be retained automatically.
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleApply}
                className="bg-white text-indigo-950 hover:bg-slate-100 font-bold shrink-0 shadow-md"
              >
                <span>Apply for this Position</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
