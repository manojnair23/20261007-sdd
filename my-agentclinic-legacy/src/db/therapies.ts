import type { Db } from './connection'

export type Therapy = {
  id: number
  name: string
  description: string
  durationMinutes: number
}

export type TherapyWithAilments = Therapy & { ailments: { id: number; name: string }[] }

const COLUMNS = 't.id, t.name, t.description, t.duration_minutes AS durationMinutes'

export function listTherapies(db: Db): TherapyWithAilments[] {
  const therapies = db.prepare(`SELECT ${COLUMNS} FROM therapies t ORDER BY t.name`).all() as Therapy[]
  const links = db
    .prepare(
      `SELECT at.therapy_id AS therapyId, a.id, a.name
       FROM ailment_therapies at
       JOIN ailments a ON a.id = at.ailment_id
       ORDER BY a.name`,
    )
    .all() as { therapyId: number; id: number; name: string }[]

  return therapies.map((therapy) => ({
    ...therapy,
    ailments: links.filter((l) => l.therapyId === therapy.id).map(({ id, name }) => ({ id, name })),
  }))
}

export function getTherapy(db: Db, id: number): Therapy | undefined {
  return db.prepare(`SELECT ${COLUMNS} FROM therapies t WHERE t.id = ?`).get(id) as Therapy | undefined
}

export function listTherapiesForAilment(db: Db, ailmentId: number): Therapy[] {
  return db
    .prepare(
      `SELECT ${COLUMNS}
       FROM therapies t
       JOIN ailment_therapies at ON at.therapy_id = t.id
       WHERE at.ailment_id = ?
       ORDER BY t.name`,
    )
    .all(ailmentId) as Therapy[]
}

/** Therapies that treat at least one of the agent's ailments. */
export function listRecommendedTherapies(db: Db, agentId: number): Therapy[] {
  return db
    .prepare(
      `SELECT DISTINCT ${COLUMNS}
       FROM therapies t
       JOIN ailment_therapies at ON at.therapy_id = t.id
       JOIN agent_ailments aa ON aa.ailment_id = at.ailment_id
       WHERE aa.agent_id = ?
       ORDER BY t.name`,
    )
    .all(agentId) as Therapy[]
}

/** Therapies not yet linked to the ailment, for the "add a therapy" list. */
export function listTherapiesNotForAilment(db: Db, ailmentId: number): Therapy[] {
  return db
    .prepare(
      `SELECT ${COLUMNS}
       FROM therapies t
       WHERE t.id NOT IN (SELECT therapy_id FROM ailment_therapies WHERE ailment_id = ?)
       ORDER BY t.name`,
    )
    .all(ailmentId) as Therapy[]
}

/** Records that a therapy treats an ailment. Linking a pair that's already linked changes nothing. */
export function linkTherapy(db: Db, ailmentId: number, therapyId: number): void {
  db.prepare('INSERT OR IGNORE INTO ailment_therapies (ailment_id, therapy_id) VALUES (?, ?)').run(ailmentId, therapyId)
}

/** Removes the link between an ailment and a therapy. Unlinking a pair that isn't linked changes nothing. */
export function unlinkTherapy(db: Db, ailmentId: number, therapyId: number): void {
  db.prepare('DELETE FROM ailment_therapies WHERE ailment_id = ? AND therapy_id = ?').run(ailmentId, therapyId)
}
