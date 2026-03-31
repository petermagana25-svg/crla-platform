"use client";

import { FormEvent, startTransition, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

export type PublicConversationMessage = {
  archived?: boolean;
  conversation_id?: string;
  created_at: string;
  id: string;
  message: string;
  sender_email: string | null;
  sender_name: string | null;
  sender_type: "agent" | "client";
  status: "read" | "replied" | "unread";
};

type PublicConversationClientProps = {
  agentLabel: string;
  clientLabel: string;
  conversationId: string;
  initialMessages: PublicConversationMessage[];
};

type PublicReplyResponse = {
  data?: {
    reply?: PublicConversationMessage;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PublicConversationClient({
  agentLabel,
  clientLabel,
  conversationId,
  initialMessages,
}: PublicConversationClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [replyDraft, setReplyDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReply = replyDraft.trim();

    if (!trimmedReply) {
      setError("Enter a message before sending.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/messages/public-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: trimmedReply,
        }),
      });

      const result = (await response.json().catch(() => null)) as PublicReplyResponse | null;

      if (!response.ok || !result?.success || !result.data?.reply) {
        throw new Error(result?.error?.message || "Unable to send your message.");
      }

      setMessages((currentMessages) => [...currentMessages, result.data!.reply!]);
      setReplyDraft("");
      setSuccessMessage("Your message has been sent. The CRLA agent will see it in their inbox.");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your message."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_380px]">
      <section className="glass-strong overflow-hidden rounded-[32px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--gold-soft)]">
            Secure Thread
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Continue your conversation
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            This thread is the best place to continue your CRLA conversation. Your
            message will be delivered directly into the agent dashboard.
          </p>
        </div>

        <div className="space-y-4 bg-[rgba(8,14,28,0.55)] px-4 py-6 sm:px-6">
          {messages.map((message) => {
            const isClientMessage = message.sender_type === "client";
            const label = isClientMessage ? clientLabel : agentLabel;

            return (
              <div
                key={message.id}
                className={`flex ${isClientMessage ? "justify-start" : "justify-end"}`}
              >
                <article
                  className={`max-w-2xl rounded-[24px] border px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] ${
                    isClientMessage
                      ? "border-sky-300/20 bg-sky-400/10 text-sky-50"
                      : "border-white/10 bg-white/10 text-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                      {isClientMessage ? "YOUR MESSAGE" : "AGENT RESPONSE"}
                    </span>
                    <span className="text-xs text-white/45">{label}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">
                    {message.message}
                  </p>
                  <p className="mt-3 text-xs text-white/45">
                    {formatMessageTime(message.created_at)}
                  </p>
                </article>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="glass rounded-[32px] border border-white/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--gold-soft)]">
          Reply Securely
        </p>
        <h3 className="mt-3 text-xl font-semibold text-white">Send a message</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Write your reply below. Once sent, the thread will update here and the
          assigned CRLA agent will be notified in their dashboard.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/80">
              Your reply
            </span>
            <textarea
              className="input-premium min-h-[180px] w-full rounded-[24px] px-4 py-4 text-sm text-white outline-none placeholder:text-white/30"
              disabled={isSubmitting}
              name="message"
              onChange={(event) => setReplyDraft(event.target.value)}
              placeholder="Type your message here..."
              value={replyDraft}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}

          <button
            className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="h-4 w-4" />
                Send message
              </>
            )}
          </button>
        </form>
      </aside>
    </div>
  );
}
