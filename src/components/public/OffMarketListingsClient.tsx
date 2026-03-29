"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import OpportunityListingCard, {
  OpportunityListingCardData,
} from "@/components/public/OpportunityListingCard";

export type OffMarketListing = OpportunityListingCardData & {
  city?: string | null;
  postal_code: string | null;
};

export default function OffMarketListingsClient({
  listings,
}: {
  listings: OffMarketListing[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  async function trackListingClick(listingId: string, agentId?: string | null) {
    console.log("TRACK LISTING CLICK", listingId);

    if (!agentId) {
      return;
    }

    try {
      await fetch("/api/listing-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listingId,
          agent_id: agentId,
        }),
      });
    } catch (error) {
      console.error("Unable to track listing click:", error);
    }
  }

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return listings;
    }

    return listings.filter((listing) => {
      const cityMatch = (listing.city ?? "").toLowerCase().includes(normalizedQuery);
      const postalMatch = (listing.postal_code ?? "")
        .toLowerCase()
        .includes(normalizedQuery);

      return cityMatch || postalMatch;
    });
  }, [listings, searchQuery]);
  const visibleListings = filteredListings.slice(0, 9);

  return (
    <>
      <section className="mt-10 mb-8 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-2xl">
        <label className="relative block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by city or postal code"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pl-12 text-white outline-none transition focus:border-[var(--gold-main)]/40"
          />
        </label>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleListings.map((listing) => (
          <OpportunityListingCard
            key={listing.id}
            href={`/off-market/${listing.id}`}
            onClick={() => {
              void trackListingClick(listing.id, listing.agent_id);
            }}
            listing={listing}
          />
        ))}
      </section>

      {filteredListings.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
          No properties found in this area
        </div>
      )}
    </>
  );
}
