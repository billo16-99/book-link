import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star } from '@phosphor-icons/react'
import { BookmarkSimple, Plus } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { useSearch } from '../lib/search'
import { favoriteOf } from '../lib/linkDefaults'
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
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const catId = params.get('cat')
  const tab = params.get('tab') === 'recent' || params.get('tab') === 'stars' ? params.get('tab') : null
  const q = query.trim().toLowerCase()
  const base = links.filter((l) => {
    if (catId && l.categoryId !== catId) return false
    if (!q) return true
    return `${l.title} ${l.url}`.toLowerCase().includes(q)
  })
  const visible = tab === 'recent'
    ? [...base].sort((a, b) => b.createdAt - a.createdAt)
    : tab === 'stars'
      ? base.filter((l) => favoriteOf(l))
      : base

  function setTab(next) {
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set('tab', next)
    else nextParams.delete('tab')
    setParams(nextParams, { replace: true })
  }

  const showNothingSaved = !loading && links.length === 0 && tab !== 'stars'
  const showNoMatches = !loading && links.length > 0 && visible.length === 0 && tab !== 'stars'
  const showNoFavorites = !loading && tab === 'stars' && visible.length === 0

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

      <div className="home-actions">
        <div className="seg home-tabs" role="group" aria-label="Filter saved links">
          <button type="button" aria-pressed={tab === null} onClick={() => setTab(null)}>
            All
          </button>
          <button type="button" aria-pressed={tab === 'recent'} onClick={() => setTab('recent')}>
            Recent
          </button>
          <button type="button" aria-pressed={tab === 'stars'} onClick={() => setTab('stars')}>
            Favorites
          </button>
        </div>
      </div>

      {showNothingSaved && (
        <div className="empty-state">
          <span className="empty-icon">
            <BookmarkSimple size={26} weight="light" aria-hidden="true" />
          </span>
          <h2>Nothing saved yet.</h2>
          <p className="mono">Add your first link to build a shelf</p>
        </div>
      )}
      {showNoMatches && (
        <div className="empty-state">
          <h2>No links match "{q}".</h2>
          <p className="mono">Try a different search</p>
        </div>
      )}
      {showNoFavorites && (
        <div className="empty-state">
          <span className="empty-icon">
            <Star size={26} weight="light" aria-hidden="true" />
          </span>
          <h2>No favorites yet.</h2>
          <p className="mono">Tap the ★ on a card to pin it here</p>
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