import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

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

describe('db CLI', () => {
  it('migrate creates the database and applies 0001_init.sql', () => {
    const result = run('migrate')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('0001_init.sql')
    expect(existsSync(dbPath)).toBe(true)
  })

  it('migrate a second time has nothing to apply', () => {
    const result = run('migrate')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No migrations to apply')
  })

  it('seed runs cleanly with zero seeders', () => {
    const result = run('seed')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Ran 0 seeder(s).')
  })

  it('prints usage and exits non-zero on an unknown command', () => {
    const result = run('nope')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage:')
  })
})
