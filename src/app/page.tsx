import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { SellersBadge, BuyersBadge } from "@/components/ui/BadgeIcons";

export default function HomePage() {
  return (
    <main className="w-full bg-[var(--navy-dark)] text-white">

      <Navbar />

      {/* HERO */}
      <section className="relative w-full overflow-hidden pt-24 pb-28 md:pt-28 md:pb-36 bg-[var(--navy-dark)]" style={{ backgroundImage: 'linear-gradient(to bottom right, var(--navy-dark), var(--navy-dark) 95%, rgba(22, 51, 37, 0.15) 100%)' }}>
        <Container>
          <div className="grid items-start gap-16 lg:grid-cols-2">

            {/* LEFT */}
            <div className="flex flex-col">

              {/* EYEBROW */}
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--gold-main)]">
                Certified Renovation Listing Agent™ Network
              </p>

              {/* HEADLINE */}
              <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-[1.1] md:text-7xl">
                Renovate Now.<br/>
                Pay at Closing.
              </h1>

              {/* SUBHEAD */}
              <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--text-muted)]">
                Strategic upgrades with no upfront cost, recouped at closing.
              </p>

              {/* ELEVATED BADGE STATEMENT BLOCK */}
              <div className="mt-16 mb-14 grid gap-8 sm:grid-cols-2">
                {/* SELLERS COLUMN */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <SellersBadge />
                  </div>
                  <div className="flex flex-col justify-start">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold-main)]">
                      Sellers
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white leading-tight">
                      Sell for More.
                    </h3>
                  </div>
                </div>

                {/* BUYERS COLUMN */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <BuyersBadge />
                  </div>
                  <div className="flex flex-col justify-start">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold-main)]">
                      Buyers
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white leading-tight">
                      Buy Turnkey.
                    </h3>
                  </div>
                </div>
              </div>

              {/* 🔥 CTA STACK */}
              <div className="mt-14 flex flex-col items-start gap-4">

                {/* PRIMARY */}
                <Link
                  href="/directory"
                  className="btn-gold inline-flex h-12 items-center gap-2 rounded-full px-8"
                >
                  Find an Agent Near You
                  <ArrowRight size={18} />
                </Link>

                {/* SEGMENT SWITCH */}
                <span className="pt-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                  For Real Estate Professionals
                </span>

                {/* AGENT ACQUISITION CTA */}
                <Link
                  href="/get-certified"
                  className="gold-halo inline-flex h-12 items-center justify-center rounded-full border border-[var(--gold-main)]/30 px-8 text-[var(--gold-main)] hover-glow transition"
                >
                  Become a Certified Agent
                </Link>

                {/* LOGIN */}
                <Link
                  href="/login"
                  className="text-sm text-white/60 hover:text-white transition"
                >
                  Already certified? Access your dashboard →
                </Link>

              </div>

            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-radial from-[rgba(0,0,0,0.15)] via-[rgba(0,0,0,0.05)] to-transparent"></div>
              <div className="overflow-hidden rounded-[40px] border border-white/10 shadow-[0_60px_160px_rgba(0,0,0,.55)]">
                <img
                  src="/images/hero-house-california.jpg"
                  alt="Renovated California home"
                  className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="absolute -bottom-20 -left-20 hidden md:block">
                <div className="gold-halo h-56 w-56 rounded-full shadow-[0_0_80px_rgba(212,175,55,0.4),0_20px_60px_rgba(0,0,0,.45)] ring-8 ring-[rgba(212,175,55,0.3)] flex items-center justify-center">
                  <img
                    src="/images/branding/crla-logo.jpg"
                    alt="CRLA Badge"
                    className="h-40 w-40 object-contain rounded-full"
                  />
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* GOLD BANNER */}
      <section className="w-full bg-gradient-to-br from-[#d9b554] to-[#9d7d1e] py-16 md:py-20 text-center">
        <p className="text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] text-[var(--navy-dark)]">
          Renovate Now. Pay at Closing.
        </p>
      </section>

      {/* TRUST STRIP */}
      <section className="w-full border-y border-white/10 bg-white/[0.02] py-16 backdrop-blur-xl">
        <Container>
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-around">
            <div className="flex items-center gap-4">
              <img
                src="/images/branding/crla-logo.jpg"
                alt="CRLA Seal"
                className="h-12 w-12 object-contain"
              />
              <span className="text-sm font-semibold text-white">CRLA Certified</span>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white">Certified Renovation Specialists</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white">No Upfront Cost</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white">Recouped at Closing</p>
            </div>
          </div>
        </Container>
      </section>
      {/* PROOF SECTION */}
      <section className="w-full py-24">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold md:text-5xl">
              The Numbers Don’t Lie
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3">

            {[
              {
                img: "/images/house-1.jpg",
                stat: "Fixer-uppers sell for 14% less than move-in ready homes",
                source: "Zillow 2026",
                insight: "Buyers factor in renovation risk and labor costs—preparation removes that uncertainty.",
              },
              {
                img: "/images/house-2.jpg",
                stat: "Move-in ready homes sell ~10 days faster on average",
                source: "Realtor.com/HousingWire 2025",
                insight: "Speed to close matters—turnkey homes don’t require buyer contingencies for repairs.",
              },
              {
                img: "/images/house-3.jpg",
                stat: "19 vs. 56 median days on market, pending vs. not",
                source: "Zillow 2026",
                insight: "Prepared homes attract qualified buyers immediately—less time languishing on market.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,.4)]"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.img}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-6">
                  <p className="text-sm font-semibold text-white">
                    {item.stat}
                  </p>
                  <p className="mt-2 text-xs text-[var(--gold-main)]">
                    {item.source}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                    {item.insight}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </Container>
      </section>

      {/* STAT PULL-QUOTE */}
      <section className="w-full py-24 bg-gradient-radial from-[#0f1522] via-[var(--navy-dark)] to-[var(--navy-dark)]">
        <Container>
          <div className="text-center">
            <p className="text-8xl md:text-9xl font-bold text-[var(--gold-main)] leading-none">
              14%
            </p>
            <p className="mt-8 text-lg md:text-xl font-semibold text-white">
              Fixer-uppers sell for less than move-in ready homes
            </p>
            <p className="mt-4 text-base text-[var(--text-muted)] max-w-2xl mx-auto">
              Buyers discount for renovation risk, labor costs, and uncertainty. Strategic preparation eliminates that risk perception.
            </p>
          </div>
        </Container>
      </section>

      {/* KNOW YOUR OPTIONS SECTION */}
      <section className="w-full bg-[#f5f1ed] py-24 text-[#1a1612]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold md:text-5xl">
              Know Your Options Before You Sell
            </h2>
          </div>

          <div className="mx-auto max-w-2xl space-y-6">
            {[
              "Learn how Renovate Now, Pay at Closing works",
              "Compare your options before listing",
              "Work with a Certified Renovation Listing Agent for guidance",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[var(--gold-main)] mt-0.5">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <p className="text-lg font-medium">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CLOSING CTA */}
      <section className="w-full py-28">
        <Container>
          <div className="glass-strong rounded-[48px] p-16 text-center shadow-[0_40px_120px_rgba(0,0,0,.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--gold-main)]">
              Sell Smarter. Buy Better.
            </p>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">Ready to Sell Smarter?</h2>

            <Link
              href="/directory"
              className="btn-gold mt-10 inline-flex items-center gap-2 rounded-full px-10 py-5"
            >
              Find an Agent
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>

    </main>
  );
}
