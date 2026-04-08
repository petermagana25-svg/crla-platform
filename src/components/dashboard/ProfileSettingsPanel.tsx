'use client';

import { FormEvent, ReactNode } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import BackToDashboardButton from '@/components/dashboard/BackToDashboardButton';
import ChangePasswordSection from '@/components/dashboard/ChangePasswordSection';
import Container from '@/components/layout/Container';
import Navbar from '@/components/layout/Navbar';

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
  const formId = mode === 'settings' ? 'profile-settings-form' : 'onboarding-profile-form';
  const showMobileStickyAction = mode === 'settings' && !isBootstrapping;
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
    <>
      <Navbar />

      <main className={`min-h-screen bg-[var(--navy-dark)] text-white ${showMobileStickyAction ? 'platform-safe-bottom md:pb-24' : 'pb-24'}`}>
        <Container className="platform-fade-in pt-6 pb-10 sm:pt-8 lg:pt-10">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:gap-6">
            {mode === 'settings' ? <BackToDashboardButton /> : null}

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.94),rgba(11,20,38,0.92))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.32)] backdrop-blur-2xl sm:p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--gold-main)] sm:text-xs">
                <ShieldCheck size={14} />
                {copy.eyebrow}
              </div>
              <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                {copy.description}
              </p>
            </section>

            {message && !isBootstrapping ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : 'border border-red-400/30 bg-red-400/10 text-red-200'
                }`}
              >
                {message.text}
              </div>
            ) : null}

            {mode === 'settings' ? settingsTopContent : null}

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-6 lg:p-8">
              {isBootstrapping ? (
                <div className="space-y-5 sm:space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-3">
                        <div className="shimmer-block h-4 w-28 rounded-full" />
                        <div className="shimmer-block h-[54px] w-full rounded-2xl" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="shimmer-block h-4 w-28 rounded-full" />
                    <div className="shimmer-block h-[54px] w-full rounded-2xl" />
                  </div>
                  <div className="hidden md:block">
                    <div className="shimmer-block h-[56px] w-full rounded-full" />
                  </div>
                </div>
              ) : (
                <form id={formId} onSubmit={onSubmit} className="space-y-5 sm:space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-2 block text-sm font-medium text-white/80">
                        Phone Number
                      </span>
                      <input
                        value={formValues.phoneNumber}
                        onChange={(event) =>
                          updateField('phoneNumber', event.target.value)
                        }
                        disabled={isBootstrapping || isSubmitting}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-[var(--gold-main)]/40"
                        placeholder="(555) 555-5555"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-2 block text-sm font-medium text-white/80">
                        License Number
                      </span>
                      <input
                        value={formValues.licenseNumber}
                        onChange={(event) =>
                          updateField('licenseNumber', event.target.value)
                        }
                        disabled={isBootstrapping || isSubmitting}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-[var(--gold-main)]/40"
                        placeholder="License number"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-2 block text-sm font-medium text-white/80">
                        City
                      </span>
                      <input
                        value={formValues.city}
                        onChange={(event) => updateField('city', event.target.value)}
                        disabled={isBootstrapping || isSubmitting}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-[var(--gold-main)]/40"
                        placeholder="City"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-2 block text-sm font-medium text-white/80">
                        State
                      </span>
                      <input
                        value={formValues.state}
                        onChange={(event) => updateField('state', event.target.value)}
                        disabled={isBootstrapping || isSubmitting}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-[var(--gold-main)]/40"
                        placeholder="State"
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-2 block text-sm font-medium text-white/80">
                      Postal Code
                    </span>
                    <input
                      value={formValues.postalCode}
                      onChange={(event) =>
                        updateField('postalCode', event.target.value)
                      }
                      disabled={isBootstrapping || isSubmitting}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-[var(--gold-main)]/40"
                      placeholder="Postal code"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={!canSubmit || isBootstrapping}
                    className={`tap-feedback min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-4 text-base font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      mode === 'settings' ? 'hidden md:inline-flex' : 'inline-flex'
                    }`}
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
              )}
            </section>

            {mode === 'settings' ? <ChangePasswordSection /> : null}
          </div>
        </Container>
      </main>

      {showMobileStickyAction ? (
        <div className="sticky-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[rgba(11,20,38,0.84)] shadow-[0_-20px_45px_rgba(0,0,0,.28)] backdrop-blur-2xl md:hidden">
          <Container className="py-3">
            <button
              type="submit"
              form={formId}
              disabled={!canSubmit || isSubmitting}
              className="tap-feedback inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-4 text-base font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
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
          </Container>
        </div>
      ) : null}
    </>
  );
}
