'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthCard, FormError } from '@/components/auth/AuthCard';

export default function RegisterPage() {
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
      window.location.assign(data.redirectTo);
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
      subtitle="Register to browse open jobs, build your profile, upload your resume and apply."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </>
      }
    >
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
          Create account
        </Button>
        <p className="text-[11px] text-slate-500 text-center">
          Next you&apos;ll complete your profile and upload your resume.
        </p>
      </form>
    </AuthCard>
  );
}
