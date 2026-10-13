import { describe, expect, it } from 'vitest'
import { get, post, testApp } from './test/testApp'

// Every page the app serves, including error states. Fixed clock and seed, see testApp.
const PAGES: [string, number][] = [
  ['/', 200],
  ['/agents', 200],
  ['/agents/1', 200],
  ['/agents/1/dashboard', 200],
  ['/agents/1?notice=created', 200],
  ['/agents/new', 200],
  ['/ailments', 200],
  ['/ailments/1', 200],
  ['/therapies', 200],
  ['/appointments', 200],
  ['/appointments/new', 200],
  ['/appointments/new?agent=1', 200],
  ['/appointments/1/reschedule', 200],
  ['/appointments/3/reschedule', 409],
  ['/dashboard', 200],
  ['/no-such-page', 404],
]

const { app } = testApp()

const pages = async () => {
  const fetched = await Promise.all(
    PAGES.map(async ([path, expected]) => ({ path, expected, ...(await get(app, path)) })),
  )
  // Also check a form re-rendered with errors.
  const invalid = await post(app, '/appointments/new', { agent: '', therapy: '', startsAt: '' })
  const invalidAgent = await post(app, '/agents/new', {})
  // And the page a cross-origin form post gets from the CSRF check.
  const forbidden = await post(app, '/appointments/new', {}, { headers: { Origin: 'https://evil.example' } })
  return [
    ...fetched,
    { path: 'POST /appointments/new (invalid)', expected: 400, status: invalid.status, body: invalid.body },
    { path: 'POST /agents/new (invalid)', expected: 400, status: invalidAgent.status, body: invalidAgent.body },
    { path: 'POST /appointments/new (cross-origin)', expected: 403, status: forbidden.status, body: forbidden.body },
  ]
}

describe('accessibility baseline on every page', async () => {
  const all = await pages()

  it.each(all.map((p) => [p.path, p]))('%s', (_path, page) => {
    const { body, status, expected } = page as (typeof all)[number]
    expect(status).toBe(expected)

    // One h1, a title, the viewport, a skip link, and its target.
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(body).toMatch(/<title>[^<]+<\/title>/)
    expect(body).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
    expect(body).toContain('<a class="skip-link" href="#main">Skip to content</a>')
    expect(body).toContain('<main id="main"')

    // Every form control has a label pointing at its id.
    for (const [control] of body.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
      if (/type="hidden"/.test(control)) continue
      const id = /\bid="([^"]+)"/.exec(control)?.[1]
      expect(id, `control without id: ${control}`).toBeDefined()
      expect(body).toContain(`<label for="${id}">`)
    }

    // Data tables have a caption and scoped headers.
    for (const [table] of body.matchAll(/<table\b[\s\S]*?<\/table>/g)) {
      expect(table).toMatch(/<caption>[^<]+<\/caption>/)
      expect(table).toMatch(/<th scope="col">/)
      expect(table).not.toMatch(/<th(?=[\s>])(?![^>]*\bscope=)[^>]*>/)
    }

    // Every action button has an accessible name.
    for (const [button] of body.matchAll(/<button\b[^>]*>([^<]*)<\/button>/g)) {
      expect(button).toMatch(/aria-label="[^"]+"|>[^<\s][^<]*<\/button>/)
    }
  })
})
