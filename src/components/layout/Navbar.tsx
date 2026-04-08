"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import Container from "./Container";
import BadgeLogo from "../ui/BadgeLogo";
import { logout } from "@/lib/logout";

type NavItem = {
  href: string;
  label: string;
  match?: (pathname: string) => boolean;
};

export default function Navbar() {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuRendered, setIsMobileMenuRendered] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const isPlatformRoute =
    pathname === "/profile" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding");

  const navItems = useMemo<NavItem[]>(
    () =>
      isPlatformRoute
        ? [
            {
              href: "/dashboard",
              label: "Dashboard",
              match: (currentPath) => currentPath === "/dashboard",
            },
            {
              href: "/profile",
              label: "Profile Settings",
              match: (currentPath) => currentPath === "/profile",
            },
            {
              href: "/dashboard/billing",
              label: "Membership",
              match: (currentPath) => currentPath.startsWith("/dashboard/billing"),
            },
            {
              href: "/dashboard/help",
              label: "Support",
              match: (currentPath) => currentPath.startsWith("/dashboard/help"),
            },
          ]
        : [
            {
              href: "/",
              label: "Home",
              match: (currentPath) => currentPath === "/",
            },
            {
              href: "/directory",
              label: "Directory",
              match: (currentPath) => currentPath === "/directory",
            },
            {
              href: "/off-market",
              label: "Opportunities",
              match: (currentPath) => currentPath.startsWith("/off-market"),
            },
            {
              href: "/how-it-works",
              label: "How It Works",
              match: (currentPath) => currentPath === "/how-it-works",
            },
            {
              href: "/get-certified",
              label: "Become Certified",
              match: (currentPath) => currentPath === "/get-certified",
            },
          ],
    [isPlatformRoute]
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (isMobileMenuRendered) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuRendered]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const desktopNavLink =
    "rounded-full px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-white/5 hover:text-white";
  const activeNavLink = "bg-white/8 text-white";

  function openMobileMenu() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsMobileMenuRendered(true);
    window.requestAnimationFrame(() => {
      setIsMobileMenuOpen(true);
    });
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsMobileMenuRendered(false);
      closeTimerRef.current = null;
    }, 180);
  }

  async function handleLogout() {
    closeMobileMenu();
    await logout(router);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,20,38,0.78)] backdrop-blur-xl">
        <Container>
          <div className="flex min-h-16 items-center justify-between gap-3 py-3 sm:min-h-20">
            <BadgeLogo />

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const isActive = item.match ? item.match(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`${desktopNavLink} ${isActive ? activeNavLink : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {isPlatformRoute ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="tap-feedback inline-flex min-h-11 items-center rounded-full bg-[var(--gold-main)] px-5 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[var(--gold-soft)] hover:shadow-[0_8px_25px_rgba(212,175,55,.35)]"
                >
                  Agent Portal
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                isMobileMenuRendered ? closeMobileMenu() : openMobileMenu()
              }
              className="tap-feedback inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </Container>
      </header>

      {isMobileMenuRendered ? (
        <div
          className={`fixed inset-0 z-[60] bg-[rgba(7,12,24,0.94)] backdrop-blur-2xl transition duration-200 md:hidden ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <Container
            className={`flex min-h-screen flex-col justify-between py-6 transition duration-200 ${
              isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            } sticky-safe-bottom`}
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <BadgeLogo />
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="tap-feedback inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_18px_60px_rgba(0,0,0,.35)] backdrop-blur-2xl">
                <p className="px-2 text-xs uppercase tracking-[0.24em] text-white/40">
                  {isPlatformRoute ? "Platform Navigation" : "Site Navigation"}
                </p>
                <nav className="mt-4 flex flex-col gap-2">
                  {navItems.map((item) => {
                    const isActive = item.match ? item.match(pathname) : pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`tap-feedback flex min-h-[52px] items-center justify-between rounded-2xl px-4 py-3 text-base font-medium transition ${
                          isActive
                            ? "bg-[var(--gold-main)] text-black shadow-[0_12px_35px_rgba(212,175,55,.28)]"
                            : "bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="space-y-3">
              {isPlatformRoute ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="tap-feedback inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="tap-feedback inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--gold-main)] px-5 py-3 text-base font-semibold text-black transition hover:bg-[var(--gold-soft)]"
                >
                  Agent Portal
                </Link>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </>
  );
}
