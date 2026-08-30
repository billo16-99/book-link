import { describe, it, expect } from 'vitest'
import { CAP_CHARS, linkQrPayload, collectionQrPayload, decodeSharedPayload } from './qrPayload'

const link = (i, over = {}) => ({
  id: `l${i}`,
  url: `https://example.com/${i}`,
  title: `Title ${i}`,
  domain: 'example.com',
  createdAt: 1000 + i,
  ...over,
})

describe('linkQrPayload', () => {
  it('encodes the destination URL directly', () => {
    expect(linkQrPayload(link(1))).toBe('https://example.com/1')
  })
})

describe('collectionQrPayload', () => {
  it('builds shareable hash URL with newest links first', () => {
    const { url, included, total } = collectionQrPayload([link(1), link(2)], 'https://bl.app', '/app/')
    expect(url.startsWith('https://bl.app/app/#/s/')).toBe(true)
    const decoded = decodeSharedPayload(url.split('/s/')[1])
    expect(decoded.total).toBe(2)
    expect(decoded.items[0].url).toBe('https://example.com/2')
    expect(included).toBe(2)
  })

  it('truncates to fit the cap, keeping newest', () => {
    const fat = Array.from({ length: 60 }, (_, i) =>
      link(i, { title: 'X'.repeat(120), url: `https://example.com/${'y'.repeat(80)}/${i}` }),
    )
    const result = collectionQrPayload(fat, 'https://bl.app', '/')
    expect(result.url.length).toBeLessThanOrEqual(2000)
    expect(result.included).toBeGreaterThan(0)
    expect(result.included).toBeLessThan(60)
    expect(result.included).toBe(result.total - (60 - result.included))
    const decoded = decodeSharedPayload(result.url.split('/s/')[1])
    expect(decoded.items).toHaveLength(result.included)
    expect(decoded.items[0].url).toContain('59')
  })

  it('keeps one link when it fits the cap', () => {
    const longTitle = 'L'.repeat(1400)
    const result = collectionQrPayload(
      [link(1, { title: longTitle })],
      'https://bl.app', '/',
    )
    expect(result.included).toBe(1)
    expect(result.total).toBe(1)
    expect(result.url.length).toBeLessThanOrEqual(2000)
    const decoded = decodeSharedPayload(result.url.split('/s/')[1])
    expect(decoded.items).toHaveLength(1)
    expect(decoded.items[0].title).toBe(longTitle)
  })

  it('degrades to an empty payload when even one link exceeds the cap', () => {
    const huge = Array.from({ length: 50 }, (_, i) =>
      link(i, { title: 'H'.repeat(3000), url: `https://example.com/${i}` }),
    )
    const result = collectionQrPayload(huge, 'https://bl.app', '/')
    expect(result.included).toBe(0)
    expect(result.total).toBe(50)
    const decoded = decodeSharedPayload(result.url.split('/s/')[1])
    expect(decoded.items).toHaveLength(0)
    expect(decoded.total).toBe(50)
  })

  it('never places / in the url payload segment', () => {
    const result = collectionQrPayload([link(1)], 'https://bl.app', '/')
    const payload = result.url.split('/s/')[1]
    expect(payload).not.toMatch(/\//)
    expect(decodeSharedPayload(payload).items).toHaveLength(1)
  })
})

describe('decodeSharedPayload', () => {
  it('round-trips unicode titles', () => {
    const { url } = collectionQrPayload(
      [link(1, { title: 'Résumé ✦ 中文' })],
      'https://bl.app', '/',
    )
    const decoded = decodeSharedPayload(url.split('/s/')[1])
    expect(decoded.items[0].title).toBe('Résumé ✦ 中文')
  })

  it('returns null on corrupt input', () => {
    expect(decodeSharedPayload('!!!not-base64!!!')).toBeNull()
    expect(decodeSharedPayload('')).toBeNull()
  })
})

describe('CAP_CHARS', () => {
  it('is ~2KB', () => {
    expect(CAP_CHARS).toBe(2000)
  })
})
