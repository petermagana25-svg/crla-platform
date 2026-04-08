'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  clearPasswordSetupGrant,
  readPasswordSetupLinkContext,
  storePasswordSetupGrant,
} from '@/lib/password-setup';

const WAIT_FOR_SESSION_MS = 4000;
const WAIT_INTERVAL_MS = 150;

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState(
    'Verifying your secure link and preparing your password setup session...'
  );

  useEffect(() => {
    let isActive = true;

    const finishWithError = (
      nextPath: string,
      mode: 'invite' | 'recovery',
      errorDescription: string
    ) => {
      const params = new URLSearchParams({
        error_description: errorDescription,
        mode,
      });

      const errorPath =
        mode === 'recovery'
          ? `/set-password?${params.toString()}`
          : `${nextPath}?${params.toString()}`;

      router.replace(errorPath);
    };

    const processCallback = async () => {
      clearPasswordSetupGrant();

      const currentUrl = new URL(window.location.href);
      const context = readPasswordSetupLinkContext('invite', currentUrl);

      if (context.errorCode || context.errorDescription) {
        finishWithError(
          context.nextPath,
          context.variant,
          readLinkErrorMessage(
            context.errorDescription,
            context.errorCode,
            context.variant
          )
        );
        return;
      }

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      const session = context.hasAuthMarkers
        ? await waitForAuthLinkSession(initialSession?.access_token ?? null)
        : initialSession;

      if (!session?.user?.id) {
        finishWithError(
          context.nextPath,
          context.variant,
          readLinkErrorMessage(null, null, context.variant)
        );
        return;
      }

      storePasswordSetupGrant(context.variant, session.user.id);

      if (isActive) {
        setStatusText('Secure link verified. Redirecting to password setup...');
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const nextPath =
        context.variant === 'recovery'
          ? '/set-password?mode=recovery'
          : `${context.nextPath}?mode=${context.variant}`;

      router.replace(nextPath);
    };

    void processCallback();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--navy-dark)] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4">
        <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--gold-main)]">
            <ShieldCheck size={14} />
            SECURE ACCESS
          </div>
          <h1 className="mt-4 text-3xl font-bold">Verifying Your Link</h1>
          <p className="mt-3 text-sm text-white/60">{statusText}</p>
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
