'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Users,
  Network,
  Search,
  Filter,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  UserCheck,
} from 'lucide-react';

export default function EmployeesPage() {
  const { organization } = useTenant();
  const [employees, setEmployees] = useState<any[]>([]);
  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'DIRECTORY' | 'ORG_CHART'>('DIRECTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const fetchEmployees = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      let url = `/api/employees?orgId=${organization.id}`;
      if (selectedDept !== 'ALL') url += `&departmentId=${selectedDept}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setOrgTree(data.orgTree || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [organization, selectedDept, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Employee Directory & Org Chart</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {employees.length} Team Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global workforce directory, reporting hierarchy tree, and employee 360 records.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('DIRECTORY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'DIRECTORY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Directory</span>
          </button>
          <button
            onClick={() => setViewMode('ORG_CHART')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'ORG_CHART'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Visual Org Chart</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name, title, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
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

      {/* Mode 1: Directory Cards */}
      {viewMode === 'DIRECTORY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-400 hover:shadow-glow cursor-pointer transition space-y-3"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.firstName + ' ' + emp.lastName)}&background=6366f1&color=fff`}
                  alt={emp.firstName}
                  className="h-12 w-12 rounded-xl object-cover border"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {emp.employeeNumber}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-indigo-600 truncate">{emp.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{emp.department?.name}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="truncate">
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <span className="font-medium text-slate-700">{emp.location?.name || 'HQ'}</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-400 block text-[10px]">Manager</span>
                  <span className="font-medium text-slate-700">{emp.manager?.name || 'Executive'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {emp.status}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Started {new Date(emp.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 2: Interactive Visual Org Chart */}
      {viewMode === 'ORG_CHART' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-enterprise overflow-x-auto space-y-8 min-h-[500px]">
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Organizational Hierarchy Tree</h2>
            <p className="text-xs text-slate-500">Visual reporting structure and department distribution</p>
          </div>

          <div className="flex flex-col items-center gap-8">
            {/* Top Level Execs / Managers */}
            {orgTree
              .filter((e) => !e.managerId || e.title?.includes('VP') || e.title?.includes('Director') || e.title?.includes('Head'))
              .map((leader) => (
                <div key={leader.id} className="flex flex-col items-center space-y-4">
                  {/* Leader Node Card */}
                  <div
                    onClick={() => setSelectedEmployee(leader)}
                    className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-400/40 w-72 cursor-pointer hover:scale-105 transition transform"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={leader.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.firstName + ' ' + leader.lastName)}&background=6366f1&color=fff`}
                        alt={leader.firstName}
                        className="h-10 w-10 rounded-full border border-indigo-400/50 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-white truncate">{leader.firstName} {leader.lastName}</p>
                        <p className="text-xs text-indigo-300 truncate">{leader.title}</p>
                        <p className="text-[10px] text-slate-400">{leader.department?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Line */}
                  {leader.directReports?.length > 0 && (
                    <div className="w-0.5 h-6 bg-indigo-300" />
                  )}

                  {/* Direct Reports Row */}
                  {leader.directReports?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                      {leader.directReports.map((sub: any) => (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedEmployee(sub)}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-md w-64 cursor-pointer hover:border-indigo-500 hover:bg-white transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={sub.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.firstName + ' ' + sub.lastName)}&background=6366f1&color=fff`}
                              alt={sub.firstName}
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <p className="font-bold text-slate-900 truncate">{sub.firstName} {sub.lastName}</p>
                              <p className="text-indigo-600 truncate text-[11px]">{sub.title}</p>
                              <p className="text-slate-400 text-[10px]">{sub.location?.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Employee 360 Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.firstName + ' ' + selectedEmployee.lastName)}&background=6366f1&color=fff`}
                  alt="avatar"
                  className="h-14 w-14 rounded-2xl border object-cover"
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-indigo-600 font-semibold">{selectedEmployee.title}</p>
                  <span className="text-[10px] font-mono text-slate-500">{selectedEmployee.employeeNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <span className="text-slate-400 block text-[10px]">Work Email</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.workEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.department?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.location?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Start Date</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedEmployee.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedEmployee.bio && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800">Professional Bio</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border">
                    {selectedEmployee.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
