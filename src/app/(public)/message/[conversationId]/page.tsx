import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import PublicConversationClient, {
  type PublicConversationMessage,
} from "@/components/public/PublicConversationClient";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type PageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

function isValidUUID(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

function buildFriendlyLabel(
  message: PublicConversationMessage | null,
  fallbackLabel: string
) {
  const trimmedName = message?.sender_name?.trim();
  const trimmedEmail = message?.sender_email?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return fallbackLabel;
}

function ConversationNotFoundState() {
  return (
    <main className="min-h-screen bg-depth">
      <Navbar />
      <section className="relative overflow-hidden py-16 sm:py-20">
        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong rounded-[32px] border border-white/10 px-8 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--gold-soft)]">
                Conversation unavailable
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Conversation not found or expired
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
                The secure conversation link may be invalid, expired, or no longer
                available. If you still need help, please reach out to your CRLA
                contact directly.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default async function PublicConversationPage({ params }: PageProps) {
  const { conversationId } = await params;

  console.log("PUBLIC CONVERSATION PAGE LOAD:", {
    conversationId,
  });

  if (!conversationId || !isValidUUID(conversationId)) {
    console.error("❌ INVALID CONVERSATION ID:", conversationId);
    return <ConversationNotFoundState />;
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: threadRows, error: threadLookupError } = await supabaseAdmin
    .from("messages")
    .select(
      "id, archived, conversation_id, created_at, message, sender_email, sender_name, sender_type, status"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  console.log("📬 THREAD ROWS:", threadRows);

  if (threadLookupError) {
    console.error("PUBLIC CONVERSATION PAGE LOOKUP ERROR:", threadLookupError);
    return <ConversationNotFoundState />;
  }

  const messages = (threadRows ?? []) as PublicConversationMessage[];

  if (!messages.length) {
    console.log("⚠️ NO MESSAGES FOUND FOR:", conversationId);
    return <ConversationNotFoundState />;
  }

  const latestClientMessage =
    [...messages].reverse().find((message) => message.sender_type === "client") ?? null;

  const latestAgentMessage =
    [...messages].reverse().find((message) => message.sender_type === "agent") ?? null;

  const clientLabel = buildFriendlyLabel(latestClientMessage, "You");
  const agentLabel = buildFriendlyLabel(latestAgentMessage, "CRLA Certified Agent");

  return (
    <main className="min-h-screen bg-depth">
      <Navbar />
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_24%)]" />
        <Container className="relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--gold-soft)]">
                CRLA Messaging
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                Continue your conversation
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
                Use this secure page to review the thread and send your next message.
                The platform inbox is the source of truth, so your reply will appear
                directly in the assigned CRLA agent dashboard.
              </p>
            </div>

            <PublicConversationClient
              agentLabel={agentLabel}
              clientLabel={clientLabel}
              conversationId={conversationId}
              initialMessages={messages}
            />
          </div>
        </Container>
      </section>
    </main>
  );
}