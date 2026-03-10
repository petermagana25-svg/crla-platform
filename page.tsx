import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Hammer, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import BadgeLogo from "@/components/ui/BadgeLogo";

function StatCard({ value, title }: { value: string; title: string }) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(0,0,0,.35)]">
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
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.15),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(31,64,114,0.35),transparent_35%)]" />

        <Container>
          <div className="grid items-center gap-20 lg:grid-cols-2">

            {/* LEFT */}
            <div className="flex flex-col justify-center">
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

              <div className="mt-14 flex flex-col items-start gap-4">

                {/* Primary CTA */}
                <Link href="/directory" className="group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--gold-main)] px-8 font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_15px_45px_rgba(212,175,55,.35)] active:scale-95">
                  Find an Agent Near You
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                {/* Secondary CTA */}
                <Link href="/how-it-works" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,.25)]">
                  How It Works
                </Link>

                <span className="pt-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                  For Real Estate Professionals
                </span>

                {/* Tertiary CTA */}
                <Link href="/get-certified" className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--gold-main)]/30 bg-[rgba(212,175,55,0.08)] px-8 font-semibold text-[var(--gold-main)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[rgba(212,175,55,0.18)] hover:shadow-[0_10px_30px_rgba(212,175,55,.15)]">
                  Become a Certified Agent
                </Link>
              </div>

              {/* TRUST STRIP */}
              <div className="mt-14 flex flex-wrap gap-8 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <ShieldCheck size={16} className="text-[var(--gold-main)]" />
                  Certified renovation specialists
                </span>
                <span className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <Hammer size={16} className="text-[var(--gold-main)]" />
                  Smart pre-sale improvements
                </span>
                <span className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <BadgeDollarSign size={16} className="text-[var(--gold-main)]" />
                  Pay-at-closing flexibility
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative">
              <div className="overflow-hidden rounded-[40px] border border-white/10 shadow-[0_60px_160px_rgba(0,0,0,.55)] transition-transform duration-500 hover:scale-[1.02]">
                <img
                  src="/images/hero-house-california.jpg"
                  alt="Beautiful renovated California home ready for sale"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div className="absolute -bottom-12 -left-12 hidden md:block">
                <div className="rounded-[32px] border border-[var(--gold-main)]/25 bg-[rgba(11,20,38,0.65)] p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(212,175,55,.15)]">
                  <BadgeLogo />
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
            <StatCard value="+26%" title="More buyer interest for well-prepared homes" />
            <StatCard value="Faster Sales" title="Homes that show better attract quicker offers" />
            <StatCard value="Stronger Offers" title="Buyers compete more for move-in ready homes" />
          </div>
        </Container>
      </section>

      {/* VALUE */}
      <section className="py-28">
        <Container>
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl font-bold md:text-5xl">
                Your Home Might Be
                <span className="text-[var(--gold-main)]"> Undervalued</span>
              </h2>
              <p className="mt-8 text-lg leading-8 text-[var(--text-muted)]">
                Many sellers list too early and miss the opportunity to present their property at its full potential.
              </p>
            </div>

            <div className="overflow-hidden rounded-[40px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,.45)] transition-transform duration-500 hover:scale-[1.02]">
              <img src="/images/kitchen-before-after.jpg" alt="Kitchen renovation comparison" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[linear-gradient(180deg,#0f1a31,#0b1426)] py-28">
        <Container>
          <div className="text-center">
            <h2 className="text-4xl font-bold md:text-5xl">Real Sellers. Real Results.</h2>
            <p className="mt-6 text-lg text-[var(--text-muted)]">
              California homeowners who prepared before listing saw remarkable outcomes.
            </p>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3">

            {[
              ["/images/testimonial-house-1.jpg","We sold in just 4 days and received multiple offers above asking.","Sarah M.","San Diego, CA"],
              ["/images/testimonial-house-2.jpg","The upgrades paid for themselves. Buyers loved the presentation.","Daniel R.","Los Angeles, CA"],
              ["/images/testimonial-house-3.jpg","We got $38,000 more than our original expected selling price.","Linda K.","San Jose, CA"]
            ].map(([img,quote,name,loc],i)=>(
              <div key={i} className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(0,0,0,.35)]">
                <div className="mb-6 overflow-hidden rounded-2xl">
                  <img src={img as string} alt="Customer home" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                </div>
                <p className="text-lg leading-8 text-white/90">“{quote}”</p>
                <p className="mt-6 font-semibold text-white">{name}</p>
                <p className="text-sm text-[var(--text-muted)]">{loc}</p>
              </div>
            ))}

          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-28">
        <Container>
          <div className="rounded-[48px] border border-white/10 bg-gradient-to-br from-[#162544] to-[#0b1426] p-16 text-center shadow-[0_40px_120px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <h2 className="text-4xl font-bold md:text-5xl">Ready to Sell Smarter?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-muted)]">
              Connect with a Certified Renovation Listing Agent and discover how to position your home for stronger offers.
            </p>
            <Link href="/directory" className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-10 py-5 font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_25px_70px_rgba(212,175,55,.35)] active:scale-95">
              Find an Agent Near You
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>

    </main>
  );
}