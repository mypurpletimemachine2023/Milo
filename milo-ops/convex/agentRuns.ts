import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const runState = v.union(v.literal('Running'), v.literal('Finished'))

export const startRun = mutation({
  args: {
    agentId: v.string(),
    title: v.string(),
    note: v.optional(v.string()),
    blockedReason: v.optional(v.string()),
    taskId: v.optional(v.id('tasks')),
    // Optional external identifier (e.g. OpenClaw subagent session id)
    externalRunId: v.optional(v.string()),
    kind: v.optional(v.union(v.literal('subagent'), v.literal('manual'))),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const kind = args.kind ?? 'manual'

    // Truth invariant: at most ONE Running run per agent.
    // If an agent restarts/reloads, we auto-finish older runs to prevent the UI from lying.
    const existingActive = await ctx.db
      .query('agentRuns')
      .withIndex('by_agentId_state', (q) => q.eq('agentId', args.agentId).eq('state', 'Running'))
      .collect()

    for (const r of existingActive) {
      const mergedNote = [r.note, 'Auto-finished (superseded by a newer run)'].filter(Boolean).join('\n')
      await ctx.db.patch(r._id, {
        state: 'Finished',
        finishedAt: now,
        note: mergedNote,
        updatedAt: now,
      })
    }

    const id = await ctx.db.insert('agentRuns', {
      agentId: args.agentId,
      title: args.title,
      note: args.note,
      blockedReason: args.blockedReason,
      taskId: args.taskId,
      externalRunId: args.externalRunId,
      kind,
      state: 'Running',
      startedAt: now,
      finishedAt: undefined,
      createdAt: now,
      updatedAt: now,
    })

    // Best-effort: reflect into the agent doc so older UIs still show something.
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agentId', (q) => q.eq('agentId', args.agentId))
      .unique()

    if (agent) {
      await ctx.db.patch(agent._id, {
        status: args.blockedReason ? 'Blocked' : 'Working',
        currentTaskTitle: args.title,
        needsFromAlejandro: args.blockedReason,
        updatedAt: now,
      })
    }

    return { ok: true, runId: id }
  },
})

export const finishRun = mutation({
  args: {
    runId: v.id('agentRuns'),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { runId, note }) => {
    const run = await ctx.db.get(runId)
    if (!run) throw new Error('Run not found')

    const now = Date.now()
    await ctx.db.patch(runId, {
      state: 'Finished',
      finishedAt: now,
      note: note ?? run.note,
      updatedAt: now,
    })

    // If this was the agent's last active run, fall back to Idle (or leave as-is).
    const stillActive = await ctx.db
      .query('agentRuns')
      .withIndex('by_agentId_state', (q) => q.eq('agentId', run.agentId).eq('state', 'Running'))
      .take(1)

    if (stillActive.length === 0) {
      const agent = await ctx.db
        .query('agents')
        .withIndex('by_agentId', (q) => q.eq('agentId', run.agentId))
        .unique()
      if (agent) {
        await ctx.db.patch(agent._id, {
          status: 'Idle',
          currentTaskTitle: undefined,
          needsFromAlejandro: undefined,
          updatedAt: now,
        })
      }
    }

    return { ok: true }
  },
})

export const listActiveRuns = query({
  args: {
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, { agentId }) => {
    if (agentId) {
      return await ctx.db
        .query('agentRuns')
        .withIndex('by_agentId_state', (q) => q.eq('agentId', agentId).eq('state', 'Running'))
        .order('desc')
        .collect()
    }

    return await ctx.db.query('agentRuns').withIndex('by_state', (q) => q.eq('state', 'Running')).order('desc').collect()
  },
})

export const attachRunToTask = mutation({
  args: {
    runId: v.id('agentRuns'),
    taskId: v.id('tasks'),
  },
  handler: async (ctx, { runId, taskId }) => {
    const run = await ctx.db.get(runId)
    if (!run) throw new Error('Run not found')

    await ctx.db.patch(runId, { taskId, updatedAt: Date.now() })
    return { ok: true }
  },
})

export const getLatestFinishedRun = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, { agentId }) => {
    const finished = await ctx.db
      .query('agentRuns')
      .withIndex('by_agentId_state', (q) => q.eq('agentId', agentId).eq('state', 'Finished'))
      .order('desc')
      .take(1)

    return finished[0] ?? null
  },
})

export const cleanupStaleRuns = mutation({
  args: {
    staleMs: v.optional(v.number()),
    /** If true, uses updatedAt for staleness; otherwise uses startedAt. */
    useUpdatedAt: v.optional(v.boolean()),
  },
  handler: async (ctx, { staleMs, useUpdatedAt }) => {
    const now = Date.now()
    const cutoff = now - (staleMs ?? 60 * 60 * 1000) // default: 60 minutes (policy: only auto-finish Running)

    const activeRuns = await ctx.db
      .query('agentRuns')
      .withIndex('by_state', (q) => q.eq('state', 'Running'))
      .collect()

    const stale = activeRuns.filter((r) => {
      const t = useUpdatedAt ? (r.updatedAt ?? r.startedAt ?? 0) : (r.startedAt ?? 0)
      return t > 0 && t < cutoff
    })

    let finished = 0
    const touchedAgents = new Set<string>()

    for (const r of stale) {
      const mergedNote = [r.note, `Auto-finished (stale; >${Math.round((staleMs ?? 60 * 60 * 1000) / 60000)}m)`]
        .filter(Boolean)
        .join('\n')
      await ctx.db.patch(r._id, {
        state: 'Finished',
        finishedAt: now,
        note: mergedNote,
        updatedAt: now,
      })
      finished++
      touchedAgents.add(r.agentId)
    }

    // If an agent has no active runs left, fall back to Idle.
    for (const agentId of touchedAgents) {
      const stillActive = await ctx.db
        .query('agentRuns')
        .withIndex('by_agentId_state', (q) => q.eq('agentId', agentId).eq('state', 'Running'))
        .take(1)

      if (stillActive.length === 0) {
        const agent = await ctx.db
          .query('agents')
          .withIndex('by_agentId', (q) => q.eq('agentId', agentId))
          .unique()
        if (agent) {
          await ctx.db.patch(agent._id, {
            status: 'Idle',
            currentTaskTitle: undefined,
            needsFromAlejandro: undefined,
            updatedAt: now,
          })
        }
      }
    }

    return { ok: true, finished, checked: activeRuns.length, cutoff }
  },
})

export const listAgentDerivedState = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('agents').withIndex('by_agentId').collect()
    const activeRuns = await ctx.db
      .query('agentRuns')
      .withIndex('by_state', (q) => q.eq('state', 'Running'))
      .collect()

    const runsByAgent = new Map<string, typeof activeRuns>()
    for (const r of activeRuns) {
      const arr = runsByAgent.get(r.agentId) ?? []
      arr.push(r)
      runsByAgent.set(r.agentId, arr)
    }

    return agents.map((a) => {
      const runs = runsByAgent.get(a.agentId) ?? []
      if (runs.length === 0) return { ...a, derivedFromRuns: false, activeRuns: [] }

      // Choose the most recently started run as the primary.
      const primary = runs.slice().sort((x, y) => (y.startedAt ?? 0) - (x.startedAt ?? 0))[0]
      return {
        ...a,
        derivedFromRuns: true,
        activeRuns: runs,
        status: primary.blockedReason ? 'Blocked' : 'Working',
        currentTaskTitle: primary.title,
        needsFromAlejandro: primary.blockedReason,
        updatedAt: Math.max(a.updatedAt ?? 0, primary.updatedAt ?? 0),
      }
    })
  },
})
