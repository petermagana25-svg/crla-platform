import 'server-only';

import { Resend } from 'resend';

export const EMAIL_FROM = 'CRLA <noreply@send.crladirectory.com>';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  if (!EMAIL_FROM.includes('crladirectory.com')) {
    throw new Error('Invalid sending domain');
  }

  console.log('Sending email from:', EMAIL_FROM);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    const errorMessage = readResendErrorMessage(error) || 'Unable to send email.';
    throw new Error(errorMessage);
  }

  return data;
}
