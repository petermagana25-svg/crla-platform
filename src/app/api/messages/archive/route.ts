import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  message_id?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const messageId = body.message_id?.trim();

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid message id is required." },
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

    const { error } = await supabaseAdmin
      .from("messages")
      .update({ archived: true })
      .eq("id", messageId);

    if (error) {
      throw new Error(error.message || "Unable to archive message.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to archive message.",
        },
      },
      { status: 500 }
    );
  }
}
