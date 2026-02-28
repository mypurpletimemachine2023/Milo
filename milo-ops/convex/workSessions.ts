import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const startSession = mutation({
  args: {
    agentId: v.string(),
    label: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { agentId, label, note }) => {
    const now = Date.now()
    const id = await ctx.db.insert('workSessions', {
      agentId,
      label,
      note,
      state: 'Active',
      startedAt: now,
      finishedAt: undefined,
      createdAt: now,
      updatedAt: now,
    })
    return { ok: true, sessionId: id }
  },
})

export const finishSession = mutation({
  args: {
    sessionId: v.id('workSessions'),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, note }) => {
    const s = await ctx.db.get(sessionId)
    if (!s) throw new Error('Session not found')
    const now = Date.now()
    await ctx.db.patch(sessionId, {
      state: 'Finished',
      finishedAt: now,
      note: note ?? s.note,
      updatedAt: now,
    })
    return { ok: true }
  },
})

export const listActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('workSessions')
      .withIndex('by_state', (q) => q.eq('state', 'Active'))
      .order('desc')
      .collect()
  },
})
