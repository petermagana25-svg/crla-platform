"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Star, Search, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

const agents = [
  { id: 1, name: "James Walker", location: "Los Angeles, CA", rating: 4.9, specialty: "Luxury homes & renovation-driven sales", region: "Southern California" },
  { id: 2, name: "Mei Chen", location: "San Diego, CA", rating: 4.8, specialty: "Family homes & strategic preparation", region: "Southern California" },
  { id: 3, name: "Carlos Ramirez", location: "San Jose, CA", rating: 4.9, specialty: "High-ROI renovation positioning", region: "Northern California" },
  { id: 4, name: "Aisha Thompson", location: "San Francisco, CA", rating: 5.0, specialty: "Premium staging & luxury strategy", region: "Northern California" },
  { id: 5, name: "Ethan Brooks", location: "Sacramento, CA", rating: 4.7, specialty: "Modern listings & seller strategy", region: "Northern California" },
  { id: 6, name: "Layla Haddad", location: "Irvine, CA", rating: 4.8, specialty: "Turnkey-ready transformations", region: "Southern California" },
  { id: 7, name: "Marcus Rivera", location: "Santa Monica, CA", rating: 4.9, specialty: "Upscale coastal property sales", region: "Southern California" },
  { id: 8, name: "Chloe Bennett", location: "Palo Alto, CA", rating: 5.0, specialty: "Executive homes & discreet luxury listings", region: "Northern California" },
];

function AgentCard({ agent }: any) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">
      <div className="mb-6 flex justify-center">
        <div className="w-[240px] overflow-hidden rounded-2xl border border-white/10">
          <div className="aspect-[4/3] w-full">
            <img
              src={`/images/agent-${agent.id}.jpg`}
              alt={agent.name}
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      <h3 className="text-center text-xl font-semibold text-white">
        {agent.name}
      </h3>

      <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        <MapPin size={16} />
        {agent.location}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Star size={16} className="text-[var(--gold-main)] fill-[var(--gold-main)]" />
        <span className="font-semibold">{agent.rating}</span>
        <span className="text-sm text-[var(--text-muted)]">Client rating</span>
      </div>

      <p className="mt-4 text-center text-sm leading-6 text-[var(--text-muted)]">
        {agent.specialty}
      </p>

      <Link
        href="/directory"
        className="mt-6 inline-flex w-full justify-center rounded-xl bg-[var(--gold-main)] px-5 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)] hover:shadow-[0_10px_30px_rgba(212,175,55,.25)]"
      >
        Contact Agent
      </Link>
    </div>
  );
}

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [minRating, setMinRating] = useState("All");

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.location.toLowerCase().includes(search.toLowerCase());

      const matchesRegion = region === "All" || agent.region === region;
      const matchesRating =
        minRating === "All" || agent.rating >= parseFloat(minRating);

      return matchesSearch && matchesRegion && matchesRating;
    });
  }, [search, region, minRating]);

  return (
    <main className="bg-[var(--navy-dark)] text-white">
      <Navbar />

      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold md:text-6xl">
              Find a Certified Renovation Listing Agent
            </h1>
            <p className="mt-6 text-lg leading-8 text-[var(--text-muted)]">
              Connect with certified professionals who help homeowners renovate,
              position, and sell faster — often for more.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search by name or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
              />
            </div>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
            >
              <option value="All">All Regions</option>
              <option>Southern California</option>
              <option>Northern California</option>
            </select>

            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
            >
              <option value="All">All Ratings</option>
              <option value="4.5">4.5★ & up</option>
              <option value="4.8">4.8★ & up</option>
              <option value="5">5★ only</option>
            </select>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <p className="mt-16 text-center text-white/50">
              No agents match your filters.
            </p>
          )}

          {/* AGENT CTA BLOCK */}
          <div className="mt-28">
            <div className="relative overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-[#162544] to-[#0b1426] p-16 text-center shadow-[0_40px_120px_rgba(0,0,0,.45)]">

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(31,64,114,0.35),transparent_40%)]" />

              <div className="relative">
                <h2 className="text-4xl font-bold md:text-5xl">
                  Are You a Real Estate Professional?
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                  Join a growing network of certified agents using renovation-backed
                  listing strategies to win more clients, stand out in competitive markets,
                  and close stronger deals.
                </p>

                <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                  <Link
                    href="/get-certified"
                    className="group inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-10 py-5 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_25px_70px_rgba(212,175,55,.35)]"
                  >
                    Become a Certified Agent
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-10 py-5 font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Learn How It Works
                  </Link>
                </div>

                <p className="mt-8 text-sm text-white/40">
                  Elevate your listings. Strengthen your brand. Grow your business.
                </p>
              </div>

            </div>
          </div>

        </Container>
      </section>
    </main>
  );
}