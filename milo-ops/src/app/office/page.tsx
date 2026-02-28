'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { DEFAULT_ROSTER } from '../../lib/roster'
import type { AgentId, AgentProfile, AgentStatus } from '../../lib/roster'

type Pt = { x: number; y: number }

type RoomId = 'Library' | 'Break Room' | 'Lunch Room' | 'Locksmith Office'

type RoomDef = {
  id: RoomId
  label: string
  rect: { x: number; y: number; w: number; h: number }
}

const WORLD = { w: 1000, h: 600 }

// These rectangles are informational (for hover/selection outlines) and match the pixel-art floor asset.
const ROOMS: RoomDef[] = [
  { id: 'Library', label: 'Library', rect: { x: 34, y: 58, w: 380, h: 240 } },
  { id: 'Break Room', label: 'Break Room', rect: { x: 34, y: 318, w: 380, h: 242 } },
  { id: 'Locksmith Office', label: 'Locksmith Office', rect: { x: 586, y: 58, w: 380, h: 240 } },
  { id: 'Lunch Room', label: 'Lunch Room', rect: { x: 586, y: 318, w: 380, h: 242 } },
]

// Anchor points (agent standing positions) aligned to the pixel-art props.
const PTS = {
  // Idle cluster (break room couch area)
  breakRoom: { x: 160, y: 458 } satisfies Pt,

  // Jackie (scraper-agent)
  libraryDesk: { x: 358, y: 236 } satisfies Pt,
  lunchRoomTable: { x: 780, y: 480 } satisfies Pt,

  // Locksmith office desks (generic)
  desk1: { x: 690, y: 194 } satisfies Pt,
  desk2: { x: 830, y: 194 } satisfies Pt,
  desk3: { x: 760, y: 264 } satisfies Pt,

  // TVs (website agent works here)
  tv1: { x: 665, y: 136 } satisfies Pt,
  tv2: { x: 800, y: 136 } satisfies Pt,
  tv3: { x: 915, y: 136 } satisfies Pt,
}

function statusFill(s: AgentStatus) {
  if (s === 'Working') return '#34d399' // emerald-400
  if (s === 'Blocked') return '#fb7185' // rose-400
  return 'rgba(255,255,255,0.55)'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function hashIndex(s: string, mod: number) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % mod
}

