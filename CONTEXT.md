# SimplifyingData — Project Context

## Checkpoint — 2026-06-16 (latest)

### What's shipped
- ✅ Landing page (`index.html`) — single-file, deployed on Vercel at simplifyingdata.co
- ✅ Custom domain `simplifyingdata.co` via Cloudflare (DNS-only, no proxy — avoids SSL errors)
- ✅ Supabase waitlist form — stores emails in `waitlist` table (project: `pyuvofppbfuytkcazgwh`)
- ✅ BizAnalyst AI product card with $199 one-time pricing
- ✅ Leads Generator product card with $199 one-time pricing
- ✅ Both buy buttons wired to Lemon Squeezy checkout URLs
- ✅ Demo link updated to `bizanalyst-demo.vercel.app`
- ✅ Fade-in animation fix — uses `.js-ready` class so content always visible if JS fails
- ✅ Canonical + OG tags for simplifyingdata.co
- ✅ Lemon Squeezy account approved (store: simplifyingdata)
- ✅ Central email service at `simplifyingdata.co/api/send-email` — handles Resend for all products
- ✅ BizAnalyst purchase → BizAnalyst-branded welcome email ✅
- ✅ Leads Generator purchase → SimplifyingLeads-branded welcome email ✅
- ✅ Supabase Site URL updated to `https://simplifyingdata.co` (product-neutral fallback)
- ✅ Supabase Redirect URLs: `bizanalyst.vercel.app` + `simplifying-leads.vercel.app`
- ✅ Custom tool card: white button + SimplifyingData wordmark

### Pending
- ⏳ BizAnalyst session: add product ID filter (skip orders where product_id ≠ 1125235) — low priority since Railway already filters on its end
- ⏳ SimplifyingLeads session: fix `redirect_to` in `generate_recovery_link` — should point to `https://simplifying-leads.vercel.app`, not `simplifyingdata.co`
- ⏳ SimplifyingLeads session: fix `ensure_client_row_by_email` using wrong Supabase API endpoint

---

## Architecture

### Payment & Provisioning Flow
```
Customer buys on simplifyingdata.co (Lemon Squeezy checkout)
  → LemonSqueezy fires order_created to ALL store webhooks

BizAnalyst order (product_id 1125235):
  → bizanalyst.vercel.app/api/webhook processes it
  → Railway webhook receives but skips (product_id ≠ 1143694)
  → BizAnalyst webhook calls simplifyingdata.co/api/send-email (central mailer)
  → Central mailer sends BizAnalyst-branded welcome email via Resend

Leads Generator order (product_id 1143694):
  → Railway webhook (web-production-f0838.up.railway.app) processes it
  → BizAnalyst webhook receives but should skip (product ID filter — pending)
  → Railway generates Supabase recovery link, calls simplifyingdata.co/api/send-email
  → Central mailer sends SimplifyingLeads-branded welcome email via Resend
```

### Webhook Behavior (important)
- Lemon Squeezy sends `order_created` to ALL webhooks for every purchase — this is normal
- Two deliveries per order in Lemon Squeezy dashboard = expected, not a bug
- Each webhook is responsible for filtering by its own product_id

### Keys & Secrets
| Key | Value | Where |
|-----|-------|-------|
| `RESEND_API_KEY` | *(see Vercel env vars — do not store here)* | SimplifyingData Vercel only |
| `INTERNAL_API_KEY` | `sd-internal-2026` | SimplifyingData Vercel + Railway |
| `CENTRAL_EMAIL_URL` | `https://simplifyingdata.co/api/send-email` | Railway env var |

### Tools & Services
| Service | Purpose | Notes |
|---------|---------|-------|
| Vercel | Hosts simplifyingdata.co | Auto-deploys from `juliautomo/simplifyingdata` |
| Cloudflare | DNS for simplifyingdata.co | Proxy OFF (grey cloud) — avoids SSL mismatch |
| Lemon Squeezy | Payments (Merchant of Record) | Store: simplifyingdata, $199 one-time |
| Supabase | DB + Auth | Project: `pyuvofppbfuytkcazgwh`, shared with BizAnalyst |

### Lemon Squeezy
- **BizAnalyst Checkout URL:** `https://simplifyingdata.lemonsqueezy.com/checkout/buy/fd945053-a0c8-45d3-b677-eab98150bf54`
- **Leads Generator Checkout URL:** `https://simplifyingdata.lemonsqueezy.com/checkout/buy/98f9976e-17e1-4c42-bca2-74fdc5c43dec`
- **Leads Generator Webhook URL:** `https://web-production-f0838.up.railway.app/webhook/lemonsqueezy`
- **Leads Generator Webhook Secret:** `sl-webhook-2026-secret` (stored as env var on Railway)
- **Leads Generator App:** `https://simplifying-leads.vercel.app/` (frontend on Vercel, backend on Railway)
- **Webhook secret:** `bizanalyst-webhook-2026` (