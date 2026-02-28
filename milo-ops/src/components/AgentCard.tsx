import type { AgentProfile, AgentStatus } from '../lib/roster'

export function statusPill(status: AgentStatus) {
  const cls =
    status === 'Working'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20'
      : status === 'Blocked'
        ? 'bg-red-500/15 text-red-200 border-red-400/20'
        : 'bg-white/10 text-white/80 border-white/15'
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>
}

export function AgentCard({
  agent,
  status,
  currentTaskTitle,
  needsFromAlejandro,
  updatedAt,
}: {
  agent: AgentProfile
  status: AgentStatus
  currentTaskTitle?: string
  needsFromAlejandro?: string
  updatedAt: number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">{agent.name}</div>
          <div className="text-xs text-white/60">
            {agent.group} • {agent.role}
          </div>
        </div>
        {statusPill(status)}
      </div>

      <div className="mt-3 grid gap-2 text-sm">
        <div className="text-white/70">
          <span className="text-white/50">Current:</span> {currentTaskTitle ?? '—'}
        </div>
        <div className="text-white/70">
          <span className="text-white/50">Needs:</span> {needsFromAlejandro ?? '—'}
        </div>
        <div className="text-xs text-white/45">Updated {new Date(updatedAt).toLocaleString()}</div>
      </div>
    </div>
  )
}
