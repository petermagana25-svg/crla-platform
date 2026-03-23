'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function GetCertifiedPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.from("agent_applications").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      license_number: licenseNumber.trim(),
    });

    if (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
      setIsSubmitting(false);
      return;
    }

    setFullName("");
    setEmail("");
    setLicenseNumber("");
    setMessage({
      type: "success",
      text: "Thank you for your application. We will review it within 48 hours.",
    });
    setIsSubmitting(false);
  }

  return (
    <main className="bg-[var(--navy-dark)] text-white">
      <Navbar />

      {/* HERO */}
      <section className="py-28">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold md:text-6xl">
              Become a Certified
              <span className="text-[var(--gold-main)]"> Renovation Listing Agent</span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-[var(--text-muted)]">
              Join a professional network of agents helping homeowners prepare,
              position, and sell their homes faster — often for stronger offers.
            </p>

            <Link
              href="#application"
              className="mt-10 inline-flex rounded-full bg-[var(--gold-main)] px-10 py-5 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
            >
              Check Your Eligibility
            </Link>
          </div>
        </Container>
      </section>

      {/* BENEFITS */}
      <section className="border-y border-white/10 bg-white/[0.02] py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Why Agents Get Certified
            </h2>
            <p className="mt-6 text-lg text-[var(--text-muted)]">
              Certification helps you stand out, win listings, and position
              properties with a smarter pre-sale strategy.
            </p>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Win more competitive listings",
              "Differentiate from non-certified agents",
              "Add renovation strategy to your pitch",
              "Attract serious sellers seeking maximum value",
              "Increase perceived professionalism",
              "Get publicly listed in the CRLA directory",
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle className="mt-1 text-[var(--gold-main)]" />
                <p className="text-[var(--text-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PROCESS */}
      <section className="py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              A Simple Path to Certification
            </h2>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-4">
            {[
              { step: "01", title: "Apply Online", copy: "Submit your professional details for review." },
              { step: "02", title: "Qualification Review", copy: "Our team evaluates your experience and region." },
              { step: "03", title: "Get Certified", copy: "Receive your certification and official badge." },
              { step: "04", title: "Get Listed", copy: "Appear publicly so homeowners can find you." },
            ].map((item) => (
              <div key={item.step} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gold-main)] font-bold text-black">
                  {item.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-4 text-sm text-[var(--text-muted)]">{item.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* APPLICATION FORM */}
      <section id="application" className="bg-[linear-gradient(180deg,#0f1a31,#0b1426)] py-28">
        <Container>
          <div className="mx-auto max-w-2xl rounded-[40px] border border-white/10 bg-white/5 p-12 backdrop-blur">
            <h2 className="text-center text-3xl font-bold">
              Check Your Eligibility
            </h2>

            {message && (
              <div
                className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border border-red-400/30 bg-red-400/10 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <input
                placeholder="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
              <input
                placeholder="License Number"
                value={licenseNumber}
                onChange={(event) => setLicenseNumber(event.target.value)}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[var(--gold-main)] py-4 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </Container>
      </section>
    </main>
  );
}
