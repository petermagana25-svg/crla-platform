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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    console.log("Incoming message:", body);
    const agentId = body.agent_id?.trim();
    const listingId = body.listing_id?.trim() || null;
    const message = body.message?.trim();
    const senderName = body.sender_name?.trim() || null;
    const senderEmail = body.sender_email?.trim() || null;

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid agent is required." },
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Message is required." },
        },
        { status: 400 }
      );
    }

    if (senderEmail && !isValidEmail(senderEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Enter a valid email address." },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase admin configuration.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "This agent is no longer available." },
        },
        { status: 404 }
      );
    }

    if (listingId) {
      const { data: listing, error: listingError } = await supabaseAdmin
        .from("listings")
        .select("id")
        .eq("id", listingId)
        .eq("agent_id", agentId)
        .maybeSingle();

      if (listingError || !listing) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "This listing is no longer available." },
          },
          { status: 400 }
        );
      }
    }

    try {
      const { data: insertedMessage, error: insertError } = await supabaseAdmin
        .from("messages")
        .insert({
          agent_id: agentId,
          listing_id: listingId,
          message,
          sender_email: senderEmail,
          sender_name: senderName,
          status: "new",
        })
        .select("id")
        .single();

      if (insertError || !insertedMessage) {
        throw new Error(insertError?.message || "Unable to send message.");
      }
    } catch (error) {
      console.error("Message insert error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Message insert error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to send message.",
        },
      },
      { status: 500 }
    );
  }
}
