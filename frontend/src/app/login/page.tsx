'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Mail, Briefcase, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthCard, FormError } from '@/components/auth/AuthCard';

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('returnTo');
  const jobTitle = searchParams.get('jobTitle');
  const applyJobId = searchParams.get('applyJobId');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerHref = nextParam
    ? `/register?next=${encodeURIComponent(nextParam)}${jobTitle ? `&jobTitle=${encodeURIComponent(jobTitle)}` : ''}`
    : '/register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Sign in failed');
        return;
      }
      // Follow same-site relative redirects safely
      let target = data.redirectTo;
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
      title="Sign in"
      subtitle={
        jobTitle
          ? `Sign in to complete your application for ${jobTitle}`
          : 'Recruiters, hiring teams and applicants sign in here.'
      }
      footer={
        <>
          Looking for a job?{' '}
          <Link href={registerHref} className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an applicant account
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
              Sign in with your candidate account or register below to submit your profile.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          {jobTitle ? 'Sign in & Continue Application' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
