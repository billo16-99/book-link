import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { normalizeUrl, isValidUrl } from '../lib/validate'
import { springPop } from '../lib/motion'

const NEW_CATEGORY = '__new__'

export default function AddLinkSheet({ open, onClose }) {
  const { addLink, addCategory, categories } = useStore()
  const [urlInput, setUrlInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUrlInput(''); setCategoryId(''); setNewName(''); setError(''); setSaving(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidUrl(urlInput)) {
      setError('Enter a valid URL, e.g. example.com/article')
      return
    }
    setSaving(true)
    setError('')
    let finalCategoryId = categoryId && categoryId !== NEW_CATEGORY ? categoryId : null
    if (categoryId === NEW_CATEGORY && newName.trim()) {
      const created = await addCategory(newName.trim())
      finalCategoryId = created?.id ?? null
    }
    const created = await addLink({ url: normalizeUrl(urlInput), categoryId: finalCategoryId })
    setSaving(false)
    if (created) onClose()
    else setError('Could not save — check your connection or storage.')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog" aria-modal="true" aria-label="Add link"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={springPop}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 18 }}>Save a link</strong>
              <button onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="field">
              <label htmlFor="sheet-url">Destination URL</label>
              <input
                id="sheet-url"
                ref={inputRef}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="example.com/article"
                inputMode="url"
              />
              <label htmlFor="sheet-cat">Category</label>
              <select id="sheet-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={NEW_CATEGORY}>New category…</option>
              </select>
              {categoryId === NEW_CATEGORY && (
                <input
                  aria-label="New category name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                />
              )}
              {error && <p className="field-error" role="alert">{error}</p>}
              <p className="sheet-note">The page preview is fetched once and cached.</p>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
