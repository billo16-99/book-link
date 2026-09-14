import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookmarkSimple, Plus } from '@phosphor-icons/react'
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
  const { query } = useSearch()
  const [params] = useSearchParams()
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
      <div className="page-head">
        <div>
          <p className="mono eyebrow">Your shelf</p>
          <h1 className="page-title">Saved links</h1>
          <p className="mono" style={{ marginTop: 10 }}>
            {links.length} {links.length === 1 ? 'link' : 'links'} saved
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setSheetOpen(true)}>
          <Plus size={16} weight="bold" /> Add link
        </button>
      </div>

      {!loading && links.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">
            <BookmarkSimple size={26} weight="light" aria-hidden="true" />
          </span>
          <h2>Nothing saved yet.</h2>
          <p className="mono">Add your first link to build a shelf</p>
        </div>
      )}
      {!loading && links.length > 0 && visible.length === 0 && (
        <div className="empty-state">
          <h2>No links match "{q}".</h2>
          <p className="mono">Try a different search</p>
        </div>
      )}
      <div className="grid">
        {loading &&
          Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
        {!loading &&
          visible.map((link, i) => (
            <LinkCard key={link.id} link={link} index={i} />
          ))}
      </div>
      <AddLinkSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  )
}