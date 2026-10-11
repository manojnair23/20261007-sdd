import type { Db } from './connection'

export type Seeder = (db: Db) => void

// Empty for now; Phase 2 adds the playful agents, ailments, and therapies.
export const seeders: Seeder[] = []

/** Runs each seeder in order inside one transaction. Returns how many ran. */
export function runSeed(db: Db, list: Seeder[] = seeders): number {
  db.transaction(() => {
    for (const seed of list) seed(db)
  })()
  return list.length
}
