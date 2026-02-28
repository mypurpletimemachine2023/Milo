'use client'

import type { KanbanTask } from './types'

function assigneeDot(assignee: KanbanTask['assignee']) {
  switch (assignee) {
    case 'Alejandro':
      return 'bg-red-500/90'
    case 'Milo':
      return 'bg-emerald-400/90'
    default:
      return 'bg-white/30'
  }
}

function priorityPill(priority?: KanbanTask['priority']) {
  switch (priority) {
    case 'High':
      return 'border-red-400/20 bg-red-500/10 text-red-200'
    case 'Medium':
      return 'border-amber-400/20 bg-amber-500/10 text-amber-100'
    case 'Low':
      return 'border-sky-400/20 bg-sky-500/10 text-sky-100'
    default:
      return 'border-white/10 bg-white/5 text-white/70'
  }
}

export function TaskCard({ task, onOpen }: { task: KanbanTask; onOpen?: (task: KanbanTask) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(task)}
      className={
        'group w-full rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.04] p-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_30px_rgba(0,0,0,0.35)] ' +
        'transition hover:border-white/20 hover:from-white/[0.10] hover:to-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white">{task.title}</div>
          {task.summary ? (
            <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">{task.summary}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={'h-2.5 w-2.5 rounded-full ' + assigneeDot(task.assignee)} aria-hidden />
          <span className="text-[11px] text-white/50">{task.assignee}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={'rounded-full border px-2 py-0.5 text-[11px] ' + priorityPill(task.priority)}>
          {task.priority ?? '—'}
        </span>
        {task.due ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
            Due {task.due}
          </span>
        ) : null}
        {task.tags?.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/65"
          >
            {t}
          </span>
        ))}
        {task.tags && task.tags.length > 2 ? (
          <span className="text-[11px] text-white/40">+{task.tags.length - 2}</span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
        <span className="truncate">#{task.id}</span>
        <span className="opacity-0 transition group-hover:opacity-100">Open →</span>
      </div>
    </button>
  )
}
