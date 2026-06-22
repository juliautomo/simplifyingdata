// Central email service for all SimplifyingData products
// POST { product, email, name, link, billing_url?, type }
// Header: x-api-key: <INTERNAL_API_KEY>

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const BRANDS = {
  bizanalyst: {
    name: 'BizAnalyst AI',
    from: 'BizAnalyst AI <noreply@simplifyingdata.co>',
    emoji: '📊',
    dashboardUrl: 'https://bizanalyst.vercel.app',
    steps: [
      '① Set your password using the button above',
      '② Upload your Excel file — sales, inventory, returns',
      '③ Ask AI anything about your data in plain English',
    ],
  },
  simplifyingleads: {
    name: 'SimplifyingLeads',
    from: 'SimplifyingLeads <noreply@simplifyingdata.co>',
    emoji: '🎯',
    dashboardUrl: 'https://simplifying-leads.vercel.app',
    steps: [
      '① Set your password using the button above',
      '② Define your target customer criteria',
      '③ Generate and export your lead list instantly',
    ],
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { product, email, name, link, billing_url, type = 'welcome' } = req.body;

  if (!product || !email || !link) {
    return res.status(400).json({ error: 'Missing required fields: product, email, link' });
  }

  const brandKey = product.toLowerCase().replace(/[^a-z]/g, '');
  const brand = BRANDS[brandKey];
  if (!brand) {
    return res.status(400).json({ error: `Unknown product: ${product}` });
  }

  if (type !== 'welcome') {
    return res.status(400).json({ error: `Unknown type: ${type}` });
  }

  const firstName = (name || '').split(' ')[0] || 'there';
  const subject = `You're in — set your password for ${brand.name}`;
  const html = buildWelcomeEmail(brand, firstName, link, billing_url);

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: brand.from, to: email, subject, html }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('[send-email] Resend error:', err);
    return res.status(500).json({ error: 'Resend error: ' + err });
  }

  const result = await r.json();
  console.log('[send-email] Sent', type, 'email to', email, 'for', brand.name);
  return res.status(200).json({ success: true, id: result.id });
}

function buildWelcomeEmail(brand, firstName, link, billing_url) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#e8e5df;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e5df;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="padding:32px 40px 24px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">
            <span style="font-weight:400;">Simplifying</span>Data
          </p>
          <p style="margin:6px 0 0;font-size:13px;color:#6b6b6b;">AI tools for growing businesses</p>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:500;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.8px;">${brand.emoji} ${brand.name.toUpperCase()}</p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1a1a1a;line-height:1.2;">Welcome, ${firstName}!</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.7;">
            Your account is ready. Set your password below to access your dashboard and get started — no setup needed.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
            <tr><td style="background:#1a1a1a;border-radius:100px;">
              <a href="${link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Set my password →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;">What's next</p>
              ${brand.steps.map(s => `<p style="margin:0 0 10px;font-size:14px;color:#555555;">${s}</p>`).join('\n              ')}
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#999999;line-height:1.6;">
            Log in anytime at <a href="${brand.dashboardUrl}" style="color:#1a1a1a;text-decoration:underline;">${brand.dashboardUrl.replace('https://', '')}</a>.
            If you didn't make this purchase, you can safely ignore this email.
          </p>

          ${billing_url ? `<p style="margin:16px 0 0;font-size:14px;color:#6b7280;">
            Manage your subscription anytime at <a href="${billing_url}" style="color:#1a1a1a;text-decoration:underline;">your billing portal</a>.
          </p>` : ''}
        </td></tr>

        <tr><td style="padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999999;">
            © 2026 SimplifyingData · Made with ♥ for growing businesses ·
            <a href="https://simplifyingdata.co" style="color:#999999;text-decoration:none;">simplifyingdata.co</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body