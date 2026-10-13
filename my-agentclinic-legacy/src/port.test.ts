import { describe, expect, it } from 'vitest'
import { DEFAULT_PORT, parsePort } from './port'

describe('parsePort', () => {
  it('defaults to 3000 when PORT is unset or blank', () => {
    expect(parsePort(undefined)).toBe(DEFAULT_PORT)
    expect(parsePort('')).toBe(DEFAULT_PORT)
    expect(parsePort('  ')).toBe(DEFAULT_PORT)
  })

  it('accepts valid ports, including 0 for an OS-assigned port', () => {
    expect(parsePort('8080')).toBe(8080)
    expect(parsePort(' 4321 ')).toBe(4321)
    expect(parsePort('0')).toBe(0)
    expect(parsePort('65535')).toBe(65535)
  })

  it.each(['abc', '3000abc', '-1', '1.5', '65536', '1e3'])('rejects %j', (value) => {
    expect(() => parsePort(value)).toThrow(/Invalid PORT/)
  })
})
