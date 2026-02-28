import { ProjectsClient } from './ProjectsClient'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const p = typeof sp.p === 'string' ? sp.p : undefined

  return <ProjectsClient initialSelectedId={p as any} />
}
