import { createApp } from '../app'
import { openDb } from '../db/connection'
import { runMigrations } from '../db/migrate'
import { runSeed } from '../db/seed'

/** Monday, Oct 12 2026, 10:00 clinic time. Seeded appointments are placed relative to this. */
export const FIXED_NOW = new Date(2026, 9, 12, 10, 0)

/** A migrated :memory: database (seeded unless `seed: false`) and an app on a fixed clock. */
export function testApp({ seed = true, now = FIXED_NOW }: { seed?: boolean; now?: Date } = {}) {
  const db = openDb(':memory:')
  runMigrations(db)
  if (seed) runSeed(db, { now })
  const app = createApp({ db, now: () => now })
  return { app, db }
}

/** Fetches a page and returns its status and body text. */
export async function get(app: ReturnType<typeof createApp>, path: string) {
  const res = await app.request(path)
  return { status: res.status, body: await res.text(), res }
}

/** Posts a URL-encoded form, without following redirects. */
export async function post(app: ReturnType<typeof createApp>, path: string, form: Record<string, string> = {}) {
  const res = await app.request(path, { method: 'POST', body: new URLSearchParams(form) })
  return { status: res.status, body: await res.text(), location: res.headers.get('location'), res }
}
