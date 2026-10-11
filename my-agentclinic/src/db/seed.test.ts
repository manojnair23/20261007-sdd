import { describe, expect, it } from 'vitest'
import { openDb, type Db } from './connection'
import { runSeed, type Seeder } from './seed'

const userTables = (db: Db) =>
  db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all()

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
  it('runs the default (empty) seeder list without writing anything', () => {
    const db = openDb(':memory:')
    expect(runSeed(db)).toBe(0)
    expect(userTables(db)).toEqual([])
  })

  it('runs seeders in order', () => {
    const { db, log, entries } = withLog()
    expect(runSeed(db, [log('first'), log('second')])).toBe(2)
    expect(entries()).toEqual(['first', 'second'])
  })

  it('rolls back the whole run when a seeder throws', () => {
    const { db, log, entries } = withLog()
    const boom: Seeder = () => {
      throw new Error('seed failed')
    }

    expect(() => runSeed(db, [log('first'), boom])).toThrow('seed failed')
    expect(entries()).toEqual([])
  })
})
