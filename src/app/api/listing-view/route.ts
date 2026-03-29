import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  agent_id?: string;
  listing_id?: string | null;
};

export const runtime = "nodejs";

function isValidUUID(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    console.log("Listing view:", body);

    const listing_id =
      typeof body.listing_id === "string" ? body.listing_id.trim() : "";
    const agent_id =
      typeof body.agent_id === "string" ? body.agent_id.trim() : "";

    if (!listing_id || !agent_id || !isValidUUID(listing_id) || !isValidUUID(agent_id)) {
      return NextResponse.json(
        { error: "Invalid listing_id or agent_id" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabaseAdmin.from("listing_views").insert({
      listing_id: listing_id || null,
      agent_id,
    });

    if (error) {
      console.error("Listing view insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Listing view API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to track listing view.",
      },
      { status: 500 }
    );
  }
}
