'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Calendar,
  FileCheck2,
  Plus,
} from 'lucide-react';
import { REQUISITION_STATUSES, STAGES } from '@/lib/constants';

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, showToast } = useTenant();
  const [requisition, setRequisition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'CANDIDATES' | 'DESCRIPTION' | 'APPROVAL_CHAIN' | 'TEAM'>('CANDIDATES');
  const [isLoading, setIsLoading] = useState(true);
  const [approvalComments, setApprovalComments] = useState('');

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/requisitions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequisition(data.requisition);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDetail();
    }
  }, [params.id]);

  const handleApprovalAction = async (action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/requisitions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments: approvalComments || (action === 'APPROVE' ? 'Approved' : 'Rejected'),
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast(action === 'APPROVE' ? 'Approval Recorded' : 'Requisition Rejected', '', 'success');
        setApprovalComments('');
        fetchDetail();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  if (isLoading || !requisition) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-slate-500">Loading Requisition details...</p>
      </div>
    );
  }

  const statusMeta = REQUISITION_STATUSES.find((s) => s.id === requisition.status);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/requisitions"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/pipeline?reqId=${requisition.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold border border-indigo-200 transition"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Open in Kanban Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                {requisition.reqNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusMeta?.color}`}>
                {statusMeta?.label || requisition.status}
              </span>
              {requisition.isPublished && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live on Careers Site
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{requisition.title}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {requisition.department?.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {requisition.location?.name} ({requisition.workplaceType})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                ${(requisition.minSalary / 1000).toFixed(0)}k - ${(requisition.maxSalary / 1000).toFixed(0)}k {requisition.currency}
              </span>
            </div>
          </div>

          {/* Quick Approval Action Box if Pending */}
          {requisition.status === 'PENDING_APPROVAL' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 lg:max-w-xs w-full">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Executive Approval Pending</span>
              </div>
              <input
                type="text"
                placeholder="Optional approval comments..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleApprovalAction('APPROVE')}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApprovalAction('REJECT')}
                  className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick KPI Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400">Total Applicants</p>
            <p className="text-base font-bold text-slate-900">{requisition.applications?.length || 0}</p>
          </div>
          <div>
            <p className="text-slate-400">Headcount Target</p>
            <p className="text-base font-bold text-slate-900">
              {requisition.filledCount} of {requisition.openingsCount} filled
            </p>
          </div>
          <div>
            <p className="text-slate-400">Hiring Manager</p>
            <p className="text-base font-bold text-slate-900">{requisition.hiringManager?.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Lead Recruiter</p>
            <p className="text-base font-bold text-slate-900">{requisition.recruiter?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'CANDIDATES', label: `Candidates (${requisition.applications?.length || 0})` },
          { id: 'DESCRIPTION', label: 'Job Description & Requirements' },
          { id: 'APPROVAL_CHAIN', label: `Approval Workflow (${requisition.approvalChains?.length || 0})` },
          { id: 'TEAM', label: 'Hiring Team & Interviewers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'CANDIDATES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden divide-y divide-slate-100">
          {requisition.applications?.map((app: any) => {
            const cand = app.candidate;
            const stageMeta = STAGES.find((s) => s.id === app.status);

            return (
              <div key={app.id} className="p-5 hover:bg-slate-50/70 transition flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {cand.firstName[0]}{cand.lastName[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/candidates/${cand.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                        {cand.firstName} {cand.lastName}
                      </Link>
                      {cand.aiMatchScore && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cand.aiMatchScore}% AI Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{cand.headline || cand.currentTitle || 'Applicant'}</p>
                    <p className="text-[11px] text-slate-400">
                      Applied on {new Date(app.appliedDate).toLocaleDateString()} • Source: {app.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {stageMeta && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${stageMeta.color}`}>
                      {stageMeta.label}
                    </span>
                  )}
                  <Link
                    href={`/candidates/${cand.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {(!requisition.applications || requisition.applications.length === 0) && (
            <div className="p-12 text-center text-xs text-slate-500">
              No candidates have applied to this requisition yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'DESCRIPTION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Role Overview</h3>
            <p className="whitespace-pre-wrap">{requisition.description}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Key Qualifications & Requirements</h3>
            <p className="whitespace-pre-wrap">{requisition.requirements}</p>
          </div>

          {requisition.benefits && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Compensation & Benefits</h3>
              <p className="whitespace-pre-wrap">{requisition.benefits}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'APPROVAL_CHAIN' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Requisition Approval Workflow</h3>
          <div className="space-y-4">
            {requisition.approvalChains?.map((step: any, index: number) => (
              <div key={step.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="p-2 rounded-full bg-white border text-xs font-bold text-slate-700">
                  #{step.stepNumber || index + 1}
                </div>
                <div className="flex-1 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{step.approver?.name || 'Approver'}</p>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        step.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : step.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-slate-500">{step.approver?.title || step.approver?.email}</p>
                  {step.comments && (
                    <p className="text-slate-700 italic bg-white p-2 rounded border mt-2">"{step.comments}"</p>
                  )}
                  {step.approvedAt && (
                    <p className="text-[10px] text-slate-400">
                      Approved at {new Date(step.approvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TEAM' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Assigned Hiring Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hiring Manager</span>
              <p className="font-bold text-sm text-slate-900">{requisition.hiringManager?.name}</p>
              <p className="text-slate-500">{requisition.hiringManager?.email}</p>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Recruiter</span>
              <p className="font-bold text-sm text-slate-900">{requisition.recruiter?.name}</p>
              <p className="text-slate-500">{requisition.recruiter?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
