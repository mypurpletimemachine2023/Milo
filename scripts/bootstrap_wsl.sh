#!/usr/bin/env bash
set -euo pipefail

# bootstrap_wsl.sh
# Minimal bootstrap for this monorepo-style workspace.

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node 20+ (recommended: nvm)" >&2
  exit 1
fi

echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"

# Root deps (if present)
if [ -f package.json ]; then
  npm ci || npm install
fi

# Milo Ops deps
if [ -d milo-ops ] && [ -f milo-ops/package.json ]; then
  (cd milo-ops && npm ci)
fi

echo "Bootstrap complete."
