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
} from 'lucide-react';

export default function OnboardingPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // New task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('HR_COMPLIANCE');
  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [taskRole, setTaskRole] = useState('CANDIDATE');

  const fetchOnboarding = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/onboarding?orgId=${organization.id}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setEmployees(data.employees || []);
        if (data.employees?.length > 0 && !taskEmployeeId) {
          setTaskEmployeeId(data.employees[0].id);
        }
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

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category === selectedCategory;
  });

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
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automate IT hardware provisioning, I-9 compliance verification, NDA e-signatures, and Day 1 team introductions.
          </p>
        </div>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

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
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                        {t.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                        {t.category}
                      </span>
                      {t.signatureRequired && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <FileSignature className="h-2.5 w-2.5" />
                          Signature Required
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500">{t.description}</p>
                    {t.employee && (
                      <p className="text-[11px] text-indigo-600 font-semibold">
                        Assigned for: {t.employee.firstName} {t.employee.lastName} ({t.employee.title})
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs shrink-0">
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
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
