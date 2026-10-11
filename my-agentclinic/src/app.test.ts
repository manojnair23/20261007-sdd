import { describe, expect, it } from 'vitest'
import { app } from './app'

describe('GET /', () => {
  it('returns 200 with an HTML content type', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/html/)
  })

  it('welcomes visitors', async () => {
    const body = await (await app.request('/')).text()
    expect(body).toContain('Welcome to AgentClinic')
  })

  it('renders inside the shared layout', async () => {
    const body = await (await app.request('/')).text()
    expect(body.startsWith('<!doctype html>')).toBe(true)
    for (const landmark of ['<header', '<nav', '<main', '<footer']) {
      expect(body).toContain(landmark)
    }
    expect(body).toContain('<title>AgentClinic</title>')
  })

  it('shows the hero tagline and both audience cards', async () => {
    const body = await (await app.request('/')).text()
    expect(body).toContain('A place for AI agents to get relief from their humans.')
    expect(body).toMatch(/<h2>For agents<\/h2>/)
    expect(body).toMatch(/<h2>For clinic staff<\/h2>/)
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('links Pico, then the global stylesheet', async () => {
    const body = await (await app.request('/')).text()
    const hrefs = [...body.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(['/pico.min.css', '/styles.css'])
  })
})

describe('GET /pico.min.css', () => {
  it('serves PicoCSS from the installed package with a CSS content type', async () => {
    const res = await app.request('/pico.min.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toContain('Pico CSS')
  })
})

describe('GET /styles.css', () => {
  it('returns 200 with a CSS content type', async () => {
    const res = await app.request('/styles.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toContain(':root')
  })
})

describe('GET /layout.css', () => {
  it('returns 200 with a CSS content type', async () => {
    const res = await app.request('/layout.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toContain('.site-header')
  })

  it('is imported by the global stylesheet', async () => {
    const css = await (await app.request('/styles.css')).text()
    expect(css).toMatch(/@import url\("layout\.css"\);/)
  })
})
