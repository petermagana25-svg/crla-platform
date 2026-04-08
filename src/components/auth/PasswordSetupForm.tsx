'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getPostAuthRedirectPathClient } from '@/lib/get-post-auth-redirect-path-client';
import {
  clearPasswordSetupGrant,
  hasValidPasswordSetupGrant,
  readPasswordSetupGrant,
  readPasswordSetupLinkContext,
  storePasswordSetupGrant,
  type PasswordSetupVariant,
} from '@/lib/password-setup';
import { supabase } from '@/lib/supabase';

type PasswordSetupFormProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant: PasswordSetupVariant;
};

type SetupStatus = 'loading' | 'invalid' | 'ready' | 'submitting' | 'success';

const WAIT_FOR_SESSION_MS = 4000;
const WAIT_INTERVAL_MS = 150;
const SESSION_RETRY_LIMIT = 5;
const SESSION_RETRY_DELAY_MS = 100;

export default function PasswordSetupForm({
  eyebrow,
  title,
  description,
  variant,
}: PasswordSetupFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<SetupStatus>('loading');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [resolvedVariant, setResolvedVariant] =
    useState<PasswordSetupVariant>(variant);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const copy = readPasswordSetupCopy(resolvedVariant, {
    eyebrow,
    title,
    description,
  });

  const canSubmit = useMemo(() => {
    return (
      status === 'ready' &&
      password.trim().length >= 8 &&
      confirmPassword.trim().length >= 8
    );
  }, [confirmPassword, password, status]);

  useEffect(() => {
    let isActive = true;

    const syncPasswordSetupState = async () => {
      const currentUrl = new URL(window.location.href);
      const context = readPasswordSetupLinkContext(variant, currentUrl);

      setResolvedVariant(context.variant);
      setStatus('loading');
      setMessage(null);

      if (context.errorCode || context.errorDescription) {
        clearPasswordSetupGrant();

        if (isActive) {
          const nextVariant = context.variant;

          setResolvedVariant(nextVariant);
          setLinkError(
            readLinkErrorMessage(
              context.errorDescription,
              context.errorCode,
              nextVariant
            )
          );
          setStatus('invalid');
        }

        return;
      }

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      const setupGrant = readPasswordSetupGrant(context.variant);

      if (context.hasAuthMarkers) {
        const linkedSession = await waitForAuthLinkSession(
          initialSession?.access_token ?? null
        );

        if (!linkedSession?.user?.id) {
          clearPasswordSetupGrant();

          if (isActive) {
            setLinkError(readLinkErrorMessage(null, null, context.variant));
            setStatus('invalid');
          }

          return;
        }

        storePasswordSetupGrant(context.variant, linkedSession.user.id);

        if (isActive) {
          setLinkError(null);
          setStatus('ready');
        }

        return;
      }

      const session =
        initialSession?.user?.id && hasValidPasswordSetupGrant(
          context.variant,
          initialSession.user.id
        )
          ? initialSession
          : setupGrant
            ? await waitForRecoverySession()
            : initialSession;
      const hasGrant = hasValidPasswordSetupGrant(
        context.variant,
        session?.user?.id
      );

      if (session?.user?.id && hasGrant) {
        if (isActive) {
          setLinkError(null);
          setStatus('ready');
        }

        return;
      }

      clearPasswordSetupGrant();

      if (isActive) {
        setLinkError(
          setupGrant
            ? 'Recovery session not established. Please retry.'
            : readMissingLinkMessage(context.variant)
        );
        setStatus('invalid');
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive || !session?.user?.id) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const context = readPasswordSetupLinkContext(variant, currentUrl);

      setResolvedVariant(context.variant);

      if (context.hasAuthMarkers) {
        storePasswordSetupGrant(context.variant, session.user.id);
      }

      if (
        context.hasAuthMarkers ||
        hasValidPasswordSetupGrant(context.variant, session.user.id)
      ) {
        setLinkError(null);
        setStatus((currentStatus) =>
          currentStatus === 'submitting' ? currentStatus : 'ready'
        );
      }
    });

    void syncPasswordSetupState();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [variant]);

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
        text: 'Passwords do not match. Re-enter both fields to continue.',
      });
      return;
    }

    setStatus('submitting');
    setMessage(null);

    const session = await waitForRecoverySession();

    if (!session) {
      setStatus('ready');
      setLinkError('Recovery session not established. Please retry.');
      setMessage({
        type: 'error',
        text: 'Session not ready. Please wait or retry.',
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setStatus('ready');
      setLinkError(readPasswordUpdateError(error.message, resolvedVariant));
      setMessage({
        type: 'error',
        text: readPasswordUpdateError(
          error.message || 'Unable to update your password.',
          resolvedVariant
        ),
      });
      return;
    }

    clearPasswordSetupGrant();
    setStatus('success');
    setMessage({
      type: 'success',
      text:
        resolvedVariant === 'invite'
          ? 'Your password has been set. Redirecting...'
          : 'Your password has been updated. Redirecting...',
    });

    const redirectTo = await getPostAuthRedirectPathClient();
    router.replace(redirectTo);
  }

  const isReady = status === 'ready' || status === 'submitting' || status === 'success';
  const isSaving = status === 'submitting';

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
              {copy.eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{copy.title}</h1>
            <p className="mt-2 text-sm text-white/50">{copy.description}</p>
          </div>

          {status === 'loading' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                {copy.loadingMessage}
              </div>
            </div>
          ) : !isReady ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm text-red-200">
                {linkError}
              </div>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--gold-main)] py-4 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
              >
                {resolvedVariant === 'invite'
                  ? 'Back to Login'
                  : 'Request Another Reset'}
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
                  placeholder={copy.passwordPlaceholder}
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
                  placeholder={copy.confirmPasswordPlaceholder}
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
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" />
                    {copy.submittingLabel}
                  </span>
                ) : (
                  copy.submitLabel
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

async function waitForAuthLinkSession(initialAccessToken: string | null) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < WAIT_FOR_SESSION_MS) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      if (!initialAccessToken || session.access_token !== initialAccessToken) {
        return session;
      }
    }

    const currentUrl = new URL(window.location.href);
    const context = readPasswordSetupLinkContext('invite', currentUrl);

    if (!context.hasAuthMarkers) {
      break;
    }

    await new Promise((resolve) => window.setTimeout(resolve, WAIT_INTERVAL_MS));
  }

  return null;
}

