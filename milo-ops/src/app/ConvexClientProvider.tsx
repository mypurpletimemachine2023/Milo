'use client'

import { ConvexReactClient } from 'convex/react'
import { ConvexProvider } from 'convex/react'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_CONVEX_URL is not set. Convex realtime will not work.')
}

const client = convexUrl ? new ConvexReactClient(convexUrl) : null

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  if (!client) return children
  return <ConvexProvider client={client}>{children}</ConvexProvider>
}
