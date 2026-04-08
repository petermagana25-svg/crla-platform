'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileAvatarSection from '@/components/dashboard/ProfileAvatarSection';
import ProfileSettingsPanel, {
  type ProfileSettingsFormValues,
} from '@/components/dashboard/ProfileSettingsPanel';
import { getStableBrowserUser } from '@/lib/get-stable-browser-user';
import { supabase } from '@/lib/supabase';

type AgentProfileRecord = {
  city: string | null;
  full_name: string | null;
  id: string;
  license_number: string | null;
  phone_number: string | null;
  postal_code: string | null;
  state: string | null;
};

type ProfileRecord = {
  avatar_url: string | null;
};

const emptyFormValues: ProfileSettingsFormValues = {
  city: '',
  licenseNumber: '',
  phoneNumber: '',
  postalCode: '',
  state: '',
};

const avatarMimeTypeToExtension: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const allowedAvatarTypes = new Set(Object.keys(avatarMimeTypeToExtension));
const maxAvatarFileSize = 3 * 1024 * 1024;

export default function ProfilePage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<ProfileSettingsFormValues>(emptyFormValues);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAvatarBucketReady, setIsAvatarBucketReady] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{
    text: string;
    type: 'error' | 'success';
  } | null>(null);
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

    async function loadSettingsState() {
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
          'id, full_name, phone_number, license_number, city, state, postal_code'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error || profileError) {
        setMessage({
          type: 'error',
          text:
            error?.message ||
            profileError?.message ||
            'Unable to load your profile settings.',
        });
        setIsBootstrapping(false);
        return;
      }

      const agentRecord = (agent as AgentProfileRecord | null) ?? null;
      const profileRecord = (profile as ProfileRecord | null) ?? null;

      if (!agentRecord) {
        setMessage({
          type: 'error',
          text: 'No agent profile was found for this account. Please contact support.',
        });
        setIsBootstrapping(false);
        return;
      }

      setAgentId(agentRecord.id);
      setAvatarUrl(profileRecord?.avatar_url ?? null);
      setFormValues({
        city: agentRecord.city ?? '',
        licenseNumber: agentRecord.license_number ?? '',
        phoneNumber: agentRecord.phone_number ?? '',
        postalCode: agentRecord.postal_code ?? '',
        state: agentRecord.state ?? '',
      });
      setFullName(agentRecord.full_name ?? null);
      setIsBootstrapping(false);
    }

    void loadSettingsState();

    return () => {
      isActive = false;
    };
  }, [router]);

  function updateField(field: keyof ProfileSettingsFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ensureAvatarBucket() {
    if (isAvatarBucketReady) {
      return true;
    }

    const response = await fetch('/api/profile/avatar/ensure-bucket', {
      method: 'POST',
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
          }
        | null;

      setAvatarMessage({
        type: 'error',
        text:
          result?.error?.message ||
          'Avatar storage is not ready. Please try again later.',
      });
      return false;
    }

    setIsAvatarBucketReady(true);
    return true;
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!allowedAvatarTypes.has(file.type)) {
      setAvatarMessage({
        type: 'error',
        text: 'Upload a JPG, PNG, or WebP image.',
      });
      return;
    }

    if (file.size > maxAvatarFileSize) {
      setAvatarMessage({
        type: 'error',
        text: 'Profile photos must be 3MB or smaller.',
      });
      return;
    }

    setAvatarMessage(null);
    setIsAvatarUploading(true);

    const user = await getStableBrowserUser();

    if (!user) {
      setIsAvatarUploading(false);
      router.replace('/login');
      return;
    }

    const bucketReady = await ensureAvatarBucket();

    if (!bucketReady) {
      setIsAvatarUploading(false);
      return;
    }

    const extension = avatarMimeTypeToExtension[file.type] ?? 'jpg';
    const filePath = `${user.id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      setIsAvatarUploading(false);
      setAvatarMessage({
        type: 'error',
        text: uploadError.message || 'Unable to upload your profile photo.',
      });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicAvatarUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: profileUpdateError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        avatar_url: publicAvatarUrl,
      },
      {
        onConflict: 'id',
      }
    );

    if (profileUpdateError) {
      setIsAvatarUploading(false);
      setAvatarMessage({
        type: 'error',
        text:
          profileUpdateError.message ||
          'Your photo uploaded, but your profile could not be updated.',
      });
      return;
    }

    setAvatarUrl(publicAvatarUrl);
    setIsAvatarUploading(false);
    setAvatarMessage({
      type: 'success',
      text: 'Your profile photo has been updated.',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agentId) {
      setMessage({
        type: 'error',
        text: 'No linked agent profile is available for editing.',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const user = await getStableBrowserUser();

    if (!user) {
      setIsSubmitting(false);
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
        text: error.message || 'Unable to update your profile.',
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
      text: 'Your profile has been updated.',
    });
  }

  return (
    <ProfileSettingsPanel
      canSubmit={canSubmit}
      formValues={formValues}
      isBootstrapping={isBootstrapping}
      isSubmitting={isSubmitting}
      message={message}
      mode="settings"
      onSubmit={handleSubmit}
      settingsTopContent={
        <ProfileAvatarSection
          avatarUrl={avatarUrl}
          feedback={avatarMessage}
          fullName={fullName}
          isDisabled={isBootstrapping || isSubmitting}
          isUploading={isAvatarUploading}
          onFileChange={handleAvatarChange}
        />
      }
      updateField={updateField}
    />
  );
}
