import { NextResponse } from "next/server";
import {
  requireAuthenticatedMessageAgent,
  resolveConversationRecord,
} from "@/app/api/messages/_utils";

type Body = {
  message_id?: string;
  conversation_id?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const messageId = body.message_id?.trim();
    const conversationId = body.conversation_id?.trim();

    const auth = await requireAuthenticatedMessageAgent();

    if (!auth.ok) {
      return auth.response;
    }

    const conversation = await resolveConversationRecord({
      agentId: auth.userId,
      supabaseAdmin: auth.supabaseAdmin,
      conversationId,
      messageId,
    });

    if (!conversation.ok) {
      return conversation.response;
    }

    const { error } = await auth.supabaseAdmin
      .from("messages")
      .update({ archived: true })
      .eq("agent_id", auth.userId)
      .eq("conversation_id", conversation.conversationId);

    if (error) {
      throw new Error(error.message || "Unable to archive message.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to archive message.",
        },
      },
      { status: 500 }
    );
  }
}
