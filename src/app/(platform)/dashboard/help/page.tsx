"use client";

import Link from "next/link";
import { BookOpen, CreditCard, LifeBuoy, Megaphone, UserRound } from "lucide-react";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";

const supportRoutes = [
  {
    href: "/profile",
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
    <main className="platform-safe-bottom min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="platform-fade-in space-y-6 py-6 sm:space-y-8 sm:py-8 lg:space-y-10 lg:py-12">
          <BackToDashboardButton />

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-5 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl sm:p-6 lg:rounded-[36px] lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Support Center
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  Help & Support
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                  Start with the most common member workflows so you can solve
                  profile, billing, and training questions quickly.
                </p>
              </div>

              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] text-[var(--gold-main)] sm:h-16 sm:w-16">
                <LifeBuoy size={28} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {supportRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_25px_60px_rgba(0,0,0,.30)] sm:p-6"
              >
                <div className="inline-flex rounded-2xl bg-[rgba(212,175,55,0.12)] p-3 text-[var(--gold-main)] transition duration-300 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.18)]">
                  {route.icon}
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl">
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

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.10),rgba(255,255,255,0.04))] p-5 backdrop-blur-2xl sm:p-6 lg:p-7">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Need more help?</h2>
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
