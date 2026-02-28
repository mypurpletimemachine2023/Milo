'use client'

import { useMemo, useState } from 'react'
import type { KanbanColumn, KanbanTask, KanbanStatus } from './types'
import { TaskCard } from './TaskCard'
import { TaskDrawer } from './TaskDrawer'

const statusOrder: KanbanStatus[] = ['Backlog', 'Next', 'In Progress', 'Blocked', 'Done']

export function KanbanBoard({
  columns,
  tasks,
}: {
  columns: KanbanColumn[]
  tasks: KanbanTask[]
}) {
  const [active, setActive] = useState<KanbanTask | null>(null)

  const byStatus = useMemo(() => {
    const map = new Map<KanbanStatus, KanbanTask[]>()
    for (const s of statusOrder) map.set(s, [])
    for (const t of tasks) {
      const list = map.get(t.status)
      if (list) list.push(t)
    }
    return map
  }, [tasks])

  return (
    <>
      <div
        className={
          'relative mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-3 sm:p-4 ' +
          'shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_50px_120px_rgba(0,0,0,0.55)]'
        }
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(229,9,20,0.14),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative flex items-center justify-between gap-3 px-2 pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Mission Control</div>
            <h2 className="mt-1 text-lg font-black tracking-tight">Tasks</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-white/45">Scroll horizontally →</span>
          </div>
        </div>

        <div
          className={
            'relative flex gap-3 overflow-x-auto px-1 pb-2 ' +
            'snap-x snap-mandatory [-webkit-overflow-scrolling:touch]'
          }
        >
          {columns.map((col) => {
            const list = byStatus.get(col.title) ?? []
            return (
              <section
                key={col.id}
                className={
                  'snap-start shrink-0 w-[84vw] max-w-[360px] sm:w-[340px] ' +
                  'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] ' +
                  'shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_40px_rgba(0,0,0,0.45)]'
                }
              >
                <div className="sticky top-0 z-10 rounded-t-2xl border-b border-white/10 bg-black/25 backdrop-blur">
                  <div className="flex items-start justify-between gap-2 px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold tracking-tight">{col.title}</div>
                      {col.hint ? (
                        <div className="mt-0.5 truncate text-xs text-white/45">{col.hint}</div>
                      ) : null}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                      {list.length}
                    </div>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-auto p-3 sm:max-h-[66vh]">
                  <div className="flex flex-col gap-2">
                    {list.length ? (
                      list.map((t) => <TaskCard key={t.id} task={t} onOpen={setActive} />)
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/55">
                        Empty.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <TaskDrawer open={!!active} task={active} onClose={() => setActive(null)} />
    </>
  )
}
