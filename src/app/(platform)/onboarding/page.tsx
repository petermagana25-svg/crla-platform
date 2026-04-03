'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AgentOnboardingRecord = {
  city: string | null;
  id: string;
  license_number: string | null;
  phone_number: string | null;
  postal_code: string | null;
  profile_completed: boolean | null;
  state: string | null;
};

type FormValues = {
  city: string;
  licenseNumber: string;
  phoneNumber: string;
  postalCode: string;
  state: string;
};

const emptyFormValues: FormValues = {
  city: '',
  licenseNumber: '',
  phoneNumber: '',
  postalCode: '',
  state: '',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(emptyFormValues);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'error' | 'success';
  } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      formValues.phoneNumber.trim().length > 0 &&
      formValues.licenseNumber.trim().length > 0 &&
      formValues.city.trim().length > 0 &&
      formValues.state.trim().length > 0 &&
      formValues.postalCode.trim().length > 0 &&
      !isSubmitting
    );
  }, [formValues, isSubmitting]);

  const loadOnboardingState = useCallback(async () => {
    setIsBootstrapping(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select(
        'id, phone_number, license_number, city, state, postal_code, profile_completed'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('agent fetch', {
      source: 'onboarding',
      userId: user.id,
      found: Boolean(agent),
    });

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to load your onboarding profile.',
      });
      setIsBootstrapping(false);
      return;
    }

    const agentRecord = (agent as AgentOnboardingRecord | null) ?? null;

    if (!agentRecord) {
      setMessage({
        type: 'error',
        text: 'No agent profile was found for this account. Please contact support.',
      });
      setIsBootstrapping(false);
      return;
    }

    if (agentRecord.profile_completed) {
      router.replace('/dashboard');
      return;
    }

    setAgentId(agentRecord.id);
    setFormValues({
      city: agentRecord.city ?? '',
      licenseNumber: agentRecord.license_number ?? '',
      phoneNumber: agentRecord.phone_number ?? '',
      postalCode: agentRecord.postal_code ?? '',
      state: agentRecord.state ?? '',
    });
    setIsBootstrapping(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOnboardingState();
  }, [loadOnboardingState]);

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agentId) {
      setMessage({
        type: 'error',
        text: 'No linked agent profile is available for onboarding.',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const payload = {
      phone_number: formValues.phoneNumber.trim(),
      license_number: formValues.licenseNumber.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim(),
      postal_code: formValues.postalCode.trim(),
      profile_completed: true,
    };

    const { error } = await supabase
      .from('agents')
      .update(payload)
      .eq('user_id', user.id);

    if (error) {
      setIsSubmitting(false);
      setMessage({
        type: 'error',
        text: error.message || 'Unable to complete onboarding.',
      });
      return;
    }

    const activationResponse = await fetch('/api/agent/activation/refresh', {
      method: 'POST',
    });

    if (!activationResponse.ok) {
      setIsSubmitting(false);
      setMessage({
        type: 'error',
        text: 'Your profile was saved, but activation could not be refreshed.',
      });
      return;
    }

    console.log('onboarding completed', {
      agentId,
      userId: user.id,
    });

    setMessage({
      type: 'success',
      text: 'Onboarding complete. Redirecting to your dashboard...',
    });
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold-main)]">
            <ShieldCheck size={14} />
            Agent Onboarding
          </div>
          <h1 className="mt-4 text-3xl font-bold">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-white/55">
            Finish your onboarding to unlock the CRLA dashboard and keep your
            account in good standing.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block text-white/75">Phone Number</span>
              <input
                value={formValues.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
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
              onChange={(event) => updateField('postalCode', event.target.value)}
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
                Saving your profile...
              </>
            ) : (
              'Complete Onboarding'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
