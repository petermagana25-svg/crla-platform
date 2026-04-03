'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordSection() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'error' | 'success';
  } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      password.trim().length >= 8 &&
      confirmPassword.trim().length >= 8 &&
      !isSaving
    );
  }, [confirmPassword, isSaving, password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim().length < 8) {
      setMessage({
        type: 'error',
        text: 'Use at least 8 characters for your new password.',
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

    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setIsSaving(false);
      setMessage({
        type: 'error',
        text: error.message || 'Unable to update your password.',
      });
      return;
    }

    console.log('password updated', {
      source: 'dashboard',
    });

    setPassword('');
    setConfirmPassword('');
    setIsSaving(false);
    setMessage({
      type: 'success',
      text: 'Your password has been updated.',
    });
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-white/40">
            Security
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Change Password
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Update your dashboard password securely through Supabase Auth.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] p-3 text-[var(--gold-main)] sm:block">
          <Lock size={20} />
        </div>
      </div>

      {message && (
        <div
          className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border border-red-400/30 bg-red-400/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block text-white/75">New Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
            placeholder="New password"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block text-white/75">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
            placeholder="Confirm password"
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating Password...
              </>
            ) : (
              'Save New Password'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
