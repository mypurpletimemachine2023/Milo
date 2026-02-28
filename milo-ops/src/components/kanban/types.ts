export type KanbanStatus = 'Backlog' | 'Next' | 'In Progress' | 'Blocked' | 'Done'

export type KanbanAssignee = 'Alejandro' | 'Milo' | 'Unassigned'

export type KanbanTask = {
  id: string
  title: string
  summary?: string
  status: KanbanStatus
  assignee: KanbanAssignee
  priority?: 'Low' | 'Medium' | 'High'
  due?: string
  tags?: string[]
}

export type KanbanColumn = {
  id: string
  title: KanbanStatus
  hint?: string
}
