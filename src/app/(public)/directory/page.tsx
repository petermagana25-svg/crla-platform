"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileBadge2, MapPin, Search, Star } from "lucide-react";
import LeadMessageButton from "@/components/public/LeadMessageButton";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { supabase } from "@/lib/supabase";

type AgentCardData = {
  agentStatus: string | null;
  bio?: string | null;
  city: string;
  isPlaceholder: boolean;
  id: string;
  image?: string;
  licenseNumber?: string | null;
  listingCount: number;
  location: string;
  name: string;
  rating: number | null;
  region: string;
  specialty: string | null;
};

type AgentRow = {
  city: string | null;
  created_at: string | null;
  full_name: string | null;
  agent_status: string | null;
  id: string;
  license_number: string | null;
  state: string | null;
};

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  id: string;
};

type ListingCountRow = {
  agent_id: string;
};

const minimumDirectoryAgents = 6;

const placeholderAgents = [
  {
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    city: "Los Angeles",
    full_name: "Michael Carter",
    state: "CA",
  },
  {
    avatar_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    city: "San Diego",
    full_name: "Sophia Martinez",
    state: "CA",
  },
  {
    avatar_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    city: "San Francisco",
    full_name: "Daniel Kim",
    state: "CA",
  },
  {
    avatar_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    city: "Sacramento",
    full_name: "Emily Johnson",
    state: "CA",
  },
  {
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    city: "Irvine",
    full_name: "James Anderson",
    state: "CA",
  },
  {
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    city: "San Jose",
    full_name: "Olivia Chen",
    state: "CA",
  },
] as const;

async function trackProfileView(agentId: string) {
  try {
    await fetch("/api/profile-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
    });
  } catch (error) {
    console.error("Unable to track profile view:", error);
  }
}

function AgentCard({
  agent,
  onTrackView,
}: {
  agent: AgentCardData;
  onTrackView: (agentId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleToggleExpand() {
    if (agent.isPlaceholder) {
      return;
    }

    setIsExpanded((current) => {
      const next = !current;

      if (next) {
        onTrackView(agent.id);
      }

      return next;
    });
  }

  return (
    <div
      className={`group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition duration-200 hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_25px_70px_rgba(0,0,0,.35)] ${
        isExpanded ? "shadow-[0_30px_80px_rgba(0,0,0,.36)]" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleToggleExpand}
        disabled={agent.isPlaceholder}
        className={`w-full text-left ${agent.isPlaceholder ? "cursor-default" : ""}`}
        aria-expanded={isExpanded}
      >
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

        <div className="mt-3 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em] ${
              agent.isPlaceholder
                ? "border border-white/10 bg-white/5 text-white/65"
                : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {agent.isPlaceholder ? "Coming Soon" : "Active"}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <MapPin size={16} />
          {agent.city}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Star
            size={16}
            className="fill-[var(--gold-main)] text-[var(--gold-main)]"
          />
          <span className="font-semibold">{agent.rating || "New"}</span>
          <span className="text-sm text-[var(--text-muted)]">Client rating</span>
        </div>

        {!agent.isPlaceholder ? (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/55">
            <span>{isExpanded ? "Show less" : "View profile details"}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        ) : null}
      </button>

      <div
        className={`grid transition-all duration-200 ${
          isExpanded ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  License Number
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {agent.licenseNumber || "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Listings
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {agent.listingCount}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-white/80">
                <FileBadge2 size={16} className="text-[var(--gold-main)]" />
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Bio
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {agent.bio || "Certified renovation listing specialist"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6" onClick={(event) => event.stopPropagation()}>
        <LeadMessageButton
          agentId={agent.isPlaceholder ? null : agent.id}
          agentName={agent.name}
          buttonLabel="Contact Agent"
          disabled={agent.isPlaceholder}
          onOpen={() => {
            if (!agent.isPlaceholder) {
              onTrackView(agent.id);
            }
          }}
          className="inline-flex w-full justify-center rounded-xl bg-[var(--gold-main)] px-5 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)] hover:shadow-[0_10px_30px_rgba(212,175,55,.25)]"
        />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  const [agents, setAgents] = useState<AgentCardData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");

  async function fetchAgents() {
    const { data: realAgentData, error: realAgentError } = await supabase
      .from("agents")
      .select("id, full_name, city, state, created_at, agent_status, license_number")
      .eq("agent_status", "active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const realAgents = (realAgentData ?? []) as AgentRow[];
    const sortedRealAgents = [...realAgents].sort((a, b) => {
      const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0;

      return bCreatedAt - aCreatedAt;
    });

    const agentIds = sortedRealAgents.map((agent) => agent.id);
    const { data: listingCountsData } = agentIds.length
      ? await supabase
          .from("listings")
          .select("agent_id")
          .in("agent_id", agentIds)
      : { data: [] as ListingCountRow[] };

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
    const listingCountsByAgent = ((listingCountsData ?? []) as ListingCountRow[]).reduce<
      Record<string, number>
    >((collection, listing) => {
      collection[listing.agent_id] = (collection[listing.agent_id] ?? 0) + 1;
      return collection;
    }, {});

    const mappedRealAgents: AgentCardData[] = sortedRealAgents.map((agent) => {
      const profile = profilesById[agent.id];
      const state = agent.state?.trim() || "State not set";
      const city = agent.city?.trim() || "Location not set";

      return {
        agentStatus: agent.agent_status,
        bio: profile?.bio,
        city,
        isPlaceholder: false,
        id: agent.id,
        image: profile?.avatar_url || "/images/agent-1.jpg",
        licenseNumber: agent.license_number,
        listingCount: listingCountsByAgent[agent.id] ?? 0,
        location: agent.city ? `${city}, ${state}` : state,
        name: agent.full_name || "Certified Agent",
        rating: null,
        region: state,
        specialty: profile?.bio ?? null,
      };
    });

    const placeholderCount = Math.max(
      minimumDirectoryAgents - mappedRealAgents.length,
      0
    );

    const mappedPlaceholderAgents: AgentCardData[] = placeholderAgents
      .slice(0, placeholderCount)
      .map((agent, index) => ({
        agentStatus: "coming_soon",
        bio: "Certified renovation listing specialist joining the CRLA directory soon.",
        city: agent.city,
        id: `placeholder-${index + 1}`,
        image: agent.avatar_url,
        isPlaceholder: true,
        licenseNumber: null,
        listingCount: 0,
        location: `${agent.city}, ${agent.state}`,
        name: agent.full_name,
        rating: null,
        region: agent.state,
        specialty: "Coming soon to the CRLA network",
      }));

    if (realAgentError) {
      setAgents(mappedPlaceholderAgents);
      return;
    }

    setAgents([...mappedRealAgents, ...mappedPlaceholderAgents]);
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
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onTrackView={trackProfileView}
                />
              ))}
            </div>

          {filteredAgents.length === 0 && (
            <p className="mt-16 text-center text-white/50">
              No CRLA agents match your filters.
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
