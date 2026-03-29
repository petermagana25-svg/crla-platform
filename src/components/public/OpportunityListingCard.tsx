"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, MapPin } from "lucide-react";

export type OpportunityListingCardData = {
  address: string;
  agent_id?: string | null;
  expected_completion_date: string | null;
  id: string;
  image_url: string | null;
  projected_price: number | null;
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

export default function OpportunityListingCard({
  href,
  onClick,
  listing,
}: {
  href?: string;
  onClick?: () => void;
  listing: OpportunityListingCardData;
}) {
  const card = (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] transition duration-300 hover:scale-[1.02]">
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

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
            <MapPin size={13} />
            {listing.address}
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
          {href ? (
            <p className="mt-3 text-sm font-medium text-[var(--gold-main)]">
              View Details
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} onClick={onClick} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
