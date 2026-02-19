#!/usr/bin/env node

/**
 * Milo Ops Autopilot Dispatcher (local Convex)
 *
 * Goal: keep agents visible + always working by ensuring each revenue queue
 * has at least N tasks, and by starting agentRuns for idle agents.
 *
 * Safe: no secrets; reads NEXT_PUBLIC_CONVEX_URL from milo-ops/.env.local.
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

const ROOT = path.resolve(__dirname, '..')
const ENV = readEnvLocal(path.join(ROOT, '.env.local'))
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ENV.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  console.log(
    'SKIP: autopilot dispatcher missing NEXT_PUBLIC_CONVEX_URL (set env or milo-ops/.env.local). ' +
      'No dispatch performed.'
  )
  process.exit(0)
}

const client = new ConvexHttpClient(convexUrl)

const QUEUES = [
  {
    tag: 'queue:kdp-coloring-book',
    title: 'KDP Coloring Book',
    defaultAssignee: 'builder',
    seedTasks: [
      'Define book spec (size, page count, style rules)',
      'Generate 50 line-art pages (Victorian Botanical Apothecary)',
      'Assemble interior PDF + page ordering',
      'Design cover concept + export print-ready cover',
      'Write listing copy + keywords + categories',
    ],
  },
  {
    tag: 'queue:$5-ebook',
    title: '$5 Ebook Line',
    defaultAssignee: 'ebook-agent',
    seedTasks: [
      'Pick ebook #1 from product list + finalize title/promise',
      'Write outline (6 chapters) + CTA ladder ($49/$199/$499)',
      'Draft chapters 1–2',
      'Draft chapters 3–4',
      'Draft chapters 5–6 + front/back matter',
      'Edit pass + formatting for KDP',
    ],
  },
  {
    tag: 'queue:purple-time-machine-alpha',
    title: 'Purple Time Machine Alpha',
    defaultAssignee: 'milo',
    seedTasks: [
      'Seed alpha launch scripts into Content Pipeline',
      'Ship 10 new microgame defs + verify hourly generator',
      'Generate cover placeholders + pick 5 for real art',
      'Office arcade playtest loop: start agentRuns when testing',
    ],
  },
]

const AGENT_HOME = {
  milo: 'GAMES',
  builder: 'DEV',
  integrator: 'DEV',
  scriptwriter: 'GAMES',
  editor: 'EBOOKS',
  'cover-artist': 'DESIGN',
  'ui-designer': 'DESIGN',
  'qa-tester': 'QA',
  'ebook-agent': 'EBOOKS',
  'website-agent': 'WEBSITES',
  'scraper-agent': 'LIBRARY',
  'ops-automator': 'DEV',
  researcher: 'LIBRARY',
  'kdp-producer': 'EBOOKS',
}

async function ensureSeedTasks() {
  for (const q of QUEUES) {
    const existing = await client.query('tasks:listByTag', { tag: q.tag, limit: 50 })
    if ((existing?.length ?? 0) >= 3) continue

    // Create seed tasks.
    for (const t of q.seedTasks) {
      await client.mutation('tasks:create', {
        title: `[${q.title}] ${t}`,
        status: 'Next',
        priority: 'Med',
        assignee: q.defaultAssignee === 'milo' ? 'Milo' : q.defaultAssignee,
        tags: [q.tag],
        author: 'autopilot',
      })
    }
  }
}

async function startRunsForIdleAgents() {
  const derived = await client.query('agentRuns:listAgentDerivedState', {})
  const activeRuns = await client.query('agentRuns:listActiveRuns', {})
  const activeByAgent = new Map()
  for (const r of activeRuns ?? []) activeByAgent.set(r.agentId, r)

  for (const a of derived ?? []) {
    const agentId = a.agentId
    if (!agentId) continue
    if (agentId === 'main') continue

    // If already running, skip.
    if (activeByAgent.has(agentId)) continue

    // If blocked, skip (blocked should be sticky).
    if (a.status === 'Blocked') continue

    // Only start a run if idle.
    if (a.status !== 'Idle') continue

    // Pick a queue based on agent type.
    let qtag = 'queue:purple-time-machine-alpha'
    if (agentId === 'ebook-agent' || agentId === 'editor') qtag = 'queue:$5-ebook'
    if (agentId === 'website-agent') qtag = 'queue:purple-time-machine-alpha'
    if (agentId === 'scraper-agent') qtag = 'queue:purple-time-machine-alpha'

    const tasks = await client.query('tasks:listByTag', { tag: qtag, limit: 5 })
    const task = (tasks ?? [])[0]

    const title = task ? `Working: ${task.title}` : 'Working: autopilot'

    await client.mutation('agentRuns:startRun', {
      agentId,
      title,
      note: task ? `Auto-picked from ${qtag}` : `Auto-started (no tasks found for ${qtag})`,
      kind: 'manual',
      taskId: task?._id,
    })
  }
}

async function main() {
  // Keep truth clean before we derive state / start new work.
  // Default: treat runs as stale if they haven't updated in 60 minutes.
  await client.mutation('agentRuns:cleanupStaleRuns', { staleMs: 60 * 60 * 1000, useUpdatedAt: true })

  await ensureSeedTasks()
  await startRunsForIdleAgents()
  console.log('OK: autopilot dispatch complete')
}

function isLikelyConnectivityError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('fetch failed')) return true
  if (msg.includes('ECONNREFUSED')) return true
  if (msg.includes('ENOTFOUND')) return true
  if (msg.includes('EAI_AGAIN')) return true
  return false
}

main().catch((e) => {
  // Cron should not spam errors when local dev services are intentionally stopped.
  // Treat network/endpoint issues as a clean skip.
  if (isLikelyConnectivityError(e)) {
    console.log(`SKIP: autopilot dispatcher could not reach Convex at ${convexUrl} (${e?.message || e}).`)
    process.exit(0)
  }

  console.error(e?.stack || String(e))
  process.exit(1)
})
