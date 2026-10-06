'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  Laptop,
  FileCheck,
  Users,
  Shield,
  HeartHandshake,
  AlertCircle,
  Plus,
  ChevronRight,
  X,
  FileSignature,
  FileText,
  UploadCloud,
  Eye,
  Download,
  Check,
  Ban,
  ShieldCheck,
  Database,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function OnboardingPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'S3_VAULT'>('S3_VAULT');
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDocCategory, setSelectedDocCategory] = useState('ALL');
  const [selectedDocStatus, setSelectedDocStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [s3Health, setS3Health] = useState<any>(null);

  // New task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('HR_COMPLIANCE');
  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [taskRole, setTaskRole] = useState('CANDIDATE');

  // Document Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('PAN');
  const [uploadCategory, setUploadCategory] = useState('IDENTITY');
  const [uploadCandidateId, setUploadCandidateId] = useState('');
  const [uploadEmployeeId, setUploadEmployeeId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Rejection Modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchOnboarding = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const [onbRes, docRes, healthRes] = await Promise.all([
        fetch(`/api/onboarding?orgId=${organization.id}`),
        fetch(`/api/documents?orgId=${organization.id}`),
        fetch(`/api/documents/health`),
      ]);

      if (onbRes.ok) {
        const data = await onbRes.json();
        setTasks(data.tasks || []);
        setEmployees(data.employees || []);
        if (data.employees?.length > 0 && !taskEmployeeId) {
          setTaskEmployeeId(data.employees[0].id);
          setUploadEmployeeId(data.employees[0].id);
        }
      }

      if (docRes.ok) {
        const dData = await docRes.json();
        setDocuments(dData.documents || []);
      }

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setS3Health(hData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, [organization]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          status: nextStatus,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Task Status Updated', `Marked as ${nextStatus}.`, 'success');
        fetchOnboarding();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !taskTitle) return;

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          employeeId: taskEmployeeId || null,
          title: taskTitle,
          description: taskDescription,
          category: taskCategory,
          assignedRole: taskRole,
        }),
      });

      if (res.ok) {
        showToast('Task Created', 'Added to onboarding checklist.', 'success');
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        fetchOnboarding();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleVerifyDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedBy: currentUser?.id || 'admin' }),
      });

      if (res.ok) {
        showToast('Document Verified', 'Marked as VERIFIED with cryptographic audit chain record.', 'success');
        fetchOnboarding();
      } else {
        const err = await res.json();
        showToast('Verification Failed', err.error, 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleRejectDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDocId || !rejectionReason.trim()) return;

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/documents/${rejectingDocId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
          actorId: currentUser?.id || 'admin',
        }),
      });

      if (res.ok) {
        showToast('Document Rejected', 'Candidate notified to submit corrected replacement.', 'info');
        setRejectingDocId(null);
        setRejectionReason('');
        fetchOnboarding();
      } else {
        const err = await res.json();
        showToast('Rejection Failed', err.error, 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        showToast('Download Error', data.error || 'Failed to generate signed download URL', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !uploadFile) {
      showToast('File Required', 'Please choose a document file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('orgId', organization.id);
      formData.append('documentType', uploadDocType);
      formData.append('category', uploadCategory);
      if (uploadEmployeeId) formData.append('employeeId', uploadEmployeeId);
      if (uploadCandidateId) formData.append('candidateId', uploadCandidateId);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          'Document Uploaded to AWS S3',
          `${data.document.documentType} stored at ${data.document.s3Key} (SHA-256 verified)`,
          'success'
        );
        setIsUploadModalOpen(false);
        setUploadFile(null);
        fetchOnboarding();
      } else {
        showToast('Upload Failed', data.error || 'Failed to upload document', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category === selectedCategory;
  });

  const filteredDocuments = documents.filter((doc) => {
    if (selectedDocCategory !== 'ALL' && doc.category !== selectedDocCategory) return false;
    if (selectedDocStatus !== 'ALL' && doc.status !== selectedDocStatus) return false;
    return true;
  });

  const pendingDocsCount = documents.filter((d) => d.status === 'PENDING_VERIFICATION' || d.status === 'UPLOADED').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Preboarding & Onboarding Hub</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {employees.length} New Hires
            </span>
            {pendingDocsCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {pendingDocsCount} Docs Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise AWS S3 Candidate Document Vault, Statutory Verification (PAN/Aadhaar), and Preboarding Tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-200 transition"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document to S3</span>
          </button>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      {/* S3 Storage & Compliance Telemetry Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Enterprise AWS S3 Storage & RLS Tenant Vault</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {s3Health?.s3?.status || 'ONLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Bucket: <code className="text-violet-300 font-mono">{s3Health?.s3?.bucket || 'infiniteatsbucket'}</code> • Region: <code className="text-violet-300 font-mono">{s3Health?.s3?.region || 'us-east-2'}</code> • Block Public Access: <strong className="text-emerald-400">ENFORCED</strong> • SHA-256 Hashing: <strong className="text-emerald-400">ACTIVE</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Vault Documents</span>
            <span className="font-mono font-bold text-base text-white">{documents.length} Records</span>
          </div>
          <button
            onClick={fetchOnboarding}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-200 transition"
            title="Refresh Vault Telemetry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('S3_VAULT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'S3_VAULT'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>S3 Document Verification Vault</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'S3_VAULT' ? 'bg-violet-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TASKS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'TASKS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Cohorts & Workflow Tasks</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'TASKS' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tasks.length}
          </span>
        </button>
      </div>

      {/* TAB 1: S3 Document Verification Vault */}
      {activeTab === 'S3_VAULT' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-enterprise flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Category:</span>
              {[
                { id: 'ALL', label: 'All Categories' },
                { id: 'IDENTITY', label: 'Identity (PAN/Aadhaar/Passport)' },
                { id: 'EDUCATION', label: 'Education' },
                { id: 'EXPERIENCE', label: 'Experience' },
                { id: 'STATUTORY', label: 'Statutory (Form 11/PF)' },
                { id: 'BANKING', label: 'Banking' },
                { id: 'EMPLOYMENT', label: 'Offer & Employment' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDocCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    selectedDocCategory === cat.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Status:</span>
              <select
                value={selectedDocStatus}
                onChange={(e) => setSelectedDocStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border rounded-xl text-slate-900 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Candidate & Employee Onboarding Document Catalogue</h2>
                <p className="text-xs text-slate-500">Every binary is securely persisted in S3 with SHA-256 metadata registered in PostgreSQL</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Showing {filteredDocuments.length} Documents
              </span>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">No documents matching filter criteria.</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload First Document</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Document Details</th>
                      <th className="p-4">Owner / Associated Entity</th>
                      <th className="p-4">S3 Location & Hash</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map((doc) => {
                      const isPending = doc.status === 'PENDING_VERIFICATION' || doc.status === 'UPLOADED';
                      const isVerified = doc.status === 'VERIFIED';
                      const isRejected = doc.status === 'REJECTED';

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">
                                  {doc.documentType}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {doc.originalFilename} • {(doc.fileSize / 1024).toFixed(1)} KB • v{doc.version}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            {doc.candidate ? (
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {doc.candidate.firstName} {doc.candidate.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400">Candidate • {doc.candidate.email}</span>
                              </div>
                            ) : doc.employee ? (
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {doc.employee.firstName} {doc.employee.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400">Employee • {doc.employee.title}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">General Tenant Asset</span>
                            )}
                          </td>

                          <td className="p-4 max-w-xs truncate">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-600 block truncate" title={doc.s3Key}>
                                {doc.s3Key}
                              </span>
                              <span className="text-[9px] font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200 block truncate" title={doc.sha256Hash}>
                                SHA: {doc.sha256Hash?.slice(0, 16)}...
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                            {isRejected && doc.rejectionReason && (
                              <span className="text-[10px] text-rose-600 block mt-1">
                                Reason: {doc.rejectionReason}
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDownloadDocument(doc.id)}
                                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                title="Download / Preview via Presigned S3 URL"
                              >
                                <Download className="h-4 w-4" />
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleVerifyDocument(doc.id)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition"
                                    title="1-Click Approve Document"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Verify</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectingDocId(doc.id);
                                      setRejectionReason('');
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 flex items-center gap-1 transition"
                                    title="Reject with Reason"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Cohorts & Workflow Tasks */}
      {activeTab === 'TASKS' && (
        <div className="space-y-8">
          {/* Active New Hires Progress Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Active Onboarding Cohorts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                const empTasks = emp.onboardingTasks || [];
                const completedCount = empTasks.filter((t: any) => t.status === 'COMPLETED').length;
                const progressPct = empTasks.length > 0 ? Math.round((completedCount / empTasks.length) * 100) : 100;

                return (
                  <div
                    key={emp.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.firstName + ' ' + emp.lastName)}&background=6366f1&color=fff`}
                          alt={emp.firstName}
                          className="h-12 w-12 rounded-xl object-cover border"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </h3>
                          <p className="text-xs text-slate-500">{emp.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {emp.department?.name} • Start: {new Date(emp.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Checklist Progress</span>
                        <span className="font-bold text-indigo-600">{progressPct}% ({completedCount}/{empTasks.length})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Checklist Management */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Enterprise Onboarding Checklist</h2>
                <p className="text-xs text-slate-500">Cross-department workflows for IT, HR, and Hiring Managers</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All Tasks' },
                  { id: 'IT_SETUP', label: 'IT Setup' },
                  { id: 'HR_COMPLIANCE', label: 'HR Compliance' },
                  { id: 'TEAM_INTRO', label: 'Team Intro' },
                  { id: 'BENEFITS', label: 'Benefits' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {filteredTasks.map((t) => {
                const isDone = t.status === 'COMPLETED';

                return (
                  <div
                    key={t.id}
                    className="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-4 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(t.id, t.status)}
                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-600 bg-white'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>

                      <div>
                        <span
                          className={`text-xs font-bold ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.title}
                        </span>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.category}
                          </span>
                          {t.employee && (
                            <span>
                              Assigned to: {t.employee.firstName} {t.employee.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-violet-600" />
                <h2 className="text-base font-bold text-slate-900">Upload Document to S3 Vault</h2>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Document Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="IDENTITY">Identity Documents</option>
                    <option value="RESUME">Resume & Cover Letter</option>
                    <option value="EDUCATION">Education Certificates</option>
                    <option value="EXPERIENCE">Experience Proof</option>
                    <option value="STATUTORY">Indian Statutory (PAN/Aadhaar/PF)</option>
                    <option value="BANKING">Banking & Cheque</option>
                    <option value="EMPLOYMENT">Employment & NDA</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Document Type *</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="PAN">PAN Card</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="HIGHEST_EDUCATION_CERTIFICATE">Degree / Highest Education</option>
                    <option value="MARKSHEET">Education Marksheet</option>
                    <option value="EXPERIENCE_LETTER">Experience Letter</option>
                    <option value="RELIEVING_LETTER">Relieving Letter</option>
                    <option value="SALARY_SLIP">Salary Slip</option>
                    <option value="FORM_16">Form 16</option>
                    <option value="BANK_PROOF">Bank Proof / Cancelled Cheque</option>
                    <option value="FORM_11">Form 11 (Statutory PF)</option>
                    <option value="UAN">UAN Document</option>
                    <option value="SIGNED_OFFER_LETTER">Signed Offer Letter</option>
                    <option value="NDA">Non-Disclosure Agreement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Associate with Employee (Optional)</label>
                <select
                  value={uploadEmployeeId}
                  onChange={(e) => setUploadEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                >
                  <option value="">-- None (Or general document) --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.title})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Choose File (PDF, DOCX, JPG, PNG - Max 20MB) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>{isUploading ? 'Uploading to AWS S3...' : 'Upload & Register Hash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Rejection Modal with Mandatory Reason */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="h-5 w-5" />
                <h2 className="text-base font-bold text-slate-900">Reject Document</h2>
              </div>
              <button onClick={() => setRejectingDocId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectDocument} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mandatory Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Blurry scan. Aadhaar number and DOB are illegible. Please re-upload a clean color copy."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingDocId(null)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Onboarding Task</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Hire Employee</label>
                <select
                  value={taskEmployeeId}
                  onChange={(e) => setTaskEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.title})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Week 1 Team Lunch"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                >
                  <option value="IT_SETUP">IT & Hardware Setup</option>
                  <option value="HR_COMPLIANCE">HR & Legal Compliance</option>
                  <option value="TEAM_INTRO">Team & Manager Intro</option>
                  <option value="BENEFITS">Benefits & Payroll</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
