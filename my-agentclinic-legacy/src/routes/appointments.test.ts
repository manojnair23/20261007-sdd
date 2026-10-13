import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import type { Db } from '../db/connection'
import { get, post, testApp } from '../test/testApp'

// Fixed clock: Mon Oct 12 2026, 10:00. Seeded appointments: 1 = GPT-Overthinker, Tue 10:00 (upcoming);
// 2 = Tokenia Tightwad, Wed 14:00 (upcoming); 3 = Loopy McRetry, Sun 11:00 (past); 4 = cancelled.
const count = (db: Db) => db.prepare('SELECT count(*) FROM appointments').pluck().get()
const statusOf = (db: Db, id: number) => db.prepare('SELECT status FROM appointments WHERE id = ?').pluck().get(id)

const valid = { agent: '4', therapy: '4', startsAt: '2026-10-13T11:00' }

describe('GET /appointments', () => {
  it('shows Upcoming, Past, and Cancelled sections in that order', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/appointments')
    expect(status).toBe(200)
    const order = ['Upcoming', 'Past', 'Cancelled'].map((h) => body.indexOf(`>${h}</h2>`))
    expect(order.every((i) => i > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(body).toContain('Tue, Oct 13, 2026, 10:00 AM')
    expect(body).toContain('<caption>Upcoming appointments, soonest first</caption>')
  })

  it('offers cancel and reschedule only on upcoming appointments', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/appointments')
    expect(body).toContain('action="/appointments/1/cancel"')
    expect(body).toContain('href="/appointments/2/reschedule"')
    expect(body).not.toContain('/appointments/3/cancel')
    expect(body).not.toContain('/appointments/4/cancel')
  })

  it('shows a notice after a change, and ignores unknown notices', async () => {
    const { app } = testApp()
    expect((await get(app, '/appointments?notice=booked')).body).toContain(
      '<div role="status" class="notice">Appointment booked. Deep breaths until then.</div>',
    )
    expect((await get(app, '/appointments?notice=hacked')).body).toContain('<div role="status"></div>')
    // Names every object inherits used to slip through and show an empty notice box.
    for (const inherited of ['toString', 'constructor', '__proto__']) {
      expect((await get(app, `/appointments?notice=${inherited}`)).body).toContain('<div role="status"></div>')
    }
  })

  it('shows empty states when there are no appointments', async () => {
    const { app } = testApp({ seed: false })
    const { body } = await get(app, '/appointments')
    expect(body).toContain('No appointments yet.')
    expect(body).toContain('No past appointments.')
    expect(body).toContain('Nothing cancelled.')
  })
})

describe('booking', () => {
  it('shows the form, prefilled from the query, with recommended therapies first', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/appointments/new?agent=1&therapy=1')
    expect(status).toBe(200)
    expect(body).toContain('<option value="1" selected="">GPT-Overthinker</option>')
    expect(body).toContain('<optgroup label="Recommended for GPT-Overthinker">')
    const recommended = body.indexOf('Recommended for')
    const others = body.indexOf('Other therapies')
    expect(body.indexOf('Token detox (60 min)')).toBeGreaterThan(recommended)
    expect(body.indexOf('Token detox (60 min)')).toBeLessThan(others)
    expect(body).toContain('<option value="1" selected="">Token detox (60 min)</option>')
    expect(body).toMatch(
      /<input type="datetime-local" id="startsAt" name="startsAt" value="" min="2026-10-12T10:00" step="900"/,
    )
  })

  it('shows a flat therapy list when no agent is chosen', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/appointments/new')
    expect(body).not.toContain('<optgroup')
    expect(body).toContain('Choose an agent…')
  })

  it('books a valid appointment and redirects to the list with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/appointments/new', valid)
    expect(status).toBe(303)
    expect(location).toBe('/appointments?notice=booked')
    expect(count(db)).toBe(5)

    const { body } = await get(app, location!)
    expect(body).toContain('Appointment booked.')
    expect(body).toContain('<a href="/agents/4">Prompta Vague</a>')
  })

  const invalid: [string, Record<string, string>, RegExp][] = [
    ['a missing agent', { agent: '' }, /Choose an agent\./],
    ['an unknown agent', { agent: '999' }, /Choose an agent from the list\./],
    ['a missing therapy', { therapy: '' }, /Choose a therapy\./],
    ['an unknown therapy', { therapy: 'abc' }, /Choose a therapy from the list\./],
    ['a malformed time', { startsAt: 'whenever' }, /Enter a real date and time\./],
    ['a past time', { startsAt: '2026-10-12T09:00' }, /Choose a time in the future\./],
    ['a time off the quarter hour', { startsAt: '2026-10-13T11:05' }, /quarter hour/],
    ['a time before opening', { startsAt: '2026-10-13T08:00' }, /open from 9:00 AM to 5:00 PM/],
    ['a therapy running past closing', { therapy: '1', startsAt: '2026-10-13T16:30' }, /would end at 5:30 PM/],
    ['an overlap with the same agent', { agent: '1', startsAt: '2026-10-13T10:15' }, /already has/],
  ]

  for (const [label, change, message] of invalid) {
    it(`rejects ${label} with 400, keeps the values, and writes nothing`, async () => {
      const { app, db } = testApp()
      const form = { ...valid, ...change }
      const { status, body } = await post(app, '/appointments/new', form)
      expect(status).toBe(400)
      expect(body).toMatch(message)
      expect(body).toContain('<div class="error-summary" role="alert"')
      expect(body).toMatch(/aria-invalid="true" aria-describedby="(agent|therapy|startsAt)-error"/)
      if (form.startsAt) expect(body).toContain(`value="${form.startsAt}"`)
      expect(count(db)).toBe(4)
    })
  }

  it('links each error in the summary to its field', async () => {
    const { app } = testApp()
    const { body } = await post(app, '/appointments/new', { agent: '', therapy: '', startsAt: '' })
    expect(body).toContain('<a href="#agent">Choose an agent.</a>')
    expect(body).toContain('<a href="#therapy">Choose a therapy.</a>')
    expect(body).toContain('<a href="#startsAt">Choose a date and time.</a>')
    expect(body).toContain('<small id="agent-error">Choose an agent.</small>')
  })
})

