import { EmailData, RegistrationRejectionEmailInput } from "../MailerService";
import { buildEmailShell } from "./shell";
import { escape } from "he";

export function buildRegistrationRejectedEmail(
  input: RegistrationRejectionEmailInput,
): EmailData {
  const safeReason = input.reason?.trim()
    ? `<p style="margin:18px 0 0;font-size:14px;"><strong>Reason:</strong> ${escape(
        input.reason!.trim(),
      )}</p>`
    : "";

  const html = buildEmailShell(`
      <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${escape(
        input.firstname + " " + input.lastname,
      )},</p>
      <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
        Your SFC Training Portal registration was not approved.
      </p>
      <p style="margin:0;text-align:center;font-size:14px;">
        After reviewing your submission, the administration team has rejected this registration request.
      </p>
      ${safeReason}
    `);

  return {
    html,
    subject: "Your SFC Training Portal registration was rejected",
  };
}
