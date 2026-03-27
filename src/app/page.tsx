import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Hammer, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

function StatCard({ value, title }: { value: string; title: string }) {
  return (
    <div className="premium-card glass rounded-3xl p-8 text-center">
      <p className="text-4xl font-bold text-[var(--gold-main)]">{value}</p>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{title}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[var(--navy-dark)] text-white">

      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-28 md:pt-28 md:pb-36">
        <Container>
          <div className="grid items-start gap-16 lg:grid-cols-2">

            {/* LEFT */}
            <div className="flex flex-col">

              {/* 🧠 HOMEOWNER HEADLINE */}
              <h1 className="max-w-2xl text-5xl font-bold leading-[1.1] md:text-7xl">
                Renovate Now.<br/>
                Pay at Closing.<br/>
                <span className="text-[var(--gold-main)]">
                  Sell Faster. Sell for More.
                </span>
              </h1>

              <p className="mt-10 max-w-xl text-lg leading-8 text-[var(--text-muted)]">
                Certified Renovation Listing Agents help homeowners prepare their property
                for market using strategic upgrades and pay-at-closing solutions —
                maximizing value without upfront renovation costs.
              </p>

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

                {/* SECONDARY */}
                <Link
                  href="/how-it-works"
                  className="btn-glass inline-flex h-12 items-center justify-center rounded-full px-8"
                >
                  How It Works
                </Link>

                <Link
                  href="/off-market"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-white transition hover:bg-white/10 hover:text-[var(--gold-main)]"
                >
                  Explore Off-Market Opportunities
                  <ArrowRight size={18} />
                </Link>

                <p className="text-sm text-white/55">
                  Discover homes before they hit the market
                </p>

                {/* 👇 SEGMENT SWITCH */}
                <span className="pt-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                  For Real Estate Professionals
                </span>

                {/* 🔥 AGENT ACQUISITION CTA */}
                <Link
                  href="/get-certified"
                  className="gold-halo inline-flex h-12 items-center justify-center rounded-full border border-[var(--gold-main)]/30 px-8 text-[var(--gold-main)] hover-glow transition"
                >
                  Become a Certified Agent
                </Link>

                {/* 👇 LOGIN (LOW PRIORITY) */}
                <Link
                  href="/login"
                  className="text-sm text-white/60 hover:text-white transition"
                >
                  Already certified? Access your dashboard →
                </Link>

              </div>

              {/* ICON BENEFITS */}
              <div className="mt-14 flex flex-wrap gap-8 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-2 hover:text-white transition">
                  <ShieldCheck size={16} className="text-[var(--gold-main)]" />
                  Certified renovation specialists
                </span>
                <span className="flex items-center gap-2 hover:text-white transition">
                  <Hammer size={16} className="text-[var(--gold-main)]" />
                  Smart pre-sale improvements
                </span>
                <span className="flex items-center gap-2 hover:text-white transition">
                  <BadgeDollarSign size={16} className="text-[var(--gold-main)]" />
                  Pay-at-closing flexibility
                </span>
              </div>

            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="overflow-hidden rounded-[40px] border border-white/10 shadow-[0_60px_160px_rgba(0,0,0,.55)]">
                <img
                  src="/images/hero-house-california.jpg"
                  alt="Renovated California home"
                  className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="absolute -bottom-16 -left-16 hidden md:block">
                <div className="gold-halo h-44 w-44 rounded-full bg-white shadow-[0_20px_60px_rgba(0,0,0,.45)] ring-8 ring-[rgba(212,175,55,0.25)] flex items-center justify-center">
                  <img
                    src="/images/branding/crla-logo.jpg"
                    alt="CRLA Badge"
                    className="h-32 w-32 object-contain rounded-full"
                  />
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* STATS */}
      <section className="border-y border-white/10 bg-white/[0.02] py-16 backdrop-blur-xl">
        <Container>
          <div className="grid gap-10 md:grid-cols-3">
            <StatCard value="+26%" title="More buyer interest" />
            <StatCard value="Faster Sales" title="Homes sell quicker" />
            <StatCard value="Stronger Offers" title="Higher competition" />
          </div>
        </Container>
      </section>
      {/* TESTIMONIAL / RESULTS */}
<section className="py-24">
  <Container>
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold md:text-5xl">
        Real Results from Smart Renovation Strategy
      </h2>
      <p className="mt-4 text-[var(--text-muted)]">
        Properties prepared strategically don’t just sell — they outperform.
      </p>
    </div>

    <div className="grid gap-10 md:grid-cols-3">

      {[
        {
          img: "/images/house-1.jpg",
          text: "Sold in 4 days after strategic renovation upgrades",
        },
        {
          img: "/images/house-2.jpg",
          text: "Received 5 competing offers above asking price",
        },
        {
          img: "/images/house-3.jpg",
          text: "Transformed listing led to 30% more buyer interest",
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

          <div className="p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {item.text}
            </p>
          </div>
        </div>
      ))}

    </div>
  </Container>
</section>

      {/* FINAL CTA */}
      <section className="py-28">
        <Container>
          <div className="glass-strong rounded-[48px] p-16 text-center shadow-[0_40px_120px_rgba(0,0,0,.45)]">
            <h2 className="text-4xl font-bold md:text-5xl">Ready to Sell Smarter?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-muted)]">
              Connect with a certified agent and position your home for stronger offers.
            </p>

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
