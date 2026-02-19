import { useEffect, useState } from 'react'
import './styles/app.css'
import type { Catalog } from './lib/catalog'
import { loadCatalog } from './lib/catalog'
import { Home } from './pages/Home'
import { Play } from './pages/Play'

function getSlugFromUrl(): string | null {
  const u = new URL(window.location.href)
  if (u.pathname.startsWith('/play/')) return decodeURIComponent(u.pathname.replace('/play/', ''))
  return null
}

function setUrlForSlug(slug: string | null) {
  const url = slug ? `/play/${encodeURIComponent(slug)}` : `/`
  window.history.pushState({}, '', url)
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [slug, setSlug] = useState<string | null>(getSlugFromUrl())

  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => setCatalog({ rows: [] }))
    const onPop = () => setSlug(getSlugFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (!catalog) return null

  return (
    <>
      <Home
        catalog={catalog}
        onPlay={(s) => {
          setUrlForSlug(s)
          setSlug(s)
        }}
      />
      {slug ? (
        <Play
          slug={slug}
          catalog={catalog}
          onClose={() => {
            setUrlForSlug(null)
            setSlug(null)
          }}
        />
      ) : null}
    </>
  )
}
