'use client';

import { FormEvent, ReactNode } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import BackToDashboardButton from '@/components/dashboard/BackToDashboardButton';
import ChangePasswordSection from '@/components/dashboard/ChangePasswordSection';

export type ProfileSettingsMode = 'onboarding' | 'settings';

export type ProfileSettingsFormValues = {
  city: string;
  licenseNumber: string;
  phoneNumber: string;
  postalCode: string;
  state: string;
};

type ProfileSettingsPanelProps = {
  canSubmit: boolean;
  formValues: ProfileSettingsFormValues;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  message: {
    text: string;
    type: 'error' | 'success';
  } | null;
  mode: ProfileSettingsMode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  settingsTopContent?: ReactNode;
  updateField: (field: keyof ProfileSettingsFormValues, value: string) => void;
};

export default function ProfileSettingsPanel({
  canSubmit,
  formValues,
  isBootstrapping,
  isSubmitting,
  message,
  mode,
  onSubmit,
  settingsTopContent,
  updateField,
}: ProfileSettingsPanelProps) {
  const copy =
    mode === 'settings'
      ? {
          description:
            'Update your agent details and account security without leaving the authenticated dashboard experience.',
          eyebrow: 'PROFILE SETTINGS',
          submitLabel: 'Save Profile Changes',
          submittingLabel: 'Saving your profile...',
          title: 'Profile & Security',
        }
      : {
          description:
            'Finish your onboarding to unlock the CRLA dashboard and keep your account in good standing.',
          eyebrow: 'AGENT ONBOARDING',
          submitLabel: 'Complete Onboarding',
          submittingLabel: 'Saving your profile...',
          title: 'Complete Your Profile',
        };

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        {mode === 'settings' ? <BackToDashboardButton /> : null}

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold-main)]">
              <ShieldCheck size={14} />
              {copy.eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{copy.title}</h1>
            <p className="mt-2 text-sm text-white/55">{copy.description}</p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  : 'border border-red-400/30 bg-red-400/10 text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === 'settings' ? settingsTopContent : null}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-2 block text-white/75">Phone Number</span>
                <input
                  value={formValues.phoneNumber}
                  onChange={(event) =>
                    updateField('phoneNumber', event.target.value)
                  }
                  disabled={isBootstrapping || isSubmitting}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  placeholder="(555) 555-5555"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-white/75">License Number</span>
                <input
                  value={formValues.licenseNumber}
                  onChange={(event) =>
                    updateField('licenseNumber', event.target.value)
                  }
                  disabled={isBootstrapping || isSubmitting}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  placeholder="License number"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-white/75">City</span>
                <input
                  value={formValues.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  disabled={isBootstrapping || isSubmitting}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  placeholder="City"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-white/75">State</span>
                <input
                  value={formValues.state}
                  onChange={(event) => updateField('state', event.target.value)}
                  disabled={isBootstrapping || isSubmitting}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  placeholder="State"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-2 block text-white/75">Postal Code</span>
              <input
                value={formValues.postalCode}
                onChange={(event) =>
                  updateField('postalCode', event.target.value)
                }
                disabled={isBootstrapping || isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                placeholder="Postal code"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit || isBootstrapping}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-4 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {copy.submittingLabel}
                </>
              ) : (
                copy.submitLabel
              )}
            </button>
          </form>
        </div>

        {mode === 'settings' ? <ChangePasswordSection /> : null}
      </div>
    </main>
  );
}
