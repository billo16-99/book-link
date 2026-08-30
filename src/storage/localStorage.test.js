import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLinks, getLink, addLink, updateLink, deleteLink,
  getCategories, addCategory, SEED_CATEGORIES,
} from './localStorage'

beforeEach(() => localStorage.clear())

describe('links', () => {
  it('starts empty', async () => {
    expect(await getLinks()).toEqual([])
  })

  it('addLink assigns id, createdAt and defaults, persists', async () => {
    const created = await addLink({ url: 'https://example.com', title: 'Ex' })
    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeTypeOf('number')
    expect(created.status).toBe('draft')
    expect(await getLinks()).toHaveLength(1)
    expect((await getLinks())[0].url).toBe('https://example.com')
  })

  it('getLink returns record or null', async () => {
    const created = await addLink({ url: 'https://a.com' })
    expect((await getLink(created.id)).url).toBe('https://a.com')
    expect(await getLink('missing')).toBeNull()
  })

  it('updateLink merges patch and keeps createdAt/id', async () => {
    const created = await addLink({ url: 'https://a.com', title: 'Old' })
    const updated = await updateLink(created.id, { title: 'New', status: 'saved' })
    expect(updated).toMatchObject({ id: created.id, title: 'New', status: 'saved' })
    expect(updated.createdAt).toBe(created.createdAt)
    expect((await getLink(created.id)).title).toBe('New')
  })

  it('updateLink returns null for unknown id', async () => {
    expect(await updateLink('ghost', { title: 'x' })).toBeNull()
  })

  it('deleteLink removes the record', async () => {
    const created = await addLink({ url: 'https://a.com' })
    await deleteLink(created.id)
    expect(await getLink(created.id)).toBeNull()
  })

  it('throws storage-unavailable when quota exceeded', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await expect(addLink({ url: 'https://a.com' })).rejects.toThrow('storage-unavailable')
  })
})

describe('categories', () => {
  it('seeds four defaults on first read', async () => {
    const cats = await getCategories()
    expect(cats.map((c) => c.name)).toEqual(SEED_CATEGORIES.map((c) => c.name))
    expect(cats[0]).toMatchObject({ id: 'read-later', name: 'Read Later' })
  })

  it('rejects empty names', async () => {
    await getCategories()
    await expect(addCategory('   ')).rejects.toThrow('category-name-required')
  })

  it('addCategory dedupes case-insensitively', async () => {
    await getCategories()
    const c = await addCategory('Tools'.toLowerCase())
    expect(c.name).toBe('Tools')
    expect(await getCategories()).toHaveLength(4)
  })

  it('addCategory persists new names', async () => {
    await getCategories()
    await addCategory('Recipes')
    expect((await getCategories()).some((c) => c.name === 'Recipes')).toBe(true)
  })
})
