# OpenClaw Mission Control

## Active projects (max 3)
1) **VeteranLockAndSafe.com** — service authority site + local SEO + conversion system
2) **AlexTheLocksmith.com** — educational hub + lawful ecommerce + lead capture
3) **Milo Ops (internal)** — dispatch + jobs pipeline + review/referral automation

## This week’s objectives
- Ship Mission Control repo artifacts (roadmap/catalog/ip register/security/scripts) ✅
- Stand up a minimal “lead capture + routing” service (web form → inbox + SMS) (next)
- Add IP provenance tracking for any third-party assets (next)

## Blockers
- Proton Bridge (Windows) ↔ WSL connectivity not confirmed yet (needed for automated outbound email).
- GoDaddy/WordPress access is manual until browser relay is attached.

## Release checklist (every PR)
- [ ] No secrets committed (`.env*` ignored; keys/tokens not present)
- [ ] README updated (run/deploy steps)
- [ ] Smoke test script or steps included
- [ ] IP_REGISTER updated for new assets
- [ ] Lint/tests run or explicitly noted
