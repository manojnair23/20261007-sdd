import type { Slot } from '../time'
import { getAgent, type Agent } from './agents'
import { listAilmentsForAgent, type Ailment } from './ailments'
import { listAppointments, type Appointment } from './appointments'
import type { Db } from './connection'
import { listTherapiesForAilment, type Therapy } from './therapies'

export type ClinicStats = {
  agents: number
  ailments: number
  upcoming: number
  next: Appointment[]
}

export type AgentDashboard = {
  agent: Agent
  ailments: (Ailment & { therapies: Therapy[] })[]
  upcoming: Appointment[]
  past: Appointment[]
  cancelled: Appointment[]
}

const count = (db: Db, table: 'agents' | 'ailments') =>
  db.prepare(`SELECT count(*) FROM ${table}`).pluck().get() as number

export function clinicStats(db: Db, now: Slot, nextLimit = 5): ClinicStats {
  const { upcoming } = listAppointments(db, now)
  return {
    agents: count(db, 'agents'),
    ailments: count(db, 'ailments'),
    upcoming: upcoming.length,
    next: upcoming.slice(0, nextLimit),
  }
}

export function agentDashboard(db: Db, agentId: number, now: Slot): AgentDashboard | undefined {
  const agent = getAgent(db, agentId)
  if (!agent) return undefined
  const ailments = listAilmentsForAgent(db, agentId).map((ailment) => ({
    ...ailment,
    therapies: listTherapiesForAilment(db, ailment.id),
  }))
  return { agent, ailments, ...listAppointments(db, now, { agentId }) }
}
