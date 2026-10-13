import { describe, expect, it } from 'vitest'
import { get, testApp } from './test/testApp'

// Crawls every internal link reachable from the home page and checks none of them is broken.
describe('internal links', () => {
  it('every link on every reachable page resolves', async () => {
    const { app } = testApp()
    const seen = new Set<string>()
    const queue = ['/']
    const broken: string[] = []

    while (queue.length > 0) {
      const path = queue.shift()!
      if (seen.has(path)) continue
      seen.add(path)

      const { status, body } = await get(app, path)
      // A delete page answers 409 when the record has appointments: that page exists and explains why.
      const expectedRefusal = status === 409 && path.endsWith('/delete')
      if (status !== 200 && !expectedRefusal) {
        broken.push(`${path} -> ${status}`)
        continue
      }
      if (!body.startsWith('<!doctype html>')) continue

      for (const [, href] of body.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
        const url = href.replace(/&amp;/g, '&').split('#')[0]
        if (url.startsWith('/') && !seen.has(url)) queue.push(url)
      }
    }

    expect(broken).toEqual([])
    // The crawl reaches every section, detail pages, dashboards, and the booking forms.
    for (const path of [
      '/agents/5',
      '/ailments/6',
      '/therapies',
      '/agents/3/dashboard',
      '/appointments/2/reschedule',
      '/appointments/new?agent=2&therapy=6',
    ]) {
      expect(seen).toContain(path)
    }
  })
})
