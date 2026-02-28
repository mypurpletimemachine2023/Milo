#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CFG = path.join(ROOT, 'config.json')

function die(msg) {
  console.error(msg)
  process.exit(1)
}

function validate() {
  if (!fs.existsSync(CFG)) {
    die(`Missing config.json. Copy config.example.json -> config.json\nPath: ${CFG}`)
  }
  const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'))
  if (!cfg.provider) die('config.json: provider is required')
  if (!cfg.projects || !cfg.projects['purple-time-machine']) {
    console.warn('config.json: projects.purple-time-machine missing (ok if you use another project)')
  }

  if (cfg.provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      die('OPENAI_API_KEY is missing in environment. Export it and retry.')
    }
  } else {
    die(`Unsupported provider: ${cfg.provider} (only "openai" implemented right now)`)
  }

  console.log('OK: config + env look good.')
}

const mode = process.argv.includes('--validate') ? 'validate' : null
if (mode === 'validate') validate()
else {
  console.log('Usage: node skills/local-ai-art/scripts/onboarding.js --validate')
}
