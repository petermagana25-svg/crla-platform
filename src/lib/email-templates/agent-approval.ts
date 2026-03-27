type AgentApprovalEmailArgs = {
  activationLink: string;
  name: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildAgentApprovalEmail({
  activationLink,
  name,
}: AgentApprovalEmailArgs) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(activationLink);

  return {
    subject: 'Your CRLA Agent Access Is Ready',
    html: `
      <div style="background:#0b1426;padding:32px 16px;font-family:Arial,sans-serif;color:#f8fafc;">
        <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
            Your application to become a Certified Renovation Listing Agent has been approved.
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
            You can now access your agent portal using the secure link below:
          </p>
          <p style="margin:0 0 24px;">
            <a href="${safeLink}" style="display:inline-block;background:#d4af37;color:#0b1426;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">
              Activate your account
            </a>
          </p>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">This link will allow you to:</p>
          <ul style="margin:0 0 20px 20px;padding:0;font-size:15px;line-height:1.7;">
            <li>Set your password</li>
            <li>Access your dashboard</li>
          </ul>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            For security reasons, please complete your setup as soon as possible.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            Once logged in, you’ll be guided to complete your profile.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.6;">
            Welcome aboard,<br />
            CRLA Team
          </p>
        </div>
      </div>
    `.trim(),
    text: `Hi ${name},

Your application to become a Certified Renovation Listing Agent has been approved.

You can now access your agent portal using the secure link below:

Activate your account: ${activationLink}

This link will allow you to:
- Set your password
- Access your dashboard

For security reasons, please complete your setup as soon as possible.

Once logged in, you'll be guided to complete your profile.

Welcome aboard,
CRLA Team`,
  };
}
