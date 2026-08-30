import { describe, it, expect } from 'vitest'
import { normalizeUrl, isValidUrl, domainOf } from './validate'

describe('normalizeUrl', () => {
  it('accepts absolute https URLs', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com/')
  })
  it('prepends https:// when scheme missing', () => {
    expect(normalizeUrl('example.com/page')).toBe('https://example.com/page')
  })
  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com/')
  })
  it('rejects non-http protocols', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('mailto:a@b.c')).toBeNull()
  })
  it('rejects garbage', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('not a url')).toBeNull()
    expect(normalizeUrl(null)).toBeNull()
  })
})

describe('isValidUrl', () => {
  it('mirrors normalizeUrl', () => {
    expect(isValidUrl('https://ok.com')).toBe(true)
    expect(isValidUrl('nope')).toBe(false)
  })
})

describe('domainOf', () => {
  it('strips www', () => {
    expect(domainOf('https://www.example.com/x')).toBe('example.com')
  })
  it('returns empty string on bad input', () => {
    expect(domainOf('zzz')).toBe('')
  })
})
