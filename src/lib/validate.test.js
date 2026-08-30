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
  it('accepts http and normalizes case', () => {
    expect(normalizeUrl('http://x.io')).toBe('http://x.io/')
    expect(normalizeUrl('HTTPS://X.IO')).toBe('https://x.io/')
  })
  it('rejects other explicit schemes', () => {
    expect(normalizeUrl('ftp://x.io')).toBeNull()
    expect(normalizeUrl('data:text/html,hi')).toBeNull()
  })
  it('rejects hosts without a dot', () => {
    expect(normalizeUrl('https://a')).toBeNull()
  })
  it('preserves query and fragment', () => {
    expect(normalizeUrl('https://example.com/p?q=1#top')).toBe('https://example.com/p?q=1#top')
  })
  it('strips userinfo, keeping the real destination', () => {
    expect(normalizeUrl('https://legit.com@evil.com')).toBe('https://evil.com/')
    expect(normalizeUrl('bar.com@evil.com')).toBe('https://evil.com/')
    expect(normalizeUrl('https://mailto:a@b.c')).toBe('https://b.c/')
  })
  it('supports explicit ports without a scheme', () => {
    expect(normalizeUrl('example.com:8080')).toBe('https://example.com:8080/')
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
