import { describe, expect, it } from 'vitest'
import { testApp } from '../test/testApp'
import { validateAilment, type AilmentFormValues } from './validate'

const { db } = testApp()

const valid: AilmentFormValues = {
  name: 'Emoji overload',
  description: 'Every reply has started ending in a little rocket, and nobody asked for that.',
}

describe('validateAilment', () => {
  it('accepts a valid ailment and trims both fields', () => {
    expect(validateAilment(db, { name: ` ${valid.name}  `, description: `\n${valid.description}` })).toEqual({
      ok: true,
      value: valid,
    })
  })

  it('asks for each missing field, keeping the trimmed values', () => {
    expect(validateAilment(db, { name: '', description: '   ' })).toEqual({
      ok: false,
      errors: { name: 'Enter a name.', description: 'Enter a description.' },
      values: { name: '', description: '' },
    })
  })

  it('limits the name to 80 characters and the description to 500', () => {
    expect(validateAilment(db, { name: 'x'.repeat(80), description: 'x'.repeat(500) }).ok).toBe(true)

    const result = validateAilment(db, { name: 'x'.repeat(81), description: 'x'.repeat(501) })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual({
      name: 'Use 80 characters or fewer. This is 81.',
      description: 'Use 500 characters or fewer. This is 501.',
    })
  })

  it("refuses another ailment's name, ignoring case", () => {
    const result = validateAilment(db, { ...valid, name: 'PROMPT FATIGUE' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual({ name: "There's already an ailment called PROMPT FATIGUE. Choose another name." })
  })

  it('lets an ailment keep its own name when edited', () => {
    // Ailment 1 is Prompt fatigue in the seed.
    expect(validateAilment(db, { ...valid, name: 'Prompt fatigue' }, { ignoreId: 1 }).ok).toBe(true)
    expect(validateAilment(db, { ...valid, name: 'Prompt fatigue' }, { ignoreId: 2 }).ok).toBe(false)
  })
})
