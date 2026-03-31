import { NextResponse } from "next/server";
import {
  buildDashboardInboxUrl,
  EMAIL_REPLY_TO_FALLBACK,
  sendEmail,
} from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type Body = {
  conversationId?: string;
  message?: string;
};

type ThreadSeed = {
  agent_id: string | null;
  archived: boolean;
  conversation_id: string;
  created_at: string;
  listing_id: string | null;
  sender_email: string | null;
  sender_name: string | null;
  sender_type: "agent" | "client";
};

export const runtime = "nodejs";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const conversationId = body.conversationId?.trim();
    const message = body.message?.trim();

    console.log("PUBLIC REPLY SUBMIT:", {
      conversationId,
      hasMessage: Boolean(message),
    });

    if (!conversationId || !message) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid conversation and message are required." },
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: threadMessages, error: threadLookupError } = await supabaseAdmin
      .from("messages")
      .select(
        "agent_id, archived, conversation_id, created_at, listing_id, sender_email, sender_name, sender_type"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (threadLookupError) {
      throw new Error(threadLookupError.message || "Unable to load conversation.");
    }

    const normalizedThread = (threadMessages ?? []) as ThreadSeed[];

    if (!normalizedThread.length) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Conversation not found or expired." },
        },
        { status: 404 }
      );
    }

    const threadSeed = normalizedThread[0];
    const clientSeed =
      normalizedThread.find(
        (threadMessage) =>
          threadMessage.sender_type === "client" &&
          typeof threadMessage.sender_email === "string" &&
          threadMessage.sender_email.trim() !== ""
      ) ?? null;

    const senderEmail = clientSeed?.sender_email?.trim() || "";
    const senderName =
      clientSeed?.sender_name?.trim() || clientSeed?.sender_email?.trim() || "Website visitor";
    const agentId = threadSeed.agent_id ?? null;
    const listingId = threadSeed.listing_id ?? null;

    if (!senderEmail || !isValidEmail(senderEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Conversation is missing a valid client email." },
        },
        { status: 400 }
      );
    }

    const { error: unarchiveError } = await supabaseAdmin
      .from("messages")
      .update({ archived: false })
      .eq("conversation_id", conversationId);

    if (unarchiveError) {
      console.error("PUBLIC REPLY UNARCHIVE ERROR:", unarchiveError);
    }

    const insertPayload = {
      agent_id: agentId,
      archived: false,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      listing_id: listingId,
      message,
      sender_email: senderEmail,
      sender_name: senderName,
      sender_type: "client" as const,
      status: "unread" as const,
    };

    const { data: insertedReply, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert(insertPayload)
      .select(
        "id, archived, conversation_id, created_at, listing_id, message, sender_email, sender_name, sender_type, status"
      )
      .maybeSingle();

    console.log("INSERTED PUBLIC REPLY ROW:", insertedReply);

    if (insertError) {
      console.error("PUBLIC REPLY INSERT ERROR:", insertError);
      throw new Error(insertError.message || "Unable to save your reply.");
    }

    let agentNotificationSent = false;

    if (agentId) {
      const { data: agentRecord, error: agentLookupError } = await supabaseAdmin
        .from("agents")
        .select("email, full_name")
        .eq("id", agentId)
        .maybeSingle();

      if (agentLookupError) {
        console.error("PUBLIC REPLY AGENT LOOKUP ERROR:", agentLookupError);
      }

      const agentEmail = agentRecord?.email?.trim() || "";

      if (agentEmail && isValidEmail(agentEmail)) {
        const dashboardInboxUrl = buildDashboardInboxUrl();

        console.log("AGENT NOTIFICATION EMAIL SEND:", {
          agentEmail,
          conversationId,
        });

        try {
          await sendEmail({
            to: agentEmail,
            subject: "New message in your CRLA inbox",
            replyTo: EMAIL_REPLY_TO_FALLBACK,
            html: `
              <p>You have received a new message. View it in your dashboard.</p>
              <p style="margin: 24px 0;">
                <a
                  href="${dashboardInboxUrl}"
                  style="display: inline-block; border-radius: 9999px; background: #d4af37; color: #0b1426; font-weight: 700; padding: 12px 20px; text-decoration: none;"
                >
                  Open your CRLA inbox
                </a>
              </p>
              <p><a href="${dashboardInboxUrl}">${dashboardInboxUrl}</a></p>
            `,
            text: `You have received a new message. View it in your dashboard:\n${dashboardInboxUrl}`,
          });
          agentNotificationSent = true;
        } catch (agentNotificationError) {
          console.error("AGENT NOTIFICATION EMAIL ERROR:", agentNotificationError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_notification_sent: agentNotificationSent,
        reply: insertedReply,
      },
    });
  } catch (error) {
    console.error("PUBLIC REPLY ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to submit public reply.",
        },
      },
      { status: 500 }
    );
  }
}
