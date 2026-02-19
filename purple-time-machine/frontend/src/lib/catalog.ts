export type GameRowId =
  | 'mythology'
  | 'weird-experiments'
  | 'classic-horror'
  | 'history-challenges'
  | 'idle-worlds'

export type GameEraId = 'ancient' | 'medieval' | '1800s' | 'unknown'

export type GameCard = {
  slug: string
  title: string
  row: GameRowId
  oneLiner: string
  input: 'tap' | 'click' | 'drag' | 'one-key'
  estSession: '30s-5m'
  source: string
  playableUrl?: string

  /** Derived client-side for now (keeps catalog.json simple). */
  era?: GameEraId
}

export type CatalogRow = {
  id: GameRowId
  title: string
  games: GameCard[]
}

export type Catalog = {
  rows: CatalogRow[]
}

function inferEraFromGame(g: GameCard): GameEraId {
  // v0 heuristic: stable, deterministic, good enough for a “pick a year/era” dial.
  // We can later move this into catalog.json as an explicit field.
  switch (g.row) {
    case 'classic-horror':
      return '1800s'
    case 'idle-worlds':
      return 'medieval'
    case 'mythology':
    case 'history-challenges':
    case 'weird-experiments':
      return 'ancient'
  }
}

function decorateCatalog(c: Catalog): Catalog {
  return {
    rows: c.rows.map((r) => ({
      ...r,
      games: r.games.map((g) => ({ ...g, era: g.era ?? inferEraFromGame(g) })),
    })),
  }
}

export async function loadCatalog(): Promise<Catalog> {
  // Catalog is a workspace file; during dev, we serve a copy via /public.
  const res = await fetch('/catalog.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  const raw = (await res.json()) as Catalog
  return decorateCatalog(raw)
}
