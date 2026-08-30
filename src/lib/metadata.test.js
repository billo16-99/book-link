import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMetadata } from './metadata'

function okResponse(json) {
  return { ok: true, status: 200, json: async () => json }
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchMetadata', () => {
  it('maps microlink data to {title, description, image}', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      okResponse({ status: 'success', data: { title: 'T', description: 'D', image: { url: 'i.png' } } }),
    ))
    await expect(fetchMetadata('https://a.com')).resolves.toEqual({
      title: 'T', description: 'D', image: 'i.png',
    })
    expect(fetch).toHaveBeenCalledWith('https://api.microlink.io/?url=https%3A%2F%2Fa.com')
  })

  it('retries once after a network failure then succeeds', async () => {
    const fail = async () => { throw new Error('offline') }
    const fetchMock = vi.fn(fail)
    fetchMock.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(okResponse({ status: 'success', data: {} }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchMetadata('https://a.com')).resolves.toEqual({ title: '', description: '', image: '' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns null after two failures', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('down') })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchMetadata('https://a.com')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('treats non-success status as failure', async () => {
    const fetchMock = vi.fn(async () => okResponse({ status: 'failed' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchMetadata('https://a.com')).resolves.toBeNull()
  })
})
