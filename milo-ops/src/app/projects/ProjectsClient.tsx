'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DEFAULT_PROJECTS, type ProjectCard } from '../../lib/projects'

function accentBg(accent: ProjectCard['accent']) {
  switch (accent) {
    case 'purple':
      return 'from-fuchsia-600/25 via-purple-600/15 to-black'
    case 'red':
      return 'from-red-600/20 via-rose-600/10 to-black'
    case 'teal':
      return 'from-teal-500/20 via-cyan-500/10 to-black'
    case 'amber':
      return 'from-amber-500/25 via-orange-500/10 to-black'
  }
}

function statusPill(status: ProjectCard['status']) {
  const cls =
    status === 'Active'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20'
      : status === 'Blocked'
        ? 'bg-red-500/15 text-red-200 border-red-400/20'
        : 'bg-white/10 text-white/80 border-white/15'
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>
}

function ProjectTile({ p, onHover, selected }: { p: ProjectCard; onHover: () => void; selected: boolean }) {
  return (
    <button
      onMouseEnter={onHover}
      onFocus={onHover}
      className={
        selected
          ? 'relative h-[150px] w-[260px] overflow-hidden rounded-2xl border border-red-500/40 bg-white/5 text-left'
          : 'relative h-[150px] w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:border-white/20'
      }
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentBg(p.accent)}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-black leading-tight">{p.title}</div>
          {statusPill(p.status)}
        </div>
        <div className="mt-2 line-clamp-3 text-xs text-white/70">{p.oneLiner}</div>
        <div className="mt-3 flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-white/60">
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

export function ProjectsClient({ initialSelectedId }: { initialSelectedId?: ProjectCard['id'] }) {
  const projects = useMemo(() => DEFAULT_PROJECTS, [])
  const init = (initialSelectedId && projects.some((p) => p.id === initialSelectedId) ? initialSelectedId : projects[0]?.id) as
    | ProjectCard['id']
    | undefined

  const [selectedId, setSelectedId] = useState(init)
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0]

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentBg(selected.accent)}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">Projects</div>
          <h1 className="mt-2 text-3xl font-black">{selected.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{selected.oneLiner}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {statusPill(selected.status)}
            <span className="text-sm text-white/70">
              <span className="text-white/50">Owner:</span> {selected.owner}
            </span>
          </div>

          <div className="mt-6 flex gap-2">
            <Link href="/tasks" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold hover:bg-red-500">
              ▶ Open Tasks
            </Link>
            <Link
              href="/content"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold hover:border-white/25"
            >
              + Open Content
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm font-extrabold uppercase tracking-widest text-white/60">All Projects</div>
        <div className="mt-3 flex gap-3 overflow-auto pb-2">
          {projects.map((p) => (
            <ProjectTile key={p.id} p={p} selected={p.id === selectedId} onHover={() => setSelectedId(p.id)} />
          ))}
        </div>
      </section>
    </main>
  )
}
