'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setViewMode } from '@/lib/view-mode';

type AgentRecord = {
  city: string | null;
  email: string | null;
  full_name: string | null;
  license_number: string | null;
  phone_number: string | null;
  postal_code: string | null;
  profile_completed: boolean | null;
  role: string | null;
  state: string | null;
};

type ProfileRecord = {
  avatar_url: string | null;
  city: string | null;
  full_name: string | null;
  license_number: string | null;
};

type FormValues = {
  city: string;
  email: string;
  fullName: string;
  licenseNumber: string;
  phoneNumber: string;
  postalCode: string;
  state: string;
  avatarUrl: string;
};

type FieldName =
  | 'fullName'
  | 'phoneNumber'
  | 'licenseNumber'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'avatar';

type FormErrors = Partial<Record<FieldName, string>>;

const emptyFormValues: FormValues = {
  city: '',
  email: '',
  fullName: '',
  licenseNumber: '',
  phoneNumber: '',
  postalCode: '',
  state: '',
  avatarUrl: '',
};

function getDraftStorageKey(userId: string) {
  return `agent-onboarding-profile-${userId}`;
}

function readDraft(userId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(userId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<FormValues>;
  } catch {
    return null;
  }
}

function saveDraft(userId: string, values: FormValues) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getDraftStorageKey(userId), JSON.stringify(values));
}

function clearDraft(userId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getDraftStorageKey(userId));
}

function getFieldError(
  field: FieldName,
  values: FormValues,
  hasAvatar: boolean
) {
  switch (field) {
    case 'fullName':
      return values.fullName.trim() ? '' : 'Full name is required.';
    case 'phoneNumber':
      return values.phoneNumber.trim() ? '' : 'Phone number is required.';
    case 'licenseNumber':
      return values.licenseNumber.trim() ? '' : 'License number is required.';
    case 'city':
      return values.city.trim() ? '' : 'City is required.';
    case 'state':
      return values.state.trim() ? '' : 'State is required.';
    case 'postalCode':
      return values.postalCode.trim() ? '' : 'Postal code is required.';
    case 'avatar':
      return hasAvatar ? '' : 'A profile image is required.';
    default:
      return '';
  }
}

