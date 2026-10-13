import { describe, expect, it } from 'vitest'
import { FIXED_NOW, testApp } from '../test/testApp'
import { toSlot } from '../time'
import { validateBooking, type BookingInput } from './validate'

// Fixed clock: Mon Oct 12 2026, 10:00. Seeded: GPT-Overthinker (agent 1) has appointment 1,
// Clarifying-questions coaching (45 min), on Tue Oct 13 at 10:00. Captain Hallucination (agent 2)
// has a *cancelled* appointment on Oct 13 at 15:00.
const { db } = testApp()
const NOW = toSlot(FIXED_NOW)

// Therapy 1: Token detox, 60 min. Therapy 2: Guided temperature reduction, 30 min.
const book = (input: Partial<BookingInput>, options?: { ignoreId?: number }) =>
  validateBooking(db, { agent: '1', therapy: '2', startsAt: '2026-10-13T11:00', ...input }, NOW, options)

const errorsOf = (input: Partial<BookingInput>, options?: { ignoreId?: number }) => {
  const result = book(input, options)
  return result.ok ? {} : result.errors
}

describe('validateBooking', () => {
  it('accepts a valid booking and returns typed values', () => {
    expect(book({})).toEqual({ ok: true, value: { agentId: 1, therapyId: 2, startsAt: '2026-10-13T11:00' } })
  })

  it('keeps the submitted values (trimmed) when invalid', () => {
    const result = book({ agent: ' 999 ', startsAt: 'soon' })
    expect(result).toMatchObject({ ok: false, values: { agent: '999', therapy: '2', startsAt: 'soon' } })
  })

  describe('agent and therapy', () => {
    it('requires both', () => {
      expect(errorsOf({ agent: '', therapy: '' })).toEqual({ agent: 'Choose an agent.', therapy: 'Choose a therapy.' })
    })

    it('rejects unknown or non-numeric ids', () => {
      for (const id of ['999', 'abc', '1.5', '-1', '0']) {
        expect(errorsOf({ agent: id }).agent).toBe('Choose an agent from the list.')
        expect(errorsOf({ therapy: id }).therapy).toBe('Choose a therapy from the list.')
      }
    })
  })

  describe('time', () => {
    it('requires a real date and time', () => {
      expect(errorsOf({ startsAt: '' }).startsAt).toBe('Choose a date and time.')
      expect(errorsOf({ startsAt: 'tomorrow' }).startsAt).toBe('Enter a real date and time.')
      expect(errorsOf({ startsAt: '2026-02-30T10:00' }).startsAt).toBe('Enter a real date and time.')
    })

    it('must be in the future', () => {
      expect(errorsOf({ startsAt: '2026-10-12T09:45' }).startsAt).toBe('Choose a time in the future.')
      expect(errorsOf({ startsAt: NOW }).startsAt).toBe('Choose a time in the future.')
      expect(errorsOf({ startsAt: '2026-10-12T10:15' })).toEqual({})
    })

    it('must start on a 15-minute boundary', () => {
      expect(errorsOf({ startsAt: '2026-10-13T11:10' }).startsAt).toMatch(/quarter hour/)
      for (const minutes of ['00', '15', '30', '45'])
        expect(errorsOf({ startsAt: `2026-10-13T11:${minutes}` })).toEqual({})
    })

    it('must start within clinic hours', () => {
      expect(errorsOf({ startsAt: '2026-10-13T08:45' }).startsAt).toBe('The clinic is open from 9:00 AM to 5:00 PM.')
      expect(errorsOf({ startsAt: '2026-10-13T17:00' }).startsAt).toBe('The clinic is open from 9:00 AM to 5:00 PM.')
      expect(errorsOf({ startsAt: '2026-10-13T09:00' })).toEqual({})
    })

    it("must end by 5:00 PM, counting the therapy's duration", () => {
      expect(errorsOf({ therapy: '1', startsAt: '2026-10-13T16:00' })).toEqual({})
      expect(errorsOf({ therapy: '1', startsAt: '2026-10-13T16:15' }).startsAt).toBe(
        'Token detox takes 60 minutes, so it would end at 5:15 PM. The clinic closes at 5:00 PM.',
      )
    })
  })

  describe('clarified rules (D7)', () => {
    it('is open every day, weekends included', () => {
      expect(new Date(2026, 9, 17).getDay()).toBe(6) // Saturday
      expect(errorsOf({ startsAt: '2026-10-17T11:00' })).toEqual({})
      expect(errorsOf({ startsAt: '2026-10-18T09:00' })).toEqual({}) // Sunday
    })

    it('lets different agents book the same therapy at the same time', () => {
      // GPT-Overthinker already has Clarifying-questions coaching (therapy 4) at this time.
      expect(errorsOf({ agent: '4', therapy: '4', startsAt: '2026-10-13T10:00' })).toEqual({})
    })
  })

  describe('overlaps', () => {
    it("rejects a slot that overlaps the agent's scheduled appointment", () => {
      expect(errorsOf({ startsAt: '2026-10-13T10:30' }).startsAt).toBe(
        "GPT-Overthinker already has Clarifying-questions coaching at 10:00 AM. Choose a time that doesn't overlap.",
      )
      // Starts before and runs into it.
      expect(errorsOf({ therapy: '1', startsAt: '2026-10-13T09:15' }).startsAt).toMatch(/already has/)
    })

    it('accepts back-to-back appointments', () => {
      expect(errorsOf({ startsAt: '2026-10-13T09:30' })).toEqual({}) // 30 min, ends 10:00
      expect(errorsOf({ startsAt: '2026-10-13T10:45' })).toEqual({}) // starts as the other ends
    })

    it('only checks the same agent', () => {
      expect(errorsOf({ agent: '4', startsAt: '2026-10-13T10:00' })).toEqual({})
    })

    it('ignores cancelled appointments', () => {
      expect(errorsOf({ agent: '2', startsAt: '2026-10-13T15:00' })).toEqual({})
    })

    it('lets an appointment be rescheduled over its own old slot', () => {
      expect(errorsOf({ therapy: '4', startsAt: '2026-10-13T10:15' }).startsAt).toMatch(/already has/)
      expect(errorsOf({ therapy: '4', startsAt: '2026-10-13T10:15' }, { ignoreId: 1 })).toEqual({})
    })
  })
})
