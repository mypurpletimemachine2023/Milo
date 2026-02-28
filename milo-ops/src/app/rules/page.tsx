export default function RulesPage() {
  const rules = [
    '1) Our mission: ship revenue-generating products + grow the locksmith business (Veteran Lock & Safe / Alex the Locksmith / FederalLocksmith.com) continuously.',
    '2) Source of truth is Milo Ops: if it isn’t in Tasks/Content/Agent Runs, it doesn’t exist.',
    '3) Every work session must have an Agent Run; every Agent Run must link to a Task (or create one).',
    '4) No agent stays Idle > 30 minutes during active hours; autopilot assigns the next best task automatically.',
    '5) Blocked is sticky: when blocked, log ONE blocker reason + ONE clear question; do not “wait silently.”',
    '6) Definition of Done: builds + basic manual test passes; QA logs the checklist result; then move to Done.',
    '7) Prefer small batches: ship in thin slices; each slice should be deployable/testable in < 2 hours.',
    '8) Anything that touches money, auth, or secrets requires caution: no secrets in chat; use env vars; rotate leaked keys.',
    '9) Every deliverable must produce an artifact: file path, URL, screenshot, or deployed link—no “I worked on it” vibes.',
    '10) Nightly factories run regardless: ebook output, KDP output, research brief, and locksmith website improvements.',
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">Company Operating Rules</h1>
      <p className="mt-3 text-white/70">
        These are the rules the agents follow to keep the company moving 24/7 (products + locksmith business).
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <ol className="grid gap-3 text-sm text-white/85">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>

      <div className="mt-6 text-xs text-white/50">
        Tip: keep this page open while assigning work; if a workflow feels slow, we update the rules.
      </div>
    </main>
  )
}
