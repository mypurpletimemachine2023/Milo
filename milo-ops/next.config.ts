import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid Next picking the wrong workspace root when multiple lockfiles exist.
    root: path.resolve(__dirname),
  },
}

export default nextConfig
