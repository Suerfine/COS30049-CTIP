import { EmailData, RegistrationApprovalEmailInput } from "../MailerService";
import { buildEmailShell } from "./shell";
import { escape } from "he";

export function buildRegistrationApprovedEmail(
  input: RegistrationApprovalEmailInput,
): EmailData {
  const html = buildEmailShell(`
              <p style="margin:0 0 18px;text-align:center;font-size:14px;">Hi ${escape(input.firstname + " " + input.lastname)},</p>
      <p style="margin:0 0 18px;text-align:center;font-size:16px;font-weight:700;">
        Congratulations! Your SFC Training Portal account has been created.
      </p>
      <p style="margin:0 0 10px;text-align:center;font-size:14px;">
        Your registration has been approved by the administration team.
      </p>
      <p style="margin:0 0 20px;text-align:center;font-size:14px;">
        Use the credentials below to access the portal.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:24px 0;border:1px solid #26352b;">
      <tr>
        <td style="width:34%;padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Email:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;">
          <a href="mailto:${escape(input.accountEmail)}" style="color:#1464c8;font-weight:700;">${escape(input.accountEmail)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Password:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;color:#b42318;font-weight:700;">
          ${escape(input.password)}
        </td>
      </tr>
      <tr>
        <td style="padding:12px;border:1px solid #26352b;background:#f2f4f1;font-size:14px;">Portal:</td>
        <td style="padding:12px;border:1px solid #26352b;font-size:14px;">
          ${escape(process.env.FRONTEND_URL ?? "SFC Training Portal")}
        </td>
      </tr>
    </table>
      <p style="margin:18px 0 0;text-align:center;font-size:14px;color:#14532d;font-weight:700;">
        You will be prompted to change your password at first login.
      </p>
      <p style="margin:8px 0 0;text-align:center;font-size:12px;color:#52645a;">
        Please keep these credentials secure.
      </p>
        `);
  return {
    html: html,
    subject: "Your SFC Training Portal account has been approved",
  };
}
