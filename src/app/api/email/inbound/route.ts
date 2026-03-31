import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function okResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

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
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripQuotedReply(value: string) {
  const markers = [
    "\nOn ",
    "\nFrom:",
    "\nSent:",
    "\n-----Original Message-----",
    "\n________________________________",
  ];

  let result = value;

  for (const marker of markers) {
    const index = result.indexOf(marker);
    if (index > 0) {
      result = result.slice(0, index).trim();
    }
  }

  return result.trim();
}

function extractMessageContent(payload: Record<string, unknown>) {
  const text =
    typeof payload.text === "string" && payload.text.trim()
      ? payload.text.trim()
      : "";

  const html =
    typeof payload.html === "string" && payload.html.trim()
      ? payload.html.trim()
      : "";

  const snippet =
    typeof payload.snippet === "string" && payload.snippet.trim()
      ? payload.snippet.trim()
      : "";

  const raw =
    typeof payload.raw === "string" && payload.raw.trim()
      ? payload.raw.trim()
      : "";

  if (text) {
    return stripQuotedReply(text);
  }

  if (html) {
    return stripQuotedReply(stripHtml(html));
  }

  if (snippet) {
    return stripQuotedReply(snippet);
  }

  if (raw) {
    const rawBodyMatch = raw.match(/\r\n\r\n([\s\S]*)$/);
    const rawBody = rawBodyMatch?.[1]?.trim() ?? "";
    if (rawBody) {
      return stripQuotedReply(stripHtml(rawBody));
    }
  }

  return "";
}

export async function POST(req: Request) {
  console.log("🔥 WEBHOOK RECEIVED RAW");

  try {
    const rawBody = await req.text();

    let body: Record<string, unknown> | null = null;

    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
    } catch (error) {
      console.error("❌ JSON PARSE ERROR:", error);
      return okResponse();
    }

    console.log("📩 RAW BODY:", JSON.stringify(body, null, 2));

    const eventType =
      (typeof body?.type === "string" ? body.type : null) ??
      (typeof body?.event === "string" ? body.event : null);

    if (eventType && eventType !== "email.received") {
      console.log("ℹ️ IGNORING NON-EMAIL-RECEIVED EVENT:", eventType);
      return okResponse();
    }

    const payload =
      typeof body?.data === "object" && body.data !== null
        ? (body.data as Record<string, unknown>)
        : {};

    const subject =
      typeof payload.subject === "string" ? payload.subject.trim() : "";

    const senderEmail = extractEmailAddress(payload.from);
    const senderName = extractSenderName(payload.from) ?? senderEmail ?? "";

    const extractedMessage = extractMessageContent(payload);

    console.log("📩 FROM:", senderEmail);
    console.log("📌 SUBJECT:", subject);
    console.log("📩 EXTRACTED MESSAGE:", extractedMessage || "(empty)");

    const match = subject.match(/\(#([a-f0-9\-]{36})\)/i);
    const conversationId = match ? match[1] : null;

    console.log("📌 PARSED CONVERSATION ID:", conversationId);

    if (!senderEmail) {
      console.log("⚠️ Missing sender email, skipping insert");
      return okResponse();
    }

    if (!conversationId) {
      console.log("⚠️ Missing conversation ID in subject, skipping insert");
      return okResponse();
    }

    // Platform-first rule:
    // if there is no usable body content, do NOT create a fake "(no content)" message.
    if (!extractedMessage) {
      console.log(
        "⚠️ No usable message body found in inbound email. Skipping insert to avoid polluting thread."
      );
      return okResponse();
    }

    const supabaseAdmin = createSupabaseAdminClient();

    console.log("🧵 THREAD LOOKUP conversationId:", conversationId);

    const { data: threadSeed, error: threadSeedError } = await supabaseAdmin
      .from("messages")
      .select("agent_id, listing_id, conversation_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    console.log("🧵 THREAD LOOKUP RESULT:", threadSeed);
    console.log("🧵 THREAD LOOKUP ERROR:", threadSeedError);

    if (threadSeedError) {
      console.error("❌ THREAD LOOKUP ERROR:", threadSeedError);
      return okResponse();
    }

    if (!threadSeed) {
      console.log("⚠️ No thread seed found for conversation:", conversationId);
      return okResponse();
    }

    const agentId = threadSeed.agent_id ?? null;
    const listingId = threadSeed.listing_id ?? null;

    const { data: matchingAgent, error: matchingAgentError } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("email", senderEmail)
      .maybeSingle();

    if (matchingAgentError) {
      console.error("❌ AGENT LOOKUP ERROR:", matchingAgentError);
      return okResponse();
    }

    const senderType = matchingAgent ? "agent" : "client";

    try {
      const insertPayload = {
        agent_id: agentId,
        listing_id: listingId,
        sender_name: senderName || senderEmail,
        sender_email: senderEmail,
        message: extractedMessage,
        status: "unread",
        created_at: new Date().toISOString(),
        conversation_id: conversationId,
        sender_type: senderType,
      };

      console.log("📥 INSERT PAYLOAD:", insertPayload);

      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from("messages")
        .insert(insertPayload)
        .select();

      if (insertError) {
        console.error("❌ INSERT ERROR:", insertError);
        return okResponse();
      }

      console.log("✅ INSERT SUCCESS");
      console.log("✅ INSERT RESULT:", insertResult);
    } catch (error) {
      console.error("❌ INSERT CRASH:", error);
    }

    return okResponse();
  } catch (error) {
    console.error("❌ INBOUND ERROR:", error);
    return okResponse();
  }
}