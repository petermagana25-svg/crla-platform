import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

type Body = {
  message_id?: string;
  reply_text?: string;
  sender_email?: string;
};

export const runtime = "nodejs";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const messageId = body.message_id?.trim();
    const senderEmail = body.sender_email?.trim();
    const replyText = body.reply_text?.trim();

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid message id is required." },
        },
        { status: 400 }
      );
    }

    if (!senderEmail || !isValidEmail(senderEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A valid recipient email is required." },
        },
        { status: 400 }
      );
    }

    if (!replyText) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Reply text is required." },
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

    await sendEmail({
      to: senderEmail,
      subject: "Response to your inquiry",
      html: `
        <p>${escapeHtml(replyText).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p>Best regards,<br/>CRLA Agent</p>
      `,
      text: `${replyText}\n\nBest regards,\nCRLA Agent`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("messages")
      .update({ status: "read" })
      .eq("id", messageId);

    if (updateError) {
      throw new Error(updateError.message || "Unable to update message status.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unable to send reply.",
        },
      },
      { status: 500 }
    );
  }
}