describe('rescheduling', () => {
  it('shows the form prefilled with the current slot', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/appointments/1/reschedule')
    expect(status).toBe(200)
    expect(body).toContain('<dd>GPT-Overthinker</dd>')
    expect(body).toContain('value="2026-10-13T10:00"')
  })

  it('moves the appointment and redirects with a notice', async () => {
    const { app, db } = testApp()
    // Overlaps its own old slot, which is allowed.
    const { status, location } = await post(app, '/appointments/1/reschedule', { startsAt: '2026-10-13T10:15' })
    expect(status).toBe(303)
    expect(location).toBe('/appointments?notice=rescheduled')
    expect(db.prepare('SELECT starts_at FROM appointments WHERE id = 1').pluck().get()).toBe('2026-10-13T10:15')
  })

  it('rejects an invalid time with 400 and changes nothing', async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/appointments/1/reschedule', { startsAt: '2026-10-13T18:00' })
    expect(status).toBe(400)
    expect(body).toContain('open from 9:00 AM to 5:00 PM')
    expect(body).toContain('value="2026-10-13T18:00"')
    expect(db.prepare('SELECT starts_at FROM appointments WHERE id = 1').pluck().get()).toBe('2026-10-13T10:00')
  })

  it('refuses past and cancelled appointments with 409', async () => {
    const { app } = testApp()
    for (const id of [3, 4]) {
      expect((await get(app, `/appointments/${id}/reschedule`)).status).toBe(409)
      const { status, body } = await post(app, `/appointments/${id}/reschedule`, { startsAt: '2026-10-15T10:00' })
      expect(status).toBe(409)
      expect(body).toContain('That appointment can&#39;t be changed')
    }
  })

  it('returns 404 for an unknown appointment', async () => {
    const { app } = testApp()
    expect((await get(app, '/appointments/999/reschedule')).status).toBe(404)
    expect((await post(app, '/appointments/999/reschedule', { startsAt: '2026-10-15T10:00' })).status).toBe(404)
  })
})

describe('cancelling', () => {
  it('cancels and redirects with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/appointments/1/cancel')
    expect(status).toBe(303)
    expect(location).toBe('/appointments?notice=cancelled')
    expect(statusOf(db, 1)).toBe('cancelled')
  })

  it('frees the slot for another booking', async () => {
    const { app } = testApp()
    const clash = { agent: '1', therapy: '4', startsAt: '2026-10-13T10:00' }
    expect((await post(app, '/appointments/new', clash)).status).toBe(400)
    await post(app, '/appointments/1/cancel')
    expect((await post(app, '/appointments/new', clash)).status).toBe(303)
  })

  it('refuses past and already-cancelled appointments with 409', async () => {
    const { app, db } = testApp()
    expect((await post(app, '/appointments/3/cancel')).status).toBe(409)
    const { status, body } = await post(app, '/appointments/4/cancel')
    expect(status).toBe(409)
    expect(body).toContain('already cancelled')
    expect(statusOf(db, 3)).toBe('scheduled')
  })

  it('returns 404 for an unknown appointment', async () => {
    const { app } = testApp()
    expect((await post(app, '/appointments/999/cancel')).status).toBe(404)
  })
})

describe('an appointment in progress (D7, upcoming vs past)', () => {
  // Same seeded data, but the clock is 10:15 on Tue Oct 13: appointment 1 (10:00, 45 min) has started.
  const inProgress = () => {
    const { db } = testApp()
    return { db, app: createApp({ db, now: () => new Date(2026, 9, 13, 10, 15) }) }
  }

  it('is listed under Past, not Upcoming', async () => {
    const { app } = inProgress()
    const { body } = await get(app, '/appointments')
    const past = body.slice(body.indexOf('>Past</h2>'), body.indexOf('>Cancelled</h2>'))
    expect(past).toContain('Tue, Oct 13, 2026, 10:00 AM')
    expect(body).not.toContain('action="/appointments/1/cancel"')
  })

  it('can no longer be cancelled or rescheduled', async () => {
    const { app, db } = inProgress()
    expect((await post(app, '/appointments/1/cancel')).status).toBe(409)
    expect((await get(app, '/appointments/1/reschedule')).status).toBe(409)
    expect((await post(app, '/appointments/1/reschedule', { startsAt: '2026-10-14T11:00' })).status).toBe(409)
    expect(statusOf(db, 1)).toBe('scheduled')
  })
})
