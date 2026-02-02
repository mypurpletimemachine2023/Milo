# Architecture (v0)

## Approach
- Build a **connector-based** system: 1 connector per county system.
- Prefer **bulk downloads / open data** first.
- Fallback to HTML scraping only where permitted.

## Pipeline
1) **Discover**: pull yesterday/today's recorded documents (or latest transfers).
2) **Extract**: parse grantor/grantee, recording date, parcel/situs address.
3) **Normalize**: consistent address + name normalization.
4) **Deduplicate**: by parcel_id + recording date + instrument id.
5) **Export**: CSV per day; optionally per zip/city.

## Storage
- Local SQLite (fast, portable)
- Tables:
  - sources(county, system, base_url, policy)
  - records(instrument_id, record_date, grantee, grantor, parcel_id, raw_json, source_url)
  - parcels(parcel_id, situs_address, mailing_address, owner)
  - exports(export_id, path, created_at)

## Tech choices
- Node/TypeScript
- Crawlee (queue + retries) + Playwright (only if needed)
- Strict rate limiting + caching
- Config-driven county definitions
