import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { StoreProvider, useStore } from './useStore'

vi.mock('../storage/repository', () => ({
  repository: {
    getLinks: vi.fn(async () => [
      { id: 'a', url: 'https://a.com', title: 'A', description: '', image: '',
        categoryId: null, status: 'saved', createdAt: 1 },
    ]),
    addLink: vi.fn(async (d) => ({ id: 'new', createdAt: 2, status: 'draft', ...d })),
    updateLink: vi.fn(async (id, patch) => ({ id, ...patch })),
    deleteLink: vi.fn(async () => {}),
    getCategories: vi.fn(async () => [{ id: 'tools', name: 'Tools' }]),
    getLink: vi.fn(async () => null),
    addCategory: vi.fn(async (name) => ({ id: 'c1', name })),
  },
}))

vi.mock('../lib/metadata', () => ({
  fetchMetadata: vi.fn(async () => null),
}))

import { repository } from '../storage/repository'
import { fetchMetadata } from '../lib/metadata'

const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>

beforeEach(() => vi.clearAllMocks())

describe('useStore', () => {
  it('loads links and categories', async () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.links).toHaveLength(1)
    expect(result.current.categories).toHaveLength(1)
  })

  it('addLink saves with status saved when metadata succeeds', async () => {
    fetchMetadata.mockResolvedValueOnce({ title: 'T', description: 'D', image: 'i' })
    const { result } = renderHook(() => useStore(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(() => result.current.addLink({ url: 'https://x.com', categoryId: null }))
    expect(repository.addLink).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://x.com', title: 'T', status: 'saved',
    }))
    expect(result.current.links.some((l) => l.id === 'new')).toBe(true)
  })

  it('addLink falls back to draft with domain title on metadata failure', async () => {
    fetchMetadata.mockResolvedValueOnce(null)
    const { result } = renderHook(() => useStore(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(() => result.current.addLink({ url: 'https://x.com/y' }))
    expect(repository.addLink).toHaveBeenCalledWith(expect.objectContaining({
      title: 'x.com', status: 'draft',
    }))
  })

  it('toggleStatus flips draft/saved through repository', async () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(() => result.current.updateLink('a', { status: 'draft' }))
    expect(repository.updateLink).toHaveBeenCalledWith('a', { status: 'draft' })
  })

  it('retryMetadata saves fetched metadata through updateLink', async () => {
    fetchMetadata.mockResolvedValueOnce({ title: 'New T', description: 'D2', image: 'i2' })
    repository.getLink.mockResolvedValueOnce({
      id: 'a', url: 'https://a.com', title: 'Old A', description: '', image: '', status: 'draft',
    })
    const { result } = renderHook(() => useStore(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(() => result.current.retryMetadata('a'))
    expect(repository.updateLink).toHaveBeenCalledWith('a', {
      title: 'New T', description: 'D2', image: 'i2', status: 'saved',
    })
  })

  it('toasts when the initial load fails', async () => {
    repository.getLinks.mockRejectedValueOnce(new Error('boom'))
    const handler = vi.fn()
    window.addEventListener('booklink:toast', handler)
    try {
      const { result } = renderHook(() => useStore(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].detail).toBe('Could not load your links')
      expect(result.current.links).toHaveLength(0)
    } finally {
      window.removeEventListener('booklink:toast', handler)
    }
  })
})
