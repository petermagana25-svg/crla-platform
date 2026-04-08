'use client';

import Image from 'next/image';
import { ChangeEvent } from 'react';
import { Camera, Loader2, User } from 'lucide-react';

type ProfileAvatarSectionProps = {
  avatarUrl: string | null;
  feedback: {
    text: string;
    type: 'error' | 'success';
  } | null;
  fullName: string | null;
  isLoading?: boolean;
  isDisabled?: boolean;
  progress?: number;
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function getInitials(fullName: string | null) {
  if (!fullName) {
    return '';
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfileAvatarSection({
  avatarUrl,
  feedback,
  fullName,
  isLoading = false,
  isDisabled = false,
  progress = 0,
  isUploading,
  onFileChange,
}: ProfileAvatarSectionProps) {
  const initials = getInitials(fullName);

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-6 lg:p-8">
        <div className="flex flex-col items-center gap-6 text-center sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="shimmer-block h-24 w-24 rounded-3xl" />
            <div className="w-full max-w-sm space-y-3">
              <div className="shimmer-block h-4 w-28 rounded-full" />
              <div className="shimmer-block h-7 w-40 rounded-full" />
              <div className="shimmer-block h-4 w-full rounded-full" />
              <div className="shimmer-block h-4 w-4/5 rounded-full" />
            </div>
          </div>

          <div className="w-full">
            <div className="shimmer-block h-[52px] w-full rounded-full sm:w-48" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-6 lg:p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName ? `${fullName} profile photo` : 'Profile photo'}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : initials ? (
              <span className="text-2xl font-semibold tracking-[0.16em] text-[var(--gold-main)]">
                {initials}
              </span>
            ) : (
              <User className="text-white/35" size={32} />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Profile Photo
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Update your avatar
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
              Upload a JPG, PNG, or WebP image up to 3MB. Your new photo will
              appear here as soon as the upload finishes.
            </p>
          </div>
        </div>

        <div className="w-full">
          <input
            id="profile-avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isDisabled || isUploading}
            onChange={onFileChange}
          />
          <label
            htmlFor="profile-avatar-upload"
            className={`tap-feedback inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition sm:w-auto ${
              isDisabled || isUploading
                ? 'cursor-not-allowed bg-white/10 text-white/45'
                : 'bg-[var(--gold-main)] text-black hover:bg-[var(--gold-soft)]'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera size={18} />
                Change Photo
              </>
            )}
          </label>

          {isUploading ? (
            <div className="mt-4 w-full max-w-sm sm:ml-auto">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--gold-main)] transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border border-red-400/30 bg-red-400/10 text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      ) : null}
    </section>
  );
}
