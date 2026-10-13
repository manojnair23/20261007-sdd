import { describe, expect, it } from 'vitest'
import { formText, parseId, requiredText, wholeNumber } from './validation'

describe('formText', () => {
  it('returns string fields and turns anything else into ""', () => {
    const body = { name: 'Loopy', upload: new Blob(['x']), many: ['a', 'b'] }
    expect(formText(body, 'name')).toBe('Loopy')
    expect(formText(body, 'upload')).toBe('')
    expect(formText(body, 'many')).toBe('')
    expect(formText(body, 'missing')).toBe('')
  })
})

describe('parseId', () => {
  it('accepts positive whole numbers, allowing surrounding spaces', () => {
    expect(parseId('1')).toBe(1)
    expect(parseId(' 42 ')).toBe(42)
    expect(parseId('9999999999')).toBe(9999999999)
  })

  it('rejects everything else', () => {
    for (const text of ['', ' ', '0', '-1', '01', '1.5', '1e3', 'abc', '12345678901']) {
      expect(parseId(text), text).toBeUndefined()
    }
  })
})

describe('requiredText', () => {
  it('accepts text up to the limit, ignoring surrounding spaces', () => {
    expect(requiredText('Token detox', 'a name', 80)).toBeUndefined()
    expect(requiredText(`  ${'x'.repeat(80)}  `, 'a name', 80)).toBeUndefined()
  })

  it('asks for blank or whitespace-only text', () => {
    expect(requiredText('', 'a name', 80)).toBe('Enter a name.')
    expect(requiredText('   ', 'a description', 500)).toBe('Enter a description.')
  })

  it('says how long text over the limit is', () => {
    expect(requiredText('x'.repeat(81), 'a name', 80)).toBe('Use 80 characters or fewer. This is 81.')
  })
})

describe('wholeNumber', () => {
  it('accepts whole numbers in range, including both ends', () => {
    expect(wholeNumber('1', 'a duration', 1, 480)).toEqual({ ok: true, value: 1 })
    expect(wholeNumber(' 45 ', 'a duration', 1, 480)).toEqual({ ok: true, value: 45 })
    expect(wholeNumber('480', 'a duration', 1, 480)).toEqual({ ok: true, value: 480 })
  })

  it('asks for a blank value', () => {
    expect(wholeNumber('  ', 'a duration', 1, 480)).toEqual({ ok: false, error: 'Enter a duration.' })
  })

  it('rejects anything that is not plain digits', () => {
    for (const text of ['-5', '4.5', '1e2', 'forty', '45 min']) {
      expect(wholeNumber(text, 'a duration', 1, 480), text).toEqual({
        ok: false,
        error: 'Enter a whole number, like 45.',
      })
    }
  })

  it('rejects numbers out of range', () => {
    for (const text of ['0', '481', '100000']) {
      expect(wholeNumber(text, 'a duration', 1, 480), text).toEqual({
        ok: false,
        error: 'Enter a number from 1 to 480.',
      })
    }
  })
})
