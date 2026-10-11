import { describe, expect, it } from 'vitest'
import { Layout } from './Layout'
import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { Main } from './layout/Main'

const render = (node: unknown) => String(node)

describe('layout subcomponents', () => {
  it('Header renders the site name and nav', () => {
    const html = render(<Header />)
    expect(html).toMatch(/^<header class="site-header">/)
    expect(html).toContain('<a class="site-name" href="/">AgentClinic</a>')
    expect(html).toContain('<nav aria-label="Main">')
  })

  it('Main wraps its children in a container', () => {
    expect(render(<Main><p>Hello</p></Main>)).toBe('<main class="container"><p>Hello</p></main>')
  })

  it('Footer renders the footer line', () => {
    const html = render(<Footer />)
    expect(html).toMatch(/^<footer class="site-footer">/)
    expect(html).toContain('No agents were over-prompted')
  })
})

describe('Layout', () => {
  it('composes header, main, and footer in order with the page content inside main', () => {
    const html = render(
      <Layout title="Test page">
        <p>Body content</p>
      </Layout>,
    )
    expect(html).toContain('<title>Test page</title>')
    expect(html).toContain('<link rel="stylesheet" href="/styles.css"/>')
    const header = html.indexOf('<header')
    const main = html.indexOf('<main')
    const footer = html.indexOf('<footer')
    expect(header).toBeGreaterThan(-1)
    expect(main).toBeGreaterThan(header)
    expect(footer).toBeGreaterThan(main)
    expect(html).toContain('<main class="container"><p>Body content</p></main>')
  })

  it('sets the viewport meta tag for responsive layouts', () => {
    const html = render(<Layout title="Test page" />)
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
  })
})