function validateForm(values: FormValues, hasAvatar: boolean) {
  const nextErrors: FormErrors = {};

  ([
    'fullName',
    'phoneNumber',
    'licenseNumber',
    'city',
    'state',
    'postalCode',
    'avatar',
  ] as FieldName[]).forEach((field) => {
    const error = getFieldError(field, values, hasAvatar);

    if (error) {
      nextErrors[field] = error;
    }
  });

  return nextErrors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-red-300">{message}</p>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold-main)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/55">{description}</p>
    </div>
  );
}

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>(emptyFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const hasAvatar = Boolean(avatarFile || formValues.avatarUrl);
  const hasMissingRequiredFields = Boolean(
    Object.keys(validateForm(formValues, hasAvatar)).length
  );

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    if (!userId || isBootstrapping) {
      return;
    }

    saveDraft(userId, formValues);
  }, [formValues, isBootstrapping, userId]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    setUserId(user.id);

    const [{ data: agentDataRaw }, { data: profileDataRaw }] = await Promise.all([
      supabase
        .from('agents')
        .select(
          'city, email, full_name, license_number, phone_number, postal_code, profile_completed, role, state'
        )
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('avatar_url, city, full_name, license_number')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const agentData = (agentDataRaw as AgentRecord | null) ?? null;
    const profileData = (profileDataRaw as ProfileRecord | null) ?? null;

    const draft = readDraft(user.id);
    const nextValues: FormValues = {
      city: draft?.city ?? agentData?.city ?? profileData?.city ?? '',
      email: user.email ?? agentData?.email ?? '',
      fullName:
        draft?.fullName ??
        profileData?.full_name ??
        agentData?.full_name ??
        (typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : '') ??
        '',
      licenseNumber:
        draft?.licenseNumber ??
        agentData?.license_number ??
        profileData?.license_number ??
        (typeof user.user_metadata?.license_number === 'string'
          ? user.user_metadata.license_number
          : '') ??
        '',
      phoneNumber: draft?.phoneNumber ?? agentData?.phone_number ?? '',
      postalCode: draft?.postalCode ?? agentData?.postal_code ?? '',
      state: draft?.state ?? agentData?.state ?? '',
      avatarUrl: draft?.avatarUrl ?? profileData?.avatar_url ?? '',
    };

    setFormValues(nextValues);
    setAvatarPreviewUrl(nextValues.avatarUrl);
    setIsBootstrapping(false);
  }

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'email') {
      return;
    }

    const fieldName = field as Exclude<keyof FormValues, 'email' | 'avatarUrl'>;

    if (errors[fieldName]) {
      const nextValues = {
        ...formValues,
        [field]: value,
      };

      setErrors((current) => ({
        ...current,
        [fieldName]: getFieldError(fieldName, nextValues, hasAvatar) || undefined,
      }));
    }
  }

  function handleBlur(field: FieldName) {
    setErrors((current) => ({
      ...current,
      [field]: getFieldError(field, formValues, hasAvatar) || undefined,
    }));
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setAvatarFile(nextFile);

    if (!nextFile) {
      setErrors((current) => ({
        ...current,
        avatar: getFieldError('avatar', formValues, Boolean(formValues.avatarUrl)) || undefined,
      }));
      return;
    }

    if (avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(nextFile);
    setAvatarPreviewUrl(previewUrl);
    setErrors((current) => ({
      ...current,
      avatar: undefined,
    }));
  }

  async function uploadAvatar(file: File, currentUserId: string) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUserId}.${fileExt}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) {
      throw new Error(error.message || 'Avatar upload failed. Please try again.');
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const nextErrors = validateForm(formValues, hasAvatar);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage({
        type: 'error',
        text: 'Please complete every required field before continuing.',
      });
      return;
    }

    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      router.replace('/login');
      return;
    }

    try {
      let finalAvatarUrl = formValues.avatarUrl;

      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile, user.id);
      }

      if (!finalAvatarUrl) {
        throw new Error('Upload a profile image before continuing.');
      }

      const trimmedValues = {
        city: formValues.city.trim(),
        full_name: formValues.fullName.trim(),
        license_number: formValues.licenseNumber.trim(),
        phone_number: formValues.phoneNumber.trim(),
        postal_code: formValues.postalCode.trim(),
        state: formValues.state.trim(),
      };

      const [{ error: profileError }, { error: agentError }] = await Promise.all([
        supabase.from('profiles').upsert({
          id: user.id,
          full_name: trimmedValues.full_name,
          city: trimmedValues.city,
          license_number: trimmedValues.license_number,
          avatar_url: finalAvatarUrl,
        }),
        supabase
          .from('agents')
          .update({
            city: trimmedValues.city,
            full_name: trimmedValues.full_name,
            license_number: trimmedValues.license_number,
            phone_number: trimmedValues.phone_number,
            postal_code: trimmedValues.postal_code,
            profile_completed: true,
            state: trimmedValues.state,
          })
          .eq('id', user.id),
      ]);

      if (profileError) {
        throw new Error(profileError.message || 'Unable to save your profile.');
      }

      if (agentError) {
        throw new Error(agentError.message || 'Unable to update your agent record.');
      }

      const activationResponse = await fetch('/api/agent/activation/refresh', {
        method: 'POST',
      });

      const activationResult = (await activationResponse.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
            success?: boolean;
          }
        | null;

      if (!activationResponse.ok || !activationResult?.success) {
        throw new Error(
          activationResult?.error?.message ||
            'Unable to refresh your activation status.'
        );
      }

      clearDraft(user.id);
      setViewMode('agent');
      setFormValues((current) => ({
        ...current,
        avatarUrl: finalAvatarUrl,
      }));
      setAvatarFile(null);
      setMessage({
        type: 'success',
        text: 'Your profile is ready. Redirecting to the dashboard...',
      });
      router.push('/dashboard');
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Something went wrong while saving your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const submitButtonLabel = useMemo(() => {
    if (isSaving) {
      return 'Saving your profile...';
    }

    if (hasMissingRequiredFields) {
      return 'Complete Required Fields';
    }

    return 'Save Profile';
  }, [hasMissingRequiredFields, isSaving]);

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(22,37,68,0.94),rgba(11,20,38,0.92))] p-7 shadow-[0_35px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-main)]/20 bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--gold-main)]">
              <ShieldCheck size={14} />
              Agent Activation
            </div>

            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
              Complete Your Public Agent Profile
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Finish your onboarding to unlock the dashboard and prepare your
              profile for the CRLA public directory. Every required field below
              must be completed before access is granted.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                Profile Preview
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="text-white/35" size={28} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">
                    {formValues.fullName || 'Your full name'}
                  </p>
                  <p className="truncate text-sm text-white/55">
                    {formValues.email || 'Email will appear here'}
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    {formValues.city || 'City'}, {formValues.state || 'State'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                'Full legal name',
                'Phone number',
                'License number',
                'City, state, and postal code',
                'Required profile image',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:p-8"
          >
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

            <section className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
              <SectionHeading
                eyebrow="Section 1"
                title="Personal Info"
                description="These details identify you inside the platform and in future directory listings."
              />

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Full Name
                  </label>
                  <input
                    value={formValues.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="Full legal name"
                  />
                  <FieldError message={errors.fullName} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Email
                  </label>
                  <input
                    value={formValues.email}
                    disabled
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white/60 outline-none"
                    placeholder="Email address"
                  />
                  <p className="mt-2 text-sm text-white/45">
                    This comes from your account and cannot be edited here.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
              <SectionHeading
                eyebrow="Section 2"
                title="Professional Info"
                description="Add the key information needed to verify and activate your agent profile."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formValues.phoneNumber}
                    onChange={(event) => updateField('phoneNumber', event.target.value)}
                    onBlur={() => handleBlur('phoneNumber')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="(555) 555-5555"
                  />
                  <FieldError message={errors.phoneNumber} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    License Number
                  </label>
                  <input
                    value={formValues.licenseNumber}
                    onChange={(event) => updateField('licenseNumber', event.target.value)}
                    onBlur={() => handleBlur('licenseNumber')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="License number"
                  />
                  <FieldError message={errors.licenseNumber} />
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
              <SectionHeading
                eyebrow="Section 3"
                title="Location"
                description="This location information will be used to place you accurately in the agent experience and directory."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    City
                  </label>
                  <input
                    value={formValues.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    onBlur={() => handleBlur('city')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="City"
                  />
                  <FieldError message={errors.city} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    State
                  </label>
                  <input
                    value={formValues.state}
                    onChange={(event) => updateField('state', event.target.value)}
                    onBlur={() => handleBlur('state')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="State"
                  />
                  <FieldError message={errors.state} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Postal Code
                  </label>
                  <input
                    value={formValues.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                    onBlur={() => handleBlur('postalCode')}
                    disabled={isBootstrapping || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="Postal code"
                  />
                  <FieldError message={errors.postalCode} />
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
              <SectionHeading
                eyebrow="Section 4"
                title="Profile Image"
                description="A profile image is required before you can continue."
              />

              <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt="Selected profile image"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="text-white/30" size={30} />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Upload Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    onBlur={() => handleBlur('avatar')}
                    disabled={isBootstrapping || isSaving}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[var(--gold-main)] file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-[var(--gold-soft)]"
                  />
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/45">
                    <MapPin size={14} />
                    Square or portrait images look best in the directory.
                  </p>
                  <FieldError message={errors.avatar} />
                </div>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/50">
                You’ll unlock dashboard access as soon as your profile is saved.
              </p>

              <button
                type="submit"
                disabled={isBootstrapping || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3.5 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                {submitButtonLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
