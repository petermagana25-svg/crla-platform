"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

export default function AgentLoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="bg-[var(--navy-dark)] text-white min-h-screen">
      <Navbar />

      <section className="relative flex items-center justify-center py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(31,64,114,0.35),transparent_35%)]" />

        <Container>
          <div className="relative mx-auto max-w-md">

            {/* Glass Card */}
            <div className="rounded-[40px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,.45)]">

              <h1 className="text-center text-4xl font-bold">
                Certified Agent Portal
              </h1>

              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Access your dashboard and manage your listings
              </p>

              {/* Form */}
              <form className="mt-10 space-y-6">

                {/* Email */}
                <div>
                  <label className="text-sm text-white/70">Email Address</label>
                  <input
                    type="email"
                    placeholder="agent@email.com"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm text-white/70">Password</label>

                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="text-right">
                  <Link
                    href="#"
                    className="text-sm text-[var(--gold-main)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-4 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_15px_45px_rgba(212,175,55,.35)]"
                >
                  Login to Portal
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Divider */}
              <div className="my-10 h-px bg-white/10" />

              {/* CTA */}
              <p className="text-center text-sm text-[var(--text-muted)]">
                Not certified yet?
              </p>

              <Link
                href="/get-certified"
                className="mt-4 inline-flex w-full justify-center rounded-full border border-[var(--gold-main)]/30 bg-[rgba(212,175,55,0.08)] px-6 py-3 text-sm font-semibold text-[var(--gold-main)] transition hover:-translate-y-1 hover:bg-[rgba(212,175,55,0.18)]"
              >
                Become a Certified Agent
              </Link>

            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}