"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPostAuthRedirectPathClient } from "@/lib/get-post-auth-redirect-path-client";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      !isSigningIn &&
      !isSendingResetEmail
    );
  }, [email, isSendingResetEmail, isSigningIn, password]);

  async function redirectSignedInUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return;
    }

    setIsSigningIn(true);
    const redirectTo = await getPostAuthRedirectPathClient();
    window.location.href = redirectTo;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void redirectSignedInUser();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsSigningIn(false);
      setFeedback({
        type: "error",
        text: error.message || "Unable to sign in.",
      });
      return;
    }

    await supabase.auth.refreshSession();
    const redirectTo = await getPostAuthRedirectPathClient();
    window.location.href = redirectTo;
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setFeedback({
        type: "error",
        text: "Enter your email first.",
      });
      return;
    }

    setFeedback(null);
    setIsSendingResetEmail(true);

    const redirectBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${redirectBaseUrl}/reset-password`,
    });

    if (error) {
      setIsSendingResetEmail(false);
      setFeedback({
        type: "error",
        text: error.message || "Could not send reset link.",
      });
      return;
    }

    setIsSendingResetEmail(false);
    setFeedback({
      type: "success",
      text: "Check your email for a secure password reset link.",
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--navy-dark)] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-8rem] top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[var(--gold-main)]/10 blur-[120px]" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4">
        <div className="w-full max-w-md mx-auto rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.35)]">

          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-[var(--gold-main)] text-xs">
              <ShieldCheck size={14} />
              MEMBER LOGIN
            </div>
            <h2 className="mt-4 text-3xl font-bold">Agent Access</h2>
            <p className="text-sm text-white/50 mt-2">
              Enter your dashboard and manage your presence
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* EMAIL */}
            <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-[var(--gold-main)]/50">
              <Mail size={18} className="text-white/40" />
              <input
                type="email"
                required
                placeholder="Email"
                className="w-full bg-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-[var(--gold-main)]/50">
              <Lock size={18} className="text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                className="w-full bg-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* ERROR */}
            {feedback && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border border-red-400/30 bg-red-400/10 text-red-200"
                }`}
              >
                {feedback.text}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-full bg-[var(--gold-main)] py-4 font-semibold text-black hover:bg-[var(--gold-soft)] transition"
            >
              {isSigningIn ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" />
                  Signing you in...
                </span>
              ) : (
                "Enter Dashboard"
              )}
            </button>

            {/* FORGOT */}
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSendingResetEmail || isSigningIn}
              className="text-xs text-[var(--gold-main)] text-center w-full"
            >
              {isSendingResetEmail ? "Sending reset link..." : "Forgot password?"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
