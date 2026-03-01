# Roadmap (30/60/90)

## 7-day execution plan (Top P0s)

### ID 34 — WSL Dev Doctor (P0) — **DO FIRST**
**Goal:** reduce environment breakage risk for every other project.
- Day 1: Expand `mission/dev_doctor.sh` checks (node/npm/python/pip/git/ssh/docker optional) + actionable guidance
- Day 2: Add `mission/bootstrap_wsl.sh` improvements + idempotency
- Day 3: Add `scripts/doctor/` helpers (optional) + smoke test output snapshot
- Day 4: Document in `mission/README.md` (how to run, expected output)
- Day 5: Add CI (GitHub Actions) to run doctor on PRs (if desired)
- Day 6–7: Polish, edge cases, ship release notes

### ID 01 — Locksmith 101 Knowledge Hub (P0)
- Day 1: Create `projects/atl/knowledge-hub` Next.js scaffold + Tailwind + markdown pipeline
- Day 2: Add 20 starter articles (original or verified PD excerpts w/ citations)
- Day 3: Categories/tags + search
- Day 4: SEO (metadata, sitemap, robots) + CTA to kits + email capture placeholder
- Day 5: Deploy notes + analytics hook
- Day 6–7: Iterate on top 5 pages for conversion

### ID 35 — Email Packager (County) (P0)
- Day 1: Define closeout folder schema + required artifacts
- Day 2: Build CLI to generate subject/body + attachment manifest
- Day 3: Add optional SMTP send (env vars; no secrets)
- Day 4: Add sample fixtures + smoke test
- Day 5–7: Integrate with Contract Closeout Wizard (ID 02)

## 0–30 days
- Lead capture + routing MVP (forms + SMS + inbox)
- Job lifecycle tracker (status board)
- Reviews + referral flywheel

## 31–60 days
- Quote guardrails + service catalog
- Attribution + close rate tracking
- Content engine automation

## 61–90 days
- Multi-tech scheduling + territory routing
- Lightweight CRM + reminders
- Federal directory validation
