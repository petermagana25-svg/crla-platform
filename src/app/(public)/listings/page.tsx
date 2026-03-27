"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import OpportunityListingCard, {
  OpportunityListingCardData,
} from "@/components/public/OpportunityListingCard";
import { supabase } from "@/lib/supabase";

type Listing = OpportunityListingCardData & {
  postal_code: string;
};

export default function ListingsPublicPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchListings() {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "address, expected_completion_date, id, image_url, postal_code, projected_price, title"
        )
        .in("status", ["in_progress", "ready"])
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      setListings(error ? [] : ((data ?? []) as Listing[]));
    }

    void fetchListings();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredListings = useMemo(() => {
    if (!postalCode.trim()) {
      return listings;
    }

    return listings.filter((listing) =>
      listing.postal_code.toLowerCase().includes(postalCode.toLowerCase())
    );
  }, [listings, postalCode]);

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">
              Public Inventory
            </p>
            <h1 className="mt-3 text-4xl font-bold md:text-5xl">
              Turnkey Houses
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
              Explore renovation listings that are currently in progress or ready
              for market.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
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
          </div>

          <Link
            href="/off-market"
            className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--gold-main)]/20 bg-[rgba(212,175,55,0.08)] px-5 py-4 text-sm text-white/85 transition hover:border-[var(--gold-main)]/35 hover:bg-[rgba(212,175,55,0.12)]"
          >
            <span>
              Looking for early access deals?{" "}
              <span className="text-[var(--gold-main)]">
                View Off-Market Opportunities
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-[var(--gold-main)]" />
          </Link>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <OpportunityListingCard
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
              No turnkey houses available in this area
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
