import type { RpgChoice, RpgCondition, RpgEffect, RpgGame, RpgScene, RpgState } from './types'

export function getScene(game: RpgGame, sceneId: string): RpgScene | undefined {
  return game.scenes.find((s) => s.id === sceneId)
}

function getNum(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? x : 0
}

export function checkCondition(state: RpgState, c: RpgCondition): boolean {
  switch (c.type) {
    case 'flagGte': {
      const v = getNum(state.flags[c.key])
      return v >= c.value
    }
    case 'flagEq':
      return state.flags[c.key] === c.value
    case 'statGte':
      return getNum(state.stats[c.key]) >= c.value
    case 'hasItem': {
      const have = getNum(state.inventory[c.key])
      return have >= (c.value ?? 1)
    }
  }
}

export function isChoiceAvailable(state: RpgState, ch: RpgChoice): boolean {
  if (!ch.requires || ch.requires.length === 0) return true
  return ch.requires.every((c) => checkCondition(state, c))
}

export function applyEffect(state: RpgState, e: RpgEffect): RpgState & { ended?: { outcome: 'win' | 'lose'; message: string } } {
  const next: RpgState & { ended?: { outcome: 'win' | 'lose'; message: string } } = {
    sceneId: state.sceneId,
    stats: { ...state.stats },
    inventory: { ...state.inventory },
    flags: { ...state.flags },
  }

  switch (e.type) {
    case 'setFlag':
      next.flags[e.key] = e.value
      return next
    case 'incFlag':
      next.flags[e.key] = getNum(next.flags[e.key]) + e.value
      return next
    case 'incStat':
      next.stats[e.key] = getNum(next.stats[e.key]) + e.value
      return next
    case 'addItem':
      next.inventory[e.key] = getNum(next.inventory[e.key]) + (e.value ?? 1)
      return next
    case 'removeItem': {
      next.inventory[e.key] = Math.max(0, getNum(next.inventory[e.key]) - (e.value ?? 1))
      return next
    }
    case 'endGame':
      next.ended = { outcome: e.outcome, message: e.message }
      return next
  }
}

export function applyChoice(_game: RpgGame, state: RpgState, choice: RpgChoice): ReturnType<typeof applyEffect> {
  let next: any = { ...state }
  for (const e of choice.effects ?? []) {
    next = applyEffect(next, e)
    if (next.ended) return next
  }
  if (choice.next) next.sceneId = choice.next
  return next
}

export function formatBody(body: string, state: RpgState): string {
  // Minimal templating: {flags.foo} / {stats.bar}
  return body.replace(/\{(flags|stats)\.([a-zA-Z0-9_:-]+)\}/g, (_, group, key) => {
    const src = group === 'flags' ? state.flags : state.stats
    const v = src[key]
    return v === undefined ? '0' : String(v)
  })
}
