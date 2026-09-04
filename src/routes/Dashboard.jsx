import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { useSearch } from '../lib/search'
import LinkCard from '../components/LinkCard'
import AddLinkSheet from '../components/AddLinkSheet'

function SkeletonCard() {
  return (
    <div className="link-card" aria-hidden="true">
      <span className="card-preview skeleton" />
      <span className="card-pills">
        <span className="pill-title skeleton" style={{ height: 26 }} />
        <span className="pill-domain skeleton" style={{ height: 26 }} />
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { links, loading } = useStore()
  const { query, setQuery } = useSearch()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [sheetOpen, setSheetOpen] = useState(false)

  const catId = params.get('cat')
  const q = query.trim().toLowerCase()
  const visible = links.filter((l) => {
    if (catId && l.categoryId !== catId) return false
    if (!q) return true
    return `${l.title} ${l.url}`.toLowerCase().includes(q)
  })

  return (
    <section aria-label="Saved links">
      <input
        placeholder="Search links…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search links"
        style={{ marginBottom: 16 }}
      />
      {!loading && links.length === 0 && (
        <div className="empty-state">
          <p>Nothing saved yet.</p>
          <p className="mono">Tap + to save your first link</p>
        </div>
      )}
      {!loading && links.length > 0 && visible.length === 0 && (
        <div className="empty-state"><p>No links match "{q}".</p></div>
      )}
      <div className="grid">
        {loading &&
          Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}
        {!loading &&
          visible.map((link, i) => (
            <LinkCard key={link.id} link={link} index={i} />
          ))}
        {!loading && (
          <motion.button
            type="button"
            className="add-card"
            onClick={() => setSheetOpen(true)}
            aria-label="Add link"
            animate={reduced ? {} : { scale: [1, 1.015, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus weight="light" />
          </motion.button>
        )}
      </div>
      <AddLinkSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  )
}