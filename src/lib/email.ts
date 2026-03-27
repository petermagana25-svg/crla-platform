import 'server-only';

import { Resend } from 'resend';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      'Missing email configuration. Set RESEND_API_KEY and RESEND_FROM_EMAIL.'
    );
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    const errorMessage = readResendErrorMessage(error) || 'Unable to send email.';
    throw new Error(errorMessage);
  }

  return data;
}
