"use client";

import Link from "next/link";
import { BookOpen, CreditCard, LifeBuoy, Megaphone, UserRound } from "lucide-react";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";

const supportRoutes = [
  {
    href: "/onboarding/profile",
    icon: <UserRound size={18} />,
    title: "Profile settings",
    description: "Update your agent details, licensing info, and public-facing profile.",
  },
  {
    href: "/dashboard/billing",
    icon: <CreditCard size={18} />,
    title: "Billing & membership",
    description: "Review renewal timing, payment status, and current membership access.",
  },
  {
    href: "/dashboard/academy",
    icon: <BookOpen size={18} />,
    title: "Academy",
    description: "Find training resources and certification-related guidance.",
  },
  {
    href: "/dashboard/marketing-assets",
    icon: <Megaphone size={18} />,
    title: "Marketing assets",
    description: "Grab the latest brand files and promotional resources.",
  },
] as const;

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToDashboardButton />

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Support Center
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                  Help & Support
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Start with the most common member workflows so you can solve
                  profile, billing, and training questions quickly.
                </p>
              </div>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] text-[var(--gold-main)]">
                <LifeBuoy size={28} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {supportRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_25px_60px_rgba(0,0,0,.30)]"
              >
                <div className="inline-flex rounded-2xl bg-[rgba(212,175,55,0.12)] p-3 text-[var(--gold-main)] transition duration-300 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.18)]">
                  {route.icon}
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">
                  {route.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                  {route.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-[var(--gold-main)]">
                  Open section
                </p>
              </Link>
            ))}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.10),rgba(255,255,255,0.04))] p-7 backdrop-blur-2xl">
            <h2 className="text-2xl font-semibold text-white">Need more help?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
              This support area is ready for future contact options such as member
              support tickets, guided help articles, and direct assistance channels.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
