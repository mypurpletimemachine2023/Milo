'use client'

import { useEffect } from 'react'
import type { KanbanTask } from './types'

export function TaskDrawer({
  open,
  task,
  onClose,
}: {
  open: boolean
  task: KanbanTask | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // Light scroll lock.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className={
          'absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-white/10 ' +
          'bg-gradient-to-b from-[#0b0d14] via-[#070812] to-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_30px_80px_rgba(0,0,0,0.65)]'
        }
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur">
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-white/45">Task</div>
                <div className="mt-1 truncate text-base font-semibold tracking-tight text-white">
                  {task?.title ?? '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/20 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Status</div>
                  <div className="mt-1 font-medium text-white/85">{task?.status ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Assignee</div>
                  <div className="mt-1 font-medium text-white/85">{task?.assignee ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Priority</div>
                  <div className="mt-1 font-medium text-white/85">{task?.priority ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Due</div>
                  <div className="mt-1 font-medium text-white/85">{task?.due ?? '—'}</div>
                </div>
              </div>

              {task?.summary ? (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Summary</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{task.summary}</p>
                </div>
              ) : null}

              {task?.tags?.length ? (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-white/45">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {task.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/65"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/45">Activity</div>
              <div className="mt-2 text-sm text-white/60">
                Activity log coming next (Convex realtime). For now, this drawer is a styling scaffold.
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/20 px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/45">Tip: press Esc to close.</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:border-white/20 hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:border-red-500/35 hover:bg-red-500/15"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
