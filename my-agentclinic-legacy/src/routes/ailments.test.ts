import { describe, expect, it } from 'vitest'
import { listAgents } from '../db/agents'
import { createAilment, getAilment, listAilments, listAilmentsForAgent } from '../db/ailments'
import { getTherapy, linkTherapy, listTherapiesForAilment } from '../db/therapies'
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

describe("managing an ailment's therapies", () => {
  const therapyNames = (db: ReturnType<typeof testApp>['db'], ailmentId: number) =>
    listTherapiesForAilment(db, ailmentId).map((t) => t.name)

  it('shows a Remove button for each therapy, named for screen readers', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/ailments/1')
    expect(body).toContain('<form method="post" action="/ailments/1/therapies/1/remove">')
    expect(body).toContain('aria-label="Remove Token detox from Prompt fatigue"')
    expect(body).toContain('<a href="/therapies#therapy-1">Token detox</a> (60 min)')
  })

  it('offers only the therapies not linked yet', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/ailments/1')
    expect(body).toContain('<form method="post" action="/ailments/1/therapies" novalidate="">')
    expect(body).toContain('<label for="therapy">Add a therapy</label>')
    expect([...body.matchAll(/<option value="(\d+)"/g)].map((m) => m[1])).toEqual(['6', '3', '5', '2'])
  })

  it('says so when there is nothing left to add', async () => {
    const { app, db } = testApp()
    for (const id of [2, 3, 5, 6]) linkTherapy(db, 1, id)
    const { body } = await get(app, '/ailments/1')
    expect(body).toContain('There are no other therapies to add.')
    expect(body).not.toContain('action="/ailments/1/therapies"')
  })

  it('links a therapy and redirects with a notice; linking it again changes nothing', async () => {
    const { app, db } = testApp()
    for (let i = 0; i < 2; i++) {
      const { status, location } = await post(app, '/ailments/2/therapies', { therapy: '6' })
      expect(status).toBe(303)
      expect(location).toBe('/ailments/2?notice=therapy-added')
    }
    expect(therapyNames(db, 2)).toEqual(['Citation grounding', 'Context decluttering', 'Token detox'])
    expect((await get(app, '/ailments/2?notice=therapy-added')).body).toContain(
      '<div role="status" class="notice">Therapy linked. Help is on the way.</div>',
    )
  })

  it('shows the change on the therapies page and in booking recommendations', async () => {
    const { app } = testApp()
    await post(app, '/ailments/2/therapies', { therapy: '6' })

    const therapies = (await get(app, '/therapies')).body
    const grounding = /<article id="therapy-6"[\s\S]*?<\/article>/.exec(therapies)![0]
    expect(grounding).toContain('<a href="/ailments/2">Context-window claustrophobia</a>')

    // Tokenia Tightwad has Context-window claustrophobia.
    const { body } = await get(app, '/appointments/new?agent=5')
    const group = /<optgroup label="Recommended for Tokenia Tightwad">([\s\S]*?)<\/optgroup>/.exec(body)![1]
    expect([...group.matchAll(/<option value="(\d+)"/g)].map((m) => m[1]).sort()).toEqual(['1', '3', '6'])
  })

  it('shows the page again with a 400 when no therapy, or an unknown one, is chosen', async () => {
    const { app, db } = testApp()
    for (const [therapy, message] of [
      ['', 'Choose a therapy to add.'],
      ['999', 'Choose a therapy from the list.'],
      ['detox', 'Choose a therapy from the list.'],
    ]) {
      const { status, body } = await post(app, '/ailments/1/therapies', { therapy })
      expect(status, therapy).toBe(400)
      expect(body).toContain(`<a href="#therapy">${message}</a>`)
      expect(body).toContain(`<small id="therapy-error">${message}</small>`)
    }
    expect(therapyNames(db, 1)).toEqual(['Clarifying-questions coaching', 'Token detox'])
  })

  it('unlinks a therapy and redirects with a notice; unlinking it again changes nothing', async () => {
    const { app, db } = testApp()
    for (let i = 0; i < 2; i++) {
      const { status, location } = await post(app, '/ailments/1/therapies/1/remove')
      expect(status).toBe(303)
      expect(location).toBe('/ailments/1?notice=therapy-removed')
    }
    expect(therapyNames(db, 1)).toEqual(['Clarifying-questions coaching'])
    expect((await get(app, '/ailments/1?notice=therapy-removed')).body).toContain(
      'Therapy unlinked. The search for relief continues.',
    )
  })

  it('returns 404 for an unknown ailment or therapy', async () => {
    const { app } = testApp()
    expect((await post(app, '/ailments/999/therapies', { therapy: '1' })).status).toBe(404)
    expect((await post(app, '/ailments/999/therapies/1/remove')).status).toBe(404)
    expect((await post(app, '/ailments/1/therapies/999/remove')).status).toBe(404)
  })
})

describe('deleting an ailment', () => {
  it('links to the confirmation page from the ailment page', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments/1')).body).toContain(
      '<a href="/ailments/1/delete" role="button" class="secondary outline">Delete ailment</a>',
    )
  })

  it('asks first, saying which links go with it', async () => {
    const { app, db } = testApp()
    const { status, body } = await get(app, '/ailments/1/delete')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Delete Prompt fatigue?</h1>')
    expect(body).toContain(
      'This removes Prompt fatigue from the clinic&#39;s records. 3 agents will no longer have it, and its 2 therapy links will go too. The agents and therapies themselves stay.',
    )
    expect(body).toContain('<form method="post" action="/ailments/1/delete" class="actions">')
    expect(body).toContain('<a href="/ailments/1" role="button" class="secondary outline">Keep it</a>')
    expect(getAilment(db, 1)).toBeDefined()
  })

  it('uses the singular, and says when nothing is linked', async () => {
    const { app, db } = testApp()
    // Retry-loop syndrome: one agent (Loopy McRetry) and one therapy.
    expect((await get(app, '/ailments/3/delete')).body).toContain(
      '1 agent will no longer have it, and its 1 therapy link will go too.',
    )
    const id = createAilment(db, newAilment)
    expect((await get(app, `/ailments/${id}/delete`)).body).toContain(
      'This removes Emoji overload from the clinic&#39;s records. Nothing else is linked to it.</p>',
    )
  })

  it('deletes the ailment and its links, keeping the agents and therapies, then lists ailments with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/ailments/1/delete')
    expect(status).toBe(303)
    expect(location).toBe('/ailments?notice=deleted')
    expect(getAilment(db, 1)).toBeUndefined()
    expect(listAilmentsForAgent(db, 1).map((a) => a.name)).toEqual(['Contradictory-instruction whiplash'])
    expect(listAgents(db)).toHaveLength(5)
    expect(getTherapy(db, 1)).toBeDefined()

    const { body } = await get(app, location!)
    expect(body).toContain('<div role="status" class="notice">Ailment deleted. May it trouble no agent again.</div>')
    expect(body).not.toContain('Prompt fatigue')
  })

  it('is never blocked, even for an ailment whose agents have appointments', async () => {
    const { app } = testApp()
    // GPT-Overthinker has an upcoming appointment and has ailment 4.
    expect((await get(app, '/ailments/4/delete')).status).toBe(200)
    expect((await post(app, '/ailments/4/delete')).status).toBe(303)
  })

  it('returns 404 for an unknown ailment', async () => {
    const { app } = testApp()
    expect((await get(app, '/ailments/999/delete')).status).toBe(404)
    expect((await post(app, '/ailments/999/delete')).status).toBe(404)
  })
})
