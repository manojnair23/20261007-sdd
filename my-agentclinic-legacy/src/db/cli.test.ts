import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { openDb, type Db } from './connection'

// Runs the real CLI in a child process against a database in a fresh temp folder.
const cli = join(__dirname, 'cli.ts')
const dir = mkdtempSync(join(tmpdir(), 'agentclinic-cli-'))
const dbPath = join(dir, 'nested', 'clinic.db')

const run = (...args: string[]) =>
  spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, DB_PATH: dbPath },
  })

afterAll(() => rmSync(dir, { recursive: true, force: true }))

/** Opens the CLI's database file directly, runs `fn`, and closes it again. */
const withDb = <T>(fn: (db: Db) => T): T => {
  const db = openDb(dbPath)
  try {
    return fn(db)
  } finally {
    db.close()
  }
}

const cancelledCount = (db: Db) =>
  db.prepare("SELECT count(*) FROM appointments WHERE status = 'cancelled'").pluck().get()

describe('db CLI', () => {
  it('migrate creates the database and applies every migration', () => {
    const result = run('migrate')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('0001_init.sql')
    expect(result.stdout).toContain('0005_appointments.sql')
    expect(existsSync(dbPath)).toBe(true)
  })

  it('migrate a second time has nothing to apply', () => {
    const result = run('migrate')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No migrations to apply')
  })

  it('seeds an empty clinic without --force', () => {
    const result = run('seed')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Resetting demo data')
    expect(result.stdout).toContain('Ran 3 seeder(s).')
  })

  it('refuses to wipe existing appointments without --force, and changes nothing', () => {
    withDb((db) => db.prepare("UPDATE appointments SET status = 'cancelled'").run())

    const result = run('seed')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('The clinic has 4 appointment(s). Re-run with --force')
    expect(result.stdout).not.toContain('Resetting demo data')
    expect(withDb(cancelledCount)).toBe(4)
  })

  it('resets the clinic with --force', () => {
    const result = run('seed', '--force')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Resetting demo data')
    expect(withDb(cancelledCount)).toBe(1)
  })

  it('rejects unknown flags', () => {
    const result = run('seed', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage:')
  })

  it('prints usage and exits non-zero on an unknown command', () => {
    const result = run('nope')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage:')
  })
})
