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
