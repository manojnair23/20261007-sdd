import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openDb, type Db } from './connection'
import { runMigrations } from './migrate'

const fixtures = join(__dirname, '__fixtures__')

const versions = (db: Db) =>
  db.prepare('SELECT version FROM schema_migrations ORDER BY version').pluck().all()

const tableExists = (db: Db, name: string) =>
  db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined

describe('runMigrations', () => {
  it('applies pending .sql files in filename order and records each one', () => {
    const db = openDb(':memory:')
    const applied = runMigrations(db, join(fixtures, 'ordered'))

    expect(applied).toEqual(['0001_create_table.sql', '0002_add_column.sql'])
    expect(versions(db)).toEqual(applied)
    const columns = db.prepare('SELECT name FROM pragma_table_info(?)').pluck().all('patients')
    expect(columns).toEqual(['id', 'name', 'mood'])
  })

  it('applies nothing on a second run', () => {
    const db = openDb(':memory:')
    runMigrations(db, join(fixtures, 'ordered'))

    expect(runMigrations(db, join(fixtures, 'ordered'))).toEqual([])
    expect(versions(db)).toHaveLength(2)
  })

  it('rolls back a failing migration, names it, and keeps earlier ones applied', () => {
    const db = openDb(':memory:')

    expect(() => runMigrations(db, join(fixtures, 'broken'))).toThrow(/0002_bad\.sql/)
    expect(versions(db)).toEqual(['0001_ok.sql'])
    expect(tableExists(db, 'patients')).toBe(true)
    expect(tableExists(db, 'half_applied')).toBe(false)
  })

  it('applies the real migrations folder cleanly', () => {
    const db = openDb(':memory:')

    expect(runMigrations(db)).toContain('0001_init.sql')
    expect(versions(db)).toContain('0001_init.sql')
  })
})
