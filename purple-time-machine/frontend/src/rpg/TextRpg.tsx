import { useEffect, useMemo, useState } from 'react'
import type { RpgGame, RpgState } from './types'
import { applyChoice, formatBody, getScene, isChoiceAvailable } from './engine'

function loadKey(gameId: string) {
  return `ptm:rpg:${gameId}:save:v0`
}

export function TextRpg({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<RpgGame | null>(null)
  const [state, setState] = useState<RpgState | null>(null)
  const [ended, setEnded] = useState<{ outcome: 'win' | 'lose'; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setGame(null)
    setState(null)
    setEnded(null)
    setError(null)

    fetch(`/rpg/${gameId}.json`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load RPG: ${r.status}`)
        return r.json()
      })
      .then((g: RpgGame) => {
        setGame(g)
        const saved = localStorage.getItem(loadKey(g.gameId))
        if (saved) {
          try {
            setState(JSON.parse(saved) as RpgState)
            return
          } catch {}
        }
        setState(g.initialState)
      })
      .catch((e) => setError(e?.message ?? String(e)))
  }, [gameId])

  // Persist.
  useEffect(() => {
    if (!game || !state) return
    localStorage.setItem(loadKey(game.gameId), JSON.stringify(state))
  }, [game, state])

  const scene = useMemo(() => (game && state ? getScene(game, state.sceneId) : undefined), [game, state])

  if (error) return <div className="playerEmpty"><div className="playerEmptyTitle">RPG load failed</div><div className="playerEmptySub">{error}</div></div>
  if (!game || !state) return <div className="playerEmpty"><div className="playerEmptyTitle">Loading…</div></div>

  if (ended) {
    return (
      <div className="rpg">
        <div className="rpgCard">
          <div className="rpgTitle">{ended.outcome === 'win' ? 'Victory' : 'Defeat'}</div>
          <div className="rpgBody">{ended.message}</div>
          <div className="rpgChoices">
            <button
              className="rpgBtn rpgBtnGold"
              onClick={() => {
                localStorage.removeItem(loadKey(game.gameId))
                setEnded(null)
                setState(game.initialState)
              }}
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!scene) {
    return (
      <div className="playerEmpty">
        <div className="playerEmptyTitle">Missing scene</div>
        <div className="playerEmptySub">Scene not found: {state.sceneId}</div>
      </div>
    )
  }

  const available = scene.choices.filter((c) => isChoiceAvailable(state, c))

  return (
    <div className="rpg">
      <div className="rpgCard">
        <div className="rpgKicker">TEXT RPG</div>
        <div className="rpgTitle">{scene.title}</div>
        <div className="rpgBody">{formatBody(scene.body, state)}</div>

        <div className="rpgMeta">
          <div className="rpgPill">Shards: {String(state.flags['shards'] ?? 0)}</div>
          <div className="rpgPill">Kind: {String(state.stats['kind'] ?? 0)}</div>
          <div className="rpgPill">Greedy: {String(state.stats['greedy'] ?? 0)}</div>
          <div className="rpgPill">Bold: {String(state.stats['bold'] ?? 0)}</div>
          <div className="rpgPill">Cautious: {String(state.stats['cautious'] ?? 0)}</div>
        </div>

        <div className="rpgChoices">
          {available.map((c, idx) => (
            <button
              key={c.id}
              className={idx === 0 ? 'rpgBtn rpgBtnGold' : 'rpgBtn'}
              onClick={() => {
                const next: any = applyChoice(game, state, c)
                if (next.ended) {
                  setEnded(next.ended)
                  setState({ ...state })
                  return
                }
                setState(next)
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
