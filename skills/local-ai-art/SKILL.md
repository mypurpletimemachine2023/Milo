---
name: local-ai-art
description: Generate AI cover art assets locally for OpenClaw projects (e.g., Purple Time Machine). Creates cover images for catalog entries and saves them into frontend public folders. Uses provider APIs via env vars (no secrets in repo).
---

# Local AI Art

Use when you need to generate **cover images** (and optionally backgrounds) for local OpenClaw projects.

## Quick start (Purple Time Machine covers)

1) Create config:

- Copy `config.example.json` → `config.json` and edit paths/style.
- Set your API key in env (do NOT put secrets in files):
  - OpenAI: `export OPENAI_API_KEY=...`

2) Validate:

```bash
node skills/local-ai-art/scripts/onboarding.js --validate
```

3) Generate covers (missing only):

```bash
node skills/local-ai-art/scripts/gen_covers.js --project purple-time-machine --missing-only
```

## What it does

- Reads the project catalog (`purple-time-machine/catalog.json`)
- For each game:
  - builds an art prompt from title/row/source/oneLiner + global style
  - writes cover art to `purple-time-machine/frontend/public/covers/<slug>.jpg`
  - (optional) writes per-game JSON prompt metadata next to it

## Notes / guardrails

- Default output is **16:9** covers.
- Keep art **original** (no copying Netflix key art).
- If provider is unavailable or keys missing, use `--dry-run` to output prompts only.
