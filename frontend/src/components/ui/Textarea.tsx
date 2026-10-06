import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`w-full p-3 bg-slate-50 border rounded-xl text-xs md:text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-100 ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600'
              : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
