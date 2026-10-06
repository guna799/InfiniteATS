'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Download, FileText, Plus, Trash2, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { FormError } from '@/components/auth/AuthCard';
import { useTenant } from '@/context/TenantContext';
import type { ProfileView } from '@/lib/candidateProfile';

type WorkEntry = ProfileView['workHistory'][number];
type EducationEntry = ProfileView['education'][number];

const EMPTY_WORK: WorkEntry = { company: '', title: '', startDate: '', endDate: '', current: false, description: '' };
const EMPTY_EDUCATION: EducationEntry = { institution: '', degree: '', field: '', startYear: '', endYear: '' };
const EDUCATION_LEVELS = ['', 'High School', 'Diploma', "Associate's", "Bachelor's", "Master's", 'MBA', 'PhD', 'Other'];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function ProfileEditor() {
  const searchParams = useSearchParams();
  const { showToast } = useTenant();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/candidate/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setMissing(data.missingFields || []);
      })
      .catch(() => setError('Could not load your profile'));
  }, []);

  if (!profile) return error ? <FormError message={error} /> : <LoadingState message="Loading your profile..." />;

  const set = <K extends keyof ProfileView>(field: K, value: ProfileView[K]) => setProfile({ ...profile, [field]: value });
  const text = (field: keyof ProfileView) => ({
    value: (profile[field] as string | number | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(field, e.target.value as never),
  });

  const updateWork = (i: number, patch: Partial<WorkEntry>) =>
    set('workHistory', profile.workHistory.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const updateEducation = (i: number, patch: Partial<EducationEntry>) =>
    set('education', profile.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const addSkill = () => {
    const skills = skillDraft
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !profile.skills.some((existing) => existing.toLowerCase() === s.toLowerCase()));
    if (skills.length) set('skills', [...profile.skills, ...skills]);
    setSkillDraft('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const { id, email, resumeFileName, resumeSize, resumeUploadedAt, ...payload } = profile;
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          experienceYears: payload.experienceYears === null || (payload.experienceYears as unknown) === '' ? null : Number(payload.experienceYears),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save your profile');
        return;
      }
      setProfile(data.profile);
      setMissing(data.missingFields || []);
      showToast('Profile saved', data.missingFields?.length ? 'A few details are still missing before you can apply.' : 'You are ready to apply for jobs.');
    } catch {
      setError('Could not save your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadResume = async (file: File) => {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError('Resume must be 10 MB or smaller');
      return;
    }
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('resume', file);
      const res = await fetch('/api/candidate/resume', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Resume upload failed');
        return;
      }
      const updated = { ...profile, ...data };
      setProfile(updated);
      setMissing((m) => m.filter((f) => f !== 'Resume upload'));
      showToast('Resume uploaded', file.name);
    } catch {
      setError('Resume upload failed');
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Recruiters see this profile and your resume when you apply. Signed in as {profile.email}.
        </p>
      </div>

      {searchParams.get('welcome') && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
          <p className="font-semibold">Welcome to InfiniteCareers!</p>
          <p className="mt-0.5">Complete your profile and upload your resume, then head to Jobs to apply.</p>
        </div>
      )}

      {missing.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Complete these to start applying:</p>
            <p className="mt-0.5">{missing.join(' · ')}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>
            Your profile is complete.{' '}
            <Link href="/jobs" className="font-semibold underline">
              Browse jobs
            </Link>
          </p>
        </div>
      )}

      <FormError message={error} />

      <Section title="Resume" description="PDF, DOC or DOCX, up to 10 MB. Stored privately and shared only with employers you apply to.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
          <FileText className="h-8 w-8 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            {profile.resumeFileName ? (
              <>
                <p className="font-semibold text-slate-900 truncate">{profile.resumeFileName}</p>
                <p className="text-slate-500">
                  {formatBytes(profile.resumeSize)} · uploaded{' '}
                  {profile.resumeUploadedAt ? new Date(profile.resumeUploadedAt).toLocaleDateString() : ''}
                </p>
              </>
            ) : (
              <p className="text-slate-600">No resume uploaded yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            {profile.resumeFileName && (
              <a href="/api/candidate/resume" className="inline-flex">
                <Button type="button" variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
                  Download
                </Button>
              </a>
            )}
            <Button
              type="button"
              variant="subtle"
              size="sm"
              isLoading={isUploading}
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={() => fileInput.current?.click()}
            >
              {profile.resumeFileName ? 'Replace' : 'Upload resume'}
            </Button>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])}
            />
          </div>
        </div>
      </Section>

      <Section title="Personal details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name" required {...text('firstName')} />
          <Input label="Last name" required {...text('lastName')} />
          <Input label="Phone" type="tel" {...text('phone')} />
          <Input label="Location" placeholder="City, Country" {...text('location')} />
        </div>
      </Section>

      <Section title="Professional summary">
        <Input label="Headline" placeholder="e.g. Senior Backend Engineer · Java & Cloud" {...text('headline')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Current job title" {...text('currentTitle')} />
          <Input label="Current company" {...text('currentCompany')} />
          <Input label="Years of experience" type="number" min={0} max={60} step={0.5} {...text('experienceYears')} />
        </div>
        <Textarea label="Summary" rows={5} placeholder="A few sentences about your experience and what you're looking for" {...text('summary')} />
      </Section>

      <Section title="Skills" description="Press Enter or comma-separate to add several at once.">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. React, PostgreSQL, Kubernetes"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addSkill}>
            Add
          </Button>
        </div>
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => set('skills', profile.skills.filter((s) => s !== skill))}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Work experience" description="Most recent first. Leave empty if you're just starting out.">
        {profile.workHistory.map((w, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Job title" required value={w.title} onChange={(e) => updateWork(i, { title: e.target.value })} />
              <Input label="Company" required value={w.company} onChange={(e) => updateWork(i, { company: e.target.value })} />
              <Input label="Start" type="month" required value={w.startDate} onChange={(e) => updateWork(i, { startDate: e.target.value })} />
              <Input
                label="End"
                type="month"
                disabled={w.current}
                value={w.current ? '' : w.endDate}
                onChange={(e) => updateWork(i, { endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={!!w.current} onChange={(e) => updateWork(i, { current: e.target.checked, endDate: '' })} />
              I currently work here
            </label>
            <Textarea
              label="What you did"
              rows={3}
              value={w.description}
              onChange={(e) => updateWork(i, { description: e.target.value })}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => set('workHistory', profile.workHistory.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => set('workHistory', [...profile.workHistory, { ...EMPTY_WORK }])}
        >
          Add experience
        </Button>
      </Section>

      <Section title="Education">
        <Select label="Highest education level" {...text('educationLevel')}>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level || 'Select…'}
            </option>
          ))}
        </Select>
        {profile.education.map((ed, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Institution" required value={ed.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} />
              <Input label="Degree" required value={ed.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} />
              <Input label="Field of study" value={ed.field} onChange={(e) => updateEducation(i, { field: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start year" inputMode="numeric" maxLength={4} value={ed.startYear} onChange={(e) => updateEducation(i, { startYear: e.target.value })} />
                <Input label="End year" inputMode="numeric" maxLength={4} value={ed.endYear} onChange={(e) => updateEducation(i, { endYear: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => set('education', profile.education.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => set('education', [...profile.education, { ...EMPTY_EDUCATION }])}
        >
          Add education
        </Button>
      </Section>

      <Section title="Links">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" {...text('linkedinUrl')} />
          <Input label="GitHub" type="url" placeholder="https://github.com/…" {...text('githubUrl')} />
          <Input label="Portfolio / website" type="url" placeholder="https://…" {...text('portfolioUrl')} />
        </div>
      </Section>

      <div className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-end gap-3">
          <span className="hidden sm:block text-xs text-slate-500">Changes are shared with employers you've applied to.</span>
          <Button type="submit" isLoading={isSaving}>
            Save profile
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileEditor />
    </Suspense>
  );
}
