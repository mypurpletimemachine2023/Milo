#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/home/lejandro/.openclaw/workspace"
DEST_DIR="/mnt/c/Backups/MILO"
TS="$(date -u +"%Y-%m-%d_%H%M%SZ")"
OUT_TGZ="$DEST_DIR/milo_workspace_$TS.tgz"

mkdir -p "$DEST_DIR"

# Ensure we have the latest redacted config snapshot in the repo
/usr/bin/env node "$WORKSPACE/scripts/backup-to-git.mjs" || true

# Create tarball snapshot (no node_modules, no build artifacts)
# Note: we intentionally include the Git repo so history travels with the snapshot.
tar -czf "$OUT_TGZ" \
  --exclude='.git/objects/pack/*.idx' \
  --exclude='.git/objects/pack/*.pack' \
  --exclude='**/node_modules' \
  --exclude='**/dist' \
  --exclude='**/build' \
  --exclude='**/.vite' \
  -C "$WORKSPACE" .

# Keep last 14 snapshots
ls -1t "$DEST_DIR"/milo_workspace_*.tgz 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "Wrote $OUT_TGZ"