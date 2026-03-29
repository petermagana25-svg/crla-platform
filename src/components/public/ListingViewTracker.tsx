"use client";

import { useEffect } from "react";

export default function ListingViewTracker({
  agentId,
  listingId,
}: {
  agentId?: string | null;
  listingId: string;
}) {
  useEffect(() => {
    if (!agentId) {
      return;
    }

    async function trackListingView() {
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
        console.error("Unable to track listing detail view:", error);
      }
    }

    void trackListingView();
  }, [agentId, listingId]);

  return null;
}
