#!/usr/bin/env bash
set -euo pipefail

# release.sh
# Basic release/smoke runner for subprojects.

project="${1:-}"

if [ -z "$project" ]; then
  echo "Usage: scripts/release.sh <project>" >&2
  echo "Projects: milo-ops" >&2
  exit 1
fi

case "$project" in
  milo-ops)
    (cd milo-ops && npm ci && npm run lint && npm run build)
    ;;
  *)
    echo "Unknown project: $project" >&2
    exit 1
    ;;
esac

echo "Release OK: $project"
