import { describe, expect, it } from 'vitest'
import { DEFAULT_DB_PATH, openDb, resolveDbPath } from './connection'

describe('openDb', () => {
  it('opens a database that answers queries', () => {
    const db = openDb(':memory:')
    expect(db.prepare('SELECT 1 AS one').get()).toEqual({ one: 1 })
    db.close()
  })

  it('enables foreign keys', () => {
    const db = openDb(':memory:')
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    db.close()
  })
})

describe('resolveDbPath', () => {
  it('uses DB_PATH when set', () => {
    expect(resolveDbPath({ DB_PATH: '/tmp/clinic.db' })).toBe('/tmp/clinic.db')
  })

  it('falls back to data/agentclinic.db when unset or blank', () => {
    expect(resolveDbPath({})).toBe(DEFAULT_DB_PATH)
    expect(resolveDbPath({ DB_PATH: '  ' })).toBe(DEFAULT_DB_PATH)
    expect(DEFAULT_DB_PATH).toMatch(/data[\\/]agentclinic\.db$/)
  })
})
