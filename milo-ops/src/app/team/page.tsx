'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AgentCard } from '../../components/AgentCard'
import { DEFAULT_ROSTER } from '../../lib/roster'
import type { AgentId, AgentRoleGroup, AgentStatus } from '../../lib/roster'

type DerivedRun = {
  _id: string
  agentId: string
  kind?: string
  title: string
  note?: string
  blockedReason?: string
  startedAt?: number
  updatedAt?: number
  finishedAt?: number
}

type DerivedAgentState = {
  agentId: string
  status?: AgentStatus
  currentTaskTitle?: string
  needsFromAlejandro?: string
  updatedAt?: number
}

const groups: AgentRoleGroup[] = ['GAMES', 'DEV', 'DESIGN', 'QA', 'EBOOKS', 'WEBSITES']

export default function TeamPage() {
  const agents = useQuery(api.agentRuns.listAgentDerivedState) as DerivedAgentState[] | undefined
  const activeRuns = useQuery(api.agentRuns.listActiveRuns, {}) as DerivedRun[] | undefined
  const seedDefault = useMutation(api.agents.seedDefault)
  const upsertRoster = useMutation(api.agents.upsertRoster)
  const setState = useMutation(api.agents.setState)
  const startRun = useMutation(api.agentRuns.startRun)
  const finishRun = useMutation(api.agentRuns.finishRun)

  // Seed once, then keep Convex agents synced with roster (idempotent).
  useEffect(() => {
    const roster = DEFAULT_ROSTER.map((a) => ({
      agentId: a.id,
      name: a.name,
      group: a.group,
      role: a.role,
      spriteKey: a.sprite.key,
    }))

    if (agents && agents.length === 0) {
      seedDefault({ roster }).catch(() => {})
      return
    }

    if (agents) {
      upsertRoster({ roster }).catch(() => {})
    }
  }, [agents, seedDefault, upsertRoster])

  const roster = useMemo(() => DEFAULT_ROSTER, [])

  const byId = useMemo(() => {
    const m = new Map<AgentId, DerivedAgentState>()
    for (const a of agents ?? []) m.set(a.agentId as AgentId, a)
    return m
  }, [agents])

  const [selected, setSelected] = useState<AgentId>('milo')
  const selectedState = byId.get(selected)

  const [runTitle, setRunTitle] = useState('')
  const [runNote, setRunNote] = useState('')
  const [blockedReason, setBlockedReason] = useState('')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-black">Team</h1>
      <p className="mt-2 text-sm text-white/65">Roster + realtime status (Convex).</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="grid gap-6">
          {groups.map((g) => (
            <section key={g} className="grid gap-3">
              <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">{g}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {roster
                  .filter((a) => a.group === g)
                  .map((a) => {
                    const s = byId.get(a.id)
                    return (
                      <button key={a.id} className="text-left" onClick={() => setSelected(a.id)}>
                        <AgentCard
                          agent={a}
                          status={(s?.status ?? 'Idle') as AgentStatus}
                          currentTaskTitle={s?.currentTaskTitle}
                          needsFromAlejandro={s?.needsFromAlejandro}
                          updatedAt={s?.updatedAt ?? Date.now()}
                        />
                      </button>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-extrabold">Quick Update</div>
          <div className="mt-2 text-xs text-white/60">Agent: {selected}</div>

          <div className="mt-4 grid gap-3">
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
              value={(selectedState?.status ?? 'Idle') as AgentStatus}
              onChange={(e) =>
                setState({
                  agentId: selected,
                  status: e.target.value as AgentStatus,
                })
              }
            >
              <option>Idle</option>
              <option>Working</option>
              <option>Blocked</option>
            </select>

            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
              placeholder="Current task title"
              defaultValue={selectedState?.currentTaskTitle ?? ''}
              onBlur={(e) => setState({ agentId: selected, currentTaskTitle: e.target.value })}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
              placeholder="Needs from Alejandro (blocker)"
              defaultValue={selectedState?.needsFromAlejandro ?? ''}
              onBlur={(e) => setState({ agentId: selected, needsFromAlejandro: e.target.value })}
            />
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-sm font-extrabold">Active Work</div>
            <div className="mt-1 text-xs text-white/60">Running subagents + manual sessions.</div>

            <div className="mt-3 grid gap-2">
              {(activeRuns ?? []).length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">No active runs.</div>
              ) : (
                <div className="grid gap-2">
                  {(activeRuns ?? []).map((r) => (
                    <div key={r._id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold">
                            {r.agentId} • {r.kind}
                          </div>
                          <div className="mt-1 truncate text-sm font-semibold">{r.title}</div>
                          {r.blockedReason ? (
                            <div className="mt-1 text-xs text-red-200/80">Blocked: {r.blockedReason}</div>
                          ) : (
                            <div className="mt-1 text-xs text-white/55">Working</div>
                          )}
                          {typeof r.startedAt === 'number' ? (
                            <div className="mt-1 text-[11px] text-white/45">Started: {new Date(r.startedAt).toLocaleString()}</div>
                          ) : null}
                          {r.note ? <div className="mt-1 text-[11px] text-white/45">{r.note}</div> : null}
                        </div>
                        <button
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:border-white/20"
                          onClick={() => finishRun({ runId: r._id as any, note: 'Manually stopped' })}
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-extrabold">Start manual run</div>
              <div className="mt-2 grid gap-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
                  placeholder="What are they working on?"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
                  placeholder="Optional note"
                  value={runNote}
                  onChange={(e) => setRunNote(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
                  placeholder="Blocked reason (optional)"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                />
                <button
                  className="mt-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold hover:border-emerald-400/60"
                  onClick={() => {
                    if (!runTitle.trim()) return
                    startRun({
                      agentId: selected,
                      title: runTitle.trim(),
                      note: runNote.trim() || undefined,
                      blockedReason: blockedReason.trim() || undefined,
                      kind: 'manual',
                    })
                      .then(() => {
                        setRunTitle('')
                        setRunNote('')
                        setBlockedReason('')
                      })
                      .catch(() => {})
                  }}
                >
                  Start for {selected}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Tip: active runs automatically drive agent status (Working/Blocked) and “why”.
          </div>
        </aside>
      </div>
    </main>
  )
}
