import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Hammer,
  ClipboardList,
  Wallet,
  Home,
  Briefcase,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

function StepCard({
  icon,
  step,
  title,
  copy,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_rgba(0,0,0,.35)]">
      <div className="absolute -top-4 left-8 rounded-full bg-[var(--gold-main)] px-4 py-1 text-xs font-bold tracking-widest text-black">
        STEP {step}
      </div>

      <div className="mb-6 inline-flex rounded-2xl bg-[var(--navy-mid)] p-3 text-[var(--gold-main)]">
        {icon}
      </div>

      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">{copy}</p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="bg-[var(--navy-dark)] text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.14),transparent_22%),radial-gradient(circle_at_20%_20%,rgba(31,64,114,0.35),transparent_30%)]" />

        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              How the CRLA Process Works
            </h1>

            <p className="mt-8 text-xl leading-9 text-[var(--text-muted)]">
              A simple, guided path to prepare your home, attract stronger buyers,
              and handle renovation costs at closing.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-8 py-4 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)]"
              >
                Find a Certified Agent
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/"
                className="rounded-full border border-white/15 px-8 py-4 font-semibold text-white transition hover:bg-white/5"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* PROCESS STEPS */}
      <section className="pb-28">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">
                A Clear Path to a
                <span className="text-[var(--gold-main)]"> Stronger Sale</span>
              </h2>
              <p className="mt-6 text-lg text-[var(--text-muted)]">
                Your certified agent coordinates everything so you don’t have to.
              </p>
            </div>

            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              <StepCard step="1" icon={<ClipboardList size={26} />} title="Home Evaluation" copy="A Certified Renovation Listing Agent evaluates your property and identifies the upgrades that will most improve buyer appeal and pricing strength." />
              <StepCard step="2" icon={<Hammer size={26} />} title="Improvement Planning" copy="Your agent designs a focused renovation strategy aimed at maximizing presentation without unnecessary or excessive upgrades." />
              <StepCard step="3" icon={<Wallet size={26} />} title="Pay-at-Closing Funding" copy="Qualified renovation work may be covered by approved funding partners, allowing costs to be repaid when the home sells." />
              <StepCard step="4" icon={<Home size={26} />} title="List & Sell Stronger" copy="Your home enters the market fully prepared, attracting more attention, stronger offers, and faster buyer decisions." />
            </div>
          </div>
        </Container>
      </section>

      {/* WHY IT WORKS */}
      <section className="border-y border-white/10 bg-[rgba(255,255,255,0.03)] py-24">
        <Container>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Why This Approach Works
            </h2>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                "Buyers pay more for homes that feel complete and move-in ready.",
                "Homes that show better generate stronger first impressions.",
                "First impressions directly influence offer speed and pricing power.",
              ].map((text, i) => (
                <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <CheckCircle2 className="mx-auto mb-4 text-[var(--gold-main)]" size={28} />
                  <p className="text-lg text-[var(--text-muted)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* HOMEOWNER CTA */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-[linear-gradient(135deg,#10203e,#0b1426)] p-14 text-center shadow-[0_30px_120px_rgba(0,0,0,.45)]">
            <h2 className="text-4xl font-bold md:text-5xl">
              Ready to Sell Smarter?
            </h2>

            <p className="mt-6 text-lg text-[var(--text-muted)]">
              Connect with a Certified Renovation Listing Agent and discover how
              to position your home for stronger offers and faster results.
            </p>

            <Link href="/directory" className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-10 py-5 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)]">
              Find an Agent Near You
              <ArrowRight size={20} />
            </Link>
          </div>
        </Container>
      </section>

      {/* AGENT RECRUITMENT CTA */}
      <section className="pb-28">
        <Container>
          <div className="mx-auto max-w-4xl rounded-[40px] border border-[var(--gold-main)]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02))] p-14 text-center backdrop-blur">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-[rgba(212,175,55,0.15)] p-4 text-[var(--gold-main)]">
                <Briefcase size={28} />
              </div>
            </div>

            <h2 className="text-4xl font-bold md:text-5xl">
              Are You a Real Estate Professional?
            </h2>

            <p className="mt-6 text-lg text-[var(--text-muted)]">
              Join the Certified Renovation Listing Agent network and offer clients
              renovation-backed selling strategies that elevate property value and
              strengthen your professional positioning.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-6">
              <Link href="/get-certified" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-10 py-5 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)]">
                Become a Certified Agent
                <ArrowRight size={20} />
              </Link>

              <Link href="/contact" className="rounded-full border border-white/15 px-10 py-5 font-semibold text-white transition hover:bg-white/5">
                Talk to Our Team
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}