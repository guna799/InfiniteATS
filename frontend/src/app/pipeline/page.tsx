'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';

export const dynamic = 'force-dynamic';
import {
  Kanban,
  Filter,
  Search,
  Sparkles,
  Users,
  ChevronRight,
  ArrowRight,
  MoreHorizontal,
  Calendar,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Star,
} from 'lucide-react';
import { STAGES } from '@/lib/constants';

function PipelineContent() {
  const searchParams = useSearchParams();
  const initialReqId = searchParams.get('reqId') || 'ALL';
  const { organization, currentUser, showToast } = useTenant();

  const [applications, setApplications] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState(initialReqId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Stage change modal
  const [activeAppToMove, setActiveAppToMove] = useState<any>(null);
  const [targetStage, setTargetStage] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const fetchPipeline = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      let url = `/api/applications?orgId=${organization.id}`;
      if (selectedReq !== 'ALL') url += `&requisitionId=${selectedReq}`;

      const [appRes, reqRes] = await Promise.all([
        fetch(url),
        fetch(`/api/requisitions?orgId=${organization.id}`),
      ]);

      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data.applications || []);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequisitions(reqData.requisitions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [organization, selectedReq]);

  const handleMoveStage = async (appId: string, newStage: string) => {
    setIsMoving(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          newStatus: newStage,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Candidate Stage Updated', `Candidate transitioned to ${newStage.replace(/_/g, ' ')}.`, 'success');
        setActiveAppToMove(null);
        fetchPipeline();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // Filter applications by search query
  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const name = `${app.candidate?.firstName} ${app.candidate?.lastName}`.toLowerCase();
    const title = app.requisition?.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || title.includes(query);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Talent Pipeline</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-600" />
              Live ATS Board
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual recruitment lifecycle from initial application to offer acceptance & onboarding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/candidates"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition"
          >
            Candidate Database
          </Link>
          <Link
            href="/interviews"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Interviews Hub</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedReq}
            onChange={(e) => setSelectedReq(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
          >
            <option value="ALL">All Requisitions ({requisitions.length})</option>
            {requisitions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.reqNumber}: {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 items-start min-w-[1900px]">
          {STAGES.filter((s) => s.id !== 'REJECTED').map((stage) => {
            const stageApps = filteredApps.filter((app) => app.status === stage.id);

            return (
              <div
                key={stage.id}
                className="kanban-col bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[80vh] shadow-subtle"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 tracking-tight">{stage.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-slate-700 border shadow-2xs">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards Column */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageApps.map((app) => {
                    const cand = app.candidate;
                    const skills = cand?.skills ? (typeof cand.skills === 'string' ? JSON.parse(cand.skills) : cand.skills) : [];

                    return (
                      <div
                        key={app.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-enterprise hover:border-indigo-400 hover:shadow-glow transition space-y-3 group"
                      >
                        {/* Header: Name and AI Match */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/candidates/${cand?.id}`}
                              className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition block leading-tight"
                            >
                              {cand?.firstName} {cand?.lastName}
                            </Link>
                            <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                              {cand?.currentTitle || cand?.headline || 'Applicant'}
                            </p>
                          </div>

                          {cand?.aiMatchScore && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                              {cand.aiMatchScore}%
                            </span>
                          )}
                        </div>

                        {/* Requisition Title */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{app.requisition?.title}</span>
                        </div>

                        {/* Parsed Skill Tags */}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 3).map((sk: string, i: number) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Quick Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setActiveAppToMove(app);
                              setTargetStage(app.status);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Move Stage</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>

                          <Link
                            href={`/candidates/${cand?.id}`}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            360 Profile
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {stageApps.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 border-2 border-dashed border-slate-200/60 rounded-xl">
                      No candidates in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Transition Modal */}
      {activeAppToMove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Advance Candidate Stage
            </h3>
            <p className="text-xs text-slate-500">
              Move <strong>{activeAppToMove.candidate?.firstName} {activeAppToMove.candidate?.lastName}</strong> for{' '}
              <strong>{activeAppToMove.requisition?.title}</strong>.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Target Stage</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 font-medium"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveAppToMove(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMoving}
                onClick={() => handleMoveStage(activeAppToMove.id, targetStage)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {isMoving ? 'Transitioning...' : 'Confirm Stage Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Pipeline...</div>}>
      <PipelineContent />
    </Suspense>
  );
}
