import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Db } from './connection'

// Resolve from this module (src/db/ or dist/db/) so migrations are found from any working directory.
export const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations')

/** Applies pending `*.sql` files in filename order, each in its own transaction. Returns the files applied. */
export function runMigrations(db: Db, dir: string = MIGRATIONS_DIR): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').pluck().all() as string[],
  )
  const pending = readdirSync(dir)
    .filter((file) => file.endsWith('.sql') && !applied.has(file))
    .sort()

  const record = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
  for (const file of pending) {
    const sql = readFileSync(join(dir, file), 'utf8')
    try {
      db.transaction(() => {
        db.exec(sql)
        record.run(file, new Date().toISOString())
      })()
    } catch (err) {
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`, { cause: err })
    }
  }
  return pending
}
