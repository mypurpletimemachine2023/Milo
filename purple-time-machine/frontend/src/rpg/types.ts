export type RpgState = {
  sceneId: string
  stats: Record<string, number>
  inventory: Record<string, number>
  flags: Record<string, boolean | number | string>
}

export type RpgCondition =
  | { type: 'flagGte'; key: string; value: number }
  | { type: 'flagEq'; key: string; value: boolean | number | string }
  | { type: 'statGte'; key: string; value: number }
  | { type: 'hasItem'; key: string; value?: number }

export type RpgEffect =
  | { type: 'setFlag'; key: string; value: boolean | number | string }
  | { type: 'incFlag'; key: string; value: number }
  | { type: 'incStat'; key: string; value: number }
  | { type: 'addItem'; key: string; value?: number }
  | { type: 'removeItem'; key: string; value?: number }
  | { type: 'endGame'; outcome: 'win' | 'lose'; message: string }

export type RpgChoice = {
  id: string
  label: string
  requires?: RpgCondition[]
  effects?: RpgEffect[]
  next?: string
}

export type RpgScene = {
  id: string
  title: string
  body: string
  choices: RpgChoice[]
}

export type RpgGame = {
  gameId: string
  title: string
  startScene: string
  initialState: RpgState
  scenes: RpgScene[]
}
