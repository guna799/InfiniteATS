import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'destructive' | 'neutral' | 'purple' | 'cyan' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({
  className = '',
  variant = 'brand',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const base = 'inline-flex items-center font-bold tracking-tight select-none';

  const variants = {
    brand: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200/80',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
  };

  const dotColors = {
    brand: 'bg-indigo-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    destructive: 'bg-rose-600',
    neutral: 'bg-slate-500',
    purple: 'bg-purple-600',
    cyan: 'bg-cyan-600',
    outline: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded gap-1',
    md: 'text-xs px-2.5 py-0.5 rounded-full gap-1.5',
    lg: 'text-xs px-3 py-1 rounded-full gap-1.5',
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
