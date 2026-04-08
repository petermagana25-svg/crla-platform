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
  isDisabled?: boolean;
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
  isDisabled = false,
  isUploading,
  onFileChange,
}: ProfileAvatarSectionProps) {
  const initials = getInitials(fullName);

  return (
    <section className="mb-8 rounded-[28px] border border-white/10 bg-slate-950/40 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
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

          <div>
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

        <div className="sm:text-right">
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
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 font-semibold transition ${
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
