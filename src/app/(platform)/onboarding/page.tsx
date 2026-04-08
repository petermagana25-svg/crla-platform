'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProfileSettingsPanel, {
  type ProfileSettingsFormValues,
} from '@/components/dashboard/ProfileSettingsPanel';
import { getStableBrowserUser } from '@/lib/get-stable-browser-user';
import { supabase } from '@/lib/supabase';

type AgentProfileRecord = {
  city: string | null;
  id: string;
  license_number: string | null;
  phone_number: string | null;
  postal_code: string | null;
  profile_completed: boolean | null;
  state: string | null;
};

const emptyFormValues: ProfileSettingsFormValues = {
  city: '',
  licenseNumber: '',
  phoneNumber: '',
  postalCode: '',
  state: '',
};

export default function OnboardingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<ProfileSettingsFormValues>(emptyFormValues);
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

  useEffect(() => {
    let isActive = true;

    async function loadOnboardingState() {
      const user = await getStableBrowserUser();

      if (!isActive) {
        return;
      }

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

      if (!isActive) {
        return;
      }

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || 'Unable to load your onboarding profile.',
        });
        setIsBootstrapping(false);
        return;
      }

      const agentRecord = (agent as AgentProfileRecord | null) ?? null;

      if (!agentRecord) {
        setMessage({
          type: 'error',
          text: 'No agent profile was found for this account. Please contact support.',
        });
        setIsBootstrapping(false);
        return;
      }

      const isOnboardingRoot = pathname === '/onboarding';

      if (isOnboardingRoot && agentRecord.profile_completed) {
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
    }

    void loadOnboardingState();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  function updateField(field: keyof ProfileSettingsFormValues, value: string) {
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

    const user = await getStableBrowserUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const { error } = await supabase
      .from('agents')
      .update({
        phone_number: formValues.phoneNumber.trim(),
        license_number: formValues.licenseNumber.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        postal_code: formValues.postalCode.trim(),
        profile_completed: true,
      })
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

    setIsSubmitting(false);
    setMessage({
      type: 'success',
      text: 'Onboarding complete. Redirecting to your dashboard...',
    });
    router.push('/dashboard');
  }

  return (
    <ProfileSettingsPanel
      canSubmit={canSubmit}
      formValues={formValues}
      isBootstrapping={isBootstrapping}
      isSubmitting={isSubmitting}
      message={message}
      mode="onboarding"
      onSubmit={handleSubmit}
      updateField={updateField}
    />
  );
}
