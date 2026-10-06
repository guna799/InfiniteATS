import React, { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export function AuthCard({ title, subtitle, children, footer, wide = false }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
      <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Infinite<span className="text-indigo-600">Careers</span>
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
        {footer && <div className="text-center text-xs text-slate-600 mt-5">{footer}</div>}
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
      {message}
    </div>
  );
}
