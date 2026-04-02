'use client';

import { ReactNode } from 'react';

type StatusToggleProps = {
  disabled?: boolean;
  icon?: ReactNode;
  isLoading?: boolean;
  label: string;
  onReset?: () => void;
  onToggle: () => void;
  overrideValue: boolean | null;
  value: boolean;
  valueLabel: string;
};

export default function StatusToggle({
  disabled = false,
  icon,
  isLoading = false,
  label,
  onReset,
  onToggle,
  overrideValue,
  value,
  valueLabel,
}: StatusToggleProps) {
  const showOverride = overrideValue !== null;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white">{label}</span>
            {showOverride && (
              <span
                aria-label="Override active"
                className="text-xs text-[var(--gold-main)]"
                title="Override active"
              >
                ⚡
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">{valueLabel}</p>
        </div>

        <div className="flex w-28 items-center justify-end gap-3">
          {icon && <span className="text-base leading-none">{icon}</span>}
          <span
            className={`relative h-6 w-11 rounded-full transition-all duration-200 ${
              value ? 'bg-emerald-400/80' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-slate-950 transition-all duration-200 ${
                value ? 'left-[1.35rem]' : 'left-0.5'
              }`}
            />
          </span>
        </div>
      </button>

      <div className="flex w-14 justify-end">
        {showOverride && onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="cursor-pointer text-xs font-medium text-slate-400 transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? '...' : 'System'}
          </button>
        ) : (
          <span className="text-xs text-transparent">System</span>
        )}
      </div>
    </div>
  );
}
