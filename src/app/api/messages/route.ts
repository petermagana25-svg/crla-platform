import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type Body = {
  agent_id?: string;
  listing_id?: string | null;
  message?: string;
  sender_email?: string | null;
  sender_name?: string | null;
};

export const runtime = "nodejs";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    console.log("Incoming message:", body);
    const supabaseAdmin = createSupabaseAdminClient();

    const agent_id =
      typeof body.agent_id === "string" ? body.agent_id.trim() : null;
    const sender_name = body.sender_name?.trim();
    const sender_email = body.sender_email?.trim();
    const message = body.message?.trim();
    const listing_id =
      typeof body.listing_id === "string" &&
      body.listing_id.trim() !== "" &&
      body.listing_id !== "undefined"
        ? body.listing_id.trim()
        : null;

    if (!sender_name || !sender_email || !message) {
      console.error("Missing fields:", {
        agent_id,
        sender_name,
        sender_email,
        message,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!agent_id) {
      console.error("Missing fields:", {
        agent_id,
        sender_name,
        sender_email,
        message,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(sender_email)) {
      console.error("Invalid sender_email in message payload:", sender_email);
      return NextResponse.json(
        {
          success: false,
          error: { message: "Enter a valid email address." },
        },
        { status: 400 }
      );
    }

    const conversationId = randomUUID();
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({
        agent_id,
        conversation_id: conversationId,
        listing_id,
        message,
        sender_name,
        sender_email,
        sender_type: "client",
        status: "unread",
      })
      .select();

    console.log("Insert result:", data);

    if (error) {
      console.error("Insert error FULL:", JSON.stringify(error));
      return NextResponse.json(
        { error: error.message || "Insert failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error("FATAL ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server crash" },
      { status: 500 }
    );
  }
}
