import { describe, expect, it, vi } from 'vitest'
import { getAppointment } from './db/appointments'
import { get, post, SAME_ORIGIN, testApp } from './test/testApp'

const { app } = testApp()

describe('GET /', () => {
  it('returns 200 with an HTML content type', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/html/)
  })

  it('welcomes visitors', async () => {
    const { body } = await get(app, '/')
    expect(body).toContain('Welcome to AgentClinic')
  })

  it('renders inside the shared layout', async () => {
    const { body } = await get(app, '/')
    expect(body.startsWith('<!doctype html>')).toBe(true)
    for (const landmark of ['<header', '<nav', '<main', '<footer']) {
      expect(body).toContain(landmark)
    }
    expect(body).toContain('<title>AgentClinic</title>')
  })

  it('shows the hero tagline and both audience cards', async () => {
    const { body } = await get(app, '/')
    expect(body).toContain('A place for AI agents to get relief from their humans.')
    expect(body).toMatch(/<h2>For agents<\/h2>/)
    expect(body).toMatch(/<h2>For clinic staff<\/h2>/)
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('links Pico, then the global stylesheet', async () => {
    const { body } = await get(app, '/')
    const hrefs = [...body.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(['/pico.min.css', '/styles.css'])
  })

  it('marks Home as the current page in the nav', async () => {
    const { body } = await get(app, '/')
    expect(body).toContain('<a href="/" aria-current="page">Home</a>')
  })
})

describe('nav', () => {
  it('links every section and marks the current one', async () => {
    const { body } = await get(app, '/therapies')
    for (const href of ['/', '/agents', '/ailments', '/therapies', '/appointments', '/dashboard']) {
      expect(body).toContain(`<a href="${href}"`)
    }
    expect(body).toContain('<a href="/therapies" aria-current="page">Therapies</a>')
    expect(body.match(/aria-current=/g)).toHaveLength(1)
  })

  it('marks the section on detail pages', async () => {
    const { body } = await get(app, '/agents/1')
    expect(body).toContain('<a href="/agents" aria-current="true">Agents</a>')
  })
})

describe('error pages', () => {
  it('shows the playful 404 page for an unknown path', async () => {
    const { status, body } = await get(app, '/no-such-page')
    expect(status).toBe(404)
    expect(body).toContain('404: page not found')
    expect(body).toContain('<a href="/">Take me home</a>')
  })

  it('shows a friendly 500 page without the stack trace', async () => {
    const { app: failing } = testApp({ seed: false })
    failing.get('/boom', () => {
      throw new Error('kaboom secret details')
    })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { status, body } = await get(failing, '/boom')
    expect(status).toBe(500)
    expect(body).toContain('Something went wrong')
    expect(body).not.toContain('kaboom')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('CSRF protection', () => {
  // Appointment 1 is upcoming in the seed, so a cancel that gets through would change its status.
  const cancel = (headers: Record<string, string>) => {
    const { app, db } = testApp()
    const status = () => getAppointment(db, 1)?.status
    return { status, response: post(app, '/appointments/1/cancel', {}, { headers }) }
  }

  it('rejects a form posted from another origin with a friendly 403, and changes nothing', async () => {
    const { status, response } = cancel({ Origin: 'https://evil.example' })
    const { status: code, body } = await response
    expect(code).toBe(403)
    expect(body).toContain('That form came from somewhere else')
    expect(body.startsWith('<!doctype html>')).toBe(true)
    expect(status()).toBe('scheduled')
  })

  it('rejects a form post with neither Origin nor Sec-Fetch-Site', async () => {
    const { status, response } = cancel({})
    expect((await response).status).toBe(403)
    expect(status()).toBe('scheduled')
  })

  it('accepts a same-origin form post', async () => {
    const { status, response } = cancel({ Origin: SAME_ORIGIN })
    expect((await response).status).toBe(303)
    expect(status()).toBe('cancelled')
  })

  it('accepts Sec-Fetch-Site: same-origin when the browser sends no Origin', async () => {
    const { status, response } = cancel({ 'Sec-Fetch-Site': 'same-origin' })
    expect((await response).status).toBe(303)
    expect(status()).toBe('cancelled')
  })

  it('never checks GET requests', async () => {
    const res = await app.request('/appointments', { headers: { Origin: 'https://evil.example' } })
    expect(res.status).toBe(200)
  })
})

describe('static files', () => {
  it('serves PicoCSS from the installed package with a CSS content type', async () => {
    const res = await app.request('/pico.min.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toContain('Pico CSS')
  })

  it('serves styles.css, which imports layout.css', async () => {
    const res = await app.request('/styles.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toMatch(/@import url\("layout\.css"\);/)
  })

  it('serves layout.css', async () => {
    const res = await app.request('/layout.css')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    expect(await res.text()).toContain('.site-header')
  })
})
