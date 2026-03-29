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

function isValidUUID(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    console.log("Incoming message:", body);
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

    if (!agent_id || !isValidUUID(agent_id)) {
      console.error("Invalid agent_id:", agent_id);
      return NextResponse.json(
        { error: "Invalid agent_id" },
        { status: 400 }
      );
    }

    if (listing_id && !isValidUUID(listing_id)) {
      console.error("Invalid listing_id:", listing_id);
      return NextResponse.json(
        { error: "Invalid listing_id" },
        { status: 400 }
      );
    }

    if (!sender_name || !sender_email || !message) {
      console.error("Missing required fields:", {
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

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error("Missing SERVICE ROLE KEY");
      throw new Error("Missing Supabase service role key.");
    }

    if (!supabaseUrl) {
      console.error("Missing SUPABASE_URL");
      throw new Error("Missing Supabase URL.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      const { error } = await supabaseAdmin.from("messages").insert({
        agent_id,
        listing_id,
        sender_name,
        sender_email,
        message,
        status: "new",
      });

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("API ERROR:", err);
      return NextResponse.json(
        { error: "Server failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      {
        success: false,
        error: { message },
        message,
      },
      { status: 500 }
    );
  }
}
