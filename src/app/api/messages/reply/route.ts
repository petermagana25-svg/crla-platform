import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  requireAuthenticatedMessageAgent,
  resolveConversationRecord,
} from "@/app/api/messages/_utils";

type Body = {
  conversation_id?: string;
  message_id?: string;
  reply_text?: string;
  sender_email?: string;
};

export const runtime = "nodejs";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const conversationId = body.conversation_id?.trim();
    const messageId = body.message_id?.trim();
    const senderEmail = body.sender_email?.trim();
    const replyText = body.reply_text?.trim();

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid message id is required." },
        },
        { status: 400 }
      );
    }

    if (!senderEmail || !isValidEmail(senderEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid recipient email is required." },
        },
        { status: 400 }
      );
    }

    if (!replyText) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Reply text is required." },
        },
        { status: 400 }
      );
    }

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

    const { data: latestClientMessage, error: latestClientMessageError } =
      await auth.supabaseAdmin
        .from("messages")
        .select("sender_email")
        .eq("agent_id", auth.userId)
        .eq("conversation_id", conversation.conversationId)
        .eq("sender_type", "client")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestClientMessageError) {
      throw new Error(
        latestClientMessageError.message || "Unable to load conversation recipient."
      );
    }

    const recipientEmail =
      latestClientMessage?.sender_email?.trim() || senderEmail;

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid recipient email is required." },
        },
        { status: 400 }
      );
    }

    const { data: agentRecord, error: agentLookupError } = await auth.supabaseAdmin
      .from("agents")
      .select("email, full_name, phone_number")
      .eq("id", auth.userId)
      .maybeSingle();

    if (agentLookupError) {
      throw new Error(agentLookupError.message || "Unable to load agent identity.");
    }

    await sendEmail({
      to: recipientEmail,
      subject: "Response to your inquiry",
      conversationId: conversation.conversationId,
      html: `
        <p>${escapeHtml(replyText).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p>Best regards,<br/>CRLA Agent</p>
      `,
      text: `${replyText}\n\nBest regards,\nCRLA Agent`,
      agentEmail: agentRecord?.email,
      agentName: agentRecord?.full_name,
      agentPhone: agentRecord?.phone_number,
    });

    const { data: insertedReply, error: insertReplyError } = await auth.supabaseAdmin
      .from("messages")
      .insert({
        agent_id: auth.userId,
        archived: conversation.latestMessage.archived,
        content: replyText,
        conversation_id: conversation.conversationId,
        listing_id: conversation.latestMessage.listing_id,
        message: replyText,
        sender_email: agentRecord?.email ?? null,
        sender_name: agentRecord?.full_name ?? "CRLA Agent",
        sender_type: "agent",
        status: "read",
      })
      .select(
        "id, conversation_id, created_at, listing_id, content, message, sender_email, sender_name, sender_type, status, archived"
      )
      .maybeSingle();

    if (insertReplyError) {
      throw new Error(insertReplyError.message || "Unable to store reply.");
    }

    const { error: updateError } = await auth.supabaseAdmin
      .from("messages")
      .update({ status: "replied" })
      .eq("agent_id", auth.userId)
      .eq("conversation_id", conversation.conversationId)
      .eq("sender_type", "client");

    if (updateError) {
      throw new Error(updateError.message || "Unable to update message status.");
    }

    return NextResponse.json({
      success: true,
      data: {
        reply: insertedReply,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to send reply.",
        },
      },
      { status: 500 }
    );
  }
}
