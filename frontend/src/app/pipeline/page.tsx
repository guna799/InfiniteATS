'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, Calendar, Search, Sparkles } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useRealtime } from '@/providers/RealtimeProvider';
import {
  PipelineCard,
  useMoveStage,
  usePipelineBoard,
  usePipelineLiveUpdates,
  usePipelineStages,
} from '@/hooks/usePipeline';

export const dynamic = 'force-dynamic';

const STAGE_COLORS: Record<string, string> = {
  APPLIED: 'border-t-slate-300',
  SCREENING: 'border-t-blue-300',
  PHONE_SCREEN: 'border-t-indigo-300',
  TECHNICAL_INTERVIEW: 'border-t-purple-300',
  HIRING_MANAGER_INTERVIEW: 'border-t-cyan-300',
  ONSITE_PANEL: 'border-t-violet-300',
  EVALUATION: 'border-t-amber-300',
  OFFER_EXTENDED: 'border-t-orange-300',
  OFFER_ACCEPTED: 'border-t-emerald-300',
  ONBOARDED: 'border-t-teal-300',
};

const RECENT_MS = 10_000;

function LiveIndicator() {
  const { status } = useRealtime();
  const styles: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    connecting: 'bg-slate-50 text-slate-600 border-slate-200',
    reconnecting: 'bg-amber-50 text-amber-700 border-amber-200',
    offline: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  const labels: Record<string, string> = {
    live: 'Live',
    connecting: 'Connecting…',
    reconnecting: 'Reconnecting…',
    offline: 'Offline',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-60'}`} />
      {labels[status]}
    </span>
  );
}

function PipelineContent() {
  const searchParams = useSearchParams();
  const { showToast, backendUserId } = useTenant();
  const [selectedReq, setSelectedReq] = useState(searchParams.get('reqId') || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [moving, setMoving] = useState<PipelineCard | null>(null);
  const [targetStage, setTargetStage] = useState('');
  const [reason, setReason] = useState('');
  // applicationId -> who moved it and when, for the "moved just now" badge
  const [recent, setRecent] = useState<Record<string, { by: string; at: number }>>({});

  const stagesQuery = usePipelineStages();
  const boardQuery = usePipelineBoard(selectedReq);
  const stages = stagesQuery.data ?? [];
  const columns = stages.filter((s) => !s.terminal);
  const labelOf = (id: string) => stages.find((s) => s.id === id)?.label ?? id.replace(/_/g, ' ');

  usePipelineLiveUpdates((event) => {
    const p = event.payload;
    setRecent((r) => ({ ...r, [p.applicationId]: { by: p.actorName, at: Date.now() } }));
    if (event.actorId !== backendUserId) {
      showToast(`${p.actorName} moved ${p.candidateName}`, `${labelOf(p.fromStage)} → ${labelOf(p.toStage)}`, 'info');
    }
  });

  // Expire "moved just now" badges
  useEffect(() => {
    if (Object.keys(recent).length === 0) return;
    const timer = setTimeout(() => {
      const cutoff = Date.now() - RECENT_MS;
      setRecent((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v.at > cutoff)));
    }, 1000);
    return () => clearTimeout(timer);
  }, [recent]);

  const move = useMoveStage({
    onConflict: (current) =>
      showToast(
        'Someone else moved this candidate first',
        `${current.candidate.name} is now in ${labelOf(current.stage)}. Review and try again.`,
        'warning'
      ),
    onError: (message) => showToast('Could not move candidate', message, 'error'),
  });

  const cards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (boardQuery.data?.cards ?? []).filter(
      (c) => !q || c.candidate.name.toLowerCase().includes(q) || c.requisition.title.toLowerCase().includes(q)
    );
  }, [boardQuery.data, searchQuery]);
  const closedCount = cards.filter((c) => stages.find((s) => s.id === c.stage)?.terminal).length;
  const requisitions = boardQuery.data?.requisitions ?? [];

  const openMove = (card: PipelineCard) => {
    setMoving(card);
    setTargetStage(card.stage);
    setReason('');
  };

  const confirmMove = () => {
    if (!moving || targetStage === moving.stage) {
      setMoving(null);
      return;
    }
    move.mutate({ card: moving, stage: targetStage, reason: reason || undefined });
    setMoving(null);
  };

  const needsReason = targetStage === 'REJECTED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Talent Pipeline</h1>
            <LiveIndicator />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Changes made by anyone on your team appear here instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-3 w-full md:w-auto">
          {closedCount > 0 && <span className="text-[11px] text-slate-500 whitespace-nowrap">{closedCount} closed</span>}
          <select
            value={selectedReq}
            onChange={(e) => setSelectedReq(e.target.value)}
            aria-label="Requisition"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
          >
            <option value="ALL">All Requisitions ({requisitions.length})</option>
            {requisitions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.reqNumber ? `${r.reqNumber}: ` : ''}
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {boardQuery.isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <span>Could not load the pipeline. {(boardQuery.error as Error)?.message}</span>
          <button onClick={() => boardQuery.refetch()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 items-start min-w-[1900px]">
          {(boardQuery.isLoading || stagesQuery.isLoading) && (
            <p className="text-xs text-slate-500 p-4">Loading pipeline…</p>
          )}
          {columns.map((stage) => {
            const stageCards = cards.filter((c) => c.stage === stage.id);
            return (
              <div
                key={stage.id}
                className={`kanban-col bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 border-t-4 ${STAGE_COLORS[stage.id] ?? ''} flex flex-col max-h-[80vh] shadow-subtle`}
              >
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 tracking-tight">{stage.label}</span>
                    <span className="text-[10px] font-bold px-2 rounded-full bg-white text-slate-700 border shadow-2xs">
                      {stageCards.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageCards.map((card) => {
                    const recentMove = recent[card.applicationId];
                    return (
                      <div
                        key={card.applicationId}
                        className={`bg-white p-4 rounded-xl border shadow-enterprise transition space-y-3 ${
                          recentMove ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{card.candidate.name}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                            {card.candidate.headline || 'Applicant'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{card.requisition.title}</span>
                        </div>

                        {recentMove && (
                          <p className="text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Moved by {recentMove.by} just now
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => openMove(card)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Move Stage</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {stageCards.length === 0 && (
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
      {moving && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Move candidate</h3>
            <p className="text-xs text-slate-500">
              Move <strong>{moving.candidate.name}</strong> for <strong>{moving.requisition.title}</strong>. Your team
              sees the change immediately.
            </p>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="target-stage" className="text-xs font-bold text-slate-700">
                Target stage
              </label>
              <select
                id="target-stage"
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 font-medium"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {needsReason && (
              <div className="space-y-1.5">
                <label htmlFor="move-reason" className="text-xs font-bold text-slate-700">
                  Reason (required)
                </label>
                <input
                  id="move-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Skills mismatch"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setMoving(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={needsReason && !reason.trim()}
                onClick={confirmMove}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                Confirm move
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
