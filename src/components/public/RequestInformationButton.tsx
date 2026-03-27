"use client";

import { useState } from "react";

export default function RequestInformationButton() {
  const [hasRequested, setHasRequested] = useState(false);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setHasRequested(true)}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--gold-main)] px-5 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)]"
      >
        Request Information
      </button>

      {hasRequested ? (
        <p className="mt-3 text-center text-sm text-white/75">
          Agent will be notified. Direct messaging coming soon.
        </p>
      ) : null}
    </div>
  );
}
