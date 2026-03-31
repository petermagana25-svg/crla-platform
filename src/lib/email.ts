import "server-only";

import { Resend } from "resend";

export const EMAIL_FROM = "CRLA <noreply@crladirectory.com>";
export const EMAIL_REPLY_TO_FALLBACK = "noreply@crladirectory.com";
export const EMAIL_REPLY_TO_INBOUND = "inbox@aedeleokir.resend.app";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type EmailSignature = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  title?: string | null;
};

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  conversationId?: string | null;
  replyTo?: string | null;
  signature?: EmailSignature | null;
};

function readResendErrorMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildHtmlSignature(signature: EmailSignature) {
  const trimmedName = signature.name?.trim() || "CRLA Team";
  const trimmedTitle = signature.title?.trim() || "CRLA Certified Agent";
  const trimmedPhone = signature.phone?.trim() || "Not provided";
  const trimmedEmail = signature.email?.trim() || EMAIL_REPLY_TO_FALLBACK;

  return `
    <br/><br/>
    <div style="margin-top:8px;font-size:13px;color:#666;line-height:1.6;">
      Best regards,<br/>
      <strong>${escapeHtml(trimmedName)}</strong><br/>
      ${escapeHtml(trimmedTitle)}<br/>
      Phone: ${escapeHtml(trimmedPhone)}<br/>
      Email: ${escapeHtml(trimmedEmail)}
    </div>
  `;
}

export function buildConversationUrl(conversationId: string) {
  return `${BASE_URL}/message/${encodeURIComponent(conversationId)}`;
}

export function buildDashboardInboxUrl() {
  return `${BASE_URL}/dashboard/inbox`;
}

export async function sendEmail({
  to,
  subject,
  html,
  conversationId,
  replyTo,
  signature,
}: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const resolvedReplyTo =
    replyTo && isValidEmail(replyTo)
      ? replyTo
      : EMAIL_REPLY_TO_FALLBACK;

  const finalSubject = conversationId
    ? `Re: Your inquiry (#${conversationId})`
    : subject;

  // IMPORTANT:
  // email.ts is now ONLY a transport + signature layer.
  // CTA/button stays in the route that calls sendEmail().
  const finalHtml = `
    ${html}
    ${signature ? buildHtmlSignature(signature) : ""}
  `;

  console.log("📧 EMAIL SEND (ROUTE-OWNED CTA):", {
    to,
    subject: finalSubject,
    replyTo: resolvedReplyTo,
    conversationId,
    url: conversationId ? buildConversationUrl(conversationId) : null,
  });

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: resolvedReplyTo,
    to: [to],
    subject: finalSubject,
    html: finalHtml,
  });

  if (error) {
    const errorMessage =
      readResendErrorMessage(error) || "Unable to send email.";
    console.error("❌ EMAIL ERROR:", error);
    throw new Error(errorMessage);
  }

  return data;
}