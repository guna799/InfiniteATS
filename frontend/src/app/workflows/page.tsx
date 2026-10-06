'use client';

import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import {
  Sparkles,
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Eye,
  FileCheck2,
  Users,
  Settings2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface WorkflowDef {
  id: string;
  name: string;
  triggerEvent: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  stepsCount: number;
  lastTriggered: string;
  executionCount: number;
}

interface ApprovalItem {
  id: string;
  entityType: 'REQUISITION' | 'OFFER' | 'SALARY_EXCEPTION';
  title: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: string;
}

export default function WorkflowsPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [activeTab, setActiveTab] = useState<'DEFINITIONS' | 'APPROVALS' | 'MONITOR'>('DEFINITIONS');

  const [workflows, setWorkflows] = useState<WorkflowDef[]>([
    {
      id: 'wf-1',
      name: 'Executive Requisition Approval Matrix',
      triggerEvent: 'REQUISITION_SUBMITTED',
      description: 'Routes multi-tier approvals through Hiring Manager, Finance Controller, and VP of Talent.',
      status: 'ACTIVE',
      stepsCount: 3,
      lastTriggered: '2 hours ago',
      executionCount: 42,
    },
    {
      id: 'wf-2',
      name: 'Offer Extended to Preboarding Automated Bridge',
      triggerEvent: 'OFFER_ACCEPTED',
      description: 'Instantly provisions employee record, triggers Aadhaar/PAN compliance tasks, and alerts IT.',
      status: 'ACTIVE',
      stepsCount: 5,
      lastTriggered: '10 mins ago',
      executionCount: 18,
    },
    {
      id: 'wf-3',
      name: 'High AI Match Candidate Fast-Track',
      triggerEvent: 'CANDIDATE_APPLIED',
      description: 'Auto-schedules preliminary screening for candidates with >90% AI competency score.',
      status: 'ACTIVE',
      stepsCount: 2,
      lastTriggered: 'Yesterday',
      executionCount: 115,
    },
  ]);

  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 'appr-1',
      entityType: 'REQUISITION',
      title: 'REQ-BLR-2026-104: Senior Product Designer',
      requestedBy: 'Priya Verma (Head of Product)',
      requestedAt: '3 hours ago',
      status: 'PENDING',
      details: 'Band L5 headcount backfill. Budget: ₹28,00,000 - ₹40,00,000 CTC.',
    },
    {
      id: 'appr-2',
      entityType: 'OFFER',
      title: 'Formal Offer: Venkata Karthik Guntupalli',
      requestedBy: 'Sravanthi Allu (Senior Technical Recruiter)',
      requestedAt: '1 day ago',
      status: 'PENDING',
      details: 'Principal Distributed Systems Engineer (₹55L Base CTC + ₹6L Joining Bonus + 25k ISOs).',
    },
  ]);

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    showToast('Approval Registered', 'Workflow advanced to next stage successfully.', 'success');
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
    showToast('Request Rejected', 'Notification sent to requester.', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Workflows & Process Automation</h1>
            <Badge variant="brand" className="gap-1">
              <Zap className="h-3 w-3" /> Event Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build event-driven recruitment lifecycles, authorization chains, and automated preboarding pipelines.
          </p>
        </div>

        <Button className="gap-2 text-xs shadow-md shadow-indigo-200" onClick={() => showToast('Workflow Builder', 'Opening visual trigger-action canvas...', 'info')}>
          <Plus className="h-3.5 w-3.5" />
          <span>New Workflow Definition</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DEFINITIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'DEFINITIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>Workflow Definitions ({workflows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'APPROVALS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Pending Approvals ({approvals.filter((a) => a.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MONITOR')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'MONITOR'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Play className="h-4 w-4" />
          <span>Execution Monitor</span>
        </button>
      </div>

      {/* Tab 1: Workflow Definitions */}
      {activeTab === 'DEFINITIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {wf.triggerEvent}
                  </span>
                  <Badge variant="success" className="text-[10px]">
                    {wf.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{wf.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{wf.description}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>{wf.stepsCount} Steps</span>
                  <span>•</span>
                  <span>{wf.executionCount} Runs</span>
                </div>
                <button
                  onClick={() => showToast('Edit Workflow', `Opening canvas for ${wf.name}`, 'info')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  title="Configure Steps"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Pending Approvals */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          {approvals.map((appr) => (
            <div
              key={appr.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {appr.entityType}
                  </span>
                  <span className="text-slate-400">• Requested {appr.requestedAt} by <strong className="text-slate-700">{appr.requestedBy}</strong></span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{appr.title}</h3>
                <p className="text-slate-600">{appr.details}</p>
              </div>

              {appr.status === 'PENDING' ? (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => handleReject(appr.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => handleApprove(appr.id)}
                  >
                    Authorize & Approve
                  </Button>
                </div>
              ) : (
                <Badge variant={appr.status === 'APPROVED' ? 'success' : 'destructive'}>
                  {appr.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Execution Monitor */}
      {activeTab === 'MONITOR' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Real-Time Event Bus & Execution Log</h3>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Event Engine Healthy (PostgreSQL + Redis Bus)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                id: 'evt-101',
                time: '10:42:15 AM',
                event: 'OFFER_ACCEPTED',
                entity: 'Candidate: Rakshitha Shetty',
                status: 'SUCCESS',
                duration: '142ms',
                actions: ['Created Employee EMP-1089', 'Initialized 6 Preboarding Tasks', 'Dispatched Slack Announcement'],
              },
              {
                id: 'evt-102',
                time: '09:15:30 AM',
                event: 'REQUISITION_APPROVED',
                entity: 'REQ-HYD-2026-101',
                status: 'SUCCESS',
                duration: '88ms',
                actions: ['Updated Requisition to OPEN', 'Published to External Career Portal', 'Notified Lead Recruiter'],
              },
              {
                id: 'evt-103',
                time: 'Yesterday 04:20 PM',
                event: 'SCORECARD_SUBMITTED',
                entity: 'Candidate: Venkata Karthik Guntupalli',
                status: 'SUCCESS',
                duration: '65ms',
                actions: ['Calculated Overall Score: 5.0 (Strong Yes)', 'Advanced Application to Offer Extension'],
              },
            ].map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold text-indigo-700">{log.event}</span>
                    <span className="text-slate-400">@ {log.time}</span>
                    <span className="text-slate-500 font-sans font-medium">• {log.entity}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                    {log.actions.map((act, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border text-slate-700">
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-slate-400 font-mono">{log.duration}</span>
                  <Badge variant="success" className="text-[10px]">
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
