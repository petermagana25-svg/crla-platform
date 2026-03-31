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
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
      (typeof payload?.text === "string" ? payload.text : "") ||
      (typeof payload?.html === "string" ? payload.html : "") ||
      (typeof payload?.snippet === "string" ? payload.snippet : "") ||
      "(no content)";
    const text =
      typeof rawText === "string" && rawText.includes("<")
        ? stripHtml(rawText)
        : rawText.trim();
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
    console.log("📩 MESSAGE CONTENT:", text);

    const match = subject.match(/\(#([a-f0-9\-]+)\)/i);
    const conversationId = match ? match[1] : null;

    console.log("📌 PARSED CONVERSATION ID:", conversationId);

    if (!senderEmail) {
      console.log("⚠️ Missing sender, skipping");
      return okResponse();
    }

    const supabaseAdmin = createSupabaseAdminClient();

    if (!conversationId) {
      console.log("⚠️ NO CONVERSATION ID — FALLBACK INSERT");

      const { data: fallbackTarget, error: fallbackLookupError } =
        await supabaseAdmin
          .from("messages")
          .select("agent_id, listing_id")
          .eq("sender_email", senderEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (fallbackLookupError) {
        console.error("Fallback lookup error:", fallbackLookupError);
        return okResponse();
      }

      if (!fallbackTarget) {
        console.log("⚠️ NO FALLBACK TARGET FOUND");
        return okResponse();
      }

      try {
        const { data: insertResult, error } = await supabaseAdmin
          .from("messages")
          .insert({
            agent_id: fallbackTarget.agent_id,
            conversation_id: null,
            created_at: new Date().toISOString(),
            listing_id: fallbackTarget.listing_id,
            message: text,
            sender_email: senderEmail,
            sender_name: senderName,
            sender_type: "client",
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
    }

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
      return okResponse();
    }

    if (!existingConversation) {
      console.log("⚠️ NO CONVERSATION FOUND");
      return okResponse();
    }

    try {
      const { data: insertResult, error } = await supabaseAdmin
        .from("messages")
        .insert({
          agent_id: existingConversation.agent_id,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
          listing_id: existingConversation.listing_id,
          message: text,
          sender_email: senderEmail,
          sender_name: senderName,
          sender_type: "client",
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
