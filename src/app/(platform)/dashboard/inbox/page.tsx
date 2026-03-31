"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Reply,
  SendHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";

type MessageStatus = "unread" | "read" | "replied";
type SenderType = "agent" | "client";

type MessageRow = {
  archived: boolean;
  conversation_id: string;
  created_at: string;
  id: string;
  listing_id: string | null;
  message: string;
  sender_email: string | null;
  sender_name: string | null;
  sender_type: SenderType;
  status: MessageStatus;
};

type ListingReference = {
  address: string;
  id: string;
  title: string | null;
};

type ThreadMessage = MessageRow & {
  body: string;
};

type InboxConversation = {
  id: string;
  latestMessage: ThreadMessage;
  latestClientMessage: ThreadMessage | null;
  listingLabel: string | null;
  messages: ThreadMessage[];
  participantEmail: string | null;
  participantLabel: string;
  status: MessageStatus;
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
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

function buildParticipantLabel(message: ThreadMessage | null) {
  const leadIdentity = message?.sender_name?.trim() || message?.sender_email?.trim();

  if (leadIdentity) {
    return `Lead: ${leadIdentity}`;
  }

  return "Lead: Website visitor";
}

function getMessageBody(message: MessageRow) {
  return message.message?.trim() || "";
}

function deriveConversationStatus(messages: ThreadMessage[]): MessageStatus {
  const clientMessages = messages.filter((message) => message.sender_type === "client");

  if (clientMessages.some((message) => message.status === "unread")) {
    return "unread";
  }

  const latestClientMessage = [...clientMessages].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )[0];

  if (latestClientMessage?.status === "replied") {
    return "replied";
  }

  return "read";
}

function getConversationStatusBadgeClass(status: MessageStatus) {
  if (status === "unread") {
    return "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "replied") {
    return "border border-sky-400/25 bg-sky-400/10 text-sky-100";
  }

  return "border border-white/10 bg-white/5 text-white/55";
}

function buildConversations(
  rawMessages: MessageRow[],
  listingsById: Record<string, ListingReference>
) {
  const conversationMap = new Map<string, InboxConversation>();

  for (const message of rawMessages) {
    const body = getMessageBody(message);
    const normalizedMessage: ThreadMessage = {
      ...message,
      body,
    };
    const listing = message.listing_id ? listingsById[message.listing_id] : undefined;
    const existingConversation = conversationMap.get(message.conversation_id);

    if (!existingConversation) {
      conversationMap.set(message.conversation_id, {
        id: message.conversation_id,
        latestClientMessage:
          message.sender_type === "client" ? normalizedMessage : null,
        latestMessage: normalizedMessage,
        listingLabel: listing ? listing.title?.trim() || listing.address : null,
        messages: [normalizedMessage],
        participantEmail:
          message.sender_type === "client" ? message.sender_email?.trim() || null : null,
        participantLabel:
          message.sender_type === "client"
            ? buildParticipantLabel(normalizedMessage)
            : "Lead: Website visitor",
        status: message.status,
      });
      continue;
    }

    existingConversation.messages.push(normalizedMessage);

    if (message.created_at >= existingConversation.latestMessage.created_at) {
      existingConversation.latestMessage = normalizedMessage;
    }

    if (
      message.sender_type === "client" &&
      (!existingConversation.latestClientMessage ||
        message.created_at >= existingConversation.latestClientMessage.created_at)
    ) {
      existingConversation.latestClientMessage = normalizedMessage;
    }

    if (!existingConversation.listingLabel && listing) {
      existingConversation.listingLabel = listing.title?.trim() || listing.address;
    }
  }

  return Array.from(conversationMap.values())
    .map((conversation) => {
      const latestClientMessage =
        conversation.latestClientMessage ??
        conversation.messages.find((message) => message.sender_type === "client") ??
        null;

      return {
        ...conversation,
        latestClientMessage,
        messages: [...conversation.messages].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        ),
        participantEmail: latestClientMessage?.sender_email?.trim() || null,
        participantLabel: buildParticipantLabel(latestClientMessage),
        status: deriveConversationStatus(conversation.messages),
      };
    })
    .sort((a, b) => b.latestMessage.created_at.localeCompare(a.latestMessage.created_at));
}

