'use client'

import * as React from 'react'
import { useMutation, useQuery } from 'convex/react'

import type { Id } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'

type TaskStatus = 'Backlog' | 'Next' | 'In Progress' | 'Blocked' | 'Done'

type TaskPriority = 'Low' | 'Med' | 'High'

export type Task = {
  _id: Id<'tasks'>
  title: string
  description?: string
  assignee?: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  dueDate?: number // ms timestamp
  archived: boolean
  createdAt: number
  updatedAt: number
}

type TaskDraft = {
  title: string
  description?: string
  assignee?: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  dueDate?: string // yyyy-mm-dd (input value)
}

const STATUSES: TaskStatus[] = ['Backlog', 'Next', 'In Progress', 'Blocked', 'Done']
const PRIORITIES: TaskPriority[] = ['Low', 'Med', 'High']

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/70">
      {children}
    </span>
  )
}

function msToDateInput(ms?: number) {
  if (!ms) return ''
  return new Date(ms).toISOString().slice(0, 10)
}

function dateInputToMs(value?: string) {
  if (!value) return undefined
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : undefined
}

function formatDue(dueMs?: number) {
  if (!dueMs) return null
  return new Date(dueMs).toISOString().slice(0, 10)
}

function assigneeDot(assignee?: string) {
  if (!assignee) return 'bg-white/25'
  const a = assignee.toLowerCase()
  if (a.includes('ale')) return 'bg-red-500/90'
  if (a.includes('milo')) return 'bg-emerald-400/90'
  return 'bg-violet-400/90'
}

class SimpleErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function TaskCard({
  task,
  onClick,
  onMoveStatus,
}: {
  task: Task
  onClick: () => void
  onMoveStatus: (status: TaskStatus) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group w-full rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.04] p-3 text-left',
        'shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_30px_rgba(0,0,0,0.35)]',
        'transition hover:border-white/20 hover:from-white/[0.10] hover:to-white/[0.06]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white">{task.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/65">
            <span className={cx('h-2 w-2 rounded-full', assigneeDot(task.assignee))} aria-hidden />
            {task.assignee ? <span>{task.assignee}</span> : <span className="text-white/40">Unassigned</span>}
            <span className="text-white/30">•</span>
            <span
              className={cx(
                'font-medium',
                task.priority === 'High' && 'text-orange-200',
                task.priority === 'Med' && 'text-yellow-200',
                task.priority === 'Low' && 'text-emerald-200',
              )}
            >
              {task.priority}
            </span>
            {task.dueDate ? (
              <>
                <span className="text-white/30">•</span>
                <span className="text-white/55">Due {formatDue(task.dueDate)}</span>
              </>
            ) : null}
          </div>
        </div>

        <select
          className={cx(
            'rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/80',
            'opacity-0 transition group-hover:opacity-100 focus:opacity-100',
          )}
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            onMoveStatus(e.target.value as TaskStatus)
          }}
          aria-label="Move status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.slice(0, 6).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
        <span className="truncate">#{task._id}</span>
        <span className="opacity-0 transition group-hover:opacity-100">Open →</span>
      </div>
    </button>
  )
}

