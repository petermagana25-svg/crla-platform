'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordSetupForm from '@/components/auth/PasswordSetupForm';
import { supabase } from '@/lib/supabase';

export default function SetPasswordPage() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        await supabase.auth.signOut();

        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (!code) {
          console.error('❌ No auth code found in URL');

          if (isMounted) {
            setInitError('This password setup link is invalid or expired.');
          }

          window.setTimeout(() => {
            router.replace('/login');
          }, 1500);
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ Session exchange error:', error);

          if (isMounted) {
            setInitError(
              error.message || 'Unable to establish a secure password session.'
            );
          }

          window.setTimeout(() => {
            router.replace('/login');
          }, 1500);
          return;
        }

        console.log('✅ New session established for:', data?.user?.email);

        const { data: userData } = await supabase.auth.getUser();
        console.log('ACTIVE USER:', userData?.user?.email);

        if (isMounted) {
          setIsInitializing(false);
          setInitError(null);
        }
      } catch (error) {
        console.error('❌ Unexpected session init error:', error);

        if (isMounted) {
          setInitError('Unable to initialize your password setup session.');
        }

        window.setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
    };

    void initSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isInitializing || initError) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[var(--navy-dark)] text-white">
        <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4">
          <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--gold-main)]">
              SECURE PASSWORD
            </div>
            <h1 className="mt-4 text-3xl font-bold">Preparing Your Session</h1>
            <p className="mt-3 text-sm text-white/60">
              {initError ||
                'Verifying your email link and creating a fresh secure session...'}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PasswordSetupForm
      eyebrow="SECURE PASSWORD"
      title="Set Your Password"
      description="Use your secure link to create or update your password and continue to the CRLA dashboard."
      variant="invite"
    />
  );
}
