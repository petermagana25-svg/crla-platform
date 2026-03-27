"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { supabase } from "@/lib/supabase";

type AgentCardData = {
  bio?: string | null;
  id: string;
  image?: string;
  location: string;
  name: string;
  rating: number | null;
  region: string;
  specialty: string | null;
};

type AgentRow = {
  city: string | null;
  full_name: string | null;
  id: string;
  state: string | null;
};

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  id: string;
};

function AgentCard({ agent }: { agent: AgentCardData }) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">
      <div className="mb-6 flex justify-center">
        <div className="w-[240px] overflow-hidden rounded-2xl border border-white/10">
          <div className="aspect-[4/3] w-full">
            <img
              src={agent.image || "/images/agent-1.jpg"}
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
        <Star
          size={16}
          className="fill-[var(--gold-main)] text-[var(--gold-main)]"
        />
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
  const [agents, setAgents] = useState<AgentCardData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");

  async function fetchAgents() {
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name, city, state")
      .eq("agent_status", "active")
      .eq("is_active", true)
      .eq("role", "agent")
      .order("full_name", { ascending: true });

    if (agentError || !agentData) {
      setAgents([]);
      return;
    }

    const agentRows = agentData as AgentRow[];
    const agentIds = agentRows.map((agent) => agent.id);

    const { data: profileData } = agentIds.length
      ? await supabase
          .from("profiles")
          .select("id, bio, avatar_url")
          .in("id", agentIds)
      : { data: [] as ProfileRow[] };

    const profilesById = ((profileData ?? []) as ProfileRow[]).reduce<
      Record<string, ProfileRow>
    >((collection, profile) => {
      collection[profile.id] = profile;
      return collection;
    }, {});

    const mappedAgents: AgentCardData[] = agentRows.map((agent) => {
      const profile = profilesById[agent.id];
      const state = agent.state?.trim() || "State not set";
      const city = agent.city?.trim() || "Location not set";

      return {
        bio: profile?.bio,
        id: agent.id,
        image: profile?.avatar_url || "/images/agent-1.jpg",
        location: agent.city ? `${city}, ${state}` : state,
        name: agent.full_name || "Certified Agent",
        rating: null,
        region: state,
        specialty: profile?.bio ?? null,
      };
    });

    setAgents(mappedAgents);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAgents();
  }, []);

  const availableStates = useMemo(
    () =>
      Array.from(new Set(agents.map((agent) => agent.region)))
        .filter(Boolean)
        .sort(),
    [agents]
  );

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.location.toLowerCase().includes(search.toLowerCase());
      const matchesState =
        selectedState === "All" || agent.region === selectedState;

      return matchesSearch && matchesState;
    });
  }, [agents, search, selectedState]);

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
              Connect with active CRLA agents who have completed onboarding,
              certification, and membership activation.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or city"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--gold-main)]"
              />
            </div>

            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur"
            >
              <option value="All">All States</option>
              {availableStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
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
              No active CRLA agents match your filters.
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
