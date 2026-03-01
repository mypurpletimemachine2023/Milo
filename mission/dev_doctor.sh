#!/usr/bin/env bash
set -euo pipefail

# mission/dev_doctor.sh
# WSL Dev Doctor (ID 34)
# - fast, deterministic checks
# - prints actionable fixes

fail=0

ok()   { printf "OK   %s\n" "$1"; }
warn() { printf "WARN %s\n" "$1"; }
nope() { printf "FAIL %s\n" "$1"; fail=1; }

has() { command -v "$1" >/dev/null 2>&1; }

section() { printf "\n== %s ==\n" "$1"; }

section "Core"
if has git; then ok "git: $(git --version | head -n1)"; else nope "git missing (sudo apt-get install git)"; fi
if has node; then ok "node: $(node -v)"; else nope "node missing (install Node 20+; recommended nvm)"; fi
if has npm;  then ok "npm:  $(npm -v)";  else nope "npm missing (comes with node)"; fi

section "Python"
if has python3; then ok "python3: $(python3 --version)"; else warn "python3 missing (needed for automation tools)"; fi
if has pip3; then ok "pip3 present"; else warn "pip3 missing (sudo apt-get install python3-pip)"; fi

section "SSH / GitHub"
if has ssh; then ok "ssh present"; else nope "ssh missing (sudo apt-get install openssh-client)"; fi

if [ -f "$HOME/.ssh/id_ed25519" ]; then
  ok "SSH key exists: ~/.ssh/id_ed25519"
else
  warn "No SSH key found at ~/.ssh/id_ed25519 (run: ssh-keygen -t ed25519 -C \"you@host\")"
fi

if [ -f "$HOME/.ssh/known_hosts" ] && grep -q "github.com" "$HOME/.ssh/known_hosts"; then
  ok "known_hosts includes github.com"
else
  warn "known_hosts missing github.com (run: ssh-keyscan github.com >> ~/.ssh/known_hosts)"
fi

section "Repo"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "inside git repo"
else
  nope "not inside a git repo"
fi

if [ -n "$(git status --porcelain=v1 2>/dev/null || true)" ]; then
  warn "working tree is dirty (uncommitted changes)"
else
  ok "working tree clean"
fi

if git remote -v | grep -q origin; then
  ok "origin remote configured"
else
  warn "origin remote not configured"
fi

if [ -d milo-ops ]; then
  if [ -f milo-ops/package.json ]; then ok "milo-ops package.json present"; else warn "milo-ops missing package.json"; fi
fi

section "Optional"
if has docker; then ok "docker present"; else warn "docker not installed"; fi

echo ""
if [ $fail -ne 0 ]; then
  echo "Dev Doctor: issues found." >&2
  exit 1
fi

echo "Dev Doctor: all good."
