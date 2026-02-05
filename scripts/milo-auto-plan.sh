#!/usr/bin/env bash
set -euo pipefail

cd /home/lejandro/.openclaw/workspace

TODAY=$(date -u +%Y-%m-%d)
BACKLOG="PRIORITIES.md"
PLAN_DIR="plans"
mkdir -p "$PLAN_DIR"
PLAN_FILE="${PLAN_DIR}/${TODAY}_plan.md"

if [[ ! -f "$BACKLOG" ]]; then
  cat > "$BACKLOG" <<'EOF'
# PRIORITIES
# Simple backlog for Milo
# Mark one or more items with "[TOP]" to signal highest priority.

- [TOP] Example: Stabilize locksmith ops dashboard (tabs + CRM stub)
- [ ] Example: Implement Orange County deed connector v0
EOF
fi

PROMPT="You are Milo, Alex's operator agent. Read the PRIORITIES.md backlog and produce a tight, execution-ready plan for the next 1–3 highest priority items.\n\nFile: PRIORITIES.md\nGoal: Create a plan for ${TODAY} that Alex can see in the morning.\n\nRules:\n- Assume you will be the one executing tasks tomorrow.\n- Pick the single most important item marked [TOP] (or the first item if none are marked). Optionally include at most 2 supporting tasks if they clearly depend on it.\n- Output a markdown plan with sections: '## Focus', '## Steps', '## Files to Touch', '## Risks / Notes'.\n- Be concise. Steps should be concrete (e.g. 'Add /api/leads endpoint to src/server.ts').\n\nOutput only the markdown plan, no extra explanation."\n
TMP_OUT=$(mktemp)
SESSION_ID="auto-plan-${TODAY}-$(date +%s)"
openclaw agent --agent main --local --session-id "$SESSION_ID" --message "$PROMPT" > "$TMP_OUT"

cat "$TMP_OUT" > "$PLAN_FILE"
rm -f "$TMP_OUT"

# Commit plan + backlog if changed (works for untracked files too)
git add "$BACKLOG" "$PLAN_FILE" 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit -m "auto-plan: ${TODAY}" || true
fi
