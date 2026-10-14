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
  ['/agents/1/edit', 200],
  ['/agents/4/delete', 200],
  ['/agents/1/delete', 409],
  ['/agents?notice=deleted', 200],
  ['/ailments', 200],
  ['/ailments/1', 200],
  ['/ailments/1?notice=created', 200],
  ['/ailments/new', 200],
  ['/ailments/1/edit', 200],
  ['/ailments/1?notice=therapy-added', 200],
  ['/ailments/1/delete', 200],
  ['/ailments?notice=deleted', 200],
  ['/therapies', 200],
  ['/therapies?notice=created', 200],
  ['/therapies/new', 200],
  ['/therapies/1/edit', 200],
  ['/therapies/2/delete', 200],
  ['/therapies/4/delete', 409],
  ['/therapies?notice=deleted', 200],
  ['/appointments', 200],
  ['/appointments/new', 200],
  ['/appointments/new?agent=1', 200],
  ['/appointments/1/reschedule', 200],
  ['/appointments/3/reschedule', 409],
  ['/dashboard', 200],
  ['/no-such-page', 404],
]

// Forms posted with invalid input, which re-render with errors, and a cross-origin post the CSRF
// check refuses. None of them change the database, so they can share one app.
const POSTS: [string, string, number, Record<string, string>?][] = [
  ['/appointments/new', 'invalid', 400, { agent: '', therapy: '', startsAt: '' }],
  ['/agents/new', 'invalid', 400],
  ['/agents/1/edit', 'invalid', 400],
  ['/agents/1/ailments', 'invalid', 400],
  ['/ailments/new', 'invalid', 400],
  ['/ailments/1/edit', 'invalid', 400],
  ['/ailments/1/therapies', 'invalid', 400],
  ['/therapies/new', 'invalid', 400],
  [
    '/therapies/4/edit',
    'invalid',
    400,
    { name: 'Clarifying-questions coaching', description: 'x', durationMinutes: '60' },
  ],
  ['/appointments/new', 'cross-origin', 403, { Origin: 'https://evil.example' }],
]

const { app } = testApp()

const pages = async () => {
  const fetched = await Promise.all(
    PAGES.map(async ([path, expected]) => ({ path, expected, ...(await get(app, path)) })),
  )
  const posted = []
  for (const [path, label, expected, extra = {}] of POSTS) {
    const crossOrigin = label === 'cross-origin'
    const { status, body } = crossOrigin ? await post(app, path, {}, { headers: extra }) : await post(app, path, extra)
    posted.push({ path: `POST ${path} (${label})`, expected, status, body })
  }
  return [...fetched, ...posted]
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
