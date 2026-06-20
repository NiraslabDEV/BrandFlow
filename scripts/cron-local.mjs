// pnpm cron:local — dispara os crons localmente contra o servidor dev.
// Lê CRON_SECRET / APP_BASE_URL do ambiente (apps/web/.env.local em dev).
// Uso: node scripts/cron-local.mjs [dispatch-stories|flush-notifications|all]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Carrega apps/web/.env.local sem dependências (dev local).
function loadEnv() {
  try {
    const file = resolve(process.cwd(), 'apps/web/.env.local')
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {
    /* sem .env.local: usa o ambiente do shell */
  }
}
loadEnv()

const BASE = process.env.APP_BASE_URL || 'http://localhost:3000'
const SECRET = process.env.CRON_SECRET
if (!SECRET) {
  console.error('CRON_SECRET ausente (apps/web/.env.local).')
  process.exit(1)
}

async function hit(path) {
  const res = await fetch(`${BASE}/api/cron/${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${SECRET}` },
  })
  const json = await res.json().catch(() => ({}))
  console.log(`POST /api/cron/${path} → ${res.status}`, JSON.stringify(json))
  return res.ok
}

const which = process.argv[2] || 'all'
const targets =
  which === 'all' ? ['dispatch-stories', 'flush-notifications'] : [which]

for (const t of targets) {
  // eslint-disable-next-line no-await-in-loop
  await hit(t)
}
