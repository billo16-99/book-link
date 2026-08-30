import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { repository } from '../storage/repository'
import { fetchMetadata } from '../lib/metadata'
import { domainOf } from '../lib/validate'

const StoreContext = createContext(null)

export function toast(message) {
  window.dispatchEvent(new CustomEvent('booklink:toast', { detail: message }))
}

export function StoreProvider({ children }) {
  const [links, setLinks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([repository.getLinks(), repository.getCategories()])
      .then(([ls, cs]) => {
        if (!alive) return
        setLinks(ls)
        setCategories(cs)
      })
      .catch(() => toast('Could not load your links'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const addLink = useCallback(async ({ url, categoryId }) => {
    const meta = await fetchMetadata(url).catch(() => null)
    let created = null
    try {
      created = await repository.addLink({
        url,
        title: meta?.title || domainOf(url),
        description: meta?.description || '',
        image: meta?.image || '',
        categoryId,
        status: meta ? 'saved' : 'draft',
      })
    } catch {
      toast('Storage is full — link not saved')
      return null
    }
    setLinks((prev) => [...prev, created])
    return created
  }, [])

  const updateLink = useCallback(async (id, patch) => {
    try {
      const next = await repository.updateLink(id, patch)
      if (next) setLinks((prev) => prev.map((l) => (l.id === id ? next : l)))
      return next
    } catch {
      toast('Storage unavailable — change not saved')
      return null
    }
  }, [])

  const deleteLink = useCallback(async (id) => {
    try {
      await repository.deleteLink(id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch {
      toast('Storage unavailable — delete failed')
    }
  }, [])

  const retryMetadata = useCallback(async (id) => {
    const link = await repository.getLink(id)
    if (!link) return null
    try {
      const meta = await fetchMetadata(link.url)
      if (!meta) return null
      return updateLink(id, {
        title: meta.title || link.title,
        description: meta.description,
        image: meta.image,
        status: 'saved',
      })
    } catch {
      return null
    }
  }, [updateLink])

  const addCategory = useCallback(async (name) => {
    try {
      const category = await repository.addCategory(name)
      setCategories((prev) =>
        prev.some((c) => c.id === category.id) ? prev : [...prev, category],
      )
      return category
    } catch {
      toast('Storage unavailable — category not saved')
      return null
    }
  }, [])

  return (
    <StoreContext.Provider
      value={{ links, categories, loading, addLink, updateLink, deleteLink, retryMetadata, addCategory }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
