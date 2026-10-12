import { describe, expect, it } from 'vitest'
import { openDb, type Db } from './connection'
import { runMigrations } from './migrate'
import { runSeed, type Seeder } from './seed'

const TABLES = ['agents', 'ailments', 'agent_ailments', 'therapies', 'ailment_therapies', 'appointments']
const NOW = new Date(2026, 9, 12, 10, 0)

const counts = (db: Db) =>
  Object.fromEntries(TABLES.map((t) => [t, db.prepare(`SELECT count(*) FROM ${t}`).pluck().get()]))

const migrated = () => {
  const db = openDb(':memory:')
  runMigrations(db)
  return db
}

const withLog = () => {
  const db = openDb(':memory:')
  db.exec('CREATE TABLE log (entry TEXT NOT NULL)')
  const log = (entry: string): Seeder => (d) => {
    d.prepare('INSERT INTO log (entry) VALUES (?)').run(entry)
  }
  const entries = () => db.prepare('SELECT entry FROM log ORDER BY rowid').pluck().all()
  return { db, log, entries }
}

describe('runSeed', () => {
  it('fills every domain table with the demo data', () => {
    const db = migrated()
    runSeed(db, { now: NOW })
    expect(counts(db)).toEqual({
      agents: 5,
      ailments: 6,
      agent_ailments: 9,
      therapies: 6,
      ailment_therapies: 9,
      appointments: 4,
    })
  })

  it('resets the demo, so seeding twice gives the same rows', () => {
    const db = migrated()
    runSeed(db, { now: NOW })
    const first = counts(db)
    db.prepare("UPDATE appointments SET status = 'cancelled'").run()

    runSeed(db, { now: NOW })
    expect(counts(db)).toEqual(first)
    expect(db.prepare("SELECT count(*) FROM appointments WHERE status = 'cancelled'").pluck().get()).toBe(1)
  })

  it('places the seeded appointments relative to the seed time', () => {
    const db = migrated()
    runSeed(db, { now: NOW })
    expect(db.prepare('SELECT starts_at, status FROM appointments ORDER BY starts_at').all()).toEqual([
      { starts_at: '2026-10-11T11:00', status: 'scheduled' },
      { starts_at: '2026-10-13T10:00', status: 'scheduled' },
      { starts_at: '2026-10-13T15:00', status: 'cancelled' },
      { starts_at: '2026-10-14T14:00', status: 'scheduled' },
    ])
  })

  it('runs custom seeders in order and passes the seed time', () => {
    const { db, log, entries } = withLog()
    const stamp: Seeder = (d, now) => log(now.toISOString())(d, now)
    expect(runSeed(db, { now: NOW, list: [log('first'), stamp] })).toBe(2)
    expect(entries()).toEqual(['first', NOW.toISOString()])
  })

  it('rolls back the whole run when a seeder throws', () => {
    const { db, log, entries } = withLog()
    const boom: Seeder = () => {
      throw new Error('seed failed')
    }

    expect(() => runSeed(db, { list: [log('first'), boom] })).toThrow('seed failed')
    expect(entries()).toEqual([])
  })
})