function updateConversationCollection(
  current: InboxConversation[],
  conversationId: string,
  updater: (conversation: InboxConversation) => InboxConversation
) {
  return current.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation
  );
}

function countUnreadConversations(conversations: InboxConversation[]) {
  return conversations.filter((conversation) => conversation.status === "unread").length;
}

export default function InboxPage() {
  const router = useRouter();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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

      const { data: messageData, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, listing_id, message, sender_name, sender_email, sender_type, status, created_at, archived"
        )
        .eq("agent_id", user.id)
        .eq("archived", view === "archived")
        .order("created_at", { ascending: true });

      if (messagesError) {
        if (isMounted) {
          setConversations([]);
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

      const mappedConversations = buildConversations(rawMessages, listingsById);

      if (!isMounted) {
        return;
      }

      setConversations(mappedConversations);
      setSelectedConversationId((current) =>
        current && mappedConversations.some((conversation) => conversation.id === current)
          ? current
          : mappedConversations[0]?.id ?? null
      );
      setUnreadCount(countUnreadConversations(mappedConversations));
      setIsLoading(false);
    }

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [router, view]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    null;

  async function handleSelectConversation(conversation: InboxConversation) {
    setSelectedConversationId(conversation.id);
    setActionFeedback(null);
    setReplySuccessMessage(null);

    if (view === "archived" || conversation.status !== "unread") {
      return;
    }

    const nextConversations = updateConversationCollection(
      conversations,
      conversation.id,
      (currentConversation) => ({
        ...currentConversation,
        messages: currentConversation.messages.map((message) =>
          message.sender_type === "client" && message.status === "unread"
            ? { ...message, status: "read" }
            : message
        ),
        status: "read",
      })
    );

    setConversations(nextConversations);
    setUnreadCount(countUnreadConversations(nextConversations));

    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
        }),
      });
    } catch (markReadError) {
      console.error("Unable to mark conversation as read:", markReadError);
    }
  }

  async function handleMarkAsUnread() {
    if (!selectedConversation || selectedConversation.status === "unread") {
      return;
    }

    setActionFeedback(null);
    setReplySuccessMessage(null);

    const nextConversations = updateConversationCollection(
      conversations,
      selectedConversation.id,
      (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.sender_type === "client"
            ? { ...message, status: "unread" }
            : message
        ),
        status: "unread",
      })
    );

    setConversations(nextConversations);
    setUnreadCount(countUnreadConversations(nextConversations));

    try {
      const response = await fetch("/api/messages/unread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
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
      const revertedConversations = updateConversationCollection(
        nextConversations,
        selectedConversation.id,
        (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.sender_type === "client"
              ? { ...message, status: "read" }
              : message
          ),
          status: "read",
        })
      );

      setConversations(revertedConversations);
      setUnreadCount(countUnreadConversations(revertedConversations));
      alert(
        markUnreadError instanceof Error
          ? markUnreadError.message
          : "Unable to mark as unread."
      );
    }
  }

  async function handleArchiveConversation() {
    if (!selectedConversation || view === "archived") {
      return;
    }

    const conversationToArchive = selectedConversation;
    const nextConversations = conversations.filter(
      (conversation) => conversation.id !== conversationToArchive.id
    );
    const currentIndex = conversations.findIndex(
      (conversation) => conversation.id === conversationToArchive.id
    );
    const nextSelectedConversation =
      nextConversations[currentIndex] ?? nextConversations[currentIndex - 1] ?? null;

    setActionFeedback(null);
    setReplySuccessMessage(null);
    setConversations(nextConversations);
    setSelectedConversationId(nextSelectedConversation?.id ?? null);
    setUnreadCount(countUnreadConversations(nextConversations));

    try {
      const response = await fetch("/api/messages/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationToArchive.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message || "Unable to archive conversation."
        );
      }

      setActionFeedback("Conversation archived");
    } catch (archiveError) {
      setConversations(conversations);
      setSelectedConversationId(conversationToArchive.id);
      setUnreadCount(countUnreadConversations(conversations));
      alert(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive conversation."
      );
    }
  }

  async function handleDeleteConversation() {
    if (!selectedConversation || view !== "archived") {
      return;
    }

    const shouldDelete = confirm(
      "Are you sure you want to permanently delete this conversation?"
    );

    if (!shouldDelete) {
      return;
    }

    const conversationToDelete = selectedConversation;
    const previousConversations = conversations;
    const nextConversations = conversations.filter(
      (conversation) => conversation.id !== conversationToDelete.id
    );
    const currentIndex = conversations.findIndex(
      (conversation) => conversation.id === conversationToDelete.id
    );
    const nextSelectedConversation =
      nextConversations[currentIndex] ?? nextConversations[currentIndex - 1] ?? null;

    setActionFeedback(null);
    setReplySuccessMessage(null);
    setConversations(nextConversations);
    setSelectedConversationId(nextSelectedConversation?.id ?? null);

    try {
      const response = await fetch("/api/messages/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationToDelete.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message || "Unable to delete conversation."
        );
      }

      setActionFeedback("Conversation deleted permanently");
    } catch (deleteError) {
      setConversations(previousConversations);
      setSelectedConversationId(conversationToDelete.id);
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete conversation."
      );
    }
  }

  async function handleSendReply() {
    if (!selectedConversation || !replyDraft.trim()) {
      return;
    }

    if (!selectedConversation.participantEmail) {
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
          conversation_id: selectedConversation.id,
          message_id: selectedConversation.latestMessage.id,
          sender_email: selectedConversation.participantEmail,
          reply_text: replyDraft,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            data?: {
              reply?: Omit<ThreadMessage, "body">;
            };
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Unable to send reply.");
      }

      const replyMessage = result?.data?.reply
        ? {
            ...result.data.reply,
            body: getMessageBody(result.data.reply as MessageRow),
          }
        : null;

      const nextConversations = updateConversationCollection(
        conversations,
        selectedConversation.id,
        (conversation) => {
          const nextMessages = conversation.messages.map((message) =>
            message.sender_type === "client"
              ? { ...message, status: "replied" as const }
              : message
          );

          if (replyMessage) {
            nextMessages.push(replyMessage);
          }

          const latestMessage = replyMessage ?? conversation.latestMessage;

          return {
            ...conversation,
            latestMessage,
            messages: nextMessages.sort((a, b) =>
              a.created_at.localeCompare(b.created_at)
            ),
            status: "replied",
          };
        }
      );

      setConversations(nextConversations);
      setUnreadCount(countUnreadConversations(nextConversations));
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
                  Manage lead conversations from the directory, off-market listings,
                  and inbound email replies in one threaded inbox.
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
                        Unread Conversations
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
                        Total Conversations
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {conversations.length}
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

          <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.4fr)_minmax(0,0.6fr)]">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4 px-2 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {view === "archived" ? "Archived Conversations" : "Conversations"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {view === "archived"
                      ? "Review archived threads or remove them permanently."
                      : "Open a conversation to expand the latest thread and respond."}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                  {conversations.length} total
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
              ) : conversations.length === 0 ? (
                <div className="mt-2 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                  {view === "archived"
                    ? "You have no archived conversations."
                    : "You do not have any conversations yet."}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {conversations.map((conversation) => {
                    const isSelected = selectedConversationId === conversation.id;
                    const previewThread = conversation.messages.slice(-3);

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => void handleSelectConversation(conversation)}
                        className={`w-full rounded-3xl border p-4 text-left transition duration-300 ${
                          isSelected
                            ? "border-[var(--gold-main)]/40 bg-[rgba(212,175,55,0.12)] shadow-[0_0_0_1px_rgba(212,175,55,0.12),0_16px_40px_rgba(212,175,55,.12)]"
                            : conversation.status === "unread"
                              ? "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))] hover:bg-white/[0.10]"
                              : "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              {conversation.status === "unread" ? (
                                <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                              ) : null}
                              <div className="min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <p
                                    className={`truncate text-base ${
                                      conversation.status === "unread"
                                        ? "font-semibold text-white"
                                        : "font-medium text-white/85"
                                    }`}
                                  >
                                    {conversation.participantLabel}
                                  </p>
                                  <span className="shrink-0 text-xs text-white/45">
                                    {formatTimestamp(conversation.latestMessage.created_at)}
                                  </span>
                                </div>

                                {conversation.listingLabel ? (
                                  <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold-main)]">
                                    {conversation.listingLabel}
                                  </p>
                                ) : null}

                                <p
                                  className={`mt-2 text-sm ${
                                    conversation.status === "unread"
                                      ? "font-medium text-white/88"
                                      : "text-[var(--text-muted)]"
                                  }`}
                                >
                                  {getMessagePreview(conversation.latestMessage.body)}
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getConversationStatusBadgeClass(
                                      conversation.status
                                    )}`}
                                  >
                                    {conversation.status}
                                  </span>
                                  <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                                    {conversation.messages.length} messages
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            {previewThread.map((message) => (
                              <div
                                key={message.id}
                                className={`rounded-2xl px-3 py-2 text-sm ${
                                  message.sender_type === "agent"
                                    ? "bg-black/20 text-white/70"
                                    : "bg-white/5 text-white/88"
                                }`}
                              >
                                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                                  {message.sender_type === "agent" ? "Agent" : "Lead"}
                                </p>
                                <p className="mt-1 line-clamp-2 leading-6">
                                  {message.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
              {!selectedConversation ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      Select a conversation to view details
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                      Choose a conversation from the list to review the full thread
                      and draft a reply.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/45">
                        Conversation Detail
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">
                        {selectedConversation.participantLabel}
                      </h2>
                      {selectedConversation.participantEmail ? (
                        <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/65">
                          <Mail size={16} className="text-[var(--gold-main)]" />
                          {selectedConversation.participantEmail}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {view === "inbox" ? (
                        <>
                          <button
                            type="button"
                            onClick={handleMarkAsUnread}
                            disabled={selectedConversation.status === "unread"}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-[var(--gold-main)]/30 hover:text-[var(--gold-main)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Mark as Unread
                          </button>
                          <button
                            type="button"
                            onClick={handleArchiveConversation}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-[var(--gold-main)]/30 hover:text-[var(--gold-main)]"
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDeleteConversation}
                          className="inline-flex items-center justify-center rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-100 transition hover:border-red-300/40 hover:bg-red-400/15"
                        >
                          Delete Permanently
                        </button>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getConversationStatusBadgeClass(
                          selectedConversation.status
                        )}`}
                      >
                        {selectedConversation.status}
                      </span>
                      <span className="text-sm text-white/45">
                        {formatTimestamp(selectedConversation.latestMessage.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6">
                    {selectedConversation.listingLabel ? (
                      <div>
                        <p className="text-base font-medium text-white">Property:</p>
                        <p className="mt-2 text-lg text-white/88">
                          {selectedConversation.listingLabel}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === "agent"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-3xl px-5 py-4 ${
                              message.sender_type === "agent"
                                ? "border border-slate-400/20 bg-[rgba(148,163,184,0.16)] text-white shadow-[0_12px_30px_rgba(148,163,184,0.10)]"
                                : "border border-sky-400/25 bg-[rgba(56,189,248,0.14)] text-white/92 shadow-[0_12px_30px_rgba(56,189,248,0.10)]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                                {message.sender_type === "client"
                                  ? "CLIENT MESSAGE"
                                  : "AGENT REPLY"}
                              </p>
                              <span className="text-xs text-white/35">
                                {formatTimestamp(message.created_at)}
                              </span>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                              {message.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <Reply size={18} className="text-[var(--gold-main)]" />
                      <h3 className="text-xl font-semibold text-white">Reply via Email</h3>
                    </div>

                    <div className="mt-5 space-y-4">
                      <p className="text-sm font-medium text-white/70">
                        Reply to this conversation
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
                        disabled={
                          !replyDraft.trim() ||
                          isReplying ||
                          !selectedConversation.participantEmail
                        }
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
