import { describe, expect, it } from 'vitest'
import { get, testApp } from '../test/testApp'
import { AGENT_NOTICES } from './agents/AgentPage'
import { AGENTS_NOTICES } from './agents/AgentsPage'
import { AILMENT_NOTICES } from './ailments/AilmentPage'
import { AILMENTS_NOTICES } from './ailments/AilmentsPage'
import { NOTICES as APPOINTMENT_NOTICES } from './appointments/AppointmentsPage'
import { THERAPIES_NOTICES } from './therapies/TherapiesPage'

// Every page that shows a notice, with the notices it knows.
const PAGES: [string, Record<string, string>][] = [
  ['/agents', AGENTS_NOTICES],
  ['/agents/1', AGENT_NOTICES],
  ['/ailments', AILMENTS_NOTICES],
  ['/ailments/1', AILMENT_NOTICES],
  ['/therapies', THERAPIES_NOTICES],
  ['/appointments', APPOINTMENT_NOTICES],
]

// "<Record> <verb>. <a short, kind line>." See Notice in components.tsx.
const PATTERN =
  /^(Agent|Ailment|Therapy|Appointment) (added|updated|deleted|assigned|unassigned|linked|unlinked|booked|rescheduled|cancelled)\. [A-Z][^.]*\.$/

describe('notices', () => {
  it.each(PAGES.flatMap(([path, notices]) => Object.entries(notices).map(([key, text]) => [path, key, text])))(
    '%s?notice=%s reads as a notice should',
    (_path, _key, text) => {
      expect(text).toMatch(PATTERN)
    },
  )

  it.each(PAGES)('%s shows each of its notices, and nothing for unknown values', async (path, notices) => {
    const { app } = testApp()
    for (const [key, text] of Object.entries(notices)) {
      expect((await get(app, `${path}?notice=${key}`)).body).toContain(
        `<div role="status" class="notice">${text.replace(/'/g, '&#39;')}</div>`,
      )
    }
    for (const unknown of ['nope', 'toString', '__proto__']) {
      expect((await get(app, `${path}?notice=${unknown}`)).body).toContain('<div role="status"></div>')
    }
  })
})
