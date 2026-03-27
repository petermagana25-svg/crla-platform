"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Megaphone } from "lucide-react";

import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

type Asset = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
};

const categories = ["all", "logo", "badge", "social", "presentation", "other"];

export default function MarketingAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState("all");

  async function fetchAssets() {
    const { data } = await supabase
      .from("marketing_assets")
      .select("*")
      .order("created_at", { ascending: false });

    setAssets(data || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAssets();
  }, []);

  const filtered =
    filter === "all"
      ? assets
      : assets.filter((a) => a.category === filter);

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="py-10 lg:py-14 space-y-10">
          <BackToDashboardButton />

          {/* HEADER */}
          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Brand Resource Center
                </p>

                <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                  Marketing Assets
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Access official CRLA logos, branding kits, and marketing
                  resources to elevate your visibility.
                </p>
              </div>

              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] text-[var(--gold-main)]">
                <Megaphone size={28} />
              </div>
            </div>
          </div>

          {/* FILTER */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const active = filter === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      active
                        ? "bg-[var(--gold-main)] text-black shadow-[0_12px_35px_rgba(212,175,55,.30)]"
                        : "border border-white/10 bg-white/5 text-white/75 hover:bg-[rgba(212,175,55,0.12)] hover:border-[var(--gold-main)]/30 hover:text-white"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="group rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_25px_60px_rgba(0,0,0,.35)]"
              >
                {/* IMAGE */}
                <div className="h-48 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.04)] p-6">
                  <img
                    src={asset.file_url}
                    alt={asset.title}
                    className="max-h-full object-contain transition duration-300 group-hover:scale-[1.05]"
                  />
                </div>

                {/* CONTENT */}
                <div className="mt-5">

                  {/* CATEGORY */}
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    {asset.category}
                  </p>

                  {/* TITLE */}
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {asset.title}
                  </h2>

                  {/* DESCRIPTION */}
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {asset.description}
                  </p>

                  {/* BUTTON */}
                  <a
                    href={asset.file_url + "?download=1"}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold-main)] px-4 py-3 text-sm font-semibold text-black transition duration-300 hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_10px_30px_rgba(212,175,55,.35)]"
                  >
                    <Download size={16} />
                    Download Asset
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </Container>
    </main>
  );
}
