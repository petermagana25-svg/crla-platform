"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import BadgeLogo from "../ui/BadgeLogo";

export default function Navbar() {
  const pathname = usePathname();

  const navLink =
    "text-[var(--text-muted)] transition hover:text-white";
  const activeLink = "text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,20,38,0.75)] backdrop-blur-xl">
      <Container>
        <div className="flex h-20 items-center justify-between">
          
          {/* LOGO */}
          <BadgeLogo />

          {/* NAV LINKS */}
          <nav className="flex items-center gap-8 text-sm">

            <Link
              href="/"
              className={`${navLink} ${pathname === "/" ? activeLink : ""}`}
            >
              Home
            </Link>

            <Link
              href="/directory"
              className={`${navLink} ${
                pathname === "/directory" ? activeLink : ""
              }`}
            >
              Directory
            </Link>

            <Link
              href="/off-market"
              className={`${navLink} ${
                pathname.startsWith("/off-market") ? activeLink : ""
              }`}
            >
              Opportunities
            </Link>

            <Link
              href="/how-it-works"
              className={`${navLink} ${
                pathname === "/how-it-works" ? activeLink : ""
              }`}
            >
              How It Works
            </Link>

            <Link
              href="/get-certified"
              className={`${navLink} ${
                pathname === "/get-certified" ? activeLink : ""
              }`}
            >
              Become Certified
            </Link>

          </nav>

          {/* RIGHT CTA */}
          <div>
            <Link
              href="/login"
              className="rounded-full bg-[var(--gold-main)] px-6 py-2 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[var(--gold-soft)] hover:shadow-[0_8px_25px_rgba(212,175,55,.35)]"
            >
              Agent Portal
            </Link>
          </div>

        </div>
      </Container>
    </header>
  );
}
