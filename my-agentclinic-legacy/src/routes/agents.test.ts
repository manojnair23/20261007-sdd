import { describe, expect, it } from 'vitest'
import { getAgent, listAgents } from '../db/agents'
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
      '<div role="status" class="notice">Details saved. A fresh start.</div>',
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
