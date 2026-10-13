import { describe, expect, it } from 'vitest'
import { addMinutes, formatSlot, formatTime, isSlot, parseSlot, slotDate, slotTime, toSlot } from './time'

describe('toSlot', () => {
  it('formats local time as YYYY-MM-DDTHH:mm with zero padding', () => {
    expect(toSlot(new Date(2026, 0, 5, 9, 3))).toBe('2026-01-05T09:03')
  })
})

describe('isSlot / parseSlot', () => {
  it('accepts real dates and times', () => {
    expect(isSlot('2026-10-12T14:30')).toBe(true)
    expect(parseSlot('2026-10-12T14:30')?.getHours()).toBe(14)
  })

  it('rejects malformed and impossible values', () => {
    for (const text of [
      '',
      'soon',
      '2026-10-12',
      '2026-10-12 14:30',
      '2026-02-30T10:00',
      '2026-10-12T24:00',
      '2026-10-12T14:30:00',
    ]) {
      expect(isSlot(text)).toBe(false)
    }
  })
})

describe('addMinutes', () => {
  it('adds within the hour', () => {
    expect(addMinutes('2026-10-12T14:00', 45)).toBe('2026-10-12T14:45')
  })

  it('rolls over the hour and the day', () => {
    expect(addMinutes('2026-10-12T16:30', 45)).toBe('2026-10-12T17:15')
    expect(addMinutes('2026-10-12T23:30', 60)).toBe('2026-10-13T00:30')
    expect(addMinutes('2026-12-31T23:45', 30)).toBe('2027-01-01T00:15')
  })

  it('subtracts across midnight', () => {
    expect(addMinutes('2026-10-12T00:15', -30)).toBe('2026-10-11T23:45')
  })

  it('throws on a non-slot', () => {
    expect(() => addMinutes('nope', 5)).toThrow()
  })
})

describe('slotDate / slotTime', () => {
  it('splits a slot', () => {
    expect(slotDate('2026-10-12T14:30')).toBe('2026-10-12')
    expect(slotTime('2026-10-12T14:30')).toBe('14:30')
  })
})

describe('formatSlot / formatTime', () => {
  it('formats in en-US with a plain space before AM/PM', () => {
    expect(formatSlot('2026-10-12T14:30')).toBe('Mon, Oct 12, 2026, 2:30 PM')
    expect(formatTime('2026-10-12T09:00')).toBe('9:00 AM')
  })
})
