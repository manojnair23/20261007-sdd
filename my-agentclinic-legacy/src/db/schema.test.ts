import { describe, expect, it } from 'vitest'
import { testApp } from '../test/testApp'

// The database enforces integrity on its own, whatever the data layer does.
describe('schema constraints', () => {
  const { db } = testApp()
  const stamp = '2026-10-12T10:00:00.000Z'

  it('rejects duplicate names', () => {
    expect(() =>
      db.prepare("INSERT INTO agents (name, model, bio) VALUES ('GPT-Overthinker', 'x', 'x')").run(),
    ).toThrow(/UNIQUE/)
    expect(() => db.prepare("INSERT INTO ailments (name, description) VALUES ('Prompt fatigue', 'x')").run()).toThrow(
      /UNIQUE/,
    )
  })

  it('rejects a blank name', () => {
    expect(() => db.prepare("INSERT INTO agents (name, model, bio) VALUES ('  ', 'x', 'x')").run()).toThrow(/CHECK/)
  })

  it('rejects a therapy that takes no time', () => {
    expect(() =>
      db.prepare("INSERT INTO therapies (name, description, duration_minutes) VALUES ('Instant cure', 'x', 0)").run(),
    ).toThrow(/CHECK/)
  })

  it('rejects an unknown appointment status or a malformed time', () => {
    const insert = db.prepare(
      'INSERT INTO appointments (agent_id, therapy_id, starts_at, status, created_at, updated_at) VALUES (1, 1, ?, ?, ?, ?)',
    )
    expect(() => insert.run('2026-10-20T10:00', 'completed', stamp, stamp)).toThrow(/CHECK/)
    expect(() => insert.run('next Tuesday', 'scheduled', stamp, stamp)).toThrow(/CHECK/)
  })

  it('rejects orphan foreign keys', () => {
    expect(() => db.prepare('INSERT INTO agent_ailments (agent_id, ailment_id) VALUES (999, 1)').run()).toThrow(
      /FOREIGN KEY/,
    )
    expect(() =>
      db
        .prepare(
          "INSERT INTO appointments (agent_id, therapy_id, starts_at, created_at, updated_at) VALUES (1, 999, '2026-10-20T10:00', ?, ?)",
        )
        .run(stamp, stamp),
    ).toThrow(/FOREIGN KEY/)
  })
})