function Drawer({
  open,
  mode,
  task,
  onClose,
  onSave,
}: {
  open: boolean
  mode: 'edit' | 'create'
  task: Task | null
  onClose: () => void
  onSave: (next: TaskDraft) => void
}) {
  const [draft, setDraft] = React.useState<TaskDraft | null>(null)

  React.useEffect(() => {
    if (mode === 'edit') {
      if (!task) {
        setDraft(null)
        return
      }
      setDraft({
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        priority: task.priority,
        status: task.status,
        tags: task.tags,
        dueDate: msToDateInput(task.dueDate) || undefined,
      })
      return
    }

    // create
    setDraft({
      title: '',
      description: '',
      assignee: 'Milo',
      priority: 'Med',
      status: 'Backlog',
      tags: [],
      dueDate: undefined,
    })
  }, [mode, task])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !draft) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close task"
      />
      <div
        className={cx(
          'absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/10',
          'bg-gradient-to-b from-[#0b0d14] via-[#070812] to-black',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_30px_80px_rgba(0,0,0,0.65)]',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Task</div>
                <div className="mt-1 truncate text-lg font-black tracking-tight">{mode === 'edit' ? 'Edit' : 'New'}</div>
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
            <div className="space-y-4">
              <label className="block">
                <div className="text-xs font-semibold text-white/60">Title</div>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>

              <label className="block">
                <div className="text-xs font-semibold text-white/60">Description</div>
                <textarea
                  className="mt-1 min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <div className="text-xs font-semibold text-white/60">Assignee</div>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                    value={draft.assignee ?? ''}
                    placeholder="Alejandro / Milo"
                    onChange={(e) => setDraft({ ...draft, assignee: e.target.value || undefined })}
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-white/60">Priority</div>
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                    value={draft.priority}
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-white/60">Status</div>
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-white/60">Due date</div>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                    value={draft.dueDate ?? ''}
                    onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || undefined })}
                  />
                </label>
              </div>

              <label className="block">
                <div className="text-xs font-semibold text-white/60">Tags (comma separated)</div>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  value={draft.tags.join(', ')}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-white/90"
                  onClick={() => onSave(draft)}
                  disabled={!draft.title.trim()}
                >
                  {mode === 'edit' ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/20 px-5 py-4">
            <div className="text-xs text-white/45">Tip: press Esc to close.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({
  tasks,
  onPatch,
  onCreate,
  modeLabel,
}: {
  tasks: Task[]
  onPatch: (id: Id<'tasks'>, patch: Partial<Task>) => Promise<void> | void
  onCreate: (draft: TaskDraft) => Promise<void> | void
  modeLabel: string
}) {
  const [selectedId, setSelectedId] = React.useState<Id<'tasks'> | null>(null)
  const [creating, setCreating] = React.useState(false)
  const selected = tasks.find((t) => t._id === selectedId) ?? null

  const byStatus = React.useMemo(() => {
    const map = new Map<TaskStatus, Task[]>()
    for (const s of STATUSES) map.set(s, [])
    for (const t of tasks) map.get(t.status)?.push(t)
    return map
  }, [tasks])

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-white/60">Kanban view ({modeLabel}).</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-white/20 hover:bg-white/10"
            onClick={() => setCreating(true)}
          >
            New task
          </button>
          <button
            type="button"
            className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:border-red-500/35 hover:bg-red-500/15"
          >
            Mission mode
          </button>
        </div>
      </div>

      <div
        className={cx(
          'relative mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-3 sm:p-4',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_50px_120px_rgba(0,0,0,0.55)]',
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(229,9,20,0.14),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative flex items-center justify-between gap-3 px-2 pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Mission Control</div>
            <h2 className="mt-1 text-lg font-black tracking-tight">Board</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-white/45">Scroll horizontally →</span>
          </div>
        </div>

        <div
          className={cx(
            'relative flex gap-3 overflow-x-auto px-1 pb-2',
            'snap-x snap-mandatory [-webkit-overflow-scrolling:touch]',
          )}
        >
          {STATUSES.map((status) => {
            const col = byStatus.get(status) ?? []
            return (
              <section
                key={status}
                className={cx(
                  'snap-start shrink-0 w-[84vw] max-w-[360px] sm:w-[340px]',
                  'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03]',
                  'shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_40px_rgba(0,0,0,0.45)]',
                )}
              >
                <header className="sticky top-0 z-10 rounded-t-2xl border-b border-white/10 bg-black/25 backdrop-blur">
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="text-sm font-semibold tracking-tight">{status}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                      {col.length}
                    </div>
                  </div>
                </header>

                <div className="max-h-[60vh] overflow-auto p-3 sm:max-h-[66vh]">
                  <div className="flex flex-col gap-2">
                    {col.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/55">
                        Empty.
                      </div>
                    ) : null}

                    {col.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onClick={() => setSelectedId(t._id)}
                        onMoveStatus={async (next) => {
                          if (next === t.status) return
                          await onPatch(t._id, { status: next })
                        }}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <Drawer
        open={creating}
        mode="create"
        task={null}
        onClose={() => setCreating(false)}
        onSave={async (draft) => {
          await onCreate(draft)
          setCreating(false)
        }}
      />

      <Drawer
        open={!!selected}
        mode="edit"
        task={selected}
        onClose={() => setSelectedId(null)}
        onSave={async (draft) => {
          if (!selected) return
          await onPatch(selected._id, {
            title: draft.title,
            description: draft.description,
            assignee: draft.assignee,
            priority: draft.priority,
            status: draft.status,
            tags: draft.tags,
            dueDate: dateInputToMs(draft.dueDate),
          })
          setSelectedId(null)
        }}
      />
    </main>
  )
}

function ConvexKanbanBoard() {
  const backlog = useQuery(api.tasks.listByStatus, { status: 'Backlog' })
  const next = useQuery(api.tasks.listByStatus, { status: 'Next' })
  const inProgress = useQuery(api.tasks.listByStatus, { status: 'In Progress' })
  const blocked = useQuery(api.tasks.listByStatus, { status: 'Blocked' })
  const done = useQuery(api.tasks.listByStatus, { status: 'Done' })

  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const moveStatus = useMutation(api.tasks.moveStatus)
  const assign = useMutation(api.tasks.assign)
  const archive = useMutation(api.tasks.archive)

  const tasks = React.useMemo(() => {
    if (!backlog || !next || !inProgress || !blocked || !done) return undefined
    return [...backlog, ...next, ...inProgress, ...blocked, ...done]
  }, [backlog, next, inProgress, blocked, done])

  const onCreate = React.useCallback(
    async (draft: TaskDraft) => {
      await createTask({
        title: draft.title.trim(),
        description: draft.description?.trim() || undefined,
        status: draft.status,
        priority: draft.priority,
        assignee: (draft.assignee?.trim() || 'Milo') as string,
        dueDate: dateInputToMs(draft.dueDate),
        tags: draft.tags,
        author: 'Tasks UI',
      })
    },
    [createTask],
  )

  const onPatch = React.useCallback(
    async (id: Id<'tasks'>, patch: Partial<Task>) => {
      // Drive updates through the server's domain-specific mutations.
      if (patch.status !== undefined) {
        await moveStatus({ id, status: patch.status, author: 'Tasks UI' })
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'assignee')) {
        await assign({ id, assignee: patch.assignee ?? null, author: 'Tasks UI' })
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'archived')) {
        await archive({ id, archived: patch.archived, author: 'Tasks UI' })
      }

      const shouldUpdate =
        patch.title !== undefined ||
        patch.description !== undefined ||
        patch.priority !== undefined ||
        Object.prototype.hasOwnProperty.call(patch, 'dueDate') ||
        patch.tags !== undefined

      if (shouldUpdate) {
        await updateTask({
          id,
          title: patch.title,
          description: patch.description,
          priority: patch.priority,
          dueDate: Object.prototype.hasOwnProperty.call(patch, 'dueDate') ? (patch.dueDate ?? null) : undefined,
          tags: patch.tags,
          author: 'Tasks UI',
        })
      }
    },
    [moveStatus, assign, archive, updateTask],
  )

  if (!tasks) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-black">Tasks</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">Loading…</div>
      </main>
    )
  }

  return <KanbanBoard tasks={tasks} onPatch={onPatch} onCreate={onCreate} modeLabel="Convex (realtime)" />
}

export function TasksPageClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

  if (!convexUrl) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-black">Tasks</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          Missing <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_CONVEX_URL</code> — tasks require Convex.
        </div>
      </main>
    )
  }

  return (
    <SimpleErrorBoundary
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-black">Tasks</h1>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            Something went wrong loading tasks.
          </div>
        </main>
      }
    >
      <ConvexKanbanBoard />
    </SimpleErrorBoundary>
  )
}
