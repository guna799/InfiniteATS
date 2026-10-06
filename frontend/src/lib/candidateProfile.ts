import { z } from 'zod';

export interface WorkHistoryEntry {
  company: string;
  title: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM, empty when current
  current?: boolean;
  description?: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  startYear?: string;
  endYear?: string;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^https?:\/\//i.test(v), 'Links must start with http:// or https://');

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  phone: optionalText(40),
  location: optionalText(120),
  headline: optionalText(160),
  summary: optionalText(4000),
  currentTitle: optionalText(120),
  currentCompany: optionalText(120),
  experienceYears: z.coerce.number().min(0).max(60).optional().nullable(),
  educationLevel: optionalText(80),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  workHistory: z
    .array(
      z.object({
        company: z.string().trim().min(1, 'Company is required').max(120),
        title: z.string().trim().min(1, 'Job title is required').max(120),
        startDate: z.string().trim().min(1, 'Start date is required').max(10),
        endDate: z.string().trim().max(10).optional().default(''),
        current: z.boolean().optional().default(false),
        description: z.string().trim().max(2000).optional().default(''),
      })
    )
    .max(20)
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().trim().min(1, 'Institution is required').max(160),
        degree: z.string().trim().min(1, 'Degree is required').max(120),
        field: z.string().trim().max(120).optional().default(''),
        startYear: z.string().trim().max(4).optional().default(''),
        endYear: z.string().trim().max(4).optional().default(''),
      })
    )
    .max(10)
    .default([]),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;

export interface ProfileView extends ProfileInput {
  id: string;
  email: string;
  resumeFileName: string | null;
  resumeSize: number | null;
  resumeUploadedAt: string | null;
}

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Converts a CandidateAccount row to the shape the profile UI edits. */
export function toProfileView(account: any): ProfileView {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    phone: account.phone,
    location: account.location,
    headline: account.headline,
    summary: account.summary,
    currentTitle: account.currentTitle,
    currentCompany: account.currentCompany,
    experienceYears: account.experienceYears,
    educationLevel: account.educationLevel,
    skills: parseJsonArray<string>(account.skills),
    workHistory: parseJsonArray<WorkHistoryEntry>(account.workHistory) as ProfileInput['workHistory'],
    education: parseJsonArray<EducationEntry>(account.education) as ProfileInput['education'],
    linkedinUrl: account.linkedinUrl,
    githubUrl: account.githubUrl,
    portfolioUrl: account.portfolioUrl,
    resumeFileName: account.resumeFileName,
    resumeSize: account.resumeSize,
    resumeUploadedAt: account.resumeUploadedAt ? new Date(account.resumeUploadedAt).toISOString() : null,
  };
}

/** Fields that must be filled in before an applicant can apply. Returns the human-readable names of what's missing. */
export function missingProfileFields(p: Partial<ProfileView> & { resumeFileName?: string | null }): string[] {
  const missing: string[] = [];
  if (!p.phone) missing.push('Phone number');
  if (!p.location) missing.push('Location');
  if (!p.headline) missing.push('Professional headline');
  if (!p.summary) missing.push('Professional summary');
  if (!p.skills || p.skills.length === 0) missing.push('At least one skill');
  if (!p.education || p.education.length === 0) missing.push('At least one education entry');
  if (!p.resumeFileName) missing.push('Resume upload');
  return missing;
}

function formatMonth(value?: string) {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!month) return year;
  return new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/** Candidate fields copied into each org's Candidate record when the applicant applies or updates their profile. */
export function toCandidateFields(account: any) {
  const profile = toProfileView(account);
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    headline: profile.headline,
    summary: profile.summary,
    currentTitle: profile.currentTitle,
    currentCompany: profile.currentCompany,
    experienceYears: profile.experienceYears ?? null,
    educationLevel: profile.educationLevel,
    skills: JSON.stringify(profile.skills),
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    // Shape read by the recruiter Candidate 360 page
    resumeParsedData: JSON.stringify({
      skills: profile.skills,
      workHistory: profile.workHistory.map((w) => ({
        role: w.title,
        company: w.company,
        period: `${formatMonth(w.startDate)} – ${w.current ? 'Present' : formatMonth(w.endDate) || 'Present'}`,
        highlights: w.description,
      })),
      education: profile.education,
      resumeFileName: profile.resumeFileName,
    }),
  };
}
