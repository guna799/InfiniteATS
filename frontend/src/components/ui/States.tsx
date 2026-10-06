import React, { ReactNode } from 'react';
import { FolderOpen, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: any;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-enterprise space-y-3 max-w-md mx-auto">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-slate-900 text-base">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function LoadingState({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="text-center py-20 px-4 space-y-3">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
      <p className="text-xs font-semibold text-slate-500 tracking-tight">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
}: {
  title?: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 max-w-md mx-auto">
      <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-slate-900 text-base">{title}</h3>
      {error && <p className="text-xs text-rose-700 max-w-xs mx-auto">{error}</p>}
      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}

export function PermissionDeniedState({
  resourceName = 'this resource',
}: {
  resourceName?: string;
}) {
  return (
    <div className="text-center py-16 px-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3 max-w-md mx-auto">
      <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-slate-900 text-base">Access Restricted</h3>
      <p className="text-xs text-slate-600 max-w-xs mx-auto">
        Your active role persona does not have permission to view or manage {resourceName}.
      </p>
    </div>
  );
}
