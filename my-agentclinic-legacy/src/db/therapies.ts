import type { Slot } from '../time'
import type { DeleteResult } from './agents'
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

/** A therapy's editable fields: everything except the id. */
export type TherapyInput = Omit<Therapy, 'id'>

/** Adds a therapy and returns the new id. */
export function createTherapy(db: Db, therapy: TherapyInput): number {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO therapies (name, description, duration_minutes)
       VALUES (@name, @description, @durationMinutes)`,
    )
    .run(therapy)
  return Number(lastInsertRowid)
}

/** Saves a therapy's fields. Returns false when there's no therapy with that id. */
export function updateTherapy(db: Db, id: number, therapy: TherapyInput): boolean {
  const { changes } = db
    .prepare(
      `UPDATE therapies SET name = @name, description = @description, duration_minutes = @durationMinutes
       WHERE id = @id`,
    )
    .run({ ...therapy, id })
  return changes > 0
}

/** Whether another therapy already uses this name, ignoring case. `ignoreId` skips the therapy being edited. */
export function therapyNameTaken(db: Db, name: string, ignoreId?: number): boolean {
  const row = db
    .prepare('SELECT 1 FROM therapies WHERE lower(name) = lower(?) AND id IS NOT ?')
    .get(name, ignoreId ?? null)
  return row !== undefined
}

/** Scheduled appointments for the therapy that haven't started yet (the same rule as `isChangeable`). */
export function countUpcomingAppointmentsForTherapy(db: Db, id: number, now: Slot): number {
  return db
    .prepare("SELECT count(*) FROM appointments WHERE therapy_id = ? AND status = 'scheduled' AND starts_at > ?")
    .pluck()
    .get(id, now) as number
}

/** How many appointments of any status use the therapy. */
export function countAppointmentsForTherapy(db: Db, id: number): number {
  return db.prepare('SELECT count(*) FROM appointments WHERE therapy_id = ?').pluck().get(id) as number
}

/**
 * Deletes a therapy and its ailment links. Therapies with any appointment (upcoming, past, or
 * cancelled) are kept, so the schedule's history stays whole. Checks and deletes in one transaction.
 */
export function deleteTherapy(db: Db, id: number): DeleteResult {
  return db.transaction((): DeleteResult => {
    if (!getTherapy(db, id)) return 'not-found'
    if (countAppointmentsForTherapy(db, id) > 0) return 'has-appointments'
    db.prepare('DELETE FROM therapies WHERE id = ?').run(id)
    return 'ok'
  })()
}

/** How many ailments the therapy is linked to. */
export function countAilmentLinksForTherapy(db: Db, id: number): number {
  return db.prepare('SELECT count(*) FROM ailment_therapies WHERE therapy_id = ?').pluck().get(id) as number
}
