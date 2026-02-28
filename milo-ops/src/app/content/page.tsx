export default function ContentPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-black">Content Pipeline</h1>
      <p className="mt-2 text-sm text-white/65">Short-form first (TikTok / Shorts / Reels). Variants supported.</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
        MVP plan:
        <ul className="mt-2 list-disc pl-5">
          <li>Stages: Inbox → Idea → Research → Draft Script → Edit → Assets → Schedule → Published → Repurpose</li>
          <li>Variants per item: multiple hooks/scripts/CTAs</li>
          <li>Attachments: images (covers/screenshots)</li>
          <li>Link to tasks + assignee (Alejandro/Milo)</li>
        </ul>
      </div>
    </main>
  )
}
