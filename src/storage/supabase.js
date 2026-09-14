import { createClient } from '@supabase/supabase-js'

const OWNER = 'owner'
const PROFILE_ID = 'me'

let client = null

function db() {
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }
  return client
}

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

const rowToLink = (r) => ({
  id: r.id,
  url: r.url,
  title: r.title,
  description: r.description,
  image: r.image,
  categoryId: r.category_id,
  status: r.status,
  createdAt: r.created_at,
})

const linkToRow = (l) => ({
  id: l.id,
  url: l.url,
  title: l.title ?? '',
  description: l.description ?? '',
  image: l.image ?? '',
  category_id: l.categoryId ?? null,
  status: l.status ?? 'draft',
  created_at: l.createdAt ?? Date.now(),
  owner: OWNER,
})

const rowToCategory = (r) => ({ id: r.id, name: r.name })

export async function getLinks() {
  const { data, error } = await db()
    .from('links')
    .select('*')
    .eq('owner', OWNER)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToLink)
}

export async function getLink(id) {
  const { data, error } = await db()
    .from('links')
    .select('*')
    .eq('owner', OWNER)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToLink(data) : null
}

export async function addLink(data) {
  const record = { ...data, id: data.id ?? uid() }
  const { data: inserted, error } = await db()
    .from('links')
    .insert(linkToRow(record))
    .select()
    .single()
  if (error) throw error
  return rowToLink(inserted)
}

export async function updateLink(id, patch) {
  const payload = {}
  if (patch.title !== undefined) payload.title = patch.title
  if (patch.description !== undefined) payload.description = patch.description
  if (patch.image !== undefined) payload.image = patch.image
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId
  if (patch.status !== undefined) payload.status = patch.status

  const { data: updated, error } = await db()
    .from('links')
    .update(payload)
    .eq('owner', OWNER)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return rowToLink(updated)
}

export async function deleteLink(id) {
  const { error } = await db()
    .from('links')
    .delete()
    .eq('owner', OWNER)
    .eq('id', id)
  if (error) throw error
}

export async function getCategories() {
  const { data, error } = await db()
    .from('categories')
    .select('*')
    .eq('owner', OWNER)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToCategory)
}

export async function addCategory(name) {
  const clean = String(name ?? '').trim()
  if (!clean) throw new Error('category-name-required')

  const { data: existing, error: findErr } = await db()
    .from('categories')
    .select('*')
    .eq('owner', OWNER)
    .ilike('name', clean)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) return rowToCategory(existing)

  const { data: created, error } = await db()
    .from('categories')
    .insert({ id: uid(), name: clean, created_at: Date.now(), owner: OWNER })
    .select()
    .single()
  if (error) throw error
  return rowToCategory(created)
}

export async function getProfile() {
  const { data, error } = await db()
    .from('profiles')
    .select('display_name')
    .eq('id', PROFILE_ID)
    .maybeSingle()
  if (error) throw error
  return { name: data?.display_name ?? '' }
}

export async function saveProfile(profile) {
  const { error } = await db()
    .from('profiles')
    .upsert({ id: PROFILE_ID, display_name: profile.name ?? '', owner: OWNER }, { onConflict: 'id' })
  if (error) throw error
}