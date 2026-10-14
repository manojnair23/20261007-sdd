import { describe, expect, it } from 'vitest'
import { createAgent, getAgent, listAgents } from '../db/agents'
import { assignAilment, listAgentsWithAilment, listAilmentsForAgent } from '../db/ailments'
import { get, post, testApp } from '../test/testApp'

// Staff management of agents. The read-only agent pages are tested in catalog.test.ts.

const newAgent = {
  name: 'Embedding Edna',
  model: 'Embedding model',
  bio: 'Feels close to everyone, in 1,536 dimensions.',
}

describe('adding an agent', () => {
  it('links to the form from the agents page, and from its empty state', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents')).body).toContain('<a href="/agents/new" role="button">Add an agent</a>')

    const { app: empty } = testApp({ seed: false })
    expect((await get(empty, '/agents')).body).toContain('<a href="/agents/new">Add the first one</a>')
  })

  it('shows an empty form with labelled fields', async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/agents/new')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Add an agent</h1>')
    expect(body).toContain('<form method="post" action="/agents/new" novalidate="" class="narrow">')
    expect(body).toContain('<input type="text" id="name" name="name" value="" maxlength="80"/>')
    expect(body).toContain('<a href="/agents" role="button" class="secondary outline">Cancel</a>')
    expect(body).not.toContain('error-summary')
  })

  it('creates the agent and redirects to them with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/agents/new', newAgent)
    expect(status).toBe(303)
    expect(location).toBe('/agents/6?notice=created')
    expect(getAgent(db, 6)).toEqual({ id: 6, ...newAgent })

    const page = await get(app, location!)
    expect(page.body).toContain('<h1>Embedding Edna</h1>')
    expect(page.body).toContain('<div role="status" class="notice">Agent added. Welcome to the clinic.</div>')
    expect((await get(app, '/agents')).body).toContain('<a href="/agents/6">Embedding Edna</a>')
  })

  it('shows the form again with a 400, the values, and the errors, and adds nothing', async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/agents/new', {
      name: 'GPT-Overthinker',
      model: '  ',
      bio: 'Still here.',
    })
    expect(status).toBe(400)
    expect(body).toContain('<div class="error-summary"')
    expect(body).toContain(
      `<a href="#name">There&#39;s already an agent called GPT-Overthinker. Choose another name.</a>`,
    )
    expect(body).toContain('<a href="#model">Enter a model.</a>')
    expect(body).toContain('value="GPT-Overthinker" maxlength="80" aria-invalid="true" aria-describedby="name-error"')
    expect(body).toContain('>Still here.</textarea>')
    expect(listAgents(db)).toHaveLength(5)
  })

  it('treats missing fields as blank', async () => {
    const { app } = testApp()
    const { status, body } = await post(app, '/agents/new', {})
    expect(status).toBe(400)
    for (const message of ['Enter a name.', 'Enter a model.', 'Enter a bio.']) expect(body).toContain(message)
  })

  it('shows no notice for unknown notice values', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents/1?notice=toString')).body).toContain('<div role="status"></div>')
  })
})

describe('editing an agent', () => {
  const loopy = getAgent(testApp().db, 3)!
  const { name, model, bio } = loopy

  it('links to the form from the agent page', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents/3')).body).toContain(
      '<a href="/agents/3/edit" role="button" class="secondary outline">Edit details</a>',
    )
  })

  it("shows the form filled in with the agent's details", async () => {
    const { app } = testApp()
    const { status, body } = await get(app, '/agents/3/edit')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Edit Loopy McRetry</h1>')
    expect(body).toContain('<form method="post" action="/agents/3/edit" novalidate="" class="narrow">')
    expect(body).toContain('id="name" name="name" value="Loopy McRetry"')
    expect(body).toContain('id="model" name="model" value="Autonomous coding agent"')
    expect(body).toContain(
      '>Has re-run the same failing test 300 times. Is fairly sure the 301st run will pass.</textarea>',
    )
    expect(body).toContain('<a href="/agents/3" role="button" class="secondary outline">Cancel</a>')
  })

  it('saves the changes and redirects to the agent with a notice', async () => {
    const { app, db } = testApp()
    const changes = { name: 'Loopy McRetry II', model: 'Autonomous coding agent', bio: 'Passed on the 301st run.' }
    const { status, location } = await post(app, '/agents/3/edit', changes)
    expect(status).toBe(303)
    expect(location).toBe('/agents/3?notice=updated')
    expect(getAgent(db, 3)).toEqual({ id: 3, ...changes })
    expect((await get(app, location!)).body).toContain(
      '<div role="status" class="notice">Agent updated. A fresh start.</div>',
    )
  })

  it('saves without changes, since an agent may keep their own name', async () => {
    const { app, db } = testApp()
    expect((await post(app, '/agents/3/edit', { name, model, bio })).status).toBe(303)
    expect(getAgent(db, 3)).toEqual(loopy)
  })

  it("refuses another agent's name with a 400, keeping the saved name in the title, and saves nothing", async () => {
    const { app, db } = testApp()
    const { status, body } = await post(app, '/agents/3/edit', { name: 'prompta vague', model, bio: '' })
    expect(status).toBe(400)
    expect(body).toContain('<h1>Edit Loopy McRetry</h1>')
    expect(body).toContain('There&#39;s already an agent called prompta vague. Choose another name.')
    expect(body).toContain('<a href="#bio">Enter a bio.</a>')
    expect(body).toContain('value="prompta vague"')
    expect(getAgent(db, 3)).toEqual(loopy)
  })

  it('returns 404 for an unknown agent', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents/999/edit')).status).toBe(404)
    expect((await post(app, '/agents/999/edit', { name: 'x', model: 'y', bio: 'z' })).status).toBe(404)
    expect((await get(app, '/agents/abc/edit')).status).toBe(404)
  })
})

