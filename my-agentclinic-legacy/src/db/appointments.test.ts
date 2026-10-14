import { describe, expect, it } from 'vitest'
import { FIXED_NOW, testApp } from '../test/testApp'
import { toSlot } from '../time'
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointments,
  listScheduledForAgentOnDate,
  rescheduleAppointment,
} from './appointments'
import { agentDashboard, clinicStats } from './dashboard'

const NOW = toSlot(FIXED_NOW) // 2026-10-12T10:00
const slots = (rows: { startsAt: string }[]) => rows.map((r) => r.startsAt)

describe('listAppointments', () => {
  it('groups into upcoming (soonest first), past, and cancelled', () => {
    const { db } = testApp()
    const grouped = listAppointments(db, NOW)
    expect(slots(grouped.upcoming)).toEqual(['2026-10-13T10:00', '2026-10-14T14:00'])
    expect(slots(grouped.past)).toEqual(['2026-10-11T11:00'])
    expect(slots(grouped.cancelled)).toEqual(['2026-10-13T15:00'])
    expect(grouped.upcoming[0]).toMatchObject({
      agentName: 'GPT-Overthinker',
      therapyName: 'Clarifying-questions coaching',
      durationMinutes: 45,
      status: 'scheduled',
    })
  })

  it('moves an appointment from upcoming to past as the clock passes it', () => {
    const { db } = testApp()
    const later = listAppointments(db, '2026-10-13T10:00')
    expect(slots(later.upcoming)).toEqual(['2026-10-14T14:00'])
    expect(slots(later.past)).toEqual(['2026-10-13T10:00', '2026-10-11T11:00'])
  })

  it('filters by agent', () => {
    const { db } = testApp()
    const grouped = listAppointments(db, NOW, { agentId: 5 })
    expect(slots(grouped.upcoming)).toEqual(['2026-10-14T14:00'])
    expect(grouped.past).toEqual([])
  })
})

describe('changing appointments', () => {
  it('creates a scheduled appointment', () => {
    const { db } = testApp()
    const id = createAppointment(db, { agentId: 4, therapyId: 4, startsAt: '2026-10-15T09:00' }, FIXED_NOW)
    expect(getAppointment(db, id)).toMatchObject({ agentName: 'Prompta Vague', status: 'scheduled' })
    expect(slots(listScheduledForAgentOnDate(db, 4, '2026-10-15'))).toEqual(['2026-10-15T09:00'])
  })

  it('cancels and reschedules only upcoming scheduled appointments', () => {
    const { db } = testApp()
    const [upcoming] = listAppointments(db, NOW).upcoming
    const [past] = listAppointments(db, NOW).past
    const [cancelled] = listAppointments(db, NOW).cancelled

    expect(rescheduleAppointment(db, upcoming.id, '2026-10-16T11:00', FIXED_NOW, NOW)).toBe('ok')
    expect(getAppointment(db, upcoming.id)?.startsAt).toBe('2026-10-16T11:00')
    expect(cancelAppointment(db, upcoming.id, FIXED_NOW, NOW)).toBe('ok')
    expect(getAppointment(db, upcoming.id)?.status).toBe('cancelled')

    expect(cancelAppointment(db, past.id, FIXED_NOW, NOW)).toBe('not-changeable')
    expect(rescheduleAppointment(db, cancelled.id, '2026-10-16T11:00', FIXED_NOW, NOW)).toBe('not-changeable')
    expect(cancelAppointment(db, 999, FIXED_NOW, NOW)).toBe('not-found')
  })
})

describe('dashboards', () => {
  it('counts the clinic and lists what is next', () => {
    const { db } = testApp()
    const stats = clinicStats(db, NOW)
    expect(stats).toMatchObject({ agents: 5, ailments: 6, upcoming: 2 })
    expect(slots(stats.next)).toEqual(['2026-10-13T10:00', '2026-10-14T14:00'])
  })

  it('reflects bookings and cancellations', () => {
    const { db } = testApp()
    createAppointment(db, { agentId: 3, therapyId: 5, startsAt: '2026-10-12T11:00' }, FIXED_NOW)
    expect(clinicStats(db, NOW).upcoming).toBe(3)
    expect(clinicStats(db, NOW).next[0].startsAt).toBe('2026-10-12T11:00')

    cancelAppointment(db, clinicStats(db, NOW).next[0].id, FIXED_NOW, NOW)
    expect(clinicStats(db, NOW).upcoming).toBe(2)
  })

  it("gathers an agent's ailments, recommended therapies, and appointments", () => {
    const { db } = testApp()
    const dashboard = agentDashboard(db, 2, NOW)!
    expect(dashboard.agent.name).toBe('Captain Hallucination')
    expect(dashboard.ailments.map((a) => [a.name, a.therapies.map((t) => t.name)])).toEqual([
      ['Hallucination anxiety', ['Citation grounding', 'Guided temperature reduction']],
      ['Temperature dysregulation', ['Guided temperature reduction']],
    ])
    expect(dashboard.upcoming).toEqual([])
    expect(slots(dashboard.cancelled)).toEqual(['2026-10-13T15:00'])
    expect(agentDashboard(db, 999, NOW)).toBeUndefined()
  })
})
