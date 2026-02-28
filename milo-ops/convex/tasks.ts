/* eslint-disable @typescript-eslint/no-explicit-any */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const statusValidator = v.union(
  v.literal('Backlog'),
  v.literal('Next'),
  v.literal('In Progress'),
  v.literal('Blocked'),
  v.literal('Done'),
)

type Status = 'Backlog' | 'Next' | 'In Progress' | 'Blocked' | 'Done'

type ActivityType =
  | 'create'
  | 'update'
  | 'status_change'
  | 'assignment'
  | 'comment'
  | 'archive'

const priorityValidator = v.union(v.literal('Low'), v.literal('Med'), v.literal('High'))

type Priority = 'Low' | 'Med' | 'High'

function nowMs() {
  return Date.now()
}

async function logActivity(
  ctx: any,
  activity: {
    taskId: any
    type: ActivityType
    author?: string
    body?: string
    fromStatus?: Status
    toStatus?: Status
    assignee?: string
    createdAt: number
  },
) {
  await ctx.db.insert('taskActivity', activity)
}

export const get = query({
  args: { id: v.id('tasks') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const listByStatus = query({
  args: {
    status: statusValidator,
    assignee: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, { status, assignee, includeArchived }) => {
    const q = assignee
      ? ctx.db
          .query('tasks')
          .withIndex('by_status_assignee', (q: any) => q.eq('status', status).eq('assignee', assignee))
      : ctx.db.query('tasks').withIndex('by_status', (q: any) => q.eq('status', status))

    const docs = await q.collect()
    if (includeArchived) return docs
    return docs.filter((d: any) => !d.archived)
  },
})

// MVP helper for tag-driven "queues" (Autopilot Queues UI).
// NOTE: no dedicated tag index yet; this scans tasks and filters in memory.
export const listByTag = query({
  args: {
    tag: v.string(),
    limit: v.optional(v.number()),
    includeDone: v.optional(v.boolean()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, { tag, limit, includeDone, includeArchived }) => {
    const docs = await ctx.db.query('tasks').collect()

    const filtered = docs.filter((d: any) => {
      if (!includeArchived && d.archived) return false
      if (!includeDone && d.status === 'Done') return false
      const tags: string[] = d.tags ?? []
      return tags.includes(tag)
    })

    // Rough "next" ordering: status buckets + most recently updated.
    const rank = (s: Status) => {
      switch (s) {
        case 'Next':
          return 0
        case 'In Progress':
          return 1
        case 'Backlog':
          return 2
        case 'Blocked':
          return 3
        case 'Done':
          return 9
      }
    }

    filtered.sort((a: any, b: any) => {
      const ra = rank(a.status as Status)
      const rb = rank(b.status as Status)
      if (ra !== rb) return ra - rb
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    })

    return filtered.slice(0, limit ?? 5)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    priority: v.optional(priorityValidator),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = nowMs()

    const status = (args.status ?? 'Backlog') as Status
    const priority = (args.priority ?? 'Med') as Priority

    const id = await ctx.db.insert('tasks', {
      title: args.title,
      description: args.description?.trim() || undefined,
      status,
      priority,
      assignee: args.assignee?.trim() || undefined,
      dueDate: args.dueDate,
      tags: args.tags ?? [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      taskId: id,
      type: 'create',
      author: args.author,
      createdAt: now,
    })

    return await ctx.db.get(id)
  },
})

export const update = mutation({
  args: {
    id: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc) throw new Error('Task not found')

    const patch: Record<string, unknown> = { updatedAt: nowMs() }
    if (args.title !== undefined) patch.title = args.title
    if (args.description !== undefined) patch.description = args.description?.trim() || undefined
    if (args.priority !== undefined) patch.priority = args.priority
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate === null ? undefined : args.dueDate
    if (args.tags !== undefined) patch.tags = args.tags

    await ctx.db.patch(args.id, patch)

    await logActivity(ctx, {
      taskId: args.id,
      type: 'update',
      author: args.author,
      createdAt: patch.updatedAt as number,
    })

    return await ctx.db.get(args.id)
  },
})

export const moveStatus = mutation({
  args: {
    id: v.id('tasks'),
    status: statusValidator,
    author: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, author }) => {
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Task not found')

    const fromStatus = doc.status as Status
    const toStatus = status as Status

    const updatedAt = nowMs()
    await ctx.db.patch(id, { status: toStatus, updatedAt })

    if (fromStatus !== toStatus) {
      await logActivity(ctx, {
        taskId: id,
        type: 'status_change',
        author,
        fromStatus,
        toStatus,
        createdAt: updatedAt,
      })
    }

    return await ctx.db.get(id)
  },
})

export const assign = mutation({
  args: {
    id: v.id('tasks'),
    assignee: v.optional(v.union(v.string(), v.null())),
    author: v.optional(v.string()),
  },
  handler: async (ctx, { id, assignee, author }) => {
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Task not found')

    const nextAssignee = assignee === null ? undefined : assignee?.trim() || undefined
    const updatedAt = nowMs()

    await ctx.db.patch(id, { assignee: nextAssignee, updatedAt })

    await logActivity(ctx, {
      taskId: id,
      type: 'assignment',
      author,
      assignee: nextAssignee,
      createdAt: updatedAt,
    })

    return await ctx.db.get(id)
  },
})

export const addComment = mutation({
  args: {
    id: v.id('tasks'),
    body: v.string(),
    author: v.optional(v.string()),
  },
  handler: async (ctx, { id, body, author }) => {
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Task not found')

    const createdAt = nowMs()
    await logActivity(ctx, {
      taskId: id,
      type: 'comment',
      author,
      body: body.trim(),
      createdAt,
    })

    await ctx.db.patch(id, { updatedAt: createdAt })

    return { ok: true }
  },
})

export const archive = mutation({
  args: {
    id: v.id('tasks'),
    archived: v.optional(v.boolean()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, { id, archived, author }) => {
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Task not found')

    const nextArchived = archived ?? true
    const updatedAt = nowMs()
    await ctx.db.patch(id, { archived: nextArchived, updatedAt })

    await logActivity(ctx, {
      taskId: id,
      type: 'archive',
      author,
      body: nextArchived ? 'archived' : 'unarchived',
      createdAt: updatedAt,
    })

    return await ctx.db.get(id)
  },
})
