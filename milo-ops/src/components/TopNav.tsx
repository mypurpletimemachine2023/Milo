import Link from 'next/link'

const items = [
  { href: '/', label: 'Home' },
  { href: '/team', label: 'Team' },
  { href: '/projects', label: 'Projects' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/queues', label: 'Queues' },
  { href: '/content', label: 'Content' },
  { href: '/office', label: 'Office' },
  { href: '/rules', label: 'Rules' },
]

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="font-black tracking-widest">MILO OPS</div>
        <nav className="flex gap-2 text-sm">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-white/20"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
