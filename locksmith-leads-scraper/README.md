# Locksmith Leads Scraper (Public Records) — v0

Goal: build a **legal, defensible** pipeline to generate local lead lists for Veteran Lock & Safe Inc.

Primary lead types:
1) **New homeowners** (recent deed transfers / recorded documents)
2) **Commercial leads** (new businesses, tenant improvements, permits, property managers)

## Principles (non-negotiable)
- Use **public records** sources that allow access (official county sites, bulk data portals, open datasets).
- Respect **Terms of Service**, robots.txt, and rate limits.
- No bypassing paywalls/captchas or “unauthorized access.”
- Store only what we need; minimize sensitive data retention.
- Avoid collecting/inferring **income**, **SSNs**, DOB, etc. (high risk; often not public or legally restricted).

## Output
- Daily CSV exports with normalized columns.
- Optional: a "do-not-contact" suppression list.

## Folder layout
- `docs/` legal notes + source inventory
- `sources/` per-county source configs
- `src/` scraper + parsers + exporters
- `data/` local SQLite + exports

## Next
1) Identify target counties + their official record sources.
2) Decide: **deeds recorder** vs **property appraiser** as primary.
3) Build 1 county connector end-to-end.
