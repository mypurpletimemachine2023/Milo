import type { GameCard as GameCardType, GameRowId } from '../lib/catalog'

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

function svgCover({ title, row }: { title: string; row: GameRowId }) {
  const emoji = rowEmoji(row)
  const safe = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b1430"/>
      <stop offset="0.6" stop-color="#090a12"/>
      <stop offset="1" stop-color="#0a0612"/>
    </linearGradient>
    <radialGradient id="r" cx="0.2" cy="0.15" r="0.9">
      <stop offset="0" stop-color="#7c3aed" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#g)"/>
  <rect width="320" height="180" fill="url(#r)"/>
  <text x="22" y="54" font-size="34">${emoji}</text>
  <text x="22" y="92" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial" font-weight="900" font-size="18" fill="#fff">${safe}</text>
  <text x="22" y="118" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial" font-weight="600" font-size="12" fill="#c7c7d1" opacity="0.9">tap • 30s–5m</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function GameCard({
  game,
  selected,
  onHover,
  onPlay,
}: {
  game: GameCardType
  selected?: boolean
  onHover?: () => void
  onPlay: () => void
}) {
  const cover = `/covers/${game.slug}.jpg`
  const coverSvg = `/covers/${game.slug}.svg`

  return (
    <button
      className={selected ? 'ncard ncardSelected' : 'ncard'}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onPlay}
      aria-label={`Play ${game.title}`}
    >
      <div className="ncardCoverWrap">
        <img
          className="ncardCover"
          src={cover}
          alt=""
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            // 1) try local placeholder SVG (generated offline)
            if (!img.dataset.triedSvg) {
              img.dataset.triedSvg = '1'
              img.src = coverSvg
              return
            }
            // 2) fallback to generated inline SVG
            img.src = svgCover({ title: game.title, row: game.row })
          }}
        />
        <div className="ncardShade" />
        <div className="ncardTitle">{game.title}</div>
      </div>
    </button>
  )
}