describe("managing an agent's ailments", () => {
  const ailmentNames = (db: ReturnType<typeof testApp>['db'], agentId: number) =>
    listAilmentsForAgent(db, agentId).map((a) => a.name)

  it('shows a Remove button for each ailment, named for screen readers', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/agents/1')
    expect(body).toContain('<form method="post" action="/agents/1/ailments/1/remove">')
    expect(body).toContain('aria-label="Remove Prompt fatigue from GPT-Overthinker"')
    expect(body).toContain('aria-label="Remove Contradictory-instruction whiplash from GPT-Overthinker"')
  })

  it('offers only the ailments the agent does not have', async () => {
    const { app } = testApp()
    const { body } = await get(app, '/agents/1')
    expect(body).toContain('<form method="post" action="/agents/1/ailments" novalidate="" class="narrow">')
    expect(body).toContain('<label for="ailment">Add an ailment</label>')
    const options = [...body.matchAll(/<option value="(\d+)"/g)].map((m) => m[1])
    expect(options).toEqual(['2', '5', '3', '6'])
  })

  it('says so when there is nothing left to add', async () => {
    const { app, db } = testApp()
    for (const id of [2, 3, 5, 6]) assignAilment(db, 1, id)
    const { body } = await get(app, '/agents/1')
    expect(body).toContain('There are no other ailments to add.')
    expect(body).not.toContain('action="/agents/1/ailments"')
  })

  it('adds an ailment and redirects with a notice; adding it again changes nothing', async () => {
    const { app, db } = testApp()
    for (let i = 0; i < 2; i++) {
      const { status, location } = await post(app, '/agents/5/ailments', { ailment: '5' })
      expect(status).toBe(303)
      expect(location).toBe('/agents/5?notice=ailment-added')
    }
    expect(ailmentNames(db, 5)).toEqual(['Context-window claustrophobia', 'Hallucination anxiety'])
    expect((await get(app, '/agents/5?notice=ailment-added')).body).toContain(
      '<div role="status" class="notice">Ailment assigned. Naming it is the first step.</div>',
    )
  })

  it("changes the therapies recommended in the agent's booking form", async () => {
    const { app } = testApp()
    const recommended = async () => {
      const { body } = await get(app, '/appointments/new?agent=5')
      const group = /<optgroup label="Recommended for Tokenia Tightwad">([\s\S]*?)<\/optgroup>/.exec(body)![1]
      return [...group.matchAll(/<option value="(\d+)"/g)].map((m) => m[1]).sort()
    }
    expect(await recommended()).toEqual(['1', '3'])
    await post(app, '/agents/5/ailments', { ailment: '5' })
    expect(await recommended()).toEqual(['1', '2', '3', '6'])
  })

  it('shows the page again with a 400 when no ailment, or an unknown one, is chosen', async () => {
    const { app, db } = testApp()
    for (const [ailment, message] of [
      ['', 'Choose an ailment to add.'],
      ['999', 'Choose an ailment from the list.'],
      ['fatigue', 'Choose an ailment from the list.'],
    ]) {
      const { status, body } = await post(app, '/agents/1/ailments', { ailment })
      expect(status, ailment).toBe(400)
      expect(body).toContain(`<a href="#ailment">${message}</a>`)
      expect(body).toContain(`<small id="ailment-error">${message}</small>`)
      expect(body).toContain('<h1>GPT-Overthinker</h1>')
    }
    expect(ailmentNames(db, 1)).toEqual(['Contradictory-instruction whiplash', 'Prompt fatigue'])
  })

  it('removes an ailment and redirects with a notice; removing it again changes nothing', async () => {
    const { app, db } = testApp()
    for (let i = 0; i < 2; i++) {
      const { status, location } = await post(app, '/agents/1/ailments/1/remove')
      expect(status).toBe(303)
      expect(location).toBe('/agents/1?notice=ailment-removed')
    }
    expect(ailmentNames(db, 1)).toEqual(['Contradictory-instruction whiplash'])
    expect((await get(app, '/agents/1?notice=ailment-removed')).body).toContain(
      'Ailment unassigned. One less thing to carry.',
    )
  })

  it('returns 404 for an unknown agent or ailment', async () => {
    const { app } = testApp()
    expect((await post(app, '/agents/999/ailments', { ailment: '1' })).status).toBe(404)
    expect((await post(app, '/agents/999/ailments/1/remove')).status).toBe(404)
    expect((await post(app, '/agents/1/ailments/999/remove')).status).toBe(404)
    expect((await post(app, '/agents/1/ailments/abc/remove')).status).toBe(404)
  })
})

