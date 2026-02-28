# Milo Ops (Mission Control)

Standalone Next.js + Convex app for:
- Team roster + live status
- Tasks board (Kanban)
- Content pipeline (short-form first, variants + assets)
- Office view (pixel monkeys at desks)

## Run (UI only, mock store)

```bash
cd milo-ops
npm run dev
```

## Enable Convex (realtime)

Convex requires a one-time login + project creation.

```bash
cd milo-ops
npx convex dev
```

Then set `NEXT_PUBLIC_CONVEX_URL` in `milo-ops/.env.local` and we’ll wire the UI to realtime queries/mutations.
