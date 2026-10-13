import type { Slot } from '../time'
import type { Db } from './connection'

export type AppointmentStatus = 'scheduled' | 'cancelled'

export type Appointment = {
  id: number
  agentId: number
  agentName: string
  therapyId: number
  therapyName: string
  durationMinutes: number
  startsAt: Slot
  status: AppointmentStatus
}

export type GroupedAppointments = {
  upcoming: Appointment[]
  past: Appointment[]
  cancelled: Appointment[]
}

export type NewAppointment = {
  agentId: number
  therapyId: number
  startsAt: Slot
}

/** Why an appointment can't be changed, or `ok`. */
export type ChangeResult = 'ok' | 'not-found' | 'not-changeable'

const SELECT = `
  SELECT ap.id, ap.agent_id AS agentId, ag.name AS agentName,
         ap.therapy_id AS therapyId, t.name AS therapyName, t.duration_minutes AS durationMinutes,
         ap.starts_at AS startsAt, ap.status
  FROM appointments ap
  JOIN agents ag ON ag.id = ap.agent_id
  JOIN therapies t ON t.id = ap.therapy_id`

/** Only scheduled appointments that haven't started yet can be cancelled or rescheduled. */
export const isChangeable = (appointment: Appointment, now: Slot) =>
  appointment.status === 'scheduled' && appointment.startsAt > now

/** Groups appointments into upcoming (soonest first), past and cancelled (most recent first). */
export function listAppointments(db: Db, now: Slot, { agentId }: { agentId?: number } = {}): GroupedAppointments {
  const rows = (
    agentId === undefined
      ? db.prepare(`${SELECT} ORDER BY ap.starts_at, ap.id`).all()
      : db.prepare(`${SELECT} WHERE ap.agent_id = ? ORDER BY ap.starts_at, ap.id`).all(agentId)
  ) as Appointment[]

  return {
    upcoming: rows.filter((a) => isChangeable(a, now)),
    past: rows.filter((a) => a.status === 'scheduled' && a.startsAt <= now).reverse(),
    cancelled: rows.filter((a) => a.status === 'cancelled').reverse(),
  }
}

export function countAppointments(db: Db): number {
  return db.prepare('SELECT count(*) FROM appointments').pluck().get() as number
}

export function getAppointment(db: Db, id: number): Appointment | undefined {
  return db.prepare(`${SELECT} WHERE ap.id = ?`).get(id) as Appointment | undefined
}

/** The agent's scheduled appointments starting on the given date ("YYYY-MM-DD"). */
export function listScheduledForAgentOnDate(db: Db, agentId: number, date: string): Appointment[] {
  return db
    .prepare(
      `${SELECT} WHERE ap.agent_id = ? AND ap.status = 'scheduled' AND substr(ap.starts_at, 1, 10) = ?
       ORDER BY ap.starts_at`,
    )
    .all(agentId, date) as Appointment[]
}

export function createAppointment(db: Db, value: NewAppointment, now: Date): number {
  const stamp = now.toISOString()
  const result = db
    .prepare(
      `INSERT INTO appointments (agent_id, therapy_id, starts_at, status, created_at, updated_at)
       VALUES (?, ?, ?, 'scheduled', ?, ?)`,
    )
    .run(value.agentId, value.therapyId, value.startsAt, stamp, stamp)
  return Number(result.lastInsertRowid)
}

function change(db: Db, id: number, now: Date, nowSlot: Slot, apply: (stamp: string) => void): ChangeResult {
  const appointment = getAppointment(db, id)
  if (!appointment) return 'not-found'
  if (!isChangeable(appointment, nowSlot)) return 'not-changeable'
  apply(now.toISOString())
  return 'ok'
}

export function cancelAppointment(db: Db, id: number, now: Date, nowSlot: Slot): ChangeResult {
  return change(db, id, now, nowSlot, (stamp) => {
    db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = ? WHERE id = ?").run(stamp, id)
  })
}

export function rescheduleAppointment(db: Db, id: number, startsAt: Slot, now: Date, nowSlot: Slot): ChangeResult {
  return change(db, id, now, nowSlot, (stamp) => {
    db.prepare('UPDATE appointments SET starts_at = ?, updated_at = ? WHERE id = ?').run(startsAt, stamp, id)
  })
}
