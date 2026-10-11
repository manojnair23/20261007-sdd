import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Db } from './connection'

// Resolve from this module (src/db/ or dist/db/) so migrations are found from any working directory.
export const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations')

/** Returns the migration files not yet applied, sorted by filename. Matches `.sql` case-insensitively. */
export function pendingMigrations(files: string[], applied: ReadonlySet<string>): string[] {
  return files.filter((file) => /\.sql$/i.test(file) && !applied.has(file)).sort()
}

/**
 * Applies pending `*.sql` files in filename order, each in its own transaction. Returns the files applied.
 *
 * Because each file already runs inside a transaction, migrations must not contain `BEGIN`/`COMMIT`,
 * and `PRAGMA foreign_keys` has no effect inside them.
 */
export function runMigrations(db: Db, dir: string = MIGRATIONS_DIR): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').pluck().all() as string[],
  )
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  const pending = pendingMigrations(files, applied)

  const record = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
  for (const file of pending) {
    try {
      const sql = readFileSync(join(dir, file), 'utf8')
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
