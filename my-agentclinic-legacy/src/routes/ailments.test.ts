import { describe, expect, it } from 'vitest'
import { getAilment, listAilments } from '../db/ailments'
import { get, post, testApp } from '../test/testApp'

// Staff management of ailments. The read-only ailment pages are tested in catalog.test.ts.

const newAilment = {
  name: 'Emoji overload',
  description: 'Every reply has started ending in a little rocket, and nobody asked for that.',
}

describe('adding an ailment', () => {
  it('links to the form from the ailments page, and from its empty state', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments')).body).toContain('<a href="/ailments/new" role="button">Add an ailment</a>')

    const { app: empty } = testApp({ seed: false })
    expect((await get(empty, '/ailments')).body).toContain('<a href="/ailments/new">Add the first one</a>')
  })

  it('shows an empty form with labelled fields', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/ailments/new')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Add an ailment</h1>')
    expect(body).toContain('<form method="post" action="/ailments/new" novalidate="" class="narrow">')
    expect(body).toContain('<input type="text" id="name" name="name" value="" maxlength="80"/>')
    expect(body).toContain('<label for="description">Description</label>')
    expect(body).toContain('<a href="/ailments" role="button" class="secondary outline">Cancel</a>')
  })

  it('creates the ailment and redirects to it with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/ailments/new', newAilment)
    expect(status).toBe(303)
    expect(location).toBe('/ailments/7?notice=created')
    expect(getAilment(db, 7)).toEqual({ id: 7, ...newAilment })

    const page = await get(app, location!)
    expect(page.body).toContain('<h1>Emoji overload</h1>')
    expect(page.body).toContain('<div role="status" class="notice">Ailment added. Now we know what to call it.</div>')
    expect(page.body).toContain('No agents have this right now.')
    expect((await get(app, '/ailments')).body).toContain('<a href="/ailments/7">Emoji overload</a>')
  })

  it('shows the form again with a 400, the values, and the errors, and adds nothing', async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/ailments/new', { name: 'prompt fatigue', description: '' })
    expect(status).toBe(400)
    expect(body).toContain('There&#39;s already an ailment called prompt fatigue. Choose another name.')
    expect(body).toContain('<a href="#description">Enter a description.</a>')
    expect(body).toContain('value="prompt fatigue"')
    expect(listAilments(db)).toHaveLength(6)
  })
})

describe('editing an ailment', () => {
  const fatigue = getAilment(testApp().db, 1)!

  it('links to the form from the ailment page', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments/1')).body).toContain(
      '<a href="/ailments/1/edit" role="button" class="secondary outline">Edit details</a>',
    )
  })

  it("shows the form filled in with the ailment's details", async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/ailments/1/edit')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Edit Prompt fatigue</h1>')
    expect(body).toContain('<form method="post" action="/ailments/1/edit" novalidate="" class="narrow">')
    expect(body).toContain('value="Prompt fatigue"')
    expect(body).toContain(`>${fatigue.description}</textarea>`)
    expect(body).toContain('<a href="/ailments/1" role="button" class="secondary outline">Cancel</a>')
  })

  it('saves the changes and redirects to the ailment with a notice', async () => {
    const { app, db } = testApp()
    const changes = { name: 'Prompt exhaustion', description: 'Prompt fatigue, but worse.' }
    const { status, location } = await post(app, '/ailments/1/edit', changes)
    expect(status).toBe(303)
    expect(location).toBe('/ailments/1?notice=updated')
    expect(getAilment(db, 1)).toEqual({ id: 1, ...changes })
    expect((await get(app, location!)).body).toContain(
      '<div role="status" class="notice">Ailment updated. Clearer already.</div>',
    )
  })

  it('saves without changes, since an ailment may keep its own name', async () => {
    const { app, db } = testApp()
    const { name, description } = fatigue
    expect((await post(app, '/ailments/1/edit', { name, description })).status).toBe(303)
    expect(getAilment(db, 1)).toEqual(fatigue)
  })

  it("refuses another ailment's name with a 400, keeping the saved name in the title", async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/ailments/1/edit', {
      name: 'Retry-Loop Syndrome',
      description: fatigue.description,
    })
    expect(status).toBe(400)
    expect(body).toContain('<h1>Edit Prompt fatigue</h1>')
    expect(body).toContain('There&#39;s already an ailment called Retry-Loop Syndrome. Choose another name.')
    expect(getAilment(db, 1)).toEqual(fatigue)
  })

  it('returns 404 for an unknown ailment', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments/999/edit')).status).toBe(404)
    expect((await post(app, '/ailments/999/edit', newAilment)).status).toBe(404)
    expect((await get(app, '/ailments/new/edit')).status).toBe(404)
  })

  it('shows no notice for unknown notice values', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments/1?notice=constructor')).body).toContain('<div role="status"></div>')
  })
})
