import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`w-full py-2 pl-3.5 pr-8 bg-slate-50 border rounded-xl text-xs md:text-sm text-slate-900 appearance-none transition focus:bg-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-100 cursor-pointer ${
              error
                ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600'
                : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
