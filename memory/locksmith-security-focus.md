# Locksmith + Security Focus (Source of Truth)

## Mission
Build practical software + automation that increases **calls, bookings, and repeat customers** for a small local locksmith company, while reducing admin load and improving technician throughput.

## Core business assumptions (edit as needed)
- Primary conversion: phone calls/texts first; booking secondary.
- Business type: mobile locksmith (residential/commercial/auto depending on scope).
- Service area: local radius (define exact cities/zip clusters).

## What “shipping” means (weekly)
- Website: money pages + forms + click-to-call + local SEO improvements shipped.
- Ops: fewer missed calls, faster dispatch, cleaner invoicing, better follow-up.
- Analytics: know which pages/ads/keywords produce calls + revenue.

## Tech priorities (in order)
1) Lead capture + routing (never miss calls/texts)
2) Scheduling/dispatch + job lifecycle tracking
3) Post-job review + referral flywheel
4) Local SEO + content engine
5) Pricing/quoting guardrails + fraud/scam protection messaging

## Guardrails
- No secrets in chat; credentials live in local env vars or managed vault.
- Avoid brittle UI automation for core ops; prefer APIs/webhooks.
- Always keep an “off switch” (revoke tokens, rotate keys).
