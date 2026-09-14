import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as supabase from './supabase'

const calls = { inserts: [], updates: [], deletes: [], upserts: [] }
const responses = { all: {}, single: {}, lookup: {} }

function setTable(table, all = [], single = null) {
  responses.all[table] = all
  responses.single[table] = single
}

function setLookup(table, value) {
  responses.lookup[table] = value
}

function makeQueryBuilder(table) {
  const q = {}
  q.select = () => q
  q.eq = () => q
  q.ilike = () => q
  q.order = () => q
  q.maybeSingle = () => Promise.resolve({ data: responses.lookup[table] ?? null, error: null })
  q.single = () => Promise.resolve({ data: responses.single[table] ?? null, error: null })
  q.insert = (row) => {
    calls.inserts.push({ table, row })
    return q
  }
  q.update = (payload) => {
    calls.updates.push({ table, payload })
    return q
  }
  q.delete = () => {
    calls.deletes.push(table)
    return q
  }
  q.upsert = (row, opts) => {
    calls.upserts.push({ table, row, opts })
    return q
  }
  q.then = (res, rej) => Promise.resolve({ data: responses.all[table] ?? [], error: null }).then(res, rej)
  return q
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table) => makeQueryBuilder(table),
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  calls.inserts.length = 0
  calls.updates.length = 0
  calls.deletes.length = 0
  calls.upserts.length = 0
  responses.all = {}
  responses.single = {}
  responses.lookup = {}
})

const snakeRow = {
  id: 'a', url: 'https://x.com', title: 'T', description: '', image: '',
  category_id: null, status: 'saved', created_at: 5, owner: 'owner',
}

describe('supabase adapter', () => {
  it('maps link rows back to the app link shape', async () => {
    setTable('links', [{ ...snakeRow }])
    const links = await supabase.getLinks()
    expect(links[0]).toEqual({
      id: 'a', url: 'https://x.com', title: 'T', description: '', image: '',
      categoryId: null, status: 'saved', createdAt: 5,
    })
  })

  it('sends camelCase link data as a snake_case row with owner', async () => {
    setTable('links', [], { ...snakeRow })
    await supabase.addLink({ url: 'https://x.com', title: 'A', categoryId: null, status: 'draft', createdAt: 7 })
    expect(calls.inserts[0].row).toMatchObject({
      url: 'https://x.com', title: 'A', category_id: null, status: 'draft', created_at: 7, owner: 'owner',
    })
  })

  it('maps partial updates to snake_case', async () => {
    setTable('links', [], { ...snakeRow })
    await supabase.updateLink('a', { title: 'Renamed', categoryId: 'c1' })
    expect(calls.updates[0].payload).toEqual({ title: 'Renamed', category_id: 'c1' })
  })

  it('deletes by id', async () => {
    await supabase.deleteLink('a')
    expect(calls.deletes).toEqual(['links'])
  })

  it('deduplicates categories case-insensitively', async () => {
    setLookup('categories', { id: 'c1', name: 'Read Later' })
    const found = await supabase.addCategory('read later')
    expect(found).toEqual({ id: 'c1', name: 'Read Later' })
    expect(calls.inserts).toHaveLength(0)
  })

  it('inserts a brand new category', async () => {
    setLookup('categories', null)
    setTable('categories', [], { id: 'c2', name: 'Recipes' })
    const created = await supabase.addCategory('Recipes')
    expect(calls.inserts[0].row).toMatchObject({ name: 'Recipes', owner: 'owner' })
    expect(created).toEqual({ id: 'c2', name: 'Recipes' })
  })

  it('reads and upserts the single profile row', async () => {
    setLookup('profiles', { display_name: 'Ada' })
    expect(await supabase.getProfile()).toEqual({ name: 'Ada' })
    await supabase.saveProfile({ name: 'Bee' })
    expect(calls.upserts[0].row).toMatchObject({ id: 'me', display_name: 'Bee', owner: 'owner' })
  })
})