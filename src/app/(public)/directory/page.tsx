"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Star, Search, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { supabase } from "@/lib/supabase";

// ✅ FAKE AGENTS (1–6 only now)
const fakeAgents = [
  { id: 1, name: "James Walker", location: "Los Angeles, CA", rating: 4.9, specialty: "Luxury homes & renovation-driven sales", region: "Southern California" },
  { id: 2, name: "Mei Chen", location: "San Diego, CA", rating: 4.8, specialty: "Family homes & strategic preparation", region: "Southern California" },
  { id: 3, name: "Carlos Ramirez", location: "San Jose, CA", rating: 4.9, specialty: "High-ROI renovation positioning", region: "Northern California" },
  { id: 4, name: "Aisha Thompson", location: "San Francisco, CA", rating: 5.0, specialty: "Premium staging & luxury strategy", region: "Northern California" },
  { id: 5, name: "Ethan Brooks", location: "Sacramento, CA", rating: 4.7, specialty: "Modern listings & seller strategy", region: "Northern California" },
  { id: 6, name: "Layla Haddad", location: "Irvine, CA", rating: 4.8, specialty: "Turnkey-ready transformations", region: "Southern California" },
];

function AgentCard({ agent }: any) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">
      <div className="mb-6 flex justify-center">
        <div className="w-[240px] overflow-hidden rounded-2xl border border-white/10">
          <div className="aspect-[4/3] w-full">
            <img
              src={agent.image || `/images/agent-${agent.id}.jpg`}
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
        <span className="font-semibold">{agent.rating || "New"}</span>
        <span className="text-sm text-[var(--text-muted)]">Client rating</span>
      </div>

      <p className="mt-4 text-center text-sm leading-6 text-[var(--text-muted)]">
        {agent.specialty || agent.bio || "Certified renovation listing specialist"}
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

  const [realAgents, setRealAgents] = useState<any[]>([]);

  // ✅ FETCH REAL AGENTS (7–9)
  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
   const { data } = await supabase
  .from("profiles")
  .select("*")
  .order("created_at", { ascending: false });

    if (data) {
      const mapped = data.map((a) => ({
        id: a.id,
        name: a.full_name,
        location: a.city || "Location not set",
        rating: null,
        specialty: a.bio,
        region: "User",
        image: a.avatar_url || "/images/default-avatar.jpg",
      }));

      setRealAgents(mapped);
    }
  }

  // ✅ COMBINE FAKE + REAL
  const allAgents = [...fakeAgents, ...realAgents];

  // ✅ FILTER EVERYTHING
  const filteredAgents = useMemo(() => {
    return allAgents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.location.toLowerCase().includes(search.toLowerCase());

      const matchesRegion = region === "All" || agent.region === region;

      const matchesRating =
        minRating === "All" ||
        (agent.rating && agent.rating >= parseFloat(minRating));

      return matchesSearch && matchesRegion && matchesRating;
    });
  }, [search, region, minRating, allAgents]);

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

          {/* FILTERS */}
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
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur"
            >
              <option value="All">All Regions</option>
              <option>Southern California</option>
              <option>Northern California</option>
              <option>User</option>
            </select>

            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur"
            >
              <option value="All">All Ratings</option>
              <option value="4.5">4.5★ & up</option>
              <option value="4.8">4.8★ & up</option>
            </select>
          </div>
        </Container>
      </section>

      {/* GRID */}
      <section className="pb-24">
        <Container>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent, index) => (
              <AgentCard key={index} agent={agent} />
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <p className="mt-16 text-center text-white/50">
              No agents match your filters.
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}