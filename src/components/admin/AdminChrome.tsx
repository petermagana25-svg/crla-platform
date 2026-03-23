'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { logout } from '@/lib/logout';

const navigation = [
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/agents', label: 'Agents' },
  { href: '/admin/resources', label: 'Resources' },
];

export default function AdminChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headerButtonClass =
    'inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout(router);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-full max-w-xs border-r border-white/10 bg-slate-900/80 px-6 py-8">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Admin
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Control Center
            </h2>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-white/10 bg-slate-950/80 px-6 py-5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={headerButtonClass}
                >
                  Switch to Agent View
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={headerButtonClass}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
