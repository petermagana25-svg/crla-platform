import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export function messageApiError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
      },
    },
    { status }
  );
}

export async function requireAuthenticatedMessageAgent() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: messageApiError("Authentication required.", 401),
    };
  }

  return {
    ok: true as const,
    userId: user.id,
    supabaseAdmin: createSupabaseAdminClient(),
  };
}

type ResolveConversationArgs = {
  conversationId?: string | null;
  messageId?: string | null;
  agentId: string;
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
};

export async function resolveConversationRecord({
  conversationId,
  messageId,
  agentId,
  supabaseAdmin,
}: ResolveConversationArgs) {
  let resolvedConversationId = conversationId?.trim() || null;

  if (!resolvedConversationId && messageId) {
    const { data: messageRecord, error: messageLookupError } = await supabaseAdmin
      .from("messages")
      .select(
        "id, agent_id, archived, conversation_id, listing_id, sender_email, sender_type, status, created_at"
      )
      .eq("id", messageId)
      .maybeSingle();

    if (messageLookupError) {
      return {
        ok: false as const,
        response: messageApiError(
          messageLookupError.message || "Unable to load message.",
          500
        ),
      };
    }

    if (!messageRecord || messageRecord.agent_id !== agentId) {
      return {
        ok: false as const,
        response: messageApiError(
          "You do not have access to this conversation.",
          403
        ),
      };
    }

    resolvedConversationId = messageRecord.conversation_id;
  }

  if (!resolvedConversationId) {
    return {
      ok: false as const,
      response: messageApiError("A valid conversation id is required.", 400),
    };
  }

  const { data: latestMessage, error: conversationLookupError } = await supabaseAdmin
    .from("messages")
    .select(
      "id, agent_id, archived, conversation_id, listing_id, sender_email, sender_type, status, created_at"
    )
    .eq("agent_id", agentId)
    .eq("conversation_id", resolvedConversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationLookupError) {
    return {
      ok: false as const,
      response: messageApiError(
        conversationLookupError.message || "Unable to load conversation.",
        500
      ),
    };
  }

  if (!latestMessage) {
    return {
      ok: false as const,
      response: messageApiError("Conversation not found.", 404),
    };
  }

  return {
    ok: true as const,
    conversationId: resolvedConversationId,
    latestMessage,
  };
}
