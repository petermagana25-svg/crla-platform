import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SERVICE ROLE KEY");
      return NextResponse.json(
        { error: "Missing service role key" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json(
        { error: "Missing Supabase URL" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({
        agent_id,
        listing_id,
        sender_name,
        sender_email,
        message,
        status: "new",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FATAL ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server crash" },
      { status: 500 }
    );
  }
}
