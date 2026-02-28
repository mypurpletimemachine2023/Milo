export type ProjectId = 'purple-time-machine' | 'coloring-books' | 'ebook-locksmith' | 'veteran-lock-safe'

export type ProjectCard = {
  id: ProjectId
  title: string
  oneLiner: string
  owner: 'Alejandro' | 'Milo'
  status: 'Active' | 'Blocked' | 'Backlog'
  // Netflix-y hero backdrop accent
  accent: 'purple' | 'red' | 'teal' | 'amber'
  tags: string[]
}

export const DEFAULT_PROJECTS: ProjectCard[] = [
  {
    id: 'purple-time-machine',
    title: 'Purple Time Machine (PD Netflix + Microgames)',
    oneLiner: 'Netflix-style public domain library + instant microgames; keep shipping hourly drops + catalog expansion.',
    owner: 'Milo',
    status: 'Active',
    accent: 'purple',
    tags: ['public-domain', 'microgames', 'netflix-ui'],
  },
  {
    id: 'coloring-books',
    title: 'Coloring Books (KDP) — Victorian Botanical Apothecary',
    oneLiner: 'Generate 50 pages + interior PDF + cover + listing. Revenue-first, fast execution.',
    owner: 'Alejandro',
    status: 'Active',
    accent: 'amber',
    tags: ['kdp', 'publishing', 'ai-art'],
  },
  {
    id: 'ebook-locksmith',
    title: 'Ebook — Alex the Locksmith',
    oneLiner: 'Finish interview batch 2 → manuscript v0 (Markdown) → export for KDP.',
    owner: 'Alejandro',
    status: 'Active',
    accent: 'teal',
    tags: ['ebook', 'kdp', 'writing'],
  },
  {
    id: 'veteran-lock-safe',
    title: 'Veteran Lock & Safe (Vercel website)',
    oneLiner: 'Site cleanup + deploy on Vercel; remove leftover template artifacts and tighten trust signals.',
    owner: 'Alejandro',
    status: 'Backlog',
    accent: 'red',
    tags: ['website', 'vercel', 'seo'],
  },
]
