import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'

export type Db = Database.Database

// Resolve from this module (src/db/ or dist/db/) so the default works from any working directory.
export const DEFAULT_DB_PATH = join(__dirname, '..', '..', 'data', 'agentclinic.db')

const MEMORY = ':memory:'

/** Returns `DB_PATH` when set and non-blank, otherwise `data/agentclinic.db` at the repo root. */
export function resolveDbPath(env: NodeJS.ProcessEnv): string {
  const path = env.DB_PATH?.trim()
  return path ? path : DEFAULT_DB_PATH
}

/** Opens a SQLite database with foreign keys on, and WAL journaling for file databases. */
export function openDb(path: string): Db {
  const isFile = path !== MEMORY
  if (isFile) mkdirSync(dirname(path), { recursive: true })

  const db = new Database(path)
  db.pragma('foreign_keys = ON')
  if (isFile) db.pragma('journal_mode = WAL')
  return db
}
