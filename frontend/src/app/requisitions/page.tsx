'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';
import { REQUISITION_STATUSES } from '@/lib/constants';

export default function RequisitionsPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formLocationId, setFormLocationId] = useState('');
  const [formHMId, setFormHMId] = useState('');
  const [formRecruiterId, setFormRecruiterId] = useState('');
  const [formMinSalary, setFormMinSalary] = useState('180000');
  const [formMaxSalary, setFormMaxSalary] = useState('240000');
  const [formPriority, setFormPriority] = useState('HIGH');
  const [formHeadcountType, setFormHeadcountType] = useState('NEW_HEADCOUNT');
  const [formWorkplaceType, setFormWorkplaceType] = useState('HYBRID');
  const [formOpenings, setFormOpenings] = useState('1');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequisitions = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      let url = `/api/requisitions?orgId=${organization.id}`;
      if (activeTab !== 'ALL') url += `&status=${activeTab}`;
      if (selectedDept !== 'ALL') url += `&departmentId=${selectedDept}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequisitions(data.requisitions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [organization, activeTab, selectedDept, searchQuery]);

  // Set default form values when organization loads
  useEffect(() => {
    if (organization?.departments?.length) {
      setFormDeptId(organization.departments[0].id);
    }
    if (organization?.locations?.length) {
      setFormLocationId(organization.locations[0].id);
    }
  }, [organization]);

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !currentUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          title: formTitle,
          departmentId: formDeptId,
          locationId: formLocationId,
          hiringManagerId: formHMId || currentUser.id,
          recruiterId: formRecruiterId || currentUser.id,
          minSalary: formMinSalary,
          maxSalary: formMaxSalary,
          priority: formPriority,
          headcountType: formHeadcountType,
          workplaceType: formWorkplaceType,
          openingsCount: formOpenings,
          description: formDescription || 'Enterprise role responsible for high impact product delivery.',
          requirements: formRequirements || '5+ years experience, relevant technical competencies, degree or equivalent.',
          benefits: formBenefits || 'Comprehensive medical/dental, 401(k) matching, equity options.',
          submitForApproval: true,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Requisition Created', 'Submitted for executive and hiring manager approval.', 'success');
        setIsCreateModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormRequirements('');
        fetchRequisitions();
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'Failed to create requisition', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickApprove = async (reqId: string) => {
    try {
      const res = await fetch(`/api/requisitions/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          comments: 'Approved via executive quick action',
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Requisition Approved', 'Requisition is now Open and published to careers portal.', 'success');
        fetchRequisitions();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Job Requisitions</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {requisitions.length} Requisitions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage headcount approvals, compensation bounds, hiring teams, and job postings.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {['ALL', 'OPEN', 'PENDING_APPROVAL', 'APPROVED', 'DRAFT', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Department Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, requisition #, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Departments</option>
              {organization?.departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Requisitions List */}
      <div className="grid grid-cols-1 gap-4">
        {requisitions.map((req) => {
          const statusMeta = REQUISITION_STATUSES.find((s) => s.id === req.status);
          const pendingApproval = req.approvalChains?.find((c: any) => c.status === 'PENDING');

          return (
            <div
              key={req.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-300 transition space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                      {req.reqNumber}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusMeta?.color}`}>
                      {statusMeta?.label || req.status}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {req.workplaceType}
                    </span>
                    {req.priority === 'URGENT' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                        Urgent Headcount
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/requisitions/${req.id}`}
                    className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition block"
                  >
                    {req.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {req.department?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {req.location?.name}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      ${(req.minSalary / 1000).toFixed(0)}k - ${(req.maxSalary / 1000).toFixed(0)}k {req.currency}
                    </span>
                  </div>
                </div>

                {/* Right Team and Actions */}
                <div className="flex flex-wrap items-center gap-4 lg:self-center">
                  <div className="text-xs space-y-0.5 border-l pl-4 border-slate-100">
                    <p className="text-slate-500">
                      Hiring Manager: <span className="font-semibold text-slate-800">{req.hiringManager?.name}</span>
                    </p>
                    <p className="text-slate-500">
                      Recruiter: <span className="font-semibold text-slate-800">{req.recruiter?.name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => handleQuickApprove(req.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve & Open</span>
                      </button>
                    )}

                    <Link
                      href={`/requisitions/${req.id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

              </div>

              {/* Progress and Candidate stats bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    {req.applications?.length || 0} Total Applicants
                  </span>
                  <span>•</span>
                  <span>Target Start: {req.targetStartDate ? new Date(req.targetStartDate).toLocaleDateString() : 'Immediate'}</span>
                </div>

                <span className="font-semibold text-slate-700">
                  {req.filledCount} of {req.openingsCount} Openings Filled
                </span>
              </div>

            </div>
          );
        })}

        {requisitions.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No Job Requisitions Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or create a new job requisition.</p>
          </div>
        )}
      </div>

      {/* Create Requisition Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Job Requisition</h2>
                <p className="text-xs text-slate-500">Initiate new headcount with compensation and approval workflow</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Department *</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    {organization?.departments?.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Location *</label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    {organization?.locations?.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Min Salary (USD) *</label>
                  <input
                    type="number"
                    required
                    value={formMinSalary}
                    onChange={(e) => setFormMinSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Max Salary (USD) *</label>
                  <input
                    type="number"
                    required
                    value={formMaxSalary}
                    onChange={(e) => setFormMaxSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Headcount Type</label>
                  <select
                    value={formHeadcountType}
                    onChange={(e) => setFormHeadcountType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="NEW_HEADCOUNT">New Headcount (Growth)</option>
                    <option value="BACKFILL">Backfill (Replacement)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Workplace Type</label>
                  <select
                    value={formWorkplaceType}
                    onChange={(e) => setFormWorkplaceType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ON_SITE">On-Site</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Job Description & Responsibilities</label>
                <textarea
                  rows={3}
                  placeholder="Describe key responsibilities and impact..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Requirements & Qualifications</label>
                <textarea
                  rows={2}
                  placeholder="Key competencies, years of experience, technical skills..."
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Requisition for Approval'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
