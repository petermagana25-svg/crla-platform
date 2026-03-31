import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function extractEmailAddress(value: unknown) {
  if (typeof value === "object" && value !== null) {
    if ("email" in value && typeof value.email === "string") {
      return value.email.trim().toLowerCase();
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function extractSenderName(value: unknown) {
  if (typeof value === "object" && value !== null) {
    if ("name" in value && typeof value.name === "string") {
      return value.name.trim();
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/^(.*?)\s*<[^>]+>$/);
  const name = match?.[1]?.trim();
  return name ? name.replace(/^["']|["']$/g, "") : null;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractConversationId(subject: string) {
  const match = subject.match(/\(#([^)]+)\)/);
  return match?.[1]?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const eventType =
      (typeof payload?.type === "string" ? payload.type : null) ??
      (typeof payload?.event === "string" ? payload.event : null);
    const emailPayload =
      typeof payload?.data === "object" && payload.data !== null
        ? (payload.data as Record<string, unknown>)
        : payload;

    if (eventType && eventType !== "email.received") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const from = extractEmailAddress(emailPayload?.from);
    const senderName = extractSenderName(emailPayload?.from);
    const subject =
      typeof emailPayload?.subject === "string" ? emailPayload.subject : "";
    const conversationId = extractConversationId(subject);
    const textBody =
      typeof emailPayload?.text === "string"
        ? emailPayload.text
        : typeof emailPayload?.textBody === "string"
          ? emailPayload.textBody
          : null;
    const htmlBody =
      typeof emailPayload?.html === "string"
        ? emailPayload.html
        : typeof emailPayload?.htmlBody === "string"
          ? emailPayload.htmlBody
          : null;
    const content = (textBody ?? (htmlBody ? stripHtml(htmlBody) : "")).trim();

    console.log("INBOUND EMAIL:", {
      from,
      subject,
      conversationId,
    });

    if (!conversationId || !content) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: existingConversation, error: conversationLookupError } =
      await supabaseAdmin
        .from("messages")
        .select("agent_id, listing_id")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (conversationLookupError) {
      console.error("Inbound conversation lookup error:", conversationLookupError);
      return NextResponse.json({ success: true, ignored: true });
    }

    if (!existingConversation) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const { error: insertError } = await supabaseAdmin.from("messages").insert({
      agent_id: existingConversation.agent_id,
      content,
      conversation_id: conversationId,
      listing_id: existingConversation.listing_id,
      message: content,
      sender_email: from,
      sender_name: senderName,
      sender_type: "client",
      status: "unread",
    });

    if (insertError) {
      console.error("Inbound insert error:", insertError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbound webhook error:", error);
    return NextResponse.json({ success: true, ignored: true });
  }
}
