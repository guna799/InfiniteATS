'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import {
  Settings,
  Building2,
  ShieldCheck,
  Webhook,
  Sliders,
  History,
  CheckCircle2,
  Plus,
  Save,
  Key,
  ExternalLink,
  X,
} from 'lucide-react';
import { ROLES } from '@/lib/constants';

export default function SettingsPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [activeTab, setActiveTab] = useState<'ORGANIZATION' | 'RBAC' | 'CUSTOM_FIELDS' | 'WEBHOOKS' | 'AUDIT_LOGS'>('ORGANIZATION');

  // Org Settings State
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/New_York');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Webhook creation modal
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['OFFER_ACCEPTED', 'EMPLOYEE_CREATED']);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setPrimaryColor(organization.primaryColor || '#4f46e5');
      setCurrency(organization.currency || 'USD');
      setTimezone(organization.timezone || 'America/New_York');
      fetchLogsAndWebhooks();
    }
  }, [organization]);

  const fetchLogsAndWebhooks = async () => {
    if (!organization) return;
    try {
      const [logsRes, whRes] = await Promise.all([
        fetch(`/api/settings/audit-logs?orgId=${organization.id}`),
        fetch(`/api/settings/webhooks?orgId=${organization.id}`),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.auditLogs || []);
      }
      if (whRes.ok) {
        const whData = await whRes.json();
        setWebhooks(whData.webhooks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          name: orgName,
          primaryColor,
          currency,
          timezone,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Settings Saved', 'Organization tenant settings updated successfully.', 'success');
        fetchLogsAndWebhooks();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !webhookName || !webhookUrl) return;

    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          name: webhookName,
          url: webhookUrl,
          events: webhookEvents,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Webhook Registered', 'Integration webhook created with signing secret.', 'success');
        setIsWebhookModalOpen(false);
        setWebhookName('');
        setWebhookUrl('');
        fetchLogsAndWebhooks();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Enterprise Administration</h1>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            {organization?.subscriptionTier} TIER
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tenant settings, security administration, fine-grained RBAC permissions, and webhook integrations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'ORGANIZATION', label: 'Organization & Branding', icon: Building2 },
          { id: 'RBAC', label: 'Role-Based Access Control (RBAC)', icon: ShieldCheck },
          { id: 'WEBHOOKS', label: `Webhooks & APIs (${webhooks.length})`, icon: Webhook },
          { id: 'AUDIT_LOGS', label: `Compliance Audit Trail (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization & Branding */}
      {activeTab === 'ORGANIZATION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise max-w-2xl space-y-6 text-xs">
          <h2 className="text-base font-bold text-slate-900">Tenant Brand & Regional Configuration</h2>

          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Organization Legal Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Primary Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 rounded-lg border p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-medium"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Corporate Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-medium"
              >
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: RBAC Inspector */}
      {activeTab === 'RBAC' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Enterprise Role-Based Access Control (RBAC)</h2>
            <p className="text-slate-500">Fine-grained permission boundaries and organizational personas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{r.label}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border">
                    {r.id}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === 'WEBHOOKS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Webhook Integration Endpoints</h2>
              <p className="text-slate-500">Real-time HTTP event triggers for Workday, Slack, and internal HRIS</p>
            </div>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Register Webhook</span>
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{wh.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Secret: {wh.secret?.slice(0, 12)}...
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border truncate">
                  {wh.url}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Immutable Compliance Audit Log</h2>
            <p className="text-slate-500">Full tamper-evident record of all status changes, approvals, and candidate transitions</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Actor: <span className="font-semibold text-slate-800">{log.actorName}</span> ({log.actorEmail})
                  </p>
                  {log.newState && (
                    <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border max-w-xl truncate">
                      {log.newState}
                    </p>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Webhook Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Register Webhook Endpoint</h2>
              <button onClick={() => setIsWebhookModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HRIS Webhook Relay"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/candidate-events"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
