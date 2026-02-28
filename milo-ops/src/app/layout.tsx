import './globals.css'
import type { Metadata } from 'next'
import { TopNav } from '../components/TopNav'
import { ConvexClientProvider } from './ConvexClientProvider'

export const metadata: Metadata = {
  title: 'Milo Ops',
  description: 'Mission Control for Milo + agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#05060a] text-white">
        <ConvexClientProvider>
          <TopNav />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
