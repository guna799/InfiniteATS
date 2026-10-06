'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items = [] }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-indigo-600 transition flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast || !item.href ? (
              <span className="font-semibold text-slate-800 truncate max-w-xs">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-indigo-600 transition truncate max-w-xs">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
