import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const taskStatus = v.union(
  v.literal('Backlog'),
  v.literal('Next'),
  v.literal('In Progress'),
  v.literal('Blocked'),
  v.literal('Done'),
)

const taskPriority = v.union(v.literal('Low'), v.literal('Med'), v.literal('High'))

export default defineSchema({
  agents: defineTable({
    agentId: v.string(), // stable id (e.g., 'milo')
    name: v.string(),
    group: v.string(),
    role: v.string(),
    spriteKey: v.string(),

    status: v.union(v.literal('Idle'), v.literal('Working'), v.literal('Blocked')),
    currentTaskTitle: v.optional(v.string()),
    needsFromAlejandro: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_agentId', ['agentId']),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),

    status: taskStatus,
    priority: taskPriority,

    // Optional; may be 'Alejandro', 'Milo', or an agentId
    assignee: v.optional(v.string()),

    dueDate: v.optional(v.number()), // ms timestamp
    tags: v.array(v.string()),

    archived: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_assignee', ['assignee'])
    .index('by_status_assignee', ['status', 'assignee']),

  taskActivity: defineTable({
    taskId: v.id('tasks'),

    type: v.union(
      v.literal('create'),
      v.literal('update'),
      v.literal('status_change'),
      v.literal('assignment'),
      v.literal('comment'),
      v.literal('archive'),
    ),

    // Optional metadata (keep sparse)
    author: v.optional(v.string()),
    body: v.optional(v.string()),

    fromStatus: v.optional(taskStatus),
    toStatus: v.optional(taskStatus),

    assignee: v.optional(v.string()),

    createdAt: v.number(),
  }).index('by_taskId', ['taskId', 'createdAt']),

  // Pragmatic run tracking (subagents + manual sessions).
  agentRuns: defineTable({
    agentId: v.string(),

    title: v.string(),
    note: v.optional(v.string()),
    blockedReason: v.optional(v.string()),

    taskId: v.optional(v.id('tasks')),

    externalRunId: v.optional(v.string()),
    kind: v.union(v.literal('subagent'), v.literal('manual')),

    state: v.union(v.literal('Running'), v.literal('Finished')),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_state', ['state', 'startedAt'])
    .index('by_agentId_state', ['agentId', 'state', 'startedAt']),

  // Optional higher-level “work session” abstraction (can group multiple runs).
  workSessions: defineTable({
    agentId: v.string(),
    label: v.string(),
    note: v.optional(v.string()),

    state: v.union(v.literal('Active'), v.literal('Finished')),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_state', ['state', 'startedAt']),
})
