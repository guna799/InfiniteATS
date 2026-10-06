'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthCard, FormError } from '@/components/auth/AuthCard';

function RegisterForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('returnTo');
  const jobTitle = searchParams.get('jobTitle');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginHref = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}${jobTitle ? `&jobTitle=${encodeURIComponent(jobTitle)}` : ''}`
    : '/login';

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      let target = data.redirectTo || '/jobs';
      if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('://')) {
        target = nextParam;
      }
      window.location.assign(target);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      wide
      title="Create your applicant account"
      subtitle={
        jobTitle
          ? `Create an account to complete your application for ${jobTitle}`
          : 'Register to browse open jobs, build your profile, upload your resume and apply.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link href={loginHref} className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </>
      }
    >
      {jobTitle && (
        <div className="mb-4 p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
          <Briefcase className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block">Applying for {jobTitle}</span>
            <span className="text-[11px] text-indigo-700">
              Create your candidate profile in seconds to submit your application.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name" autoComplete="given-name" required value={form.firstName} onChange={update('firstName')} />
          <Input label="Last name" autoComplete="family-name" required value={form.lastName} onChange={update('lastName')} />
        </div>
        <Input label="Email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} />
          <Input label="Location" placeholder="City, Country" value={form.location} onChange={update('location')} />
        </div>
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          helperText="At least 8 characters, including a letter and a number"
          value={form.password}
          onChange={update('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          {jobTitle ? 'Register & Continue Application' : 'Create account'}
        </Button>
        <p className="text-[11px] text-slate-500 text-center">
          Next you&apos;ll complete your profile and upload your resume.
        </p>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
