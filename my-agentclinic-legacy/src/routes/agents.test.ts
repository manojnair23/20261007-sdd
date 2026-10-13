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
