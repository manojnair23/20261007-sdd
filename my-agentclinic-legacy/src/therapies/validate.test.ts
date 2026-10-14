import { describe, expect, it } from 'vitest'
import { getTherapy } from '../db/therapies'
import { FIXED_NOW, testApp } from '../test/testApp'
import { toSlot } from '../time'
import { validateTherapy, type TherapyFormValues } from './validate'

const { db } = testApp()
const now = toSlot(FIXED_NOW)

const valid: TherapyFormValues = {
  name: 'Gradient descent walk',
  description: 'A gentle stroll downhill, one small step at a time.',
  durationMinutes: '45',
}

/** The saved therapy's fields as form values, so a test can change just one. */
const asForm = (id: number): TherapyFormValues => {
  const { name, description, durationMinutes } = getTherapy(db, id)!
  return { name, description, durationMinutes: String(durationMinutes) }
}

describe('validateTherapy', () => {
  it('accepts a valid therapy, trims the text, and turns the duration into a number', () => {
    const result = validateTherapy(
      db,
      { name: ` ${valid.name}`, description: `${valid.description} `, durationMinutes: ' 45 ' },
      now,
    )
    expect(result).toEqual({
      ok: true,
      value: { name: valid.name, description: valid.description, durationMinutes: 45 },
    })
  })

  it('asks for each missing field, keeping the trimmed values', () => {
    expect(validateTherapy(db, { name: '', description: ' ', durationMinutes: '' }, now)).toEqual({
      ok: false,
      errors: { name: 'Enter a name.', description: 'Enter a description.', durationMinutes: 'Enter a duration.' },
      values: { name: '', description: '', durationMinutes: '' },
    })
  })

  it('limits the name to 80 characters and the description to 500', () => {
    expect(validateTherapy(db, { ...valid, name: 'x'.repeat(80), description: 'x'.repeat(500) }, now).ok).toBe(true)
    const result = validateTherapy(db, { ...valid, name: 'x'.repeat(81), description: 'x'.repeat(501) }, now)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual({
      name: 'Use 80 characters or fewer. This is 81.',
      description: 'Use 500 characters or fewer. This is 501.',
    })
  })

  it('takes a whole number of minutes from 1 to 480', () => {
    for (const ok of ['1', '480']) expect(validateTherapy(db, { ...valid, durationMinutes: ok }, now).ok, ok).toBe(true)
    for (const [text, error] of [
      ['0', 'Enter a number from 1 to 480.'],
      ['481', 'Enter a number from 1 to 480.'],
      ['4.5', 'Enter a whole number, like 45.'],
      ['forty', 'Enter a whole number, like 45.'],
    ]) {
      const result = validateTherapy(db, { ...valid, durationMinutes: text }, now)
      expect(result.ok ? undefined : result.errors.durationMinutes, text).toBe(error)
    }
  })

  it("refuses another therapy's name, ignoring case, but lets a therapy keep its own", () => {
    const result = validateTherapy(db, { ...valid, name: 'token DETOX' }, now)
    expect(result.ok ? undefined : result.errors.name).toBe(
      "There's already a therapy called token DETOX. Choose another name.",
    )
    expect(validateTherapy(db, asForm(1), now, { ignoreId: 1 }).ok).toBe(true)
  })

  describe('duration lock', () => {
    // Clarifying-questions coaching (4, 45 min) has one upcoming appointment in the seed.

    it("won't change the duration of a therapy with upcoming appointments", () => {
      const result = validateTherapy(db, { ...asForm(4), durationMinutes: '60' }, now, { ignoreId: 4 })
      expect(result.ok ? undefined : result.errors).toEqual({
        durationMinutes:
          "This therapy has 1 upcoming appointment, booked for 45 minutes. Change the duration after they've happened, or cancel them first.",
      })
    })

    it('still lets its name and description change', () => {
      const form = { ...asForm(4), name: 'Clarifying-questions bootcamp', description: 'Now with homework.' }
      expect(validateTherapy(db, form, now, { ignoreId: 4 }).ok).toBe(true)
    })

    it('ignores past and cancelled appointments', () => {
      // Exponential-backoff meditation (5) has only a past appointment; Citation grounding (6) only a cancelled one.
      expect(validateTherapy(db, { ...asForm(5), durationMinutes: '20' }, now, { ignoreId: 5 }).ok).toBe(true)
      expect(validateTherapy(db, { ...asForm(6), durationMinutes: '90' }, now, { ignoreId: 6 }).ok).toBe(true)
    })

    it("doesn't apply to a new therapy", () => {
      expect(validateTherapy(db, { ...valid, durationMinutes: '60' }, now).ok).toBe(true)
    })
  })
})
