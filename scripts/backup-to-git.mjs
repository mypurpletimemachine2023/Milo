#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WORKSPACE = '/home/lejandro/.openclaw/workspace';
const OPENCLAW_CONFIG = '/home/lejandro/.openclaw/openclaw.json';
const BACKUP_DIR = path.join(WORKSPACE, 'backups');

function sh(cmd) {
  return execSync(cmd, { cwd: WORKSPACE, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function redactConfig(obj) {
  // Redact common secret-bearing fields.
  const clone = JSON.parse(JSON.stringify(obj));

  const redact = (o, key) => {
    if (o && typeof o === 'object' && key in o && typeof o[key] === 'string') {
      const v = o[key];
      o[key] = v.length <= 8 ? '[REDACTED]' : `${v.slice(0, 4)}…${v.slice(-4)} (REDACTED)`;
    }
  };

  // Known locations in OpenClaw config
  if (clone.gateway?.auth) redact(clone.gateway.auth, 'token');
  if (clone.channels?.telegram) redact(clone.channels.telegram, 'botToken');
  if (clone.skills?.entries) {
    for (const k of Object.keys(clone.skills.entries)) {
      redact(clone.skills.entries[k], 'apiKey');
      redact(clone.skills.entries[k], 'token');
    }
  }

  // Also nuke any top-level apiKey/token fields we might have missed
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    redact(o, 'apiKey');
    redact(o, 'token');
    redact(o, 'secret');
    for (const v of Object.values(o)) walk(v);
  };
  walk(clone);

  return clone;
}

function backupOpenClawConfig() {
  try {
    const raw = fs.readFileSync(OPENCLAW_CONFIG, 'utf8');
    const parsed = JSON.parse(raw);
    const redacted = redactConfig(parsed);

    ensureDir(BACKUP_DIR);
    const outPath = path.join(BACKUP_DIR, 'openclaw.redacted.json');
    fs.writeFileSync(outPath, JSON.stringify(redacted, null, 2) + '\n');
  } catch (e) {
    // If config doesn't exist or isn't readable, don't fail the whole backup.
  }
}

function main() {
  backupOpenClawConfig();

  sh('git add -A');

  const status = sh('git status --porcelain');
  if (!status) return;

  const ts = new Date().toISOString().replace('T', ' ').replace(/\..+/, 'Z');
  try {
    sh(`git commit -m "auto-backup: ${ts}"`);
  } catch {
    // no-op if commit fails
  }
}

main();
