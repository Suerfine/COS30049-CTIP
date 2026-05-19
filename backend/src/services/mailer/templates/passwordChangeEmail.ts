import {
  EmailData,
  PasswordResetEmailInput,
  RegistrationEmailInput,
} from "../MailerService";
import { buildEmailShell } from "./shell";
import { escape } from "he";
export function buildPasswordChangeEmail(
  input: RegistrationEmailInput,
): EmailData {
  const html = buildEmailShell(`
        <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${escape(input.firstname + " " + input.lastname)},</p>
      <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
        Your SFC Training Portal password was changed.
      </p>
      <p style="margin:0 0 18px;text-align:center;font-size:14px;">
        If you did not perform this change, please contact the SFC administration immediately to secure your account.
      </p>
    `);
  return {
    html: html,
    subject: "Password Change Notification for SFC Training Portal",
  };
}
