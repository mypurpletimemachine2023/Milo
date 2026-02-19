import { useEffect } from 'react'
import type { Catalog } from '../lib/catalog'
import { TextRpg } from '../rpg/TextRpg'

export function Play({ slug, catalog, onClose }: { slug: string; catalog: Catalog; onClose: () => void }) {
  const game = catalog.rows.flatMap((r) => r.games).find((g) => g.slug === slug)

  // MVP polish: obvious "quit" + reliable way back to the dashboard.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="playerOverlay" role="dialog" aria-modal="true" aria-label="Game player">
      <header className="playerHeader">
        <button className="playerBack" onClick={onClose} aria-label="Back to Home">
          ← Home
        </button>

        <div className="playerTitle" title={game?.title ?? slug}>
          {game?.title ?? slug}
        </div>

        <div className="playerHeaderRight">
          {game?.playableUrl && !game.playableUrl.startsWith('/rpg/') ? (
            <a className="playerLink" href={game.playableUrl} target="_blank" rel="noreferrer">
              Open ↗
            </a>
          ) : null}
          <button className="playerClose" onClick={onClose} aria-label="Quit game">
            ✕ Quit
          </button>
        </div>
      </header>

      {game?.playableUrl?.startsWith('/rpg/') ? (
        <div className="playerFrame" style={{ background: '#000' }}>
          <TextRpg gameId={game.playableUrl.replace('/rpg/', '')} />
        </div>
      ) : game?.playableUrl ? (
        <iframe className="playerFrame" src={game.playableUrl} title={game.title} allow="fullscreen" />
      ) : (
        <div className="playerEmpty">
          <div className="playerEmptyTitle">No playable build yet.</div>
          <div className="playerEmptySub">This is the shell — next step is wiring in game builds.</div>
          <div className="playerEmptyActions">
            <button className="playerClose" onClick={onClose}>
              Back to Home
            </button>
          </div>
        </div>
      )}

      <footer className="playerBottom">
        <button className="playerBottomBtn playerBottomPrimary" onClick={onClose}>
          ← Back to browse
        </button>
        {game?.playableUrl ? (
          <a className="playerBottomBtn" href={game.playableUrl} target="_blank" rel="noreferrer">
            Open ↗
          </a>
        ) : null}
      </footer>
    </div>
  )
}
