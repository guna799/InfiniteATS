export const STAGES = [
  { id: 'APPLIED', label: 'Applied', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'SCREENING', label: 'Screening', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'PHONE_SCREEN', label: 'Phone Screen', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'TECHNICAL_INTERVIEW', label: 'Technical Round', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'HIRING_MANAGER_INTERVIEW', label: 'Manager Interview', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'ONSITE_PANEL', label: 'Onsite / Panel', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'EVALUATION', label: 'Evaluation / Debrief', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'OFFER_EXTENDED', label: 'Offer Extended', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'OFFER_ACCEPTED', label: 'Offer Accepted / Preboarding', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'ONBOARDED', label: 'Hired & Active Employee', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'REJECTED', label: 'Disqualified', color: 'bg-rose-50 text-rose-700 border-rose-200' },
] as const;

export const REQUISITION_STATUSES = [
  { id: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-amber-100 text-amber-800' },
  { id: 'APPROVED', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  { id: 'OPEN', label: 'Open & Active', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'PAUSED', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'CLOSED', label: 'Closed / Filled', color: 'bg-purple-100 text-purple-800' },
  { id: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-100 text-rose-800' },
] as const;

export const OFFER_STATUSES = [
  { id: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { id: 'PENDING_APPROVAL', label: 'In Approval', color: 'bg-amber-100 text-amber-800' },
  { id: 'APPROVED', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  { id: 'EXTENDED', label: 'Extended to Candidate', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'ACCEPTED', label: 'Accepted & Signed', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'DECLINED', label: 'Candidate Declined', color: 'bg-rose-100 text-rose-800' },
  { id: 'RESCINDED', label: 'Rescinded', color: 'bg-zinc-200 text-zinc-700' },
] as const;

export const ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full tenant configuration, billing, security, and enterprise settings' },
  { id: 'RECRUITING_ADMIN', label: 'Talent Acquisition Director', description: 'Manages all requisitions, recruiters, workflows, and integrations' },
  { id: 'RECRUITER', label: 'Senior Recruiter', description: 'Sources candidates, manages pipeline stages, schedules interviews, drafts offers' },
  { id: 'HIRING_MANAGER', label: 'Hiring Manager', description: 'Reviews requisitions, approves offers, evaluates candidates, provides feedback' },
  { id: 'INTERVIEWER', label: 'Interviewer', description: 'Conducts assigned interviews and submits structured scorecards' },
  { id: 'HR_OPS', label: 'HR Operations & Onboarding', description: 'Manages compliance, I-9, equipment provisioning, employee records' },
  { id: 'EXECUTIVE', label: 'Executive Leadership', description: 'Read-only visibility into talent analytics, headcount, and compensation approvals' },
] as const;

export const SCORECARD_RECOMMENDATIONS = [
  { id: 'STRONG_YES', label: 'Strong Yes (Top 5%)', color: 'bg-emerald-600 text-white hover:bg-emerald-700', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'YES', label: 'Yes (Hire)', color: 'bg-blue-600 text-white hover:bg-blue-700', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'NEUTRAL', label: 'Neutral (Need Discussion)', color: 'bg-amber-500 text-white hover:bg-amber-600', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'NO', label: 'No (Do Not Hire)', color: 'bg-orange-600 text-white hover:bg-orange-700', badgeColor: 'bg-orange-100 text-orange-800' },
  { id: 'STRONG_NO', label: 'Strong No', color: 'bg-rose-600 text-white hover:bg-rose-700', badgeColor: 'bg-rose-100 text-rose-800' },
] as const;
