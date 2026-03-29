"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, MessageSquareText, UserRound, X } from "lucide-react";

type LeadMessageButtonProps = {
  agentId?: string | null;
  agentName: string;
  buttonLabel: string;
  className?: string;
  disabled?: boolean;
  listingId?: string | null;
  listingTitle?: string | null;
};

export default function LeadMessageButton({
  agentId = null,
  agentName,
  buttonLabel,
  className = "",
  disabled = false,
  listingId = null,
  listingTitle = null,
}: LeadMessageButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const normalizedAgentName = agentName.trim() || "there";
  const modalAgentName = agentName.trim() || "your agent";

  const isUnavailable = disabled || !agentId;
  const initialMessage = useMemo(() => {
    if (listingId && listingTitle) {
      return `Hi ${normalizedAgentName}, I’m interested in the property "${listingTitle}". I would like more details about the renovation, pricing, and availability.`;
    }

    return `Hi ${normalizedAgentName}, I came across your profile on CRLA and would like to learn more about your services.`;
  }, [listingId, listingTitle, normalizedAgentName]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setHasSent(false);
    setMessage(initialMessage);
    setSenderEmail("");
    setSenderName("");
  }, [initialMessage, isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agentId) {
      console.error("Missing agent_id — cannot send message");
      alert("Something went wrong. Please try again.");
      return;
    }

    if (isUnavailable) {
      return;
    }

    if (!senderName.trim() || !senderEmail.trim()) {
      alert("Please enter your name and email so the agent can reply");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Agent ID:", agentId);

      const payload = {
        agent_id: agentId,
        listing_id: listingId || null,
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        message,
      };

      console.log("Submitting payload:", payload);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response", response);

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      console.log("Response body", result);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to send message.");
      }

      setHasSent(true);
      setMessage(initialMessage);
      setSenderEmail("");
      setSenderName("");
      setIsOpen(false);
      alert("Message sent successfully");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send message."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isUnavailable}
        onClick={() => setIsOpen(true)}
        className={`${className} ${isUnavailable ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {buttonLabel}
      </button>

      {hasSent ? (
        <p className="mt-3 text-center text-sm text-emerald-200">
          Your message has been sent.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-sm text-red-200">{error}</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.82)] p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,27,48,0.98),rgba(4,8,16,0.98))] p-6 shadow-[0_40px_120px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  CRLA Message
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  {listingId ? "Request Information" : "Contact Agent"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                  Your message will be delivered to {modalAgentName} in the CRLA inbox.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close message form"
              >
                <X size={16} />
              </button>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                  <MessageSquareText size={16} className="text-[var(--gold-main)]" />
                  Message
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  placeholder="Write your message"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                    <UserRound size={16} className="text-[var(--gold-main)]" />
                    Your name
                  </span>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="Your name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                    <Mail size={16} className="text-[var(--gold-main)]" />
                    Your email
                  </span>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(event) => setSenderEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--gold-main)]/40"
                    placeholder="Your email"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/50">
                  Listing details are included automatically when relevant.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
