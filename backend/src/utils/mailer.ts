import crypto from "crypto";
import nodemailer from "nodemailer";

type RegistrationEmailInput = {
  to: string;
  firstname: string;
  lastname: string;
};

type ApprovalEmailInput = RegistrationEmailInput & {
  accountEmail: string;
  password: string;
};

type RejectionEmailInput = RegistrationEmailInput & {
  reason?: string | null;
};

type PasswordResetEmailInput = RegistrationEmailInput & {
  resetUrl: string;
};

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
    from,
  };
}

function createTransporter() {
  const config = getMailerConfig();

  if (!config) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    }),
    from: config.from,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFullName(input: RegistrationEmailInput): string {
  return `${input.firstname} ${input.lastname}`.trim();
}

function buildEmailShell(content: string): string {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f3f6f2;font-family:Arial,Helvetica,sans-serif;color:#1f2a24;">
        <div style="width:100%;padding:10px 0 28px;">
          <p style="margin:0 0 12px;text-align:center;font-size:11px;color:#66736b;">
            [This is an automated response, please do not reply to this email. Thank you.]
          </p>
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:94%;margin:0 auto;background:#ffffff;border-collapse:collapse;border:1px solid #d9e2d8;">
            <tr>
              <td style="background:#14532d;padding:26px 32px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#cce8d2;">Sarawak Forestry Corporation</div>
                <div style="font-size:28px;font-weight:700;line-height:1.2;margin-top:6px;">SFC Training Portal</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#eef5ee;padding:16px 32px;text-align:center;font-size:12px;color:#4f6256;">
                For enquiries, please contact the SFC administration team.
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}

function buildCredentialTable(accountEmail: string, password: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:24px 0;border:1px solid #26352b;">
      <tr>
        <td style="width:34%;padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Email:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;">
          <a href="mailto:${escapeHtml(accountEmail)}" style="color:#1464c8;font-weight:700;">${escapeHtml(accountEmail)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Password:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;color:#b42318;font-weight:700;">
          ${escapeHtml(password)}
        </td>
      </tr>
      <tr>
        <td style="padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Portal:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;">
          ${escapeHtml(process.env.FRONTEND_URL ?? "SFC Training Portal")}
        </td>
      </tr>
    </table>
  `;
}

export function generateRandomPassword(): string {
  return `SFC-${crypto.randomBytes(6).toString("base64url")}`;
}

export function generateSfcEmail(id: string | number): string {
  const localPart = String(id)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

  return `${localPart}@sfc.gov.my`;
}

export async function sendRegistrationApprovedEmail(
  input: ApprovalEmailInput,
): Promise<void> {
  const mailer = createTransporter();

  if (!mailer) {
    console.warn("SMTP is not configured; skipped registration approval email.");
    return;
  }

  const safeName = escapeHtml(getFullName(input));
  const html = buildEmailShell(`
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${safeName},</p>
    <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
      Congratulations! Your SFC Training Portal account has been created.
    </p>
    <p style="margin:0 0 10px;text-align:center;font-size:14px;">
      Your registration has been approved by the administration team.
    </p>
    <p style="margin:0 0 20px;text-align:center;font-size:14px;">
      Use the credentials below to access the portal.
    </p>
    ${buildCredentialTable(input.accountEmail, input.password)}
    <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#52645a;">
      Please keep these credentials secure.
    </p>
  `);

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: input.to,
    subject: "Your SFC Training Portal account has been approved",
    html,
  });
}

export async function sendRegistrationRejectedEmail(
  input: RejectionEmailInput,
): Promise<void> {
  const mailer = createTransporter();

  if (!mailer) {
    console.warn("SMTP is not configured; skipped registration rejection email.");
    return;
  }

  const safeReason = input.reason?.trim()
    ? `<p style="margin:18px 0 0;font-size:14px;"><strong>Reason:</strong> ${escapeHtml(input.reason.trim())}</p>`
    : "";
  const html = buildEmailShell(`
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${escapeHtml(getFullName(input))},</p>
    <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
      Your SFC Training Portal registration was not approved.
    </p>
    <p style="margin:0;text-align:center;font-size:14px;">
      After reviewing your submission, the administration team has rejected this registration request.
    </p>
    ${safeReason}
  `);

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: input.to,
    subject: "Your SFC Training Portal registration was rejected",
    html,
  });
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
): Promise<void> {
  const mailer = createTransporter();

  if (!mailer) {
    console.warn("SMTP is not configured; skipped password reset email.");
    return;
  }

  const safeName = escapeHtml(getFullName(input));
  const safeResetUrl = escapeHtml(input.resetUrl);
  const html = buildEmailShell(`
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${safeName},</p>
    <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
      We received a request to reset your SFC Training Portal password.
    </p>
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">
      Click the link below to create a new password. This link will expire in 30 minutes.
    </p>
    <p style="margin:28px 0;text-align:center;">
      <a href="${safeResetUrl}" style="display:inline-block;padding:14px 24px;background:#14532d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
        Reset Password
      </a>
    </p>
    <p style="margin:0;text-align:center;font-size:12px;color:#52645a;word-break:break-all;">
      If the button does not work, copy and paste this link into your browser:<br />
      <span style="color:#14532d;">${safeResetUrl}</span>
    </p>
  `);

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: input.to,
    subject: "Reset your SFC Training Portal password",
    html,
  });
}

export async function sendPasswordChangedEmail(
  input: RegistrationEmailInput,
): Promise<void> {
  const mailer = createTransporter();

  if (!mailer) {
    console.warn("SMTP is not configured; skipped password changed email.");
    return;
  }

  const safeName = escapeHtml(getFullName(input));
  const html = buildEmailShell(`
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${safeName},</p>
    <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
      Your SFC Training Portal password was changed.
    </p>
    <p style="margin:0 0 18px;text-align:center;font-size:14px;">
      If you did not perform this change, please contact the SFC administration immediately to secure your account.
    </p>
  `);

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: input.to,
    subject: "Your SFC Training Portal password has been changed",
    html,
  });
}
