#!/usr/bin/env bash
set -euo pipefail

cd /home/lejandro/.openclaw/workspace

# Simple nightly "compound review" for Milo
# 1) Look at yesterday+today memory files
# 2) Ask main agent to extract 3–10 learnings
# 3) Append them to AGENTS.md (or create it if missing)
# 4) Commit locally

TODAY=$(date -u +%Y-%m-%d)
YESTERDAY=$(date -ud "yesterday" +%Y-%m-%d)

MEM_FILES=()
[[ -f "memory/${YESTERDAY}.md" ]] && MEM_FILES+=("memory/${YESTERDAY}.md")
[[ -f "memory/${TODAY}.md" ]] && MEM_FILES+=("memory/${TODAY}.md")

PROMPT="You are Milo, Alex's operator agent. Perform a nightly compound review.\n\nContext files (may or may not exist):\n- AGENTS.md (who you are / how you work)\n- SOUL.md (persona)\n- USER.md (about Alex)\n- SECURITY.md (guardrails)\n- Recent memory files: ${MEM_FILES[*]}\n\nTask:\n1) Skim the recent memory files listed above (if present).\n2) Identify 3–10 concrete learnings, patterns, or gotchas from today that are worth keeping long-term.\n3) Update AGENTS.md in-place to capture these learnings under a short dated subsection for ${TODAY} (e.g. '## Learnings – ${TODAY}').\n4) Keep the edit minimal and surgical: no big rewrites, just append/merge notes.\n\nOutput only the final AGENTS.md content; do not include explanations."\n
# Use OpenClaw's own CLI to call main agent in isolated mode
TMP_OUT=$(mktemp)
openclaw agents run --agent main --isolated --prompt "$PROMPT" > "$TMP_OUT"

# Write back AGENTS.md from model output
cat "$TMP_OUT" > AGENTS.md
rm -f "$TMP_OUT"

# Commit if there are changes
if ! git diff --quiet AGENTS.md; then
  git add AGENTS.md
  git commit -m "auto-compound: nightly learnings ${TODAY}" || true
fi
