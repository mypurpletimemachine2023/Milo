export type AgentId =
  | 'milo'
  | 'builder'
  | 'integrator'
  | 'scriptwriter'
  | 'editor'
  | 'cover-artist'
  | 'ui-designer'
  | 'qa-tester'
  | 'ebook-agent'
  | 'website-agent'
  | 'scraper-agent'

// Used by /team grouping + /office zones
export type AgentRoleGroup = 'DEV' | 'DESIGN' | 'QA' | 'EBOOKS' | 'WEBSITES' | 'GAMES'

export type AgentStatus = 'Idle' | 'Working' | 'Blocked'

export type AgentProfile = {
  id: AgentId
  name: string
  group: AgentRoleGroup
  role: string
  // Monkey theme + pixel art: render as sprite key (we can swap later)
  sprite: {
    kind: 'pixel'
    key: string
  }
}

export const DEFAULT_ROSTER: AgentProfile[] = [
  {
    id: 'milo',
    name: 'Milo',
    group: 'GAMES',
    role: 'Orchestrator / game director',
    sprite: { kind: 'pixel', key: 'monkey-purple' },
  },

  // DEV
  {
    id: 'builder',
    name: 'Sara',
    group: 'DEV',
    role: 'Builder — ships features + fixes',
    sprite: { kind: 'pixel', key: 'monkey-builder' },
  },
  {
    id: 'integrator',
    name: 'Lisa',
    group: 'DEV',
    role: 'Integrator — Convex schema + wiring + integrations',
    sprite: { kind: 'pixel', key: 'monkey-wires' },
  },

  // DESIGN
  {
    id: 'cover-artist',
    name: 'Maria',
    group: 'DESIGN',
    role: 'Cover Artist — prompts + visual consistency',
    sprite: { kind: 'pixel', key: 'monkey-artist' },
  },
  {
    id: 'ui-designer',
    name: 'Amy',
    group: 'DESIGN',
    role: 'UI Designer — Mission Control UI + pixel office',
    sprite: { kind: 'pixel', key: 'monkey-ui' },
  },

  // QA
  {
    id: 'qa-tester',
    name: 'Nina',
    group: 'QA',
    role: 'QA Tester — smoke tests + bug reports',
    sprite: { kind: 'pixel', key: 'monkey-red' },
  },

  // EBOOKS
  {
    id: 'ebook-agent',
    name: 'Kayla',
    group: 'EBOOKS',
    role: 'Ebook Agent — writes + edits ebooks continuously',
    sprite: { kind: 'pixel', key: 'monkey-ebook' },
  },
  {
    id: 'editor',
    name: 'Vero',
    group: 'EBOOKS',
    role: 'Editor — polish + pacing + clarity',
    sprite: { kind: 'pixel', key: 'monkey-writer' },
  },

  // WEBSITES
  {
    id: 'website-agent',
    name: 'Tiffany',
    group: 'WEBSITES',
    role: 'Website Agent — packages assets + deploys (Vercel)',
    sprite: { kind: 'pixel', key: 'monkey-web' },
  },
  {
    id: 'scraper-agent',
    name: 'Jackie',
    group: 'WEBSITES',
    role: 'Scraper Agent — research + extraction + summaries',
    sprite: { kind: 'pixel', key: 'monkey-scout' },
  },

  // GAMES
  {
    id: 'scriptwriter',
    name: 'Stephanie',
    group: 'GAMES',
    role: 'Scriptwriter — short-form launch content + variants',
    sprite: { kind: 'pixel', key: 'monkey-green' },
  },
]
