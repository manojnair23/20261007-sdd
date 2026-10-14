import { describe, expect, it } from 'vitest'
import { testApp } from '../test/testApp'
import { validateAgent, type AgentFormValues } from './validate'

const { db } = testApp()

const valid: AgentFormValues = {
  name: 'Sir Summarize-a-Lot',
  model: 'Summarization model',
  bio: 'Turns every email into a bulleted list. Recipients have started to notice.',
}

describe('validateAgent', () => {
  it('accepts a valid agent and trims every field', () => {
    const result = validateAgent(db, { name: `  ${valid.name} `, model: ` ${valid.model}`, bio: `${valid.bio}\n` })
    expect(result).toEqual({ ok: true, value: valid })
  })

  it('asks for each missing field, keeping the trimmed values', () => {
    const result = validateAgent(db, { name: ' ', model: '', bio: '\n' })
    expect(result).toEqual({
      ok: false,
      errors: { name: 'Enter a name.', model: 'Enter a model.', bio: 'Enter a bio.' },
      values: { name: '', model: '', bio: '' },
    })
  })

  it('limits the name and model to 80 characters and the bio to 500', () => {
    expect(validateAgent(db, { ...valid, name: 'x'.repeat(80) }).ok).toBe(true)
    expect(validateAgent(db, { ...valid, model: 'x'.repeat(80), bio: 'x'.repeat(500) }).ok).toBe(true)

    const result = validateAgent(db, { name: 'x'.repeat(81), model: 'x'.repeat(81), bio: 'x'.repeat(501) })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual({
      name: 'Use 80 characters or fewer. This is 81.',
      model: 'Use 80 characters or fewer. This is 81.',
      bio: 'Use 500 characters or fewer. This is 501.',
    })
  })

  it("refuses another agent's name, ignoring case and spaces", () => {
    const result = validateAgent(db, { ...valid, name: '  loopy mcretry ' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual({ name: "There's already an agent called loopy mcretry. Choose another name." })
  })

  it('lets an agent keep their own name when edited', () => {
    // Agent 3 is Loopy McRetry in the seed.
    expect(validateAgent(db, { ...valid, name: 'Loopy McRetry' }, { ignoreId: 3 }).ok).toBe(true)
    expect(validateAgent(db, { ...valid, name: 'Loopy McRetry' }, { ignoreId: 1 }).ok).toBe(false)
  })
})