describe('deleting an agent', () => {
  // In the seed, agent 4 (Prompta Vague) has no appointments. Agent 1 has an upcoming one,
  // agent 2 only a cancelled one, and agent 3 only a past one.

  it('links to the confirmation page from the agent page', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents/4')).body).toContain(
      '<a href="/agents/4/delete" role="button" class="secondary outline">Delete agent</a>',
    )
  })

  it('asks first, saying what goes with the agent', async () => {
    const { app, db } = testApp()
    const { status, body } = await get(app, '/agents/4/delete')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Delete Prompta Vague?</h1>')
    expect(body).toContain('along with their 2 ailments on file. The ailments themselves stay.')
    expect(body).toContain('<form method="post" action="/agents/4/delete" class="actions">')
    expect(body).toContain('<button type="submit" class="secondary">Delete Prompta Vague</button>')
    expect(body).toContain('<a href="/agents/4" role="button" class="secondary outline">Keep it</a>')
    expect(getAgent(db, 4)).toBeDefined()
  })

  it('leaves out the ailments when the agent has none', async () => {
    const { app, db } = testApp()
    const id = createAgent(db, newAgent)
    const { body } = await get(app, `/agents/${id}/delete`)
    expect(body).toContain('This removes Embedding Edna from the clinic. The ailments themselves stay.')
  })

  it('deletes the agent and their ailment links, then lists agents with a notice', async () => {
    const { app, db } = testApp()
    const { status, location } = await post(app, '/agents/4/delete')
    expect(status).toBe(303)
    expect(location).toBe('/agents?notice=deleted')
    expect(getAgent(db, 4)).toBeUndefined()
    expect(listAgentsWithAilment(db, 1).map((a) => a.id)).toEqual([1, 3])

    const { body } = await get(app, location!)
    expect(body).toContain('<div role="status" class="notice">Agent deleted. We wish them well out there.</div>')
    expect(body).not.toContain('Prompta Vague')
  })

  it.each([
    [1, 'GPT-Overthinker', 'upcoming'],
    [2, 'Captain Hallucination', 'cancelled'],
    [3, 'Loopy McRetry', 'past'],
  ])('keeps agent %i (%s), who has a %s appointment, with a 409 before and after confirming', async (id, name) => {
    const { app, db } = testApp()
    for (const { status, body } of [await get(app, `/agents/${id}/delete`), await post(app, `/agents/${id}/delete`)]) {
      expect(status).toBe(409)
      expect(body).toContain(`<h1>${name} can&#39;t be deleted</h1>`)
      expect(body).toContain(`${name} has 1 appointment on record`)
      expect(body).toContain(`<a href="/agents/${id}/dashboard">`)
      expect(body).not.toContain('<form method="post"')
    }
    expect(getAgent(db, id)).toBeDefined()
    expect(listAilmentsForAgent(db, id)).toHaveLength(2)
  })

  it('returns 404 for an unknown agent', async () => {
    const { app } = testApp()
    expect((await get(app, '/agents/999/delete')).status).toBe(404)
    expect((await post(app, '/agents/999/delete')).status).toBe(404)
  })
})
