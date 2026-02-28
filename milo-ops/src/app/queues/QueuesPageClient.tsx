'use client'

import * as React from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { AgentId } from '../../lib/roster'

type QueueConfig = {
  id: 'kdp-coloring-book' | 'five-dollar-ebook' | 'purple-time-machine-alpha'
  title: string
  oneLiner: string
  tag: string
  ownerLabel: string
  defaultAgentId: AgentId
}

type QueueTask = {
  _id: string
  title: string
  status?: string
  priority?: string
  assignee?: string
  updatedAt?: number
  archived?: boolean
}

const QUEUES: QueueConfig[] = [
  {
    id: 'kdp-coloring-book',
    title: 'KDP Coloring Book',
    oneLiner: 'Ship a new coloring book SKU with fast iterations.',
    tag: 'queue:kdp-coloring-book',
    ownerLabel: 'Milo',
    defaultAgentId: 'milo',
  },
  {
    id: 'five-dollar-ebook',
    title: '$5 Ebook',
    oneLiner: 'Rapid ebook production + launch loop.',
    tag: 'queue:$5-ebook',
    ownerLabel: 'Kayla',
    defaultAgentId: 'ebook-agent',
  },
  {
    id: 'purple-time-machine-alpha',
    title: 'Purple Time Machine (alpha)',
    oneLiner: 'Get the alpha live + collecting early signals.',
    tag: 'queue:purple-time-machine-alpha',
    ownerLabel: 'Sara (Builder)',
    defaultAgentId: 'builder',
  },
]

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function AssigneePill({ assignee }: { assignee?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/70">
      {assignee?.trim() ? assignee : 'Unassigned'}
    </span>
  )
}

function TaskRow({ t }: { t: QueueTask }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{t.title}</div>
        <div className="mt-0.5 text-[11px] text-white/45">{t.status ? t.status : '—'}</div>
      </div>
      <AssigneePill assignee={t.assignee} />
    </div>
  )
}

function QueueCard({ q }: { q: QueueConfig }) {
  // String reference so UI can ship even if api codegen isn't updated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (useQuery('tasks:listByTag' as any, { tag: q.tag, limit: 5 }) as unknown as QueueTask[] | undefined) ??
    undefined

  const startRun = useMutation(api.agentRuns.startRun)
  const [starting, setStarting] = React.useState(false)

  return (
    <section
      className={cx(
        'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-4',
        'shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_40px_rgba(0,0,0,0.45)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">Queue</div>
          <h2 className="mt-1 truncate text-lg font-black tracking-tight">{q.title}</h2>
          <p className="mt-1 text-sm text-white/65">{q.oneLiner}</p>
          <div className="mt-2 text-xs text-white/55">
            <span className="text-white/40">Owner:</span> {q.ownerLabel}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] text-white/40">Default agent</div>
          <div className="mt-0.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold">
            {q.defaultAgentId}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">Next 5 tasks</div>
          <div className="text-[11px] text-white/45">tag: {q.tag}</div>
        </div>

        {!tasks ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 text-sm text-white/65">
            No tasks found. Add tasks with tag <code className="rounded bg-white/10 px-1">{q.tag}</code>.
          </div>
        ) : (
          <div className="grid gap-2">
            {tasks.slice(0, 5).map((t) => (
              <TaskRow key={t._id} t={t} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={cx(
            'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold',
            'hover:border-white/20 hover:bg-white/10',
          )}
          onClick={() => {
            // Wiring to OpenClaw spawn is intentionally deferred for MVP.
            window.alert('Spawn agent: callout only (wire to OpenClaw spawn later).')
          }}
        >
          + Spawn agent
        </button>

        <button
          type="button"
          disabled={starting}
          className={cx(
            'rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold',
            'hover:border-emerald-400/60',
            starting && 'opacity-60',
          )}
          onClick={() => {
            setStarting(true)
            startRun({
              agentId: q.defaultAgentId,
              title: `${q.title} — Autopilot`,
              note: `Queue tag: ${q.tag}`,
              kind: 'subagent',
            })
              .catch(() => {})
              .finally(() => setStarting(false))
          }}
        >
          ▶ Start run
        </button>

        <Link
          href="/tasks"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold hover:border-white/20"
        >
          Open Kanban →
        </Link>
      </div>

      <div className="mt-3 text-[11px] text-white/40">
        MVP note: queues are tag-driven. Add tasks with the queue tag to populate this list.
      </div>
    </section>
  )
}

export function QueuesPageClient() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">Autopilot Queues</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Top 3 revenue targets</h1>
          <p className="mt-1 text-sm text-white/65">
            Simple queue view: next tasks + who owns it. Use “Start run” to create an agentRun.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/team"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-white/20 hover:bg-white/10"
          >
            Team
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-white/20 hover:bg-white/10"
          >
            Projects
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {QUEUES.map((q) => (
          <QueueCard key={q.id} q={q} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <div className="font-semibold">How to populate</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/65">
          <li>
            Create tasks in Convex with a tag matching the queue tag (e.g.{' '}
            <code className="rounded bg-white/10 px-1">queue:kdp-coloring-book</code>).
          </li>
          <li>Queues pull the next 5 non-archived, non-Done tasks by most recently updated.</li>
        </ul>
      </div>
    </main>
  )
}
