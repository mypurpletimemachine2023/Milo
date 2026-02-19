# Milo Ops — Truth Policy (MVP)

## Source of truth
- **Convex tables** are the source of truth.
- UI status should derive from **`agentRuns`**, not vibes.

## Invariants
1) **At most one `Running` run per agent**
- Enforced inside `agentRuns.startRun`.
- When a new run starts for an agent, any existing `Running` runs are auto-finished as:
  - `state = Finished`
  - `finishedAt = now`
  - note appended: `Auto-finished (superseded by a newer run)`

2) **Stale `Running` runs are auto-finished**
- Policy: a run is stale if it hasn’t updated in **60 minutes**.
- Implemented via `agentRuns.cleanupStaleRuns({ staleMs: 60m, useUpdatedAt: true })`.
- Triggered by autopilot dispatcher before it seeds tasks/starts runs.
- Auto-finished note appended: `Auto-finished (stale; >60m)`.

## Rationale
- Prevents dashboards from lying after reloads/crashes.
- Keeps “Working” state meaningful.
- Supports 24/7 autopilot without manual babysitting.

## Validation
Run locally:

```bash
cd milo-ops
node scripts/validate_truth.js
```

Expected:
- exits 0
- prints: `OK: invariant holds (≤1 Running run per agent)`

## Tuning
- If we want more aggressive cleanup, lower stale threshold to **30m**.
- If we add a future `needsInput` state, we should **exclude** it from auto-finish.
