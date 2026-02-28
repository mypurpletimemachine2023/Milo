import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Mission Control</h1>
      <p className="mt-3 max-w-2xl text-white/70">
        This is the standalone ops hub: Tasks + Content Pipeline + Team + (fun) Office view.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/team" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20">
          <div className="text-lg font-extrabold">Team</div>
          <div className="mt-1 text-sm text-white/60">Roster + live status + blockers.</div>
        </Link>
        <Link href="/office" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20">
          <div className="text-lg font-extrabold">Office</div>
          <div className="mt-1 text-sm text-white/60">Pixel-art office view (monkey theme).</div>
        </Link>
        <Link href="/tasks" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20">
          <div className="text-lg font-extrabold">Tasks</div>
          <div className="mt-1 text-sm text-white/60">Kanban board (assigned to Alejandro/Milo).</div>
        </Link>
        <Link href="/content" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20">
          <div className="text-lg font-extrabold">Content</div>
          <div className="mt-1 text-sm text-white/60">Short-form pipeline with variants + assets.</div>
        </Link>
      </div>

      <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
        <div className="font-extrabold">Next step</div>
        <div className="mt-1 text-amber-100/90">
          This UI is currently backed by an in-memory mock store. We’ll swap it to Convex realtime once you run the
          Convex init (it needs a one-time login).
        </div>
      </div>
    </main>
  )
}
