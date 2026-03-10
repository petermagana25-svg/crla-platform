"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function AgentLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--navy-dark)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,.45)]">

        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Agent Portal Login
        </h1>

        <div className="mb-5">
          <label className="mb-2 block text-sm text-white/60">Email</label>
          <input
            type="email"
            placeholder="agent@email.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm text-white/60">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 w-full rounded-xl bg-[var(--gold-main)] py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
        >
          Login
        </button>

        <div className="text-center text-sm text-white/50">
          Forgot password?{" "}
          <Link href="/" className="text-[var(--gold-main)] hover:underline">
            Reset here
          </Link>
        </div>
      </div>
    </main>
  );
}