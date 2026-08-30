const LINKS_KEY = 'booklink.links.v1'
const CATEGORIES_KEY = 'booklink.categories.v1'

export const SEED_CATEGORIES = [
  { id: 'read-later', name: 'Read Later' },
  { id: 'tools', name: 'Tools' },
  { id: 'inspiration', name: 'Inspiration' },
  { id: 'shopping', name: 'Shopping' },
]

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error('storage-unavailable')
  }
}

export async function getLinks() {
  const data = readJson(LINKS_KEY)
  return Array.isArray(data) ? data : []
}

export async function getLink(id) {
  return (await getLinks()).find((l) => l.id === id) ?? null
}

export async function addLink(data) {
  const links = await getLinks()
  const record = {
    id: data.id ?? uid(),
    url: data.url,
    title: data.title ?? '',
    description: data.description ?? '',
    image: data.image ?? '',
    categoryId: data.categoryId ?? null,
    status: data.status ?? 'draft',
    createdAt: data.createdAt ?? Date.now(),
  }
  writeJson(LINKS_KEY, [...links, record])
  return record
}

export async function updateLink(id, patch) {
  const links = await getLinks()
  let updated = null
  const next = links.map((l) => {
    if (l.id !== id) return l
    updated = { ...l, ...patch, id: l.id, createdAt: l.createdAt }
    return updated
  })
  if (!updated) return null
  writeJson(LINKS_KEY, next)
  return updated
}

export async function deleteLink(id) {
  const links = await getLinks()
  writeJson(LINKS_KEY, links.filter((l) => l.id !== id))
}

export async function getCategories() {
  const existing = readJson(CATEGORIES_KEY)
  if (Array.isArray(existing)) return existing
  const seeds = SEED_CATEGORIES.map((c) => ({ ...c }))
  writeJson(CATEGORIES_KEY, seeds)
  return seeds
}

export async function addCategory(name) {
  const cats = await getCategories()
  const clean = String(name ?? '').trim()
  if (!clean) throw new Error('category-name-required')
  const found = cats.find((c) => c.name.toLowerCase() === clean.toLowerCase())
  if (found) return found
  const created = { id: uid(), name: clean }
  writeJson(CATEGORIES_KEY, [...cats, created])
  return created
}
