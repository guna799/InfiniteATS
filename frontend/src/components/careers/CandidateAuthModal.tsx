'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Globe,
  Github,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CandidateAuthModal({
  isOpen,
  onClose,
  onAuthenticated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: { email: string; name: string }) => void;
}) {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'MFA_VERIFY'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (authMode === 'LOGIN' || authMode === 'REGISTER') {
        // Trigger MFA step
        setAuthMode('MFA_VERIFY');
      } else if (authMode === 'MFA_VERIFY') {
        onAuthenticated({
          email: email || 'karthik.guntupalli@example.com',
          name: name || 'Venkata Karthik Guntupalli',
        });
        onClose();
      } else if (authMode === 'FORGOT_PASSWORD') {
        setMsg('Password reset link sent to your email address.');
      }
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-6 text-xs text-left">
        <div className="text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {authMode === 'LOGIN' && 'Sign in to Candidate Portal'}
            {authMode === 'REGISTER' && 'Create Candidate Account'}
            {authMode === 'FORGOT_PASSWORD' && 'Reset Your Password'}
            {authMode === 'MFA_VERIFY' && 'Two-Factor Authentication (MFA)'}
          </h2>
          <p className="text-slate-500">
            {authMode === 'MFA_VERIFY'
              ? 'Enter the 6-digit security code sent to your authenticator app.'
              : 'Track your applications, interview schedules, and offer letters.'}
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {msg}
          </div>
        )}

        {/* Social Authentication Architecture */}
        {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onAuthenticated({ email: 'social.user@google.com', name: 'Google Candidate' });
                onClose();
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold text-slate-700 shadow-xs transition"
            >
              <Globe className="h-4 w-4 text-indigo-600" />
              <span>Continue with Google Single Sign-On</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAuthenticated({ email: 'github.user@github.com', name: 'GitHub Developer' });
                onClose();
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold text-slate-700 shadow-xs transition"
            >
              <Github className="h-4 w-4 text-slate-900" />
              <span>Continue with GitHub</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-slate-200" />
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
                Or with email
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {authMode === 'REGISTER' && (
            <Input
              label="Full Name *"
              required
              placeholder="e.g. Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {authMode !== 'MFA_VERIFY' && (
            <>
              <Input
                label="Email Address *"
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {authMode !== 'FORGOT_PASSWORD' && (
                <Input
                  label="Password *"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </>
          )}

          {authMode === 'MFA_VERIFY' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono p-3 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>
          )}

          <Button type="submit" size="md" className="w-full" isLoading={isLoading}>
            {authMode === 'LOGIN' && 'Sign In'}
            {authMode === 'REGISTER' && 'Create Account'}
            {authMode === 'FORGOT_PASSWORD' && 'Send Reset Link'}
            {authMode === 'MFA_VERIFY' && 'Verify & Continue'}
          </Button>
        </form>

        {/* Auth mode toggles */}
        <div className="text-center pt-2 text-slate-500 space-y-1">
          {authMode === 'LOGIN' && (
            <>
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('REGISTER')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Register
                </button>
              </p>
              <button
                type="button"
                onClick={() => setAuthMode('FORGOT_PASSWORD')}
                className="text-[11px] text-slate-400 hover:text-slate-600 block mx-auto"
              >
                Forgot your password?
              </button>
            </>
          )}

          {authMode === 'REGISTER' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                className="font-bold text-indigo-600 hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          {authMode === 'FORGOT_PASSWORD' && (
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className="font-bold text-indigo-600 hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
