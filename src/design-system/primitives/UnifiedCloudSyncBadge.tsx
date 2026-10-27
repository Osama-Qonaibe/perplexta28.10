/**
 * ☁️ PERPLEXTA DESIGN SYSTEM — UNIFIED CLOUD SYNC BADGE
 * Standardized 32px (h-8) cloud sync status indicator with ping animation,
 * status dot, multi-language support, and accessible click-to-save trigger.
 */

import React from 'react';
import { Cloud, Check, RefreshCw, AlertCircle } from 'lucide-react';

export type CloudSyncStatus = 'saving' | 'synced' | 'saved' | 'error' | 'draft' | 'idle' | 'local';

export interface UnifiedCloudSyncBadgeProps {
  status: CloudSyncStatus;
  onClick?: () => void;
  language?: string;
  className?: string;
  showIcon?: boolean;
}

export const UnifiedCloudSyncBadge: React.FC<UnifiedCloudSyncBadgeProps> = ({
  status,
  onClick,
  language = 'ar',
  className = '',
  showIcon = true,
}) => {
  const isAr = language === 'ar';
  const isSynced = status === 'synced' || status === 'saved';
  const isSaving = status === 'saving';
  const isError = status === 'error';
  const isLocal = status === 'local' || status === 'draft' || status === 'idle';

  const label = isSaving
    ? (isAr ? 'جاري الحفظ...' : 'Saving...')
    : isSynced
    ? (isAr ? 'محفوظ سحابياً' : 'Cloud Synced')
    : isError
    ? (isAr ? 'تعذر الحفظ' : 'Sync Error')
    : (isAr ? 'مسودة محلية' : 'Local Draft');

  const tooltip = isAr
    ? 'حالة المزامنة السحابية (اضغط للحفظ الآن)'
    : 'Cloud Sync Status (Click to save now)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || isSaving}
      title={tooltip}
      className={`
        inline-flex items-center justify-center gap-1.5 h-8 px-2.5
        rounded-shape-sm text-[11px] font-bold leading-none border
        transition-all duration-150 select-none relative
        ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${
          isSaving
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
            : isSynced
            ? 'bg-[var(--bg-success-muted)] text-[var(--fg-success)] border-[color-mix(in_srgb,var(--fg-success)_25%,transparent)]'
            : isError
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
            : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]'
        }
        ${className}
      `}
    >
      {/* Animated Ping Indicator Dot */}
      <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
        {isSaving && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-shape-full bg-amber-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-shape-full h-1.5 w-1.5 ${
            isSaving
              ? 'bg-amber-500'
              : isSynced
              ? 'bg-[var(--fg-success)]'
              : isError
              ? 'bg-rose-500'
              : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
      </span>

      {showIcon && (
        <span className="shrink-0">
          {isSaving ? (
            <RefreshCw size={11} className="animate-spin text-amber-500" />
          ) : isSynced ? (
            <Cloud size={12} className="text-[var(--fg-success)]" />
          ) : isError ? (
            <AlertCircle size={12} className="text-rose-500" />
          ) : (
            <Cloud size={12} className="text-[var(--text-muted)]" />
          )}
        </span>
      )}

      <span className="truncate">{label}</span>
    </button>
  );
};
