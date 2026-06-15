# SimplifyingData — Project Context

## Checkpoint — 2026-06-13 (latest)

### What's shipped
- ✅ Landing page (`index.html`) — single-file, deployed on Vercel at simplifyingdata.co
- ✅ Custom domain `simplifyingdata.co` via Cloudflare (DNS-only, no proxy — avoids SSL errors)
- ✅ Supabase waitlist form — stores emails in `waitlist` table (project: `pyuvofppbfuytkcazgwh`)
- ✅ BizAnalyst AI product card with $199 one-time pricing
- ✅ Buy button wired to Lemon Squeezy checkout URL
- ✅ Demo link updated to `bizanalyst-demo.vercel.app`
- ✅ Fade-in animation fix — uses `.js-ready` class so content always visible if JS fails
- ✅ Canonical + OG tags for simplifyingdata.co
- ✅ Lemon Squeezy account approved (store: simplifyingdata)
- ✅ Full payment → provisioning flow working end-to-end (tested with wearcada@gmail.com)
- ✅ Transactional email handled via Resend — managed in AI Biz session
- ✅ Supabase redirect URL confirmed working

### Pending
- ✅ Leads Generator product card added to landing page ($199 one-time)
- ⏳ Leads Generator — build the actual product (same provisioning flow as BizAnalyst)

---

## Architecture

### Payment & Provisioning Flow
```
Customer buys on simplifyingdata.co (Lemon Squeezy checkout)
  → LemonSqueezy POST to bizanalyst.vercel.app/api/webhook
  → Verifies HMAC-SHA256 signature
  → Creates Supabase auth user (inviteUserByEmail → sends set-password email)
  → Inserts biz_clients row (auth_user_id, vercel_url='bizanalyst.vercel.app')
  → Customer clicks email link → sets password → lands on dashboard
```

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
- **Webhook secret:** `bizanalyst-webhook-2026` (stored as Vercel env var `LEMON_SQUEEZY_WEBHOOK_SECRET`)
- **Webhook URL:** `https://bizanalyst.vercel.app/api/webhook`
- **Event:** `order_created`

### Supabase Tables (this project touches)
| Table | Access | Purpose |
|-------|--------|---------|
| `waitlist` | Insert-only (anon) | Stores emails from landing page form |
| `auth.users` | Written by webhook (service role) | One per paying customer |
| `biz_clients` | Written by webhook (service role) | Links auth user to dashboard |

### Supabase Keys
- **Anon key** (in index.html): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (safe to expose)
- **Service role key**: stored only as Vercel env var `SUPABASE_SERVICE_ROLE_KEY` on bizanalyst project

---

## Files
| File | Purpose |
|------|---------|
| `index.html` | Entire landing page — HTML + CSS + JS, single file |
| `CONTEXT.md` | This file |

---

## Cowork Session Structure
| Session | Folder | Handles |
|---------|--------|---------|
| SimplifyingData architecture (this) | `C:\Users\julia\GitHub\simplifyingdata` | Landing page, marketing, Lemon Squeezy config |
| AI Biz | `C:\Users\julia\GitHub\bizanalyst` | Webhook, dashboard, Supabase schema, bug fixes |

> Both sessions share the same Supabase MCP — either can query/fix the DB directly.

---

## Push Workflow
Claude can't push directly via file tools. Uses sandbox clone method:
```bash
git clone https://<token>@github.com/juliautomo/simplifyingdata.git repo
cp <updated file> repo/
cd repo && git commit -am "message" && git push origin main
```
GitHub token: regenerate at github.com/settings/tokens when needed.
