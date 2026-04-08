'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
  sharedActiveNavItemClass,
  sharedInactiveNavItemClass,
  sharedNavItemBaseClass,
} from '@/lib/nav-item-styles';
import { logout } from '@/lib/logout';
import { setViewMode } from '@/lib/view-mode';

const navigation = [
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/agents', label: 'Agents' },
  { href: '/admin/resources', label: 'Resources' },
];

export default function AdminChrome({ children }: { children: ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '';
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headerButtonClass =
    'inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout(router);
  }

  function handleSwitchToAgentView() {
    setViewMode('agent');
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="hidden w-full max-w-xs border-r border-white/10 bg-slate-900/80 px-6 py-8 md:block">
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
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 text-sm font-medium ${sharedNavItemBaseClass} ${
                    isActive
                      ? sharedActiveNavItemClass
                      : sharedInactiveNavItemClass
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6 md:px-6 md:py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 md:hidden">
                  Admin
                </p>
                <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleSwitchToAgentView}
                  className={`${headerButtonClass} min-h-11 justify-center`}
                >
                  Switch to Agent View
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`${headerButtonClass} min-h-11 justify-center`}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium ${sharedNavItemBaseClass} ${
                      isActive
                        ? sharedActiveNavItemClass
                        : sharedInactiveNavItemClass
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+80px)] sm:px-6 md:px-6 md:py-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
