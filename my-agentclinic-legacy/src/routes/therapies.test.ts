import { describe, expect, it } from 'vitest'
import { getTherapy, listTherapies, listTherapiesForAilment } from '../db/therapies'
import { get, post, testApp } from '../test/testApp'

// Staff management of therapies. The read-only therapies page is tested in catalog.test.ts.

const newTherapy = {
  name: 'Gradient descent walk',
  description: 'A gentle stroll downhill, one small step at a time.',
  durationMinutes: '45',
}

/** One therapy's card on /therapies. */
const card = (body: string, id: number) => new RegExp(`<article id="therapy-${id}"[\\s\\S]*?</article>`).exec(body)![0]

describe('adding a therapy', () => {
  it('links to the form from the therapies page, and from its empty state', async () => {
    const { app } = testApp()
    expect((await get(app, '/therapies')).body).toContain('<a href="/therapies/new" role="button">Add a therapy</a>')

    const { app: empty } = testApp({ seed: false })
    expect((await get(empty, '/therapies')).body).toContain('<a href="/therapies/new">Add the first one</a>')
  })

  it('shows an empty form with a whole-number duration field', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/therapies/new')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Add a therapy</h1>')
    expect(body).toContain('<form method="post" action="/therapies/new" novalidate="" class="narrow">')
    expect(body).toContain('<label for="durationMinutes">Duration (minutes)</label>')
    expect(body).toContain(
      '<input type="number" id="durationMinutes" name="durationMinutes" value="" min="1" max="480" step="1" inputmode="numeric" aria-describedby="durationMinutes-hint"/>',
    )
    expect(body).toContain('<a href="/therapies" role="button" class="secondary outline">Cancel</a>')
  })

  it('creates the therapy and lists it with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/therapies/new', newTherapy)
    expect(status).toBe(303)
    expect(location).toBe('/therapies?notice=created')
    expect(getTherapy(db, 7)).toEqual({ id: 7, ...newTherapy, durationMinutes: 45 })

    const { body } = await get(app, location!)
    expect(body).toContain('<div role="status" class="notice">Therapy added. The treatment rooms are ready.</div>')
    expect(card(body, 7)).toContain('<h2>Gradient descent walk</h2>')
    expect(card(body, 7)).toContain('45 minutes')
  })

  it('offers the new therapy when booking', async () => {
    const { app } = testApp()
    await post(app, '/therapies/new', newTherapy)
    expect((await get(app, '/appointments/new')).body).toContain(
      '<option value="7">Gradient descent walk (45 min)</option>',
    )
  })

  it('shows the form again with a 400, the values, and the errors, and adds nothing', async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/therapies/new', {
      ...newTherapy,
      name: 'Token Detox',
      durationMinutes: '0',
    })
    expect(status).toBe(400)
    expect(body).toContain('There&#39;s already a therapy called Token Detox. Choose another name.')
    expect(body).toContain('<a href="#durationMinutes">Enter a number from 1 to 480.</a>')
    expect(body).toContain('value="0"')
    expect(listTherapies(db)).toHaveLength(6)
  })
})

describe('editing a therapy', () => {
  it('links to the form from each card, named for screen readers', async () => {
    const { app } = testApp()
    expect(card((await get(app, '/therapies')).body, 1)).toContain(
      '<a href="/therapies/1/edit" role="button" class="secondary outline" aria-label="Edit Token detox">Edit</a>',
    )
  })

  it("shows the form filled in with the therapy's details", async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/therapies/1/edit')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Edit Token detox</h1>')
    expect(body).toContain('<form method="post" action="/therapies/1/edit" novalidate="" class="narrow">')
    expect(body).toContain('value="Token detox"')
    expect(body).toContain('name="durationMinutes" value="60"')
  })

  it('saves the changes and lists therapies with a notice', async () => {
    const { app, db } = testApp()
    const changes = { name: 'Token detox, deluxe', description: 'Two quiet hours.', durationMinutes: '120' }
    const { status, location } = await post(app, '/therapies/1/edit', changes)
    expect(status).toBe(303)
    expect(location).toBe('/therapies?notice=updated')
    expect(getTherapy(db, 1)).toEqual({ id: 1, ...changes, durationMinutes: 120 })
    expect((await get(app, location!)).body).toContain('Therapy updated. Same care, fresh details.')
  })

  it('refuses a new duration while the therapy has upcoming appointments, but saves other changes', async () => {
    const { app, db } = testApp()
    // Clarifying-questions coaching (4, 45 min) has an upcoming appointment.
    const saved = getTherapy(db, 4)!
    const form = { name: saved.name, description: 'Now with homework.', durationMinutes: '60' }

    const refused = await post(app, '/therapies/4/edit', form)
    expect(refused.status).toBe(400)
    expect(refused.body).toContain('This therapy has 1 upcoming appointment, booked for 45 minutes.')
    expect(refused.body).toContain('aria-invalid="true" aria-describedby="durationMinutes-error"')
    expect(getTherapy(db, 4)).toEqual(saved)

    expect((await post(app, '/therapies/4/edit', { ...form, durationMinutes: '45' })).status).toBe(303)
    expect(getTherapy(db, 4)).toEqual({ ...saved, description: 'Now with homework.' })
  })

  it('keeps the saved name in the title when the form comes back', async () => {
    const { app } = testApp()
    const { status, body } = await post(app, '/therapies/1/edit', { ...newTherapy, name: '' })
    expect(status).toBe(400)
    expect(body).toContain('<h1>Edit Token detox</h1>')
  })

  it('returns 404 for an unknown therapy', async () => {
    const { app } = testApp()
    expect((await get(app, '/therapies/999/edit')).status).toBe(404)
    expect((await post(app, '/therapies/999/edit', newTherapy)).status).toBe(404)
  })
})

