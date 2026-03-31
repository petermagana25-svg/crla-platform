import { NextResponse } from "next/server";
import {
  buildConversationUrl,
  EMAIL_REPLY_TO_INBOUND,
  sendEmail,
} from "@/lib/email";
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

function buildMessagePreview(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= 280) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 277)}...`;
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

    const resolvedConversationId = conversation.conversationId?.trim();

    if (!resolvedConversationId) {
      throw new Error("Conversation ID missing.");
    }

    const { data: latestClientMessage, error: latestClientMessageError } =
      await auth.supabaseAdmin
        .from("messages")
        .select("sender_email")
        .eq("agent_id", auth.userId)
        .eq("conversation_id", resolvedConversationId)
        .eq("sender_type", "client")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestClientMessageError) {
      throw new Error(
        latestClientMessageError.message ||
          "Unable to load conversation recipient."
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

    const { data: agentRecord, error: agentLookupError } =
      await auth.supabaseAdmin
        .from("agents")
        .select("email, full_name, phone_number")
        .eq("id", auth.userId)
        .maybeSingle();

    if (agentLookupError) {
      throw new Error(
        agentLookupError.message || "Unable to load agent identity."
      );
    }

    const { data: insertedReply, error: insertReplyError } =
      await auth.supabaseAdmin
        .from("messages")
        .insert({
          agent_id: auth.userId,
          archived: conversation.latestMessage.archived,
          conversation_id: resolvedConversationId,
          listing_id: conversation.latestMessage.listing_id,
          message: replyText,
          sender_email: agentRecord?.email ?? null,
          sender_name: agentRecord?.full_name ?? "CRLA Agent",
          sender_type: "agent",
          status: "read",
        })
        .select(
          "id, conversation_id, created_at, listing_id, message, sender_email, sender_name, sender_type, status, archived"
        )
        .maybeSingle();

    if (insertReplyError) {
      throw new Error(insertReplyError.message || "Unable to store reply.");
    }

    const { error: updateError } = await auth.supabaseAdmin
      .from("messages")
      .update({ status: "replied" })
      .eq("agent_id", auth.userId)
      .eq("conversation_id", resolvedConversationId)
      .eq("sender_type", "client");

    if (updateError) {
      throw new Error(updateError.message || "Unable to update message status.");
    }

    const messagePreview = buildMessagePreview(replyText);
    const escapedPreview = escapeHtml(messagePreview).replace(/\n/g, "<br/>");
    const conversationUrl = buildConversationUrl(resolvedConversationId);

    console.log("OUTBOUND EMAIL:", {
      conversationId: resolvedConversationId,
      recipientEmail,
      conversationUrl,
      preview: messagePreview,
    });

    let emailNotificationSent = false;

    try {
      await sendEmail({
        to: recipientEmail,
        subject: "Response to your inquiry",
        conversationId: resolvedConversationId,
        replyTo: EMAIL_REPLY_TO_INBOUND,

        html: `
          <p>Hi,</p>
          <p>You’ve received a new response regarding your inquiry on CRLA.</p>

          <p><strong>Message preview:</strong></p>

          <blockquote style="margin: 16px 0; border-left: 3px solid rgba(212,175,55,0.45); padding-left: 16px; color: #dbeafe;">
            ${escapedPreview}
          </blockquote>

          <p style="margin: 24px 0 12px; text-align: center;">
            <a
              href="${conversationUrl}"
              style="
                display: inline-block;
                padding: 14px 22px;
                background: #d4af37;
                color: #111111;
                font-weight: 700;
                font-size: 15px;
                border-radius: 10px;
                text-decoration: none;
              "
            >
              Continue the conversation
            </a>
          </p>

          <p style="margin: 14px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
            If the button does not work, copy and paste this link into your browser:<br/>
            <span style="word-break: break-all;">${conversationUrl}</span>
          </p>
        `,

        text: `Hi,

You’ve received a new response regarding your inquiry on CRLA.

Message preview:
"${messagePreview}"

Continue the conversation:
${conversationUrl}`,

        signature: {
          email: agentRecord?.email,
          name: agentRecord?.full_name,
          phone: agentRecord?.phone_number,
          title: "CRLA Certified Agent",
        },
      });

      emailNotificationSent = true;
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        email_notification_sent: emailNotificationSent,
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