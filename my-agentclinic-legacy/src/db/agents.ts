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
