import type { Db } from './connection'

export type Agent = {
  id: number
  name: string
  model: string
  bio: string
}

export function listAgents(db: Db): Agent[] {
  return db.prepare('SELECT id, name, model, bio FROM agents ORDER BY name').all() as Agent[]
}

export function getAgent(db: Db, id: number): Agent | undefined {
  return db.prepare('SELECT id, name, model, bio FROM agents WHERE id = ?').get(id) as Agent | undefined
}

/** An agent's editable fields: everything except the id. */
export type AgentInput = Omit<Agent, 'id'>

/** Adds an agent and returns the new id. */
export function createAgent(db: Db, agent: AgentInput): number {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO agents (name, model, bio) VALUES (@name, @model, @bio)')
    .run(agent)
  return Number(lastInsertRowid)
}

/** Whether another agent already uses this name, ignoring case. `ignoreId` skips the agent being edited. */
export function agentNameTaken(db: Db, name: string, ignoreId?: number): boolean {
  const row = db
    .prepare('SELECT 1 FROM agents WHERE lower(name) = lower(?) AND id IS NOT ?')
    .get(name, ignoreId ?? null)
  return row !== undefined
}

/** Saves an agent's fields. Returns false when there's no agent with that id. */
export function updateAgent(db: Db, id: number, agent: AgentInput): boolean {
  const { changes } = db
    .prepare('UPDATE agents SET name = @name, model = @model, bio = @bio WHERE id = @id')
    .run({ ...agent, id })
  return changes > 0
}

/** How many appointments of any status the agent has. */
export function countAppointmentsForAgent(db: Db, id: number): number {
  const row = db.prepare('SELECT count(*) AS count FROM appointments WHERE agent_id = ?').get(id) as { count: number }
  return row.count
}

export type DeleteResult = 'ok' | 'not-found' | 'has-appointments'

/**
 * Deletes an agent and their ailment links. Agents with any appointment (upcoming, past, or
 * cancelled) are kept, so the schedule's history stays whole. Checks and deletes in one transaction.
 */
export function deleteAgent(db: Db, id: number): DeleteResult {
  return db.transaction((): DeleteResult => {
    if (!getAgent(db, id)) return 'not-found'
    if (countAppointmentsForAgent(db, id) > 0) return 'has-appointments'
    db.prepare('DELETE FROM agents WHERE id = ?').run(id)
    return 'ok'
  })()
}