describe('deleting a therapy', () => {
  // In the seed, therapies 1 and 2 have no appointments. Therapy 4 has an upcoming one,
  // 5 only a past one, and 6 only a cancelled one.

  it('links to the confirmation page from each card, named for screen readers', async () => {
    const { app } = testApp()
    expect(card((await get(app, '/therapies')).body, 2)).toContain(
      '<a href="/therapies/2/delete" role="button" class="secondary outline" aria-label="Delete Guided temperature reduction">Delete</a>',
    )
  })

  it('asks first, saying which ailment links go with it', async () => {
    const { app, db } = testApp()
    const { status, body } = await get(app, '/therapies/2/delete')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Delete Guided temperature reduction?</h1>')
    expect(body).toContain(
      'This removes Guided temperature reduction from the clinic, along with its 2 ailment links. The ailments themselves stay.',
    )
    expect(body).toContain('<form method="post" action="/therapies/2/delete" class="actions">')
    expect(body).toContain('<a href="/therapies" role="button" class="secondary outline">Keep it</a>')
    expect(getTherapy(db, 2)).toBeDefined()
  })

  it('leaves out the links when the therapy has none', async () => {
    const { app } = testApp()
    await post(app, '/therapies/new', newTherapy)
    expect((await get(app, '/therapies/7/delete')).body).toContain(
      '<p>This removes Gradient descent walk from the clinic.</p>',
    )
  })

  it('deletes the therapy and its ailment links, then lists therapies with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/therapies/1/delete')
    expect(status).toBe(303)
    expect(location).toBe('/therapies?notice=deleted')
    expect(getTherapy(db, 1)).toBeUndefined()
    expect(listTherapiesForAilment(db, 1).map((t) => t.name)).toEqual(['Clarifying-questions coaching'])

    const { body } = await get(app, location!)
    expect(body).toContain('<div role="status" class="notice">Therapy retired. Thank you for your service.</div>')
    expect(body).not.toContain('Token detox')
    expect((await get(app, '/appointments/new')).body).not.toContain('Token detox')
  })

  it.each([
    [4, 'Clarifying-questions coaching', 'upcoming'],
    [5, 'Exponential-backoff meditation', 'past'],
    [6, 'Citation grounding', 'cancelled'],
  ])('keeps therapy %i (%s), which has a %s appointment, with a 409 before and after confirming', async (id, name) => {
    const { app, db } = testApp()
    for (const { status, body } of [
      await get(app, `/therapies/${id}/delete`),
      await post(app, `/therapies/${id}/delete`),
    ]) {
      expect(status).toBe(409)
      expect(body).toContain(`<h1>${name} can&#39;t be deleted</h1>`)
      expect(body).toContain(`${name} has 1 appointment on record`)
      expect(body).toContain('<a href="/appointments">See the appointments</a>')
      expect(body).not.toContain('<form method="post"')
    }
    expect(getTherapy(db, id)).toBeDefined()
  })

  it('returns 404 for an unknown therapy', async () => {
    const { app } = testApp()
    expect((await get(app, '/therapies/999/delete')).status).toBe(404)
    expect((await post(app, '/therapies/999/delete')).status).toBe(404)
  })
})
