import 'server-only';

import { Resend } from 'resend';

export const EMAIL_FROM = 'CRLA <noreply@crladirectory.com>';
export const EMAIL_REPLY_TO_FALLBACK = 'noreply@crladirectory.com';
export const EMAIL_REPLY_TO_INBOUND = 'inbox@aedeleokir.resend.app';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  conversationId?: string | null;
  agentEmail?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
};

function readResendErrorMessage(payload: unknown) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  conversationId,
  agentEmail,
  agentName,
  agentPhone,
}: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  if (!EMAIL_FROM.includes('crladirectory.com')) {
    throw new Error('Invalid sending domain');
  }

  if (!EMAIL_FROM.endsWith('@crladirectory.com>')) {
    throw new Error('Email must use verified root domain');
  }

  const trimmedAgentEmail = agentEmail?.trim() || '';
  const trimmedAgentName = agentName?.trim() || 'CRLA Team';
  const trimmedAgentPhone = agentPhone?.trim() || 'Not provided';
  const signatureEmail = isValidEmail(trimmedAgentEmail)
    ? trimmedAgentEmail
    : EMAIL_REPLY_TO_FALLBACK;
  const trimmedConversationId = conversationId?.trim() || null;
  const replyTo = EMAIL_REPLY_TO_INBOUND;
  const resolvedSubject = trimmedConversationId
    ? `Re: Your inquiry (#${trimmedConversationId})`
    : subject;
  const signature = `
  <br/><br/>
  Best regards,<br/>
  <strong>${escapeHtml(trimmedAgentName)}</strong><br/>
  CRLA Certified Agent<br/>
  📞 ${escapeHtml(trimmedAgentPhone)}<br/>
  ✉️ ${escapeHtml(signatureEmail)}
`;
  const htmlWithSignature = `${html}${signature}`;
  const textWithSignature = text
    ? `${text}\n\nBest regards,\n${trimmedAgentName}\nCRLA Certified Agent\nPhone: ${trimmedAgentPhone}\nEmail: ${signatureEmail}`
    : undefined;

  console.log('EMAIL SEND CONFIG:', {
    from: EMAIL_FROM,
    reply_to: EMAIL_REPLY_TO_INBOUND,
    to,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo,
    to: [to],
    subject: resolvedSubject,
    html: htmlWithSignature,
    ...(textWithSignature ? { text: textWithSignature } : {}),
  });

  if (error) {
    const errorMessage = readResendErrorMessage(error) || 'Unable to send email.';
    throw new Error(errorMessage);
  }

  return data;
}
