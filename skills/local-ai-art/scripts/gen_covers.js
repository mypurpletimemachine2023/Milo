#!/usr/bin/env node
/*
Generate 16:9 cover images for games in a project catalog.
Default provider: OpenAI Images API via fetch (Node 18+).

Usage:
  node skills/local-ai-art/scripts/gen_covers.js --project purple-time-machine --missing-only
  node skills/local-ai-art/scripts/gen_covers.js --project purple-time-machine --dry-run
  node skills/local-ai-art/scripts/gen_covers.js --project purple-time-machine --missing-only --local-placeholder
*/

const fs = require('fs')
const path = require('path')

const SKILL_ROOT = path.resolve(__dirname, '..')
const CFG_PATH = path.join(SKILL_ROOT, 'config.json')

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  return process.argv[i + 1] ?? true
}

const project = String(arg('project', 'purple-time-machine'))
const dryRun = !!arg('dry-run', false)
const missingOnly = !!arg('missing-only', false)
const localPlaceholder = !!arg('local-placeholder', false)
const limit = Number(arg('limit', '0')) // 0 = unlimited

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

function loadConfig() {
  if (!fileExists(CFG_PATH)) {
    throw new Error(`Missing config.json. Copy config.example.json -> config.json\nPath: ${CFG_PATH}`)
  }
  return readJson(CFG_PATH)
}

function buildPrompt({ game, style }) {
  const base = style?.look ?? ''
  const neg = style?.negative ? `\nNegative: ${style.negative}` : ''
  // Keep it consistent + no text
  return [
    base,
    `Subject: cover art for a microgame titled "${game.title}".`,
    `Theme row: ${game.row}.`,
    `Public-domain inspiration: ${game.source}.`,
    `Gameplay hook: ${game.oneLiner}`,
    `Composition: cinematic key art, centered subject, strong silhouette, readable at small size, no text.`,
    neg,
  ]
    .filter(Boolean)
    .join('\n')
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function localSvgPlaceholder({ game }) {
  // No text (per Alejandro). Deterministic per slug.
  const h = hashCode(game.slug)
  const a = (h % 360)
  const b = ((h * 7) % 360)
  const c = ((h * 13) % 360)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${a} 60% 18%)"/>
      <stop offset="0.55" stop-color="hsl(${b} 65% 10%)"/>
      <stop offset="1" stop-color="hsl(${c} 70% 8%)"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.20" r="0.9">
      <stop offset="0" stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="0.35" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.18"/>
      </feComponentTransfer>
    </filter>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="1024" height="576" fill="url(#bg)"/>
  <rect width="1024" height="576" fill="url(#glow)"/>

  <!-- cinematic silhouette block -->
  <g opacity="0.92" filter="url(#blur)">
    <path d="M620 160 C740 190 820 280 840 370 C860 470 790 530 670 520 C560 510 500 440 480 360 C460 280 500 130 620 160 Z" fill="rgba(0,0,0,0.55)"/>
    <path d="M280 430 C330 340 420 290 520 300 C610 310 700 380 740 460 C670 520 590 550 500 552 C400 550 325 520 280 430 Z" fill="rgba(0,0,0,0.38)"/>
  </g>

  <!-- rim light stroke -->
  <path d="M612 182 C718 210 790 290 806 365 C822 440 770 500 664 492 C566 484 522 426 506 362 C490 298 506 154 612 182 Z" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="6"/>

  <!-- vignette -->
  <rect width="1024" height="576" fill="rgba(0,0,0,0.35)"/>
  <rect width="1024" height="576" filter="url(#grain)" opacity="0.55"/>
</svg>`

  return Buffer.from(svg, 'utf8')
}

async function openaiImage({ prompt, model, size, quality }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model ?? 'gpt-image-1',
      prompt,
      size: size ?? '1024x576',
      quality: quality ?? 'high',
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI image generation failed (${res.status}): ${t}`)
  }

  const json = await res.json()
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI response missing b64_json')
  return Buffer.from(b64, 'base64')
}

async function main() {
  const cfg = loadConfig()
  const proj = cfg.projects?.[project]
  if (!proj) throw new Error(`Unknown project: ${project} (check config.json projects)`) 

  const WORKSPACE_ROOT = path.resolve(SKILL_ROOT, '..', '..')
  const catalogPath = path.resolve(WORKSPACE_ROOT, proj.catalogPath)
  const coversDir = path.resolve(WORKSPACE_ROOT, proj.coversDir)
  ensureDir(coversDir)

  const catalog = readJson(catalogPath)
  const games = catalog.rows.flatMap((r) => r.games)

  let n = 0
  for (const game of games) {
    if (limit && n >= limit) break

    const out = path.join(coversDir, `${game.slug}.jpg`)
    if (missingOnly && fileExists(out)) continue

    const prompt = buildPrompt({ game, style: cfg.style })

    if (dryRun) {
      console.log(`--- ${game.slug} -> ${out}`)
      console.log(prompt)
      n++
      continue
    }

    // Local-first mode: write deterministic SVG placeholders (no text).
    if (localPlaceholder) {
      const svgOut = out.replace(/\.jpg$/, '.svg')
      const svg = localSvgPlaceholder({ game })
      fs.writeFileSync(svgOut, svg)
      fs.writeFileSync(svgOut.replace(/\.svg$/, '.prompt.txt'), prompt)
      console.log(`Wrote ${svgOut}`)
      n++
      continue
    }

    if (cfg.provider !== 'openai') throw new Error(`Unsupported provider: ${cfg.provider}`)

    const buf = await openaiImage({
      prompt,
      model: cfg.openai?.model,
      size: cfg.openai?.size,
      quality: cfg.openai?.quality,
    })

    fs.writeFileSync(out, buf)
    fs.writeFileSync(out.replace(/\.jpg$/, '.prompt.txt'), prompt)
    console.log(`Wrote ${out}`)
    n++
  }

  console.log(`Done. Generated ${n} cover(s).`) 
}

main().catch((e) => {
  console.error(e?.stack ?? String(e))
  process.exit(1)
})
