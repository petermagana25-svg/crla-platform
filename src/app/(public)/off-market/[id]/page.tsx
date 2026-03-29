import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Home, MapPin } from "lucide-react";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import LeadMessageButton from "@/components/public/LeadMessageButton";
import ListingViewTracker from "@/components/public/ListingViewTracker";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type ListingDetail = {
  address: string;
  agent_id: string | null;
  agent_name: string | null;
  description: string;
  expected_completion_date: string | null;
  id: string;
  image_url: string | null;
  projected_price: number | null;
  renovation_details: string | null;
  title: string;
  agents: {
    email: string | null;
    full_name: string | null;
    id: string;
  } | null;
};

type JoinedListingDetail = Omit<ListingDetail, "agents"> & {
  agents:
    | {
        email: string | null;
        full_name: string | null;
        id: string;
        is_active: boolean | null;
      }[]
    | null;
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Price available upon request";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Completion date coming soon";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

async function fetchOffMarketListing(id: string) {
  const supabase = await createServerSupabaseClient();

  const joinedQuery = await supabase
    .from("listings")
    .select(
      "address, agent_id, description, expected_completion_date, id, image_url, projected_price, renovation_details, title, agents!inner(id, email, full_name, is_active)"
    )
    .eq("id", id)
    .in("status", ["in_progress", "ready"])
    .eq("agents.is_active", true)
    .maybeSingle();

  if (!joinedQuery.error && joinedQuery.data) {
    const listing = joinedQuery.data as JoinedListingDetail;

    return {
      ...listing,
      agent_name: listing.agents?.[0]?.full_name ?? null,
      agents: listing.agents?.[0]
        ? {
            email: listing.agents[0].email,
            full_name: listing.agents[0].full_name,
            id: listing.agents[0].id,
          }
        : null,
    };
  }

  const fallbackQuery = await supabase
    .from("listings")
    .select(
      "address, agent_id, description, expected_completion_date, id, image_url, projected_price, renovation_details, title"
    )
    .eq("id", id)
    .in("status", ["in_progress", "ready"])
    .maybeSingle();

  return fallbackQuery.error
    ? null
    : ((fallbackQuery.data as ListingDetail | null) ?? null);
}

export default async function OffMarketListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await fetchOffMarketListing(id);

  const agentName = listing?.agent_name || listing?.agents?.full_name || "";
  const agentEmail = listing?.agents?.email || null;

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <Link
            href="/off-market"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Off-Market Opportunities
          </Link>

          {!listing ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
              This off-market opportunity is no longer available.
            </div>
          ) : (
            <>
              <ListingViewTracker
                listingId={listing.id}
                agentId={listing.agent_id}
              />

              <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_35px_90px_rgba(0,0,0,.30)]">
                  <div className="relative aspect-square w-full">
                    {listing.image_url ? (
                      <Image
                        src={listing.image_url}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/35">
                        <Home size={34} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                    Off-Market Opportunity
                  </p>
                  <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                    {listing.title || listing.address}
                  </h1>
                  <p className="mt-4 flex items-center gap-2 text-base text-[var(--text-muted)]">
                    <MapPin size={17} />
                    {listing.address}
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <p className="text-sm text-white/55">Projected Price</p>
                      <p className="mt-2 text-3xl font-bold text-[var(--gold-main)]">
                        {formatCurrency(listing.projected_price)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <p className="flex items-center gap-2 text-sm text-white/55">
                        <CalendarDays size={16} />
                        Expected Completion
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatDate(listing.expected_completion_date)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-white/45">
                      Listing Agent
                    </p>
                    <p className="mt-3 text-xl font-semibold text-white">
                      {agentName || "Assigned CRLA agent"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {agentEmail || "Contact details available upon request"}
                    </p>

                    {listing.agent_id ? (
                      <LeadMessageButton
                        agentId={listing.agent_id}
                        agentName={agentName}
                        buttonLabel="Request Information"
                        listingId={listing.id}
                        listingTitle={listing.title || listing.address}
                        className="relative z-10 mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--gold-main)] px-5 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
                      />
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">
                    Property Overview
                  </p>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                    {listing.description}
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">
                    Renovation Details
                  </p>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                    {listing.renovation_details || "Renovation details will be shared by the listing agent."}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
