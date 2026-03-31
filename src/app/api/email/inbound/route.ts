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

export async function POST(req: Request) {
  console.log("🔥 WEBHOOK RECEIVED RAW");

  try {
    const rawBody = await req.text();

    let body: Record<string, unknown> | null;

    try {
      body = (rawBody ? JSON.parse(rawBody) : null) as Record<string, unknown> | null;
    } catch (e) {
      console.error("❌ JSON PARSE ERROR", e);
      return okResponse();
    }

    console.log("📩 RAW BODY:", JSON.stringify(body, null, 2));

    const eventType =
      (typeof body?.type === "string" ? body.type : null) ??
      (typeof body?.event === "string" ? body.event : null);
    const payload =
      typeof body?.data === "object" && body.data !== null
        ? (body.data as Record<string, unknown>)
        : body;

    if (eventType && eventType !== "email.received") {
      return okResponse();
    }

    const subject = typeof body?.data === "object" &&
      body.data !== null &&
      "subject" in body.data &&
      typeof body.data.subject === "string"
      ? body.data.subject
      : "";
    const rawText =
      (typeof body?.data === "object" &&
      body.data !== null &&
      "text" in body.data &&
      typeof body.data.text === "string"
        ? body.data.text
        : "") ||
      (typeof body?.data === "object" &&
      body.data !== null &&
      "html" in body.data &&
      typeof body.data.html === "string"
        ? body.data.html
        : "") ||
      (typeof body?.data === "object" &&
      body.data !== null &&
      "snippet" in body.data &&
      typeof body.data.snippet === "string"
        ? body.data.snippet
        : "") ||
      "";
    const cleanText = rawText
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    const finalText = cleanText.split("On ").shift()?.trim() || "";
    const message = finalText || "(no content)";
    const fromEmail =
      typeof body?.data === "object" &&
      body.data !== null &&
      "from" in body.data
        ? body.data.from
        : "";
    const senderEmail = typeof fromEmail === "string"
      ? fromEmail
      : typeof fromEmail === "object" &&
          fromEmail !== null &&
          "email" in fromEmail &&
          typeof fromEmail.email === "string"
        ? fromEmail.email
        : "";
    const senderName = extractSenderName(payload?.from) ?? extractSenderName(body?.from);

    console.log("📩 FROM:", senderEmail);
    console.log("📌 SUBJECT:", subject);
    console.log("📩 RAW BODY:", rawText);
    console.log("🧹 CLEAN BODY:", finalText);

    const match = subject.match(/\(#([a-f0-9\-]+)\)/i);
    const conversationId = match ? match[1] : null;

    console.log("📌 PARSED CONVERSATION ID:", conversationId);

    if (!senderEmail) {
      console.log("⚠️ Missing sender, skipping");
      return okResponse();
    }

    const supabaseAdmin = createSupabaseAdminClient();
    if (!conversationId) {
      console.log("⚠️ NO CONVERSATION ID");
      return okResponse();
    }

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
      console.error("Inbound conversation lookup error:", threadSeedError);
      return okResponse();
    }

    if (!threadSeed) {
      console.log("⚠️ NO THREAD SEED FOUND FOR CONVERSATION:", conversationId);
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
      console.error("Agent sender lookup error:", matchingAgentError);
      return okResponse();
    }

    const senderType = matchingAgent ? "agent" : "client";

    try {
      console.log("📥 INSERT PAYLOAD:", {
        agent_id: agentId,
        listing_id: listingId,
        sender_email: senderEmail,
        conversation_id: conversationId,
        sender_type: senderType,
        message,
      });

      const { data: insertResult, error } = await supabaseAdmin
        .from("messages")
        .insert({
          agent_id: agentId,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
          listing_id: listingId,
          message,
          sender_email: senderEmail,
          sender_name: senderEmail,
          sender_type: senderType,
          status: "unread",
        })
        .select();

      if (error) {
        console.error("❌ INSERT ERROR:", error);
      } else {
        console.log("✅ INSERT SUCCESS");
      }

      console.log("✅ INSERT RESULT:", insertResult);
    } catch (err) {
      console.error("❌ INSERT CRASH:", err);
    }

    return okResponse();
  } catch (error) {
    console.error("❌ INBOUND ERROR:", error);
    return okResponse();
  }
}
