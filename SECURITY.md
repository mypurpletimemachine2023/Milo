# SECURITY.md (Milo)

## Current posture (intended)
- Control UI: **local-only** (loopback bind)
- Telegram DM access: **pairing/allowlist** (only approved users)
- No customer PII stored (until Alex explicitly enables)
- Backups:
  - Local git auto-commit every 30 minutes
  - Daily tar snapshot to Windows: `/mnt/c/Backups/MILO/`

## Secrets handling
- Never commit raw secrets (bot tokens, API keys, gateway token) into git.
- If a config snapshot is needed, commit **redacted** only:
  - `backups/openclaw.redacted.json`

## Approval gates (hard rules)
- Ads/spend: must be explicitly approved by Alex.
- Customer-impacting policy/pricing/scripts: must be explicitly approved by Alex.
- Outbound customer messaging: do not automate until a specific workflow is defined.
- **Elevated (sudo/root) actions:** disabled by default. Only perform if Alex explicitly requests it for a specific task.

## Operational notes
- If remote access is ever enabled (Cloudflare/Tailscale/reverse proxy), configure trusted proxies / access controls first.
