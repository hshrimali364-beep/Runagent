import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'RunAgent <noreply@runagent.in>'

// ── Send OTP Email ────────────────────────────────────────────
export async function sendOtpEmail(email: string, otp: string, firmName?: string) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${otp} is your RunAgent login code`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:28px 40px">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">
            Run<span style="color:#1a56db">Agent</span>
          </span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Login Code</p>
          <h1 style="margin:0 0 24px;font-size:36px;font-weight:700;color:#0a0a0a;letter-spacing:-1px">${otp}</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            ${firmName ? `Hello ${firmName},<br><br>` : ''}
            Enter this code in RunAgent to sign in. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:14px 16px;margin:24px 0">
            <p style="margin:0;font-size:13px;color:#6b7280">
              🔒 If you didn't request this code, ignore this email. Your account is safe.
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af">This code is valid for one-time use only and expires in 10 minutes.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            © ${new Date().getFullYear()} RunAgent · Built for Indian CA Firms · Made in India 🇮🇳
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (error) throw new Error(`Email send failed: ${error.message}`)
  return data
}

// ── Send Magic Link Email ─────────────────────────────────────
export async function sendMagicLinkEmail(email: string, magicUrl: string, firmName?: string) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your RunAgent login link',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#0a0a0a;padding:28px 40px">
          <span style="color:#fff;font-size:20px;font-weight:700">Run<span style="color:#1a56db">Agent</span></span>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0a0a0a;font-size:24px">Your login link is ready</h2>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6">
            ${firmName ? `Hello ${firmName},<br><br>` : ''}
            Click the button below to sign in to RunAgent. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${magicUrl}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">Sign In to RunAgent →</a>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">
            Or copy this URL: <br><span style="color:#1a56db;word-break:break-all">${magicUrl}</span>
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} RunAgent · Made in India 🇮🇳</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (error) throw new Error(`Email send failed: ${error.message}`)
  return data
}

// ── Access Request Approved Email ─────────────────────────────
export async function sendApprovalEmail(email: string, firmName: string, loginUrl: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🎉 Your RunAgent access is approved!',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#0a0a0a;padding:28px 40px">
          <span style="color:#fff;font-size:20px;font-weight:700">Run<span style="color:#1a56db">Agent</span></span>
        </td></tr>
        <tr><td style="padding:40px">
          <div style="background:#ecfdf5;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">🎉</div>
            <h2 style="margin:0;color:#059669;font-size:20px">Your access is approved!</h2>
          </div>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            Hello ${firmName},<br><br>
            Your RunAgent account is ready! You have <strong>50 free bill credits</strong> to get started.
          </p>
          <ul style="font-size:14px;color:#374151;line-height:2;padding-left:20px">
            <li>Upload bill photos from clients via WhatsApp links</li>
            <li>Automatic OCR extraction of invoice data</li>
            <li>Export to Excel, CSV, or Tally</li>
          </ul>
          <a href="${loginUrl}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;margin-top:24px">Login to RunAgent →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} RunAgent · Made in India 🇮🇳</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

// ── Access Request Rejected Email ─────────────────────────────
export async function sendRejectionEmail(email: string, firmName: string, reason?: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Update on your RunAgent access request',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#0a0a0a;padding:28px 40px">
          <span style="color:#fff;font-size:20px;font-weight:700">Run<span style="color:#1a56db">Agent</span></span>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0a0a0a;font-size:22px">Regarding your access request</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            Hello ${firmName},<br><br>
            After reviewing your request, we are unable to approve it at this time.
            ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}
          </p>
          <p style="font-size:14px;color:#6b7280">
            If you believe this is a mistake, please contact us at <a href="mailto:hello@runagent.in" style="color:#1a56db">hello@runagent.in</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

// ── Bill upload notification to CA ────────────────────────────
export async function sendBillUploadNotification(
  caEmail: string, firmName: string, clientName: string, invoiceCount: number
) {
  await resend.emails.send({
    from: FROM,
    to: caEmail,
    subject: `${clientName} uploaded ${invoiceCount} bill(s) — RunAgent`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
  <div style="font-size:18px;font-weight:700;margin-bottom:20px">Run<span style="color:#1a56db">Agent</span></div>
  <h2 style="margin:0 0 12px;font-size:18px;color:#0a0a0a">New bills uploaded</h2>
  <p style="color:#374151;font-size:14px;line-height:1.6">
    <strong>${clientName}</strong> has uploaded <strong>${invoiceCount} bill(s)</strong> for your firm <em>${firmName}</em>.
    Log in to review and approve them.
  </p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices" 
     style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:20px">
    Review Bills →
  </a>
</div>`,
  })
}
