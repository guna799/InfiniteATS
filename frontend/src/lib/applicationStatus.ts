// Applicant-facing wording for internal pipeline stages
export function applicantStatus(status: string): { label: string; tone: 'brand' | 'success' | 'warning' | 'destructive' | 'neutral' } {
  switch (status) {
    case 'APPLIED':
      return { label: 'Application received', tone: 'brand' };
    case 'SCREENING':
    case 'PHONE_SCREEN':
      return { label: 'Under review', tone: 'brand' };
    case 'TECHNICAL_INTERVIEW':
    case 'HIRING_MANAGER_INTERVIEW':
    case 'ONSITE_PANEL':
    case 'EVALUATION':
      return { label: 'Interviewing', tone: 'warning' };
    case 'OFFER_PENDING':
    case 'OFFER_EXTENDED':
      return { label: 'Offer stage', tone: 'success' };
    case 'OFFER_ACCEPTED':
    case 'PREBOARDING':
    case 'ONBOARDED':
      return { label: 'Hired', tone: 'success' };
    case 'REJECTED':
      return { label: 'Not selected', tone: 'neutral' };
    case 'WITHDRAWN':
      return { label: 'Withdrawn', tone: 'neutral' };
    default:
      return { label: status.replace(/_/g, ' ').toLowerCase(), tone: 'neutral' };
  }
}
