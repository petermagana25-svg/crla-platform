'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPostAuthRedirectPathClient } from '@/lib/get-post-auth-redirect-path-client';

type PasswordSetupFormProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant: 'invite' | 'recovery';
};

export default function PasswordSetupForm({
  eyebrow,
  title,
  description,
  variant,
}: PasswordSetupFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      isReady &&
      !loading &&
      password.trim().length >= 8 &&
      confirmPassword.trim().length >= 8
    );
  }, [confirmPassword, isReady, loading, password]);

  async function loadSessionState() {
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
    const searchParams = currentUrl.searchParams;
    const errorDescription =
      searchParams.get('error_description') ||
      hashParams.get('error_description');
    const errorCode =
      searchParams.get('error_code') || hashParams.get('error_code');

    if (errorDescription || errorCode) {
      setLinkError(readLinkErrorMessage(errorDescription, errorCode, variant));
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setIsReady(Boolean(session));

    if (session) {
      setLinkError(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessionState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsReady(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim().length < 8) {
      setMessage({
        type: 'error',
        text: 'Use at least 8 characters for your password.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setLinkError(readPasswordUpdateError(error.message, variant));
      setMessage({
        type: 'error',
        text: readPasswordUpdateError(
          error.message || 'Unable to update your password.',
          variant
        ),
      });
      return;
    }

    const redirectTo = await getPostAuthRedirectPathClient();

    setMessage({
      type: 'success',
      text: 'Password updated. Redirecting...',
    });

    window.location.href = redirectTo;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--navy-dark)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[var(--gold-main)]/10 blur-[120px]" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4">
        <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--gold-main)]">
              <ShieldCheck size={14} />
              {eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-white/50">{description}</p>
          </div>

          {!isReady ? (
            <div className="space-y-4">
              <div
                className={`rounded-2xl px-4 py-4 text-sm ${
                  linkError
                    ? 'border border-red-400/30 bg-red-400/10 text-red-200'
                    : 'border border-white/10 bg-white/5 text-white/70'
                }`}
              >
                {linkError ||
                  'Use the secure link from your email to open this page and start your password setup.'}
              </div>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--gold-main)] py-4 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-[var(--gold-main)]/50">
                <Lock size={18} className="text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="New password"
                  className="w-full bg-transparent outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-[var(--gold-main)]/50">
                <Lock size={18} className="text-white/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Confirm password"
                  className="w-full bg-transparent outline-none"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {message && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border border-red-400/30 bg-red-400/10 text-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-full bg-[var(--gold-main)] py-4 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" />
                    Saving your password...
                  </span>
                ) : (
                  'Save Password'
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function readLinkErrorMessage(
  errorDescription: string | null,
  errorCode: string | null,
  variant: 'invite' | 'recovery'
) {
  const normalizedDescription = errorDescription?.toLowerCase() ?? '';
  const normalizedCode = errorCode?.toLowerCase() ?? '';

  if (
    normalizedDescription.includes('expired') ||
    normalizedCode.includes('expired')
  ) {
    return variant === 'invite'
      ? 'This activation link has expired. Ask an admin to resend your invite.'
      : 'This reset link has expired. Request a new password reset email from the login page.';
  }

  if (
    normalizedDescription.includes('invalid') ||
    normalizedCode.includes('invalid')
  ) {
    return variant === 'invite'
      ? 'This activation link is invalid. Ask an admin to resend your invite.'
      : 'This reset link is invalid. Request a new password reset email from the login page.';
  }

  return variant === 'invite'
    ? 'This activation link is no longer valid. Ask an admin to resend your invite.'
    : 'This reset link is no longer valid. Request a new password reset email from the login page.';
}

function readPasswordUpdateError(
  message: string,
  variant: 'invite' | 'recovery'
) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('session')) {
    return variant === 'invite'
      ? 'Your activation link is invalid or expired. Ask an admin to resend it.'
      : 'Your reset link is invalid or expired. Request a new one from the login page.';
  }

  if (normalizedMessage.includes('expired')) {
    return variant === 'invite'
      ? 'Your activation link has expired. Ask an admin to resend it.'
      : 'Your reset link has expired. Request a new one from the login page.';
  }

  return message;
}
