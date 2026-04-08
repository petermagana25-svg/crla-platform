"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToDashboardButton() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:text-[var(--gold-main)] sm:w-auto"
    >
      <ArrowLeft size={16} />
      Back to Dashboard
    </Link>
  );
}
