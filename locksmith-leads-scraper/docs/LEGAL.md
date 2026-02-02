# Legal + Compliance Notes (Not legal advice)

This project must stay on the "public records + permitted use" side.

## Safer data to collect
- Property address
- Recorded document metadata (instrument #, book/page, recording date)
- Grantee name(s) (new owner) if shown on the official record
- Parcel ID
- Mailing address (if shown on the official record)

## Higher-risk / avoid by default
- **Income, credit, wealth estimates** (often derived/enriched; can trigger FCRA-like concerns depending on use)
- Any non-public personal identifiers (SSN/DOB)
- Driver/license info (DPPA)
- Scraping gated portals that prohibit automation

## Contact / marketing compliance (US)
- Postal mail is typically simplest for new-move leads.
- SMS/robocalls have strict TCPA rules; do not automate.
- Email requires CAN-SPAM compliance; keep opt-out.

## Operational guardrails
- Maintain a per-source record of Terms/allowed use.
- Rate-limit requests and identify your user-agent.
- Cache pages; do not hammer county servers.
- Prefer official bulk downloads or APIs if available.
