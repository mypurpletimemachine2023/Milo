# Milo / OpenClaw Security Checklist

This is a working checklist to apply whenever we add new skills, tools, or infra.

## 1. Gateway exposure & auth
- [x] Gateway bound to localhost only (no 0.0.0.0 exposure).
- [ ] If exposed beyond localhost, `gateway.auth.token` set and stored via env var.

## 2. DM / chat access control
- [x] Telegram DM restricted via explicit allowlist (Alex only).
- [ ] Any new channels must use explicit allowlists or strong auth.

## 3. Sandbox & command safety
- [x] Elevated / sudo actions disabled by default.
- [x] No destructive commands (`rm -rf`, `mkfs`, etc.) run without explicit approval.
- [ ] When containerized, run tools in sandbox / network-restricted contexts.

## 4. Secrets & credentials
- [x] Raw OpenClaw configs have `600` perms; credentials dir `700`.
- [x] Backups use redacted configs (no live secrets in git).
- [ ] Any new skills use env vars or local auth profiles instead of plaintext tokens.

## 5. Prompt injection via web / scraping
- [x] Treat all web/scraped content as untrusted text.
- [ ] Never execute code or shell commands that come directly from page content.
- [ ] For lead scrapers, respect ToS/robots + avoid high-risk PII by default.

## 6. Dangerous tools & outbound actions
- [x] Outbound messaging (email, SMS, calls, posts) requires explicit approval.
- [x] No `git push`, `curl | sh`, or similar side-effectful commands without Alex’s go-ahead.
- [ ] New skills must document any destructive or external effects in their SKILL.md.

## 7. Network isolation (future containerization)
- [ ] When running gateway/agents in Docker, use isolated networks by default.
- [ ] Limit egress for scrapers and tools to required domains only.

## 8. Tool access scope
- [x] Only necessary tools enabled for main agent.
- [ ] New tools/skills should be added with narrow, documented capabilities.

## 9. Logging & audit
- [x] OpenClaw session logs enabled for main agent.
- [x] Local git + snapshot backups keep a trace of config and code changes.
- [ ] For any high-risk automation (dialers, mass outreach), log inputs/outputs separately.

## 10. Pairing & tokens
- [x] Telegram pairing is one-off and not reused.
- [ ] Any future pairing codes / API tokens must be cryptographically random and rate-limited.

---

**Usage:**
- Run through this list when:
  - Adding a new skill or external integration.
  - Changing gateway config or exposing new ports.
  - Deploying Milo to a new environment (e.g., cloud Milo-Arcade).
- Keep it short and practical; update as we harden more pieces.