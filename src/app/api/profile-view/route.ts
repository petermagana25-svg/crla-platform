import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  agent_id?: string;
};

export const runtime = "nodejs";

function isValidUUID(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const agentId =
      typeof body.agent_id === "string" ? body.agent_id.trim() : null;

    if (!agentId || !isValidUUID(agentId)) {
      return NextResponse.json(
        { error: "Invalid agent_id" },
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

    const { error } = await supabaseAdmin.from("profile_views").insert({
      agent_id: agentId,
    });

    if (error) {
      console.error("Profile view insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile view API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to track profile view.",
      },
      { status: 500 }
    );
  }
}
