import type { Db } from './connection'
import { resetDemo, seedAppointments, seedCatalog } from './seedData'

export type Seeder = (db: Db, now: Date) => void

// Seeding resets the demo: clear every domain table, then insert the playful data.
export const seeders: Seeder[] = [resetDemo, seedCatalog, seedAppointments]

type SeedOptions = {
  now?: Date
  list?: Seeder[]
}

/** Runs each seeder in order inside one transaction. Returns how many ran. */
export function runSeed(db: Db, { now = new Date(), list = seeders }: SeedOptions = {}): number {
  db.transaction(() => {
    for (const seed of list) seed(db, now)
  })()
  return list.length
}
