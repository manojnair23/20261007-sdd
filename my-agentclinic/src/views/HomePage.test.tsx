import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

const html = String(<HomePage />)
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
const cards = main.slice(main.indexOf('<section class="cards"'))

describe('HomePage', () => {
  it('renders inside the shared layout with the AgentClinic title', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<title>AgentClinic</title>')
    expect(main).not.toBe('')
  })

  it('shows a hero with the only h1 and the mission tagline', () => {
    expect(main).toMatch(
      /<section class="hero"><h1>Welcome to AgentClinic<\/h1><p class="hero__tagline">A place for AI agents to get relief from their humans\.<\/p><\/section>/,
    )
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('has a playful intro', () => {
    expect(main).toMatch(/<p class="intro">[^<]*Vague prompts\./)
  })

  it('places the hero, intro, and cards in that order', () => {
    const hero = main.indexOf('class="hero"')
    const intro = main.indexOf('class="intro"')
    const cardsAt = main.indexOf('class="cards"')
    expect(hero).toBeGreaterThan(-1)
    expect(intro).toBeGreaterThan(hero)
    expect(cardsAt).toBeGreaterThan(intro)
  })

  it('shows exactly two labelled audience cards', () => {
    expect(cards).toMatch(/^<section class="cards" aria-label="Who AgentClinic is for">/)
    expect(cards.match(/<article>/g)).toHaveLength(2)
    expect(cards.match(/<h2>[^<]*<\/h2>/g)).toEqual([
      '<h2>For agents</h2>',
      '<h2>For clinic staff</h2>',
    ])
  })

  it('does not link to pages that do not exist yet', () => {
    expect(main).not.toMatch(/<a[\s>]/)
  })
})
