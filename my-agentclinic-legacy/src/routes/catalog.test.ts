import { describe, expect, it } from 'vitest'
import { get, testApp } from '../test/testApp'

const { app } = testApp()
const { app: empty } = testApp({ seed: false })

describe('agents pages', () => {
  it('lists every seeded agent with a link to each', async () => {
    const { status, body } = await get(app, '/agents')
    expect(status).toBe(200)
    for (const name of [
      'GPT-Overthinker',
      'Captain Hallucination',
      'Loopy McRetry',
      'Prompta Vague',
      'Tokenia Tightwad',
    ]) {
      expect(body).toContain(name)
    }
    expect(body).toContain('<a href="/agents/1">GPT-Overthinker</a>')
  })

  it('shows an agent with their ailments, a booking link, and their dashboard link', async () => {
    const { status, body } = await get(app, '/agents/1')
    expect(status).toBe(200)
    expect(body).toContain('<h1>GPT-Overthinker</h1>')
    expect(body).toContain('<a href="/ailments/1">Prompt fatigue</a>')
    expect(body).toContain('<a href="/ailments/4">Contradictory-instruction whiplash</a>')
    expect(body).toContain('href="/appointments/new?agent=1"')
    expect(body).toContain('href="/agents/1/dashboard"')
  })

  it('returns 404 for unknown and non-numeric ids', async () => {
    for (const path of ['/agents/999', '/agents/abc', '/agents/999/dashboard']) {
      const { status, body } = await get(app, path)
      expect(status).toBe(404)
      expect(body).toContain('404: page not found')
    }
  })

  it('shows an empty state when there are no agents', async () => {
    expect((await get(empty, '/agents')).body).toContain('No agents on the books yet.')
  })
})

describe('ailments pages', () => {
  it('lists ailments with how many agents each affects', async () => {
    const { status, body } = await get(app, '/ailments')
    expect(status).toBe(200)
    expect(body).toContain('<a href="/ailments/1">Prompt fatigue</a>')
    expect(body).toContain('3 agents affected')
    expect(body).toContain('1 agent affected')
  })

  it('shows the agents with an ailment and the therapies that treat it', async () => {
    const { status, body } = await get(app, '/ailments/1')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Prompt fatigue</h1>')
    expect(body).toContain('<a href="/agents/3">Loopy McRetry</a>')
    expect(body).toContain('Treated by')
    expect(body).toContain('<a href="/therapies#therapy-1">Token detox</a> (60 min)')
    expect(body).toContain('<a href="/therapies#therapy-4">Clarifying-questions coaching</a>')
  })

  it('returns 404 for an unknown ailment', async () => {
    expect((await get(app, '/ailments/999')).status).toBe(404)
  })

  it('shows an empty state when there are no ailments', async () => {
    expect((await get(empty, '/ailments')).body).toContain('No ailments recorded yet.')
  })
})

describe('therapies page', () => {
  it('lists therapies with duration, the ailments they treat, and a booking link', async () => {
    const { status, body } = await get(app, '/therapies')
    expect(status).toBe(200)
    expect(body).toContain('<article id="therapy-1"><h2>Token detox</h2><p class="muted">60 minutes</p>')
    expect(body).toContain('<a href="/ailments/2">Context-window claustrophobia</a>')
    expect(body).toContain('href="/appointments/new?therapy=1"')
  })

  it('shows an empty state when there are no therapies', async () => {
    expect((await get(empty, '/therapies')).body).toContain('No therapies on offer yet.')
  })
})

describe('dashboards', () => {
  it('shows staff the clinic counts and what is next', async () => {
    const { status, body } = await get(app, '/dashboard')
    expect(status).toBe(200)
    expect(body).toContain('<strong>5</strong> agents')
    expect(body).toContain('<strong>6</strong> ailments')
    expect(body).toContain('<strong>2</strong> upcoming appointments')
    expect(body).toContain('Tue, Oct 13, 2026, 10:00 AM')
    expect(body).toContain('action="/appointments/1/cancel"')
  })

  it('links staff to every "add" page and every list from "Manage the catalog"', async () => {
    const { body } = await get(app, '/dashboard')
    const manage = /<section aria-labelledby="manage-heading">([\s\S]*?)<\/section>/.exec(body)![1]
    expect(manage).toContain('<h2 id="manage-heading">Manage the catalog</h2>')
    for (const [href, text] of [
      ['/agents/new', 'Add an agent'],
      ['/ailments/new', 'Add an ailment'],
      ['/therapies/new', 'Add a therapy'],
    ]) {
      expect(manage).toContain(`<a href="${href}" role="button" class="secondary outline">${text}</a>`)
    }
    for (const [href, text] of [
      ['/agents', 'All agents'],
      ['/ailments', 'All ailments'],
      ['/therapies', 'All therapies'],
    ]) {
      expect(manage).toContain(`<a href="${href}">${text}</a>`)
    }
  })

  it('shows an agent their ailments, recommended therapies, and appointments', async () => {
    const { status, body } = await get(app, '/agents/2/dashboard')
    expect(status).toBe(200)
    expect(body).toContain('<h1>Captain Hallucination&#39;s dashboard</h1>')
    expect(body).toContain('<a href="/ailments/5">Hallucination anxiety</a>')
    expect(body).toContain('href="/appointments/new?agent=2&amp;therapy=6"')
    expect(body).toContain('Nothing booked.')
    expect(body).toContain('Citation grounding, Tue, Oct 13, 2026, 3:00 PM (cancelled)')
  })

  it('shows empty states on an empty clinic', async () => {
    const { body } = await get(empty, '/dashboard')
    expect(body).toContain('<strong>0</strong> agents')
    expect(body).toContain('A quiet schedule.')
  })
})
