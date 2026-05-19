import { EmailData, PasswordResetEmailInput } from "../MailerService";
import { buildEmailShell } from "./shell";
import { escape } from "he";

export function buildPasswordResetEmail(
  input: PasswordResetEmailInput,
): EmailData {
  const html = buildEmailShell(`
        <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${escape(input.firstname + " " + input.lastname)},</p>
        <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
            We received a request to reset your SFC Training Portal password.
        </p>
        <p style="margin:0 0 18px;text-align:center;font-size:14px;">
            Click the link below to create a new password. This link will expire in 30 minutes.
        </p>
        <p style="margin:28px 0;text-align:center;">
            <a href="${escape(input.resetUrl)}" style="display:inline-block;padding:14px 24px;background:#14532d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
            Reset Password
            </a>
        </p>
        `);
  return {
    html: html,
    subject: "Password Reset Request for SFC Training Portal",
  };
}
