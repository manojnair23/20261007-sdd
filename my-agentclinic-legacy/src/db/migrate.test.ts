import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openDb, type Db } from './connection'
import { pendingMigrations, runMigrations } from './migrate'

const fixtures = join(__dirname, '__fixtures__')

const versions = (db: Db) => db.prepare('SELECT version FROM schema_migrations ORDER BY version').pluck().all()

const tableExists = (db: Db, name: string) =>
  db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined

describe('pendingMigrations', () => {
  it('sorts by filename whatever order the folder lists them in', () => {
    const files = ['0003_c.sql', '0001_a.sql', '0002_b.sql']
    expect(pendingMigrations(files, new Set())).toEqual(['0001_a.sql', '0002_b.sql', '0003_c.sql'])
  })

  it('skips applied files and non-SQL files, and matches .sql in any case', () => {
    const files = ['0002_b.SQL', 'README.txt', '0001_a.sql', '0003_c.sql']
    expect(pendingMigrations(files, new Set(['0001_a.sql']))).toEqual(['0002_b.SQL', '0003_c.sql'])
  })
})

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
