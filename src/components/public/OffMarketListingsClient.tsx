"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import OpportunityListingCard, {
  OpportunityListingCardData,
} from "@/components/public/OpportunityListingCard";

export type OffMarketListing = OpportunityListingCardData & {
  postal_code: string;
};

export default function OffMarketListingsClient({
  listings,
}: {
  listings: OffMarketListing[];
}) {
  const [postalCode, setPostalCode] = useState("");

  const filteredListings = useMemo(() => {
    if (!postalCode.trim()) {
      return listings;
    }

    return listings.filter((listing) =>
      listing.postal_code.toLowerCase().includes(postalCode.toLowerCase())
    );
  }, [listings, postalCode]);

  return (
    <>
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
        <label className="relative block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            size={18}
          />
          <input
            type="text"
            placeholder="Filter by postal code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-12 pr-4 text-white outline-none transition focus:border-[var(--gold-main)]/40"
          />
        </label>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredListings.map((listing) => (
          <OpportunityListingCard
            key={listing.id}
            href={`/off-market/${listing.id}`}
            listing={listing}
          />
        ))}
      </section>

      {filteredListings.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
          No off-market properties available yet
        </div>
      )}
    </>
  );
}
