#!/usr/bin/env bash
set -euo pipefail

# Milo Gateway Watchdog
# ----------------------
# Checks whether the OpenClaw gateway is responding.
# If it's down/unhealthy, it restarts the gateway and sends you a Telegram notice
# via the OpenClaw CLI. Intended to be run by cron every few minutes.

# === CONFIG ===
# Telegram target for notifications. Use your Telegram user id or @username
# that is wired in your OpenClaw config.
TELEGRAM_TARGET="7060446302"  # TODO: change if you prefer @handle instead of id

# Channel to use for notifications (must match your configured channel).
TELEGRAM_CHANNEL="telegram"

# How many seconds to wait for the health check before we call it dead.
HEALTH_TIMEOUT=10

cd /home/lejandro/.openclaw/workspace

log() {
  printf "[%s] %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$1" >> logs/gateway-watchdog.log
}

mkdir -p logs

# 1) Health check
if openclaw health --timeout "$HEALTH_TIMEOUT" > /dev/null 2>&1; then
  # Gateway responded OK
  exit 0
fi

log "Gateway health check FAILED. Attempting restart."

# 2) Restart gateway
if ! openclaw gateway restart > /dev/null 2>&1; then
  log "Gateway restart command FAILED."
  exit 1
fi

# Give it a couple seconds to come up
sleep 3

# 3) Re-check health after restart
if openclaw health --timeout "$HEALTH_TIMEOUT" > /dev/null 2>&1; then
  log "Gateway restarted successfully after failure."

  # 4) Send Telegram notification *via gateway* now that it's back
  # If this fails, we just log it and move on so cron doesn't spam errors.
  MSG="[Milo Watchdog] Gateway was down. I auto-ran 'openclaw gateway restart' and health is OK now."
  openclaw message send \
    --channel "$TELEGRAM_CHANNEL" \
    --target "$TELEGRAM_TARGET" \
    --message "$MSG" \
    > /dev/null 2>&1 || log "Failed to send Telegram notification after restart."
else
  log "Gateway still unhealthy after restart attempt. No notification sent."
fi
