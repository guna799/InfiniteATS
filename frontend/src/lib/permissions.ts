export type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'HR_ADMIN'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'INTERVIEWER'
  | 'CANDIDATE'
  | 'EMPLOYEE';

export type Resource =
  | 'requisitions'
  | 'candidates'
  | 'applications'
  | 'interviews'
  | 'offers'
  | 'onboarding'
  | 'employees'
  | 'documents'
  | 'reports'
  | 'workflows'
  | 'forms'
  | 'settings'
  | 'auditLogs';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'manage';

// Permission Matrix mapping Role -> Resource -> Actions[]
export const ROLE_PERMISSIONS: Record<string, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    requisitions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    candidates: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    applications: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    interviews: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    offers: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    onboarding: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    employees: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    documents: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    reports: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    workflows: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    forms: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    settings: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    auditLogs: ['read', 'export', 'manage'],
  },
  RECRUITING_ADMIN: {
    requisitions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'],
    candidates: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    applications: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    interviews: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    offers: ['create', 'read', 'update', 'approve', 'export', 'manage'],
    onboarding: ['create', 'read', 'update', 'export', 'manage'],
    employees: ['read', 'export'],
    documents: ['create', 'read', 'update', 'export'],
    reports: ['read', 'export'],
    workflows: ['create', 'read', 'update', 'manage'],
    forms: ['create', 'read', 'update', 'manage'],
    settings: ['read', 'update'],
    auditLogs: ['read'],
  },
  RECRUITER: {
    requisitions: ['create', 'read', 'update'],
    candidates: ['create', 'read', 'update', 'export'],
    applications: ['create', 'read', 'update', 'export'],
    interviews: ['create', 'read', 'update'],
    offers: ['create', 'read', 'update'],
    onboarding: ['read'],
    employees: ['read'],
    documents: ['create', 'read'],
    reports: ['read'],
  },
  HIRING_MANAGER: {
    requisitions: ['create', 'read', 'update', 'approve'],
    candidates: ['read', 'update'],
    applications: ['read', 'update'],
    interviews: ['create', 'read', 'update'],
    offers: ['read', 'approve'],
    onboarding: ['read', 'update'],
    employees: ['read'],
    reports: ['read'],
  },
  INTERVIEWER: {
    candidates: ['read'],
    applications: ['read'],
    interviews: ['read', 'update'],
  },
  HR_OPS: {
    onboarding: ['create', 'read', 'update', 'export', 'manage'],
    employees: ['create', 'read', 'update', 'export', 'manage'],
    documents: ['create', 'read', 'update', 'manage'],
    offers: ['read'],
    reports: ['read'],
    settings: ['read'],
  },
  EXECUTIVE: {
    requisitions: ['read', 'approve', 'export'],
    candidates: ['read'],
    applications: ['read'],
    offers: ['read', 'approve'],
    employees: ['read', 'export'],
    reports: ['read', 'export'],
  },
  EMPLOYEE: {
    employees: ['read'],
    onboarding: ['read', 'update'],
    documents: ['read', 'update'],
  },
  CANDIDATE: {
    applications: ['read'],
    offers: ['read', 'update'], // e-sign
    onboarding: ['read', 'update'], // complete preboarding
    documents: ['create', 'read', 'update'],
  },
};

export function hasPermission(
  userRole: string | undefined,
  resource: Resource,
  action: Action
): boolean {
  if (!userRole) return false;
  const roleRules = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.RECRUITER;
  const resourceActions = roleRules[resource] || [];
  return resourceActions.includes(action) || resourceActions.includes('manage');
}
