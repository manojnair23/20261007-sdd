import type { Agent } from './agents'
import type { Db } from './connection'

export type Ailment = {
  id: number
  name: string
  description: string
}

export type AilmentWithCount = Ailment & { agentCount: number }

export function listAilments(db: Db): AilmentWithCount[] {
  return db
    .prepare(
      `SELECT a.id, a.name, a.description, count(aa.agent_id) AS agentCount
       FROM ailments a
       LEFT JOIN agent_ailments aa ON aa.ailment_id = a.id
       GROUP BY a.id
       ORDER BY a.name`,
    )
    .all() as AilmentWithCount[]
}

export function getAilment(db: Db, id: number): Ailment | undefined {
  return db.prepare('SELECT id, name, description FROM ailments WHERE id = ?').get(id) as Ailment | undefined
}

export function listAgentsWithAilment(db: Db, ailmentId: number): Agent[] {
  return db
    .prepare(
      `SELECT ag.id, ag.name, ag.model, ag.bio
       FROM agents ag
       JOIN agent_ailments aa ON aa.agent_id = ag.id
       WHERE aa.ailment_id = ?
       ORDER BY ag.name`,
    )
    .all(ailmentId) as Agent[]
}

export function listAilmentsForAgent(db: Db, agentId: number): Ailment[] {
  return db
    .prepare(
      `SELECT a.id, a.name, a.description
       FROM ailments a
       JOIN agent_ailments aa ON aa.ailment_id = a.id
       WHERE aa.agent_id = ?
       ORDER BY a.name`,
    )
    .all(agentId) as Ailment[]
}

/** Ailments the agent doesn't have yet, for the "add an ailment" list. */
export function listAilmentsNotForAgent(db: Db, agentId: number): Ailment[] {
  return db
    .prepare(
      `SELECT a.id, a.name, a.description
       FROM ailments a
       WHERE a.id NOT IN (SELECT ailment_id FROM agent_ailments WHERE agent_id = ?)
       ORDER BY a.name`,
    )
    .all(agentId) as Ailment[]
}

/** Gives an agent an ailment. Assigning one they already have changes nothing. */
export function assignAilment(db: Db, agentId: number, ailmentId: number): void {
  db.prepare('INSERT OR IGNORE INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)').run(agentId, ailmentId)
}

/** Takes an ailment off an agent. Removing one they don't have changes nothing. */
export function unassignAilment(db: Db, agentId: number, ailmentId: number): void {
  db.prepare('DELETE FROM agent_ailments WHERE agent_id = ? AND ailment_id = ?').run(agentId, ailmentId)
}