function readMissingLinkMessage(variant: PasswordSetupVariant) {
  return variant === 'invite'
    ? 'This secure setup page only works from a valid invite or activation email. Ask an admin to send you a fresh link.'
    : 'This secure reset page only works from a valid password reset email. Request a new reset link from the login page.';
}

function readPasswordSetupCopy(
  variant: PasswordSetupVariant,
  fallbackCopy: Pick<PasswordSetupFormProps, 'eyebrow' | 'title' | 'description'>
) {
  if (variant === 'recovery') {
    return {
      confirmPasswordPlaceholder: 'Confirm new password',
      description:
        'Enter your new password below to finish the secure recovery flow and regain access to your account.',
      eyebrow: 'PASSWORD RESET',
      loadingMessage: 'Preparing secure reset...',
      passwordPlaceholder: 'New password',
      submitLabel: 'Update Password',
      submittingLabel: 'Updating your password...',
      title: 'Reset Your Password',
    };
  }

  if (variant === 'invite') {
    return {
      confirmPasswordPlaceholder: 'Confirm password',
      description:
        'Create your password to activate your account and continue into the CRLA platform.',
      eyebrow: 'ACCOUNT SETUP',
      loadingMessage: 'Preparing secure account setup...',
      passwordPlaceholder: 'Create password',
      submitLabel: 'Set Password',
      submittingLabel: 'Setting your password...',
      title: 'Create Your Password',
    };
  }

  return {
    confirmPasswordPlaceholder: 'Confirm password',
    description: fallbackCopy.description,
    eyebrow: fallbackCopy.eyebrow,
    loadingMessage: 'Preparing secure reset...',
    passwordPlaceholder: 'New password',
    submitLabel: 'Save Password',
    submittingLabel: 'Saving your password...',
    title: fallbackCopy.title,
  };
}

async function waitForRecoverySession() {
  let attempts = 0;
  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] =
    null;

  while (attempts < SESSION_RETRY_LIMIT && !session) {
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();
    session = nextSession;

    if (!session) {
      await new Promise((resolve) =>
        setTimeout(resolve, SESSION_RETRY_DELAY_MS)
      );
      attempts += 1;
    }
  }

  return session;
}

function readLinkErrorMessage(
  errorDescription: string | null,
  errorCode: string | null,
  variant: PasswordSetupVariant
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
  variant: PasswordSetupVariant
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
