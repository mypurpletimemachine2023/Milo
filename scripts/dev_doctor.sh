#!/usr/bin/env bash
set -euo pipefail

# dev_doctor.sh
# Quick health checks.

fail=0

check() {
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "OK   $name"
  else
    echo "FAIL $name"
    fail=1
  fi
}

check "git" git --version
check "node" node --version
check "npm" npm --version

if [ -d milo-ops ]; then
  check "milo-ops package.json" test -f milo-ops/package.json
fi

echo ""
if [ $fail -ne 0 ]; then
  echo "Doctor found issues." >&2
  exit 1
fi

echo "Doctor: all good."