export default function OfficePage() {
  const agents = useQuery(api.agentRuns.listAgentDerivedState)
  const seedDefault = useMutation(api.agents.seedDefault)

  // For Jackie debrief bubble + lunch-room move after finishing.
  const jackieLastFinished = useQuery(api.agentRuns.getLatestFinishedRun, { agentId: 'scraper-agent' })

  // Seed once (keeps /office usable as a standalone entrypoint).
  useEffect(() => {
    if (agents && agents.length === 0) {
      seedDefault({
        roster: DEFAULT_ROSTER.map((a) => ({
          agentId: a.id,
          name: a.name,
          group: a.group,
          role: a.role,
          spriteKey: a.sprite.key,
        })),
      }).catch(() => {})
    }
  }, [agents, seedDefault])

  const roster = useMemo(() => DEFAULT_ROSTER, [])
  const byId = useMemo(() => new Map((agents ?? []).map((a) => [a.agentId as AgentId, a])), [agents])

  const [selected, setSelected] = useState<AgentId>('milo')
  const selectedProfile = roster.find((a) => a.id === selected)
  const selectedState: any = byId.get(selected)

  const jackieShowDebrief = useMemo(() => {
    const r: any = jackieLastFinished
    const finishedAt = (r?.finishedAt ?? 0) as number
    if (!finishedAt) return false

    // Show for ~30 minutes after finishing.
    return Date.now() - finishedAt < 30 * 60 * 1000
  }, [jackieLastFinished])

  const placements = useMemo(() => {
    const posById = new Map<AgentId, { pt: Pt; status: AgentStatus; bubble?: string }>()

    // Deterministic desk assignment for non-special agents.
    const deskCycle: Pt[] = [PTS.desk1, PTS.desk2, PTS.desk3]

    const ordered = roster.slice().sort((a, b) => a.name.localeCompare(b.name))

    ordered.forEach((p, i) => {
      const st: any = byId.get(p.id)
      const status = (st?.status ?? 'Idle') as AgentStatus

      // Default: Idle hangs out in the Break Room.
      let pt: Pt = PTS.breakRoom
      let bubble: string | undefined

      if (p.id === 'scraper-agent') {
        if (status === 'Working') {
          pt = PTS.libraryDesk
        } else if (jackieShowDebrief) {
          pt = PTS.lunchRoomTable
          const note = (jackieLastFinished as any)?.note as string | undefined
          bubble = note ?? 'Debrief ready.'
        } else {
          pt = PTS.breakRoom
        }
      } else if (status === 'Working' && p.id === 'website-agent') {
        const tvs = [PTS.tv1, PTS.tv2, PTS.tv3]
        pt = tvs[hashIndex(p.id, tvs.length)]
      } else if (status === 'Working') {
        pt = deskCycle[i % deskCycle.length]
      }

      posById.set(p.id, { pt, status, bubble })
    })

    return posById
  }, [roster, byId, jackieShowDebrief, jackieLastFinished])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-black">Office</h1>
      <p className="mt-2 text-sm text-white/65">Pixel-art office map, driven by Convex realtime agent state.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1020] to-[#060610] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">Floor</div>
            <div className="text-[11px] text-white/50">
              <span className="text-white/70">Working</span> at desk / TV • <span className="text-white/70">Idle</span> in Break Room •{' '}
              <span className="text-white/70">Blocked</span> shows icon
            </div>
          </div>

          <div className="relative">
            <svg
              viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
              className="h-auto w-full select-none"
              role="img"
              aria-label="Office floor map"
              preserveAspectRatio="xMidYMid meet"
              style={{ imageRendering: 'pixelated' }}
            >
              {/* Pixel-art floor */}
              <image href="/office/floor-v2.svg" x={0} y={0} width={WORLD.w} height={WORLD.h} />

              {/* Clickable arcade hotspot → Purple Time Machine project */}
              <a href="/projects?p=purple-time-machine" aria-label="Open Purple Time Machine project">
                <rect x={905} y={420} width={120} height={60} fill="transparent" />
              </a>

              {/* Room hover outlines (subtle; keeps the map legible) */}
              {ROOMS.map((r) => (
                <rect
                  key={r.id}
                  x={r.rect.x}
                  y={r.rect.y}
                  width={r.rect.w}
                  height={r.rect.h}
                  rx={18}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.06)"
                />
              ))}

              {/* Agents */}
              {roster.map((p) => {
                const placement = placements.get(p.id)
                const st: any = byId.get(p.id)
                const status = (placement?.status ?? (st?.status ?? 'Idle')) as AgentStatus
                const pt = placement?.pt ?? PTS.breakRoom
                const bubble = placement?.bubble
                const isSelected = p.id === selected

                return (
                  <g
                    key={p.id}
                    transform={`translate(${pt.x},${pt.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(p.id)}
                  >
                    {/* selection ring */}
                    {isSelected ? (
                      <circle cx={0} cy={0} r={22} fill="rgba(248,113,113,0.12)" stroke="rgba(248,113,113,0.35)" />
                    ) : null}

                    {/* Sprite */}
                    <image
                      href={status === 'Working' ? '/office/monkey_typing.svg' : '/office/monkey_idle.svg'}
                      x={-16}
                      y={-16}
                      width={32}
                      height={32}
                    />

                    {/* Status dot (tiny) */}
                    <circle cx={14} cy={-14} r={5} fill={statusFill(status)} opacity={0.95} stroke="rgba(0,0,0,0.45)" />

                    {/* Blocked icon */}
                    {status === 'Blocked' ? (
                      <g transform="translate(12,-14)">
                        <circle cx={0} cy={0} r={9} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.20)" />
                        <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={900} fill="#fb7185">
                          !
                        </text>
                      </g>
                    ) : null}

                    {/* Debrief bubble (Jackie) */}
                    {bubble ? (
                      <g transform="translate(18,-48)">
                        <image href="/office/chat-bubble.svg" x={-10} y={-10} width={34} height={34} />
                        <title>{bubble}</title>
                      </g>
                    ) : null}

                    {/* Name tag */}
                    <g transform="translate(0,26)">
                      <rect
                        x={-44}
                        y={-12}
                        width={88}
                        height={18}
                        rx={9}
                        fill="rgba(0,0,0,0.40)"
                        stroke={isSelected ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.10)'}
                      />
                      <text x={0} y={1} textAnchor="middle" fontSize={10} fontWeight={800} fill="rgba(255,255,255,0.85)">
                        {p.name}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ROOMS.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-extrabold text-white/70">{r.label}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roster
                    .filter((p) => {
                      const placement = placements.get(p.id)
                      const pt = placement?.pt
                      if (!pt) return false
                      return (
                        pt.x >= r.rect.x &&
                        pt.x <= r.rect.x + r.rect.w &&
                        pt.y >= r.rect.y &&
                        pt.y <= r.rect.y + r.rect.h
                      )
                    })
                    .map((p) => {
                      const placement = placements.get(p.id)
                      const status = (placement?.status ?? 'Idle') as AgentStatus
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p.id)}
                          className={
                            selected === p.id
                              ? 'rounded-full border border-red-400/40 bg-white/10 px-2 py-1 text-[11px] font-semibold'
                              : 'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold hover:border-white/20'
                          }
                        >
                          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: statusFill(status) }} />
                          {p.name}
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-extrabold">Agent</div>
          <div className="mt-2 text-lg font-black">{selectedProfile?.name ?? selected}</div>
          <div className="text-xs text-white/60">
            {selectedProfile?.group} • {selectedProfile?.role}
          </div>

          <div className="mt-4 grid gap-2 text-sm text-white/75">
            <div>
              <span className="text-white/50">Status:</span> {selectedState?.status ?? 'Idle'}
            </div>
            <div>
              <span className="text-white/50">Current:</span> {selectedState?.currentTaskTitle ?? '—'}
            </div>
            <div>
              <span className="text-white/50">Needs:</span> {selectedState?.needsFromAlejandro ?? '—'}
            </div>
            <div>
              <span className="text-white/50">Active runs:</span> {(selectedState?.activeRuns?.length ?? 0) as number}
            </div>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Tip: change status from <span className="text-white/70">/team</span> (or when active runs start/stop).
          </div>
        </aside>
      </div>
    </main>
  )
}
