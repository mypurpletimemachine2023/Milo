import { useEffect, useMemo, useState } from 'react'
import { GameCard } from '../components/GameCard'
import type { Catalog, CatalogRow, GameCard as GameCardType, GameEraId, GameRowId } from '../lib/catalog'
import { loadCatalog } from '../lib/catalog'

function rowEmoji(row: GameRowId) {
  switch (row) {
    case 'classic-horror':
      return '🧛'
    case 'mythology':
      return '🏛️'
    case 'history-challenges':
      return '🕰️'
    case 'weird-experiments':
      return '🧪'
    case 'idle-worlds':
      return '🕯️'
  }
}

function Row({
  row,
  selectedSlug,
  onSelect,
  onPlay,
}: {
  row: CatalogRow
  selectedSlug: string | null
  onSelect: (slug: string) => void
  onPlay: (slug: string) => void
}) {
  return (
    <section className="nrow">
      <h2 className="nrowTitle">
        <span className="nrowEmoji">{rowEmoji(row.id)}</span>
        {row.title}
      </h2>
      <div className="nrowRail" role="list">
        {row.games.length === 0 ? (
          <div className="nrowEmpty">No games yet.</div>
        ) : (
          row.games.map((g) => (
            <div key={g.slug} role="listitem" className="nrowItem">
              <GameCard
                game={g}
                selected={selectedSlug === g.slug}
                onHover={() => onSelect(g.slug)}
                onPlay={() => onPlay(g.slug)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function eraLabel(e: GameEraId) {
  switch (e) {
    case 'ancient':
      return 'Ancient'
    case 'medieval':
      return 'Medieval'
    case '1800s':
      return '1800s'
    case 'unknown':
      return 'Unknown'
  }
}

export function Home({ onPlay }: { onPlay: (slug: string) => void }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [era, setEra] = useState<GameEraId | 'all'>('all')

  useEffect(() => {
    loadCatalog()
      .then((c) => {
        setCatalog(c)
        const first = c.rows.flatMap((r) => r.games)[0]?.slug ?? null
        setSelectedSlug((s) => s ?? first)
      })
      .catch((e) => setError(e?.message ?? String(e)))
  }, [])

  const rows = useMemo(() => {
    const all = catalog?.rows ?? []
    if (era === 'all') return all
    return all
      .map((r) => ({ ...r, games: r.games.filter((g) => (g.era ?? 'unknown') === era) }))
      .filter((r) => r.games.length > 0)
  }, [catalog, era])

  const selected: GameCardType | undefined = useMemo(() => {
    if (!catalog || !selectedSlug) return undefined
    return catalog.rows.flatMap((r) => r.games).find((g) => g.slug === selectedSlug)
  }, [catalog, selectedSlug])

  // Keep selection valid when filters change.
  useEffect(() => {
    if (!catalog) return
    const allFiltered = rows.flatMap((r) => r.games)
    if (allFiltered.length === 0) return
    const stillExists = allFiltered.some((g) => g.slug === selectedSlug)
    if (!stillExists) setSelectedSlug(allFiltered[0]!.slug)
  }, [catalog, rows, selectedSlug])

  return (
    <main className="napp">
      <header className="ntopbar">
        <div className="ntopbarLeft">
          <div className="nbrand">MY PURPLE TIME MACHINE</div>
          <div className="ntag">Instant microgames • Public domain only</div>
        </div>
        <div className="ntopbarRight">
          <div className="nsearchHint">Search (coming)</div>
        </div>
      </header>

      {/* MVP loop step A: pick a “time/era” first (heuristic for now). */}
      <section className="nera" aria-label="Pick a time">
        <div className="neraLabel">Pick a time:</div>
        <div className="neraChips" role="tablist" aria-label="Time filters">
          {(['all', 'ancient', 'medieval', '1800s'] as const).map((e) => (
            <button
              key={e}
              className={era === e ? 'neraChip neraChipOn' : 'neraChip'}
              onClick={() => setEra(e)}
              role="tab"
              aria-selected={era === e}
            >
              {e === 'all' ? 'All' : eraLabel(e)}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      {/* Netflix-style hero + preview */}
      <section className="nhero">
        <div className="nheroBg" />
        <div className="nheroInner">
          <div className="nheroMeta">
            <div className="nheroKicker">Preview</div>
            <div className="nheroTitle">{selected?.title ?? 'Pick a game'}</div>
            <div className="nheroLine">{selected?.oneLiner ?? 'Hover a cover to preview it.'}</div>
            <div className="nheroSource">{selected?.source ?? ''}</div>
            <div className="nheroBtns">
              {selected?.slug ? (
                <button className="nbtn nbtnPrimary" onClick={() => onPlay(selected.slug)}>
                  ▶ Play
                </button>
              ) : null}
              {selected?.slug ? (
                <button className="nbtn" onClick={() => navigator.clipboard?.writeText?.(selected.playableUrl ?? '')}>
                  + My List (later)
                </button>
              ) : null}
            </div>
          </div>

          <div className="nheroPreview" aria-label="Game preview">
            {selected?.playableUrl ? (
              <div className="nheroFrameWrap">
                <iframe className="nheroFrame" src={selected.playableUrl} title={`Preview: ${selected.title}`} />
                <div className="nheroFrameShade" />
                <div className="nheroFrameBadge">Preview</div>
              </div>
            ) : (
              <div className="nheroPlaceholder">No playable yet.</div>
            )}
          </div>
        </div>
      </section>

      <div className="nrows">
        {rows.map((r) => (
          <Row
            key={r.id}
            row={r}
            selectedSlug={selectedSlug}
            onSelect={(s) => setSelectedSlug(s)}
            onPlay={onPlay}
          />
        ))}
      </div>
    </main>
  )
}
