# SimplifyingData — Project Context

## Checkpoint — 2026-06-16 (updated)

### What's shipped
- ✅ Landing page (`index.html`) — deployed at simplifyingdata.co
- ✅ Custom domain `simplifyingdata.co` via Cloudflare (DNS-only, no proxy)
- ✅ Supabase waitlist form — stores emails in `waitlist` table (project: `pyuvofppbfuytkcazgwh`)
- ✅ Central email service at `simplifyingdata.co/api/send-email` — handles Resend for all products
- ✅ BizAnalyst purchase → BizAnalyst-branded welcome email ✅
- ✅ Leads Generator purchase → SimplifyingLeads-branded welcome email ✅
- ✅ `billing_url` support in `send-email.js` — renders billing portal link in email when passed
- ✅ Supabase Site URL → `https://simplifyingdata.co` (product-neutral fallback)
- ✅ Supabase Redirect URLs: `bizanalyst.vercel.app` + `simplifying-leads.vercel.app`
- ✅ BizAnalyst product landing page at simplifyingdata.co/bizanalyst
- ✅ Leads Generator product landing page at simplifyingdata.co/leads-generator
- ✅ `vercel.json` with `cleanUrls: true` — serves .html files without extension
- ✅ Homepage hero copy updated to be product-neutral
- ✅ BizAnalyst-specific sections removed from homepage (mockup, "Three steps")
- ✅ Contact section ("Have questions?") on all three pages → julia.utomo@gmail.com
- ✅ "Learn more →" buttons on homepage product cards (not direct checkout)

### Pricing (current)
| Product | Price | Trial |
|---------|-------|-------|
| BizAnalyst AI | $19.99/month | 7-day free trial, cancel anytime |
| Leads Generator | $39.99/month | 7-day free trial, cancel anytime |

### Pending
- Nothing — both products fully shipped and working end-to-end
- Future: when Lemon Squeezy sends `billing_url` in order payload, BizAnalyst webhook should forward it to `/api/send-email` (BizAnalyst session's job)

---

## Architecture

### Session Boundaries (important — do not cross)
| Session | Repo | Owns |
|---------|------|------|
| SimplifyingData (this) | `juliautomo/simplifyingdata` | `index.html`, `bizanalyst.html`, `leads-generator.html`, `api/send-email.js`, `vercel.json` |
| BizAnalyst | `juliautomo/bizanalyst` | Dashboard app, `api/webhook.js` (calls central mailer) |
| SimplifyingLeads | Railway + separate Vercel | Leads dashboard, Railway webhook (calls central mailer) |

> ⚠️ This session pushes ONLY to `juliautomo/simplifyingdata`. BizAnalyst and SimplifyingLeads changes belong in their own sessions.

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
  → BizAnalyst webhook receives but skips (product_id filter)
  → Railway generates Supabase recovery link, calls simplifyingdata.co/api/send-email
  → Central mailer sends SimplifyingLeads-branded welcome email via Resend
```

### Webhook Behavior (important)
- Lemon Squeezy sends `order_created` to ALL webhooks for every purchase — this is normal
- Two deliveries per order in Lemon Squeezy dashboard = expected, not a bug
- Each webhook filters by its own product_id

### Central Email Service (`api/send-email.js`)
- POST `{ product, email, name, link, billing_url?, type? }`
- Header: `x-api-key: <INTERNAL_API_KEY>`
- `billing_url` is optional — renders billing portal link in email when present
- Supported products: `bizanalyst`, `simplifyingleads`

### Keys & Secrets
| Key | Value | Where |
|-----|-------|-------|
| `RESEND_API_KEY` | *(see Vercel env vars — do not store here)* | SimplifyingData Vercel only |
| `INTERNAL_API_KEY` | *(see Vercel env vars — do not store here)* | SimplifyingData Vercel + Railway |
| `CENTRAL_EMAIL_URL` | `https://simplifyingdata.co/api/send-email` | Railway env var |

### Tools & Services
| Service | Purpose | Notes |
|---------|---------|-------|
| Vercel | Hosts simplifyingdata.co | Auto-deploys from `juliautomo/simplifyingdata` |
| Cloudflare | DNS for simplifyingdata.co | Proxy OFF (grey cloud) — avoids SSL mismatch |
| Lemon Squeezy | Payments (Merchant of Record) | Store: simplifyingdata, subscription model |
| Supabase | DB + Auth | Project: `pyuvofppbfuytkcazgwh`, shared with BizAnalyst |

### Lemon Squeezy
- **BizAnalyst Checkout URL:** `https://simplifyingdata.lemonsqueezy.com/checkout/buy/d1f48ade-82e2-4530-b513-31d33e63fac0`
- **Leads Generator Checkout URL:** `https://simplifyingdata.lemonsqueezy.com/checkout/buy/9fc83e2d-b165-4a43-8fc7-d11a78c43c36`
- **Leads Generator Webhook URL:** `https://web-production-f0838.up.railway.app/webhook/lemonsqueezy`
- **Leads Generator Webhook Secret:** `sl-webhook-2026-secret` (stored as env var on Railway)
- **Leads Generator App:** `https://simplifying-leads.vercel.app/` (frontend on Vercel, backend on Railway)
- **BizAnalyst Webhook Secret:** `bizanalyst-webhook-2026` (Vercel env var `LEMON_SQUEEZY_WEBHOOK_SECRET`)
- **BizAnalyst Webhook URL:** `https://bizanalyst.vercel.app/api/webhook`
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
| `index.html` | Homepage — product-neutral, links to product pages |
| `bizanalyst.html` | BizAnalyst AI product landing page |
| `leads-generator.html` | Leads Generator product landing page |
| `api/send-email.js` | Central email service — Resend for all products |
| `vercel.json` | `cleanUrls: true` — serves pages without .html extension |
| `CONTEXT.md` | This file |

---

## Push Workflow
Claude can't push directly via file tools. Uses sandbox clone method:
```bash
git clone https://<token>@github.com/juliautomo/simplifyingdata.git repo
cp <updated file> repo/
cd repo && git config user.email "julia.utomo@gmail.com" && git config user.name "Julia" && git add -A && git commit -m "message" && git push origin main
```
GitHub token: *(stored locally — regenerate at github.com/settings/tokens if expired, needs `repo` scope)