import { DEFAULT_ROSTER, type AgentId, type AgentProfile, type AgentStatus } from './roster'

export type AgentState = {
  agentId: AgentId
  status: AgentStatus
  currentTaskTitle?: string
  needsFromAlejandro?: string
  updatedAt: number
}

// MVP: in-memory store (replaced by Convex).
let agentStates: AgentState[] = DEFAULT_ROSTER.map((a) => ({
  agentId: a.id,
  status: a.id === 'milo' ? 'Working' : 'Idle',
  currentTaskTitle: a.id === 'milo' ? 'Build Milo Ops (Mission Control)' : undefined,
  needsFromAlejandro: undefined,
  updatedAt: Date.now(),
}))

export function listRoster(): AgentProfile[] {
  return DEFAULT_ROSTER
}

export function listAgentStates(): AgentState[] {
  return agentStates.slice().sort((x, y) => x.agentId.localeCompare(y.agentId))
}

export function setAgentState(patch: Partial<AgentState> & { agentId: AgentId }) {
  agentStates = agentStates.map((s) => {
    if (s.agentId !== patch.agentId) return s
    return {
      ...s,
      ...patch,
      updatedAt: Date.now(),
    }
  })
}
