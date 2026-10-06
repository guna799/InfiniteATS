'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Briefcase,
  Users,
  Calendar,
  FileCheck2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Building2,
  UserCheck,
  ChevronRight,
  ArrowRight,
  Bot
} from 'lucide-react';
import { REQUISITION_STATUSES, STAGES } from '@/lib/constants';

export default function DashboardPage() {
  const { organization, currentUser } = useTenant();
  const [metrics, setMetrics] = useState<any>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, reqsRes, candsRes, auditRes] = await Promise.all([
          fetch(`/api/analytics?orgId=${organization.id}`),
          fetch(`/api/requisitions?orgId=${organization.id}`),
          fetch(`/api/candidates?orgId=${organization.id}`),
          fetch(`/api/settings/audit-logs?orgId=${organization.id}`),
        ]);

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setMetrics(data.metrics);
        }
        if (reqsRes.ok) {
          const data = await reqsRes.json();
          setRequisitions(data.requisitions || []);
        }
        if (candsRes.ok) {
          const data = await candsRes.json();
          setRecentCandidates(data.candidates || []);
        }
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditLogs(data.auditLogs?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [organization]);

  const openReqs = requisitions.filter((r) => r.status === 'OPEN');
  const pendingApprovalReqs = requisitions.filter((r) => r.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Talent Intelligence Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Tenant: {organization?.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back, {currentUser?.name || 'Recruiting Leader'}
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            From First Application to First Day — Track open headcount, accelerate candidate pipelines, orchestrate scorecards, and execute compliant onboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <Link
            href="/requisitions"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Requisition</span>
          </Link>
          <Link
            href="/ai-hub"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold backdrop-blur transition"
          >
            <Bot className="h-4 w-4 text-indigo-300" />
            <span>AI Talent Suite</span>
          </Link>
        </div>
      </div>

      {/* Pending Approvals Callout Banner if any */}
      {pendingApprovalReqs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {pendingApprovalReqs.length} Job Requisition(s) Pending Executive Approval
              </p>
              <p className="text-[11px] text-amber-800">
                Action required from Hiring Managers / Compensation Committee before publishing.
              </p>
            </div>
          </div>
          <Link
            href="/requisitions"
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
          >
            Review Approvals <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Top Enterprise KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Requisitions</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{openReqs.length}</span>
            <span className="text-xs font-semibold text-slate-400">/ {requisitions.length} total</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{openReqs.reduce((acc, r) => acc + r.openingsCount, 0)} open headcounts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Candidates</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{metrics?.totalCandidates || recentCandidates.length}</span>
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Avg Match: 92% AI Score</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offer Acceptance</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{metrics?.offerAcceptanceRate || 95}%</span>
            <span className="text-xs font-semibold text-emerald-600 font-medium">High</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{metrics?.acceptedOffers || 2} Hired this quarter</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Time-to-Fill</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{metrics?.avgTimeToHireDays || 23.4}</span>
            <span className="text-xs font-semibold text-slate-500">Days</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>↓ 4.2 days vs industry benchmark</span>
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Active Requisitions & High Match Talent */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Job Requisitions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Job Requisitions</h2>
                <p className="text-xs text-slate-500">Requisitions currently recruiting candidates</p>
              </div>
              <Link
                href="/requisitions"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all ({requisitions.length}) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {requisitions.slice(0, 4).map((req) => {
                const statusMeta = REQUISITION_STATUSES.find((s) => s.id === req.status);

                return (
                  <div key={req.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {req.reqNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta?.color || 'bg-slate-100 text-slate-700'}`}>
                          {statusMeta?.label || req.status}
                        </span>
                        {req.priority === 'URGENT' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            Urgent
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/requisitions/${req.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition block"
                      >
                        {req.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{req.department?.name}</span>
                        <span>•</span>
                        <span>{req.location?.name}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          ${(req.minSalary / 1000).toFixed(0)}k - ${(req.maxSalary / 1000).toFixed(0)}k {req.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-slate-900 block">
                          {req.applications?.length || 0} Candidates
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {req.filledCount} / {req.openingsCount} filled
                        </span>
                      </div>
                      <Link
                        href={`/requisitions/${req.id}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Candidates / AI Matches */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Featured High-Match Candidates</h2>
                <p className="text-xs text-slate-500">Ranked by AI resume parser & competency match score</p>
              </div>
              <Link
                href="/candidates"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Talent Pool <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentCandidates.slice(0, 4).map((cand) => {
                const latestApp = cand.applications?.[0];
                const stageMeta = STAGES.find((s) => s.id === latestApp?.status);
                const skills = cand.skills ? (typeof cand.skills === 'string' ? JSON.parse(cand.skills) : cand.skills) : [];

                return (
                  <div key={cand.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {cand.firstName[0]}{cand.lastName[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/candidates/${cand.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition">
                            {cand.firstName} {cand.lastName}
                          </Link>
                          {cand.aiMatchScore && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                              {cand.aiMatchScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{cand.headline || 'Software Engineering Specialist'}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skills.slice(0, 3).map((skill: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {stageMeta && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${stageMeta.color}`}>
                          {stageMeta.label}
                        </span>
                      )}
                      <Link
                        href={`/candidates/${cand.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline px-2 py-1"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Live Audit Trail & Quick Links */}
        <div className="space-y-8">
          
          {/* Quick Platform Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recruitment Hub</h3>
            <div className="space-y-2">
              <Link
                href="/pipeline"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-indigo-900 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border text-indigo-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span>Live Kanban Pipeline</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/interviews"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-indigo-900 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border text-indigo-600">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span>Interview Command Center</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/offers"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-indigo-900 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border text-emerald-600">
                    <FileCheck2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Offers & E-Signatures</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/onboarding"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-indigo-900 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border text-purple-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Preboarding & New Hires</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/employees"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:text-indigo-900 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border text-blue-600">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Org Chart & Staff Tree</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>
            </div>
          </div>

          {/* Live Enterprise Audit Trail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Enterprise Audit Activity</span>
              </h3>
              <Link href="/settings" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1 space-y-0.5">
                  <p className="font-semibold text-slate-800 leading-tight">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    by <span className="font-medium text-slate-700">{log.actorName}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
