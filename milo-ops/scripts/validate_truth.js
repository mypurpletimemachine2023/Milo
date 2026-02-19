#!/usr/bin/env node
/**
 * Validate Milo Ops truth invariants:
 * - ≤1 Running agentRun per agent
 * - (optional) cleanupStaleRuns closes stale Running runs
 */

const fs = require('fs')
const path = require('path')
const { ConvexHttpClient } = require('convex/browser')

function readEnvLocal(envPath) {
  if (!fs.existsSync(envPath)) return {}
  const txt = fs.readFileSync(envPath, 'utf8')
  const out = {}
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    out[m[1]] = m[2]
  }
  return out
}

function die(msg) {
  console.error(msg)
  process.exit(1)
}

async function main() {
  const ROOT = path.resolve(__dirname, '..')
  const ENV = readEnvLocal(path.join(ROOT, '.env.local'))
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ENV.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) die('Missing NEXT_PUBLIC_CONVEX_URL (set env or milo-ops/.env.local)')

  const client = new ConvexHttpClient(convexUrl)

  const active = await client.query('agentRuns:listActiveRuns', {})
  const byAgent = new Map()
  for (const r of active || []) {
    const arr = byAgent.get(r.agentId) || []
    arr.push(r)
    byAgent.set(r.agentId, arr)
  }

  const offenders = []
  for (const [agentId, runs] of byAgent.entries()) {
    if ((runs?.length || 0) > 1) offenders.push({ agentId, count: runs.length, runs })
  }

  if (offenders.length > 0) {
    console.error('FAIL: multiple Running runs detected for agents:')
    for (const o of offenders) {
      console.error(`- ${o.agentId}: ${o.count}`)
      for (const r of o.runs.slice(0, 5)) {
        console.error(`  - ${r._id} startedAt=${r.startedAt} title=${r.title}`)
      }
    }
    process.exit(2)
  }

  console.log(`OK: invariant holds (≤1 Running run per agent). Active runs: ${(active || []).length}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e?.stack || String(e))
  process.exit(1)
})
