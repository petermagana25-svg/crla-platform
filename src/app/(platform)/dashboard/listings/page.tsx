"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import { computeAgentStatus } from "@/lib/agent-status";
import { selectPreferredMembership } from "@/lib/membership";
import { supabase } from "@/lib/supabase";

type Listing = {
  address: string;
  city: string;
  expected_completion_date: string | null;
  id: string;
  image_url: string | null;
  projected_price: number | null;
  state: string;
  title: string;
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
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

  return `Ready: ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value))}`;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isActiveAgent, setIsActiveAgent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const [
        { data: agentData },
        { data: membershipData },
        { data: listingData, error: listingError },
      ] =
        await Promise.all([
          supabase
            .from("agents")
            .select(
              "is_active, profile_completed, certification_status, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active"
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("memberships")
            .select("id, status, starts_at, expires_at, created_at")
            .eq("agent_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("listings")
            .select(
              "address, city, expected_completion_date, id, image_url, projected_price, state, title"
            )
            .eq("agent_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (!isMounted) {
        return;
      }

      const preferredMembership = selectPreferredMembership(
        ((membershipData ?? []) as MembershipRow[]).map((membership) => ({
          amount: null,
          created_at: membership.created_at,
          currency: null,
          expires_at: membership.expires_at,
          id: membership.id,
          plan_name: null,
          renewal_period: null,
          starts_at: membership.starts_at,
          status: membership.status,
        }))
      );

      setIsActiveAgent(
        agentData
          ? computeAgentStatus({
              ...(agentData as AgentAccess),
              membership_status: preferredMembership?.status ?? "pending",
            }).finalActive
          : false
      );
      setListings(listingError ? [] : ((listingData ?? []) as Listing[]));
      setIsLoading(false);
    }

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleDeleteListing(listingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(listingId);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("agent_id", user.id);

      if (error) {
        throw new Error(error.message || "Unable to delete listing.");
      }

      setListings((current) => current.filter((listing) => listing.id !== listingId));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete listing."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToDashboardButton />

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Listing Manager
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                  My Listings
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Manage the renovation listings connected to your CRLA agent
                  account.
                </p>
              </div>

              <Link
                href={isActiveAgent ? "/dashboard/listings/new" : "#"}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  isActiveAgent
                    ? "bg-[var(--gold-main)] text-black hover:bg-[var(--gold-soft)]"
                    : "cursor-not-allowed border border-white/10 bg-white/5 text-white/45"
                }`}
              >
                <PlusCircle size={16} />
                Add Listing
              </Link>
            </div>

            {!isActiveAgent && (
              <p className="mt-5 text-sm text-yellow-200">
                Complete your activation to start adding listings
              </p>
            )}
          </div>

          {message && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {message}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] transition duration-300 hover:scale-[1.02]"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt={listing.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/35">
                      <Home size={28} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/25" />

                  <div className="absolute right-3 top-3 z-10 flex gap-2">
                    <Link
                      href={`/dashboard/listings/${listing.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65"
                      aria-label={`Edit ${listing.title || listing.address}`}
                    >
                      <PencilLine size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDeleteListing(listing.id)}
                      disabled={deletingId === listing.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Delete ${listing.title || listing.address}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-white/10 p-4 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/55">
                      {listing.address}, {listing.city}, {listing.state}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      {listing.title || listing.address}
                    </h2>
                    <p className="mt-3 text-2xl font-bold text-[var(--gold-main)]">
                      {formatCurrency(listing.projected_price)}
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      {formatDate(listing.expected_completion_date)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && listings.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
              You don’t have any listings yet
            </div>
          )}

          {isLoading && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
              Loading listings...
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
type AgentAccess = {
  admin_override_active: boolean | null;
  admin_override_membership_active: boolean | null;
  admin_override_profile_complete: boolean | null;
  admin_override_training_complete: boolean | null;
  certification_status: "not_started" | "in_progress" | "completed" | "certified" | null;
  is_active: boolean | null;
  profile_completed: boolean | null;
};

type MembershipRow = {
  created_at: string | null;
  expires_at: string | null;
  id: string;
  starts_at: string | null;
  status: "active" | "expired" | "pending" | "cancelled" | null;
};
