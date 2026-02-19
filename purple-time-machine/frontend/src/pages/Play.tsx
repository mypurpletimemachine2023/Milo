import type { Catalog } from '../lib/catalog'

export function Play({ slug, catalog, onClose }: { slug: string; catalog: Catalog; onClose: () => void }) {
  const game = catalog.rows.flatMap((r) => r.games).find((g) => g.slug === slug)

  return (
    <div className="playerOverlay" role="dialog" aria-modal="true">
      <div className="playerHeader">
        <div className="playerTitle">{game?.title ?? slug}</div>
        <button className="playerClose" onClick={onClose}>
          Close
        </button>
      </div>

      {game?.playableUrl ? (
        <iframe className="playerFrame" src={game.playableUrl} title={game.title} />
      ) : (
        <div className="playerEmpty">
          <div className="playerEmptyTitle">No playable build yet.</div>
          <div className="playerEmptySub">This is the shell — next step is wiring in game builds.</div>
        </div>
      )}
    </div>
  )
}
