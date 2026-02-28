import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('agents').withIndex('by_agentId').collect()
  },
})

export const seedDefault = mutation({
  args: {
    roster: v.array(
      v.object({
        agentId: v.string(),
        name: v.string(),
        group: v.string(),
        role: v.string(),
        spriteKey: v.string(),
      }),
    ),
  },
  handler: async (ctx, { roster }) => {
    const existing = await ctx.db.query('agents').take(1)
    if (existing.length > 0) return { ok: true, seeded: false }

    const now = Date.now()
    for (const a of roster) {
      await ctx.db.insert('agents', {
        ...a,
        status: a.agentId === 'milo' ? 'Working' : 'Idle',
        currentTaskTitle: a.agentId === 'milo' ? 'Build Milo Ops (Mission Control)' : undefined,
        needsFromAlejandro: undefined,
        updatedAt: now,
      })
    }

    return { ok: true, seeded: true, count: roster.length }
  },
})

// Upsert roster entries (idempotent). Use this whenever agent list changes.
export const upsertRoster = mutation({
  args: {
    roster: v.array(
      v.object({
        agentId: v.string(),
        name: v.string(),
        group: v.string(),
        role: v.string(),
        spriteKey: v.string(),
      }),
    ),
  },
  handler: async (ctx, { roster }) => {
    const now = Date.now()

    let inserted = 0
    let updated = 0

    for (const a of roster) {
      const existing = await ctx.db
        .query('agents')
        .withIndex('by_agentId', (q) => q.eq('agentId', a.agentId))
        .unique()

      if (!existing) {
        await ctx.db.insert('agents', {
          ...a,
          status: 'Idle',
          currentTaskTitle: undefined,
          needsFromAlejandro: undefined,
          updatedAt: now,
        })
        inserted++
        continue
      }

      // Keep existing status fields; update identity fields.
      await ctx.db.patch(existing._id, {
        name: a.name,
        group: a.group,
        role: a.role,
        spriteKey: a.spriteKey,
        updatedAt: now,
      })
      updated++
    }

    return { ok: true, inserted, updated }
  },
})

export const setState = mutation({
  args: {
    agentId: v.string(),
    status: v.optional(v.union(v.literal('Idle'), v.literal('Working'), v.literal('Blocked'))),
    currentTaskTitle: v.optional(v.string()),
    needsFromAlejandro: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('agents')
      .withIndex('by_agentId', (q) => q.eq('agentId', args.agentId))
      .unique()
    if (!doc) throw new Error(`Agent not found: ${args.agentId}`)

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.status !== undefined) patch.status = args.status
    if (args.currentTaskTitle !== undefined) patch.currentTaskTitle = args.currentTaskTitle || undefined
    if (args.needsFromAlejandro !== undefined) patch.needsFromAlejandro = args.needsFromAlejandro || undefined

    await ctx.db.patch(doc._id, patch)
    return { ok: true }
  },
})
