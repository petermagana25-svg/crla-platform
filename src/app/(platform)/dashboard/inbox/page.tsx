"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2, Mail, MessageSquareText, Reply, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";

type MessageRow = {
  created_at: string;
  id: string;
  listing_id: string | null;
  message: string;
  sender_email: string | null;
  sender_name: string | null;
  status: string;
};

type ListingReference = {
  address: string;
  id: string;
  title: string | null;
};

type InboxMessage = MessageRow & {
  listingLabel: string | null;
};

type InboxView = "inbox" | "archived";

function formatTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const differenceInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (differenceInMinutes < 60) {
    const safeMinutes = Math.max(1, differenceInMinutes);
    return `${safeMinutes} min ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} hour${differenceInHours === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getMessagePreview(value: string) {
  return value.length > 60 ? `${value.slice(0, 60)}...` : value;
}

function buildSenderLabel(message: InboxMessage) {
  const leadIdentity = message.sender_name?.trim() || message.sender_email?.trim();

  if (leadIdentity) {
    return `Lead: ${leadIdentity}`;
  }

  return "Lead: Website visitor";
}

export default function InboxPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState<InboxView>("inbox");

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      console.log("Inbox user id:", user.id);

      const { data: messageData, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, listing_id, message, sender_name, sender_email, status, created_at"
        )
        .eq("agent_id", user.id)
        .eq("archived", view === "archived")
        .order("created_at", { ascending: false });

      if (messagesError) {
        if (isMounted) {
          setMessages([]);
          setUnreadCount(0);
          setError(messagesError.message || "Unable to load messages.");
          setIsLoading(false);
        }
        return;
      }

      const rawMessages = (messageData ?? []) as MessageRow[];
      const listingIds = Array.from(
        new Set(
          rawMessages
            .map((message) => message.listing_id)
            .filter((value): value is string => Boolean(value))
        )
      );

      const { data: listingData } = listingIds.length
        ? await supabase
            .from("listings")
            .select("id, title, address")
            .in("id", listingIds)
        : { data: [] as ListingReference[] };

      const listingsById = ((listingData ?? []) as ListingReference[]).reduce<
        Record<string, ListingReference>
      >((collection, listing) => {
        collection[listing.id] = listing;
        return collection;
      }, {});

      const mappedMessages: InboxMessage[] = rawMessages.map((message) => {
        const listing = message.listing_id
          ? listingsById[message.listing_id]
          : undefined;

        return {
          ...message,
          listingLabel: listing
            ? listing.title?.trim() || listing.address
            : null,
        };
      });

      console.log("Fetched messages:", mappedMessages);

      if (!isMounted) {
        return;
      }

      setMessages(mappedMessages);
      setSelectedMessageId((current) =>
        current && mappedMessages.some((message) => message.id === current)
          ? current
          : mappedMessages[0]?.id ?? null
      );
      setUnreadCount(
        mappedMessages.filter((message) => message.status === "new").length
      );
      setIsLoading(false);
    }

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [router, view]);

  const selectedMessage =
    messages.find((message) => message.id === selectedMessageId) ?? null;

  async function handleSelectMessage(message: InboxMessage) {
    setSelectedMessageId(message.id);
    setActionFeedback(null);
    setReplySuccessMessage(null);

    if (view === "archived" || message.status !== "new") {
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, status: "read" } : item
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: message.id,
        }),
      });
    } catch (markReadError) {
      console.error("Unable to mark message as read:", markReadError);
    }
  }

  async function handleMarkAsUnread() {
    if (!selectedMessage || selectedMessage.status === "new") {
      return;
    }

    setActionFeedback(null);
    setReplySuccessMessage(null);
    setMessages((current) =>
      current.map((message) =>
        message.id === selectedMessage.id
          ? { ...message, status: "new" }
          : message
      )
    );
    setUnreadCount((current) => current + 1);

    try {
      const response = await fetch("/api/messages/unread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: selectedMessage.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to mark as unread.");
      }

      setActionFeedback("Marked as unread");
    } catch (markUnreadError) {
      setMessages((current) =>
        current.map((message) =>
          message.id === selectedMessage.id
            ? { ...message, status: "read" }
            : message
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      alert(
        markUnreadError instanceof Error
          ? markUnreadError.message
          : "Unable to mark as unread."
      );
    }
  }

  async function handleArchiveMessage() {
    if (!selectedMessage || view === "archived") {
      return;
    }

    const messageToArchive = selectedMessage;
    const nextMessages = messages.filter(
      (message) => message.id !== messageToArchive.id
    );
    const currentIndex = messages.findIndex(
      (message) => message.id === messageToArchive.id
    );
    const nextSelectedMessage =
      nextMessages[currentIndex] ?? nextMessages[currentIndex - 1] ?? null;

    setActionFeedback(null);
    setReplySuccessMessage(null);
    setMessages(nextMessages);
    setSelectedMessageId(nextSelectedMessage?.id ?? null);
    setUnreadCount((current) =>
      messageToArchive.status === "new" ? Math.max(0, current - 1) : current
    );

    try {
      const response = await fetch("/api/messages/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: messageToArchive.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to archive message.");
      }

      setActionFeedback("Message archived");
    } catch (archiveError) {
      setMessages(messages);
      setSelectedMessageId(messageToArchive.id);
      setUnreadCount((current) =>
        messageToArchive.status === "new" ? current + 1 : current
      );
      alert(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive message."
      );
    }
  }

  async function handleDeleteMessage() {
    if (!selectedMessage || view !== "archived") {
      return;
    }

    const shouldDelete = confirm(
      "Are you sure you want to permanently delete this message?"
    );

    if (!shouldDelete) {
      return;
    }

    const messageToDelete = selectedMessage;
    const previousMessages = messages;
    const nextMessages = messages.filter(
      (message) => message.id !== messageToDelete.id
    );
    const currentIndex = messages.findIndex(
      (message) => message.id === messageToDelete.id
    );
    const nextSelectedMessage =
      nextMessages[currentIndex] ?? nextMessages[currentIndex - 1] ?? null;

    setActionFeedback(null);
    setReplySuccessMessage(null);
    setMessages(nextMessages);
    setSelectedMessageId(nextSelectedMessage?.id ?? null);

    try {
      const response = await fetch("/api/messages/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: messageToDelete.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to delete message.");
      }

      setActionFeedback("Message deleted permanently");
    } catch (deleteError) {
      setMessages(previousMessages);
      setSelectedMessageId(messageToDelete.id);
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message."
      );
    }
  }

  async function handleSendReply() {
    if (!selectedMessage || !replyDraft.trim()) {
      return;
    }

    if (!selectedMessage.sender_email) {
      alert("This lead did not include an email address.");
      return;
    }

    setIsReplying(true);
    setActionFeedback(null);
    setReplySuccessMessage(null);

    try {
      const response = await fetch("/api/messages/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: selectedMessage.id,
          sender_email: selectedMessage.sender_email,
          reply_text: replyDraft,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to send reply.");
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === selectedMessage.id
            ? { ...message, status: "read" }
            : message
        )
      );
      setUnreadCount((current) =>
        selectedMessage.status === "new" ? Math.max(0, current - 1) : current
      );
      setReplySuccessMessage("Reply sent successfully");
      setReplyDraft("");
    } catch (replyError) {
      alert(
        replyError instanceof Error
          ? replyError.message
          : "Unable to send reply."
      );
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToDashboardButton />

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Member Communications
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-5xl">Inbox</h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Review incoming lead messages from the directory and off-market
                  listing requests in one place.
                </p>
              </div>

              <div className="space-y-3">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                  {(["inbox", "archived"] as InboxView[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setView(tab);
                        setActionFeedback(null);
                        setReplySuccessMessage(null);
                        setReplyDraft("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        view === tab
                          ? "bg-[var(--gold-main)] text-black shadow-[0_10px_30px_rgba(212,175,55,.25)]"
                          : "text-white/55 hover:text-[var(--gold-main)]"
                      }`}
                    >
                      {tab === "inbox" ? "Inbox" : "Archived"}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="inline-flex w-full items-center gap-3 rounded-2xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] px-4 py-3 text-[var(--gold-main)]">
                    <Inbox size={20} />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                        New Messages
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {unreadCount}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75">
                    <MessageSquareText size={20} className="text-[var(--gold-main)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                        Total Messages
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {messages.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {actionFeedback ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {actionFeedback}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.34fr)_minmax(0,0.66fr)]">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4 px-2 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {view === "archived" ? "Archived Messages" : "Messages"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {view === "archived"
                      ? "Review archived conversations or remove them permanently."
                      : "Click a message to view the full conversation details."}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                  {messages.length} total
                </span>
              </div>

              {error ? (
                <div className="mt-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {isLoading ? (
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading your inbox...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="mt-2 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                  {view === "archived"
                    ? "You have no archived messages"
                    : "You do not have any messages yet."}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => void handleSelectMessage(message)}
                      className={`w-full rounded-3xl border p-4 text-left transition duration-300 ${
                        selectedMessageId === message.id
                          ? "border-[var(--gold-main)]/40 bg-[rgba(212,175,55,0.12)] shadow-[0_0_0_1px_rgba(212,175,55,0.12),0_16px_40px_rgba(212,175,55,.12)]"
                          : message.status === "new"
                            ? "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))] hover:bg-white/[0.10]"
                            : "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            {message.status === "new" ? (
                              <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                            ) : null}
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className={`truncate text-base ${
                                    message.status === "new"
                                      ? "font-semibold text-white"
                                      : "font-medium text-white/85"
                                  }`}
                                >
                                  {buildSenderLabel(message)}
                                </p>
                                <span className="shrink-0 text-xs text-white/45">
                                  {formatTimestamp(message.created_at)}
                                </span>
                              </div>

                              {message.listingLabel ? (
                                <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold-main)]">
                                  {message.listingLabel}
                                </p>
                              ) : null}

                              <p
                                className={`mt-2 text-sm ${
                                  message.status === "new"
                                    ? "font-medium text-white/88"
                                    : "text-[var(--text-muted)]"
                                }`}
                              >
                                {getMessagePreview(message.message)}
                              </p>

                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                    message.status === "new"
                                      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                      : "border border-white/10 bg-white/5 text-white/55"
                                  }`}
                                >
                                  {message.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
              {!selectedMessage ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      Select a message to view details
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                      Choose a message from the list to read the full inquiry and
                      draft a reply.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/45">
                        Message Detail
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">
                        {buildSenderLabel(selectedMessage)}
                      </h2>
                      {selectedMessage.sender_email ? (
                        <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/65">
                          <Mail size={16} className="text-[var(--gold-main)]" />
                          {selectedMessage.sender_email}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {view === "inbox" ? (
                        <>
                          <button
                            type="button"
                            onClick={handleMarkAsUnread}
                            disabled={selectedMessage.status === "new"}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-[var(--gold-main)]/30 hover:text-[var(--gold-main)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Mark as Unread
                          </button>
                          <button
                            type="button"
                            onClick={handleArchiveMessage}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-[var(--gold-main)]/30 hover:text-[var(--gold-main)]"
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDeleteMessage}
                          className="inline-flex items-center justify-center rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-100 transition hover:border-red-300/40 hover:bg-red-400/15"
                        >
                          Delete Permanently
                        </button>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          selectedMessage.status === "new"
                            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border border-white/10 bg-white/5 text-white/55"
                        }`}
                      >
                        {selectedMessage.status}
                      </span>
                      <span className="text-sm text-white/45">
                        {formatTimestamp(selectedMessage.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6">
                    {selectedMessage.listingLabel ? (
                      <div>
                        <p className="text-base font-medium text-white">
                          {"\uD83D\uDCCD"} Property:
                        </p>
                        <p className="mt-2 text-lg text-white/88">
                          {selectedMessage.listingLabel}
                        </p>
                      </div>
                    ) : null}

                    <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-white/88">
                      {selectedMessage.message}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <Reply size={18} className="text-[var(--gold-main)]" />
                      <h3 className="text-xl font-semibold text-white">Reply via Email</h3>
                    </div>

                    <div className="mt-5 space-y-4">
                      <p className="text-sm font-medium text-white/70">
                        Reply to this inquiry
                      </p>
                      <textarea
                        value={replyDraft}
                        onChange={(event) => {
                          setReplyDraft(event.target.value);
                          if (replySuccessMessage) {
                            setReplySuccessMessage(null);
                          }
                        }}
                        rows={6}
                        placeholder="Write a reply..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--gold-main)]/40"
                      />

                      {replySuccessMessage ? (
                        <p className="text-sm text-emerald-200">
                          {replySuccessMessage}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={!replyDraft.trim() || isReplying}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <SendHorizontal size={16} />
                        {isReplying ? "Sending..." : "Reply via Email"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
