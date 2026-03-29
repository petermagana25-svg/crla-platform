import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import OffMarketListingsClient, {
  OffMarketListing,
} from "@/components/public/OffMarketListingsClient";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function fetchOffMarketListings() {
  const supabase = await createServerSupabaseClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .in("status", ["in_progress", "ready"])
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (listings ?? []) as OffMarketListing[];
}

export default async function OffMarketPage() {
  const listings = await fetchOffMarketListings();

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-12 py-10 lg:py-14">
          <section className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_30%),linear-gradient(180deg,rgba(15,27,48,0.96),rgba(4,8,16,0.98))] px-6 py-14 shadow-[0_45px_120px_rgba(0,0,0,.42)] backdrop-blur-2xl md:px-10 md:py-20">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.45)] to-transparent" />

            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--gold-main)]/80">
                Early Access Inventory
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-7xl">
                Off-Market{" "}
                <span className="text-[var(--gold-main)]">Properties</span>
              </h1>

              <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[var(--text-muted)] md:text-xl">
                Discover homes under renovation before they reach the market.
                Engage early, negotiate directly, and secure your next property
                ahead of the crowd.
              </p>

              <div className="mt-10 grid gap-4 text-sm text-white/85 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur-md">
                  Early access before public listing
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur-md">
                  Negotiate directly with the agent
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur-md">
                  Move into a fully renovated turnkey home
                </div>
              </div>

              <a
                href="#available-properties"
                className="mt-10 inline-flex items-center justify-center rounded-full bg-[var(--gold-main)] px-8 py-4 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[var(--gold-soft)] hover:shadow-[0_16px_40px_rgba(212,175,55,.28)]"
              >
                Explore Available Properties
              </a>
            </div>
          </section>

          <div id="available-properties">
            <OffMarketListingsClient listings={listings} />
          </div>
        </div>
      </Container>
    </main>
  );
}
