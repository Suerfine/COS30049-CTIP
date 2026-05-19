export function buildEmailShell(content: string): string {
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
