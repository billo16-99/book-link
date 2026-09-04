import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowSquareOut, ClockCounterClockwise, Trash } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { domainOf } from '../lib/validate'
import PillSelector from '../components/PillSelector'
import StatusDot from '../components/StatusDot'

const EASE = [0.32, 0.72, 0, 1]

export default function LinkDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { links, loading, categories, updateLink, deleteLink, retryMetadata, addCategory } = useStore()
  const link = links.find((l) => l.id === id)

  if (loading) return <div className="hero-preview skeleton" style={{ maxWidth: 420 }} aria-hidden="true" />

  if (!link) {
    return (
      <div className="empty-state">
        <p>This link isn't here.</p>
        <Link to="/" className="btn-pill">Back</Link>
      </div>
    )
  }

  const isDraft = link.status === 'draft'

  async function handleCategoryChange(value) {
    if (!value) return updateLink(link.id, { categoryId: null })
    const known = categories.find((c) => c.id === value)
    if (!known) {
      const created = await addCategory(value)
      return updateLink(link.id, { categoryId: created?.id ?? null })
    }
    return updateLink(link.id, { categoryId: known.id })
  }

  return (
    <motion.section
      className="detail-grid"
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.38, ease: EASE }}
      aria-label="Link detail"
    >
      <motion.div layoutId={`preview-${link.id}`} className="hero-preview">
        {link.image ? <img src={link.image} alt="" /> : (
          <span className="letter-tile">{domainOf(link.url).charAt(0).toUpperCase()}</span>
        )}
      </motion.div>

      <div className="detail-side">
        <Link to="/" className="btn-pill" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusDot
            status={link.status}
            onToggle={() => updateLink(link.id, { status: isDraft ? 'saved' : 'draft' })}
          />
          <PillSelector
            label="Category"
            value={link.categoryId ?? ''}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            onChange={handleCategoryChange}
          />
        </div>

        <input
            className="title-input"
            defaultValue={link.title}
            aria-label="Title"
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v && v !== link.title) updateLink(link.id, { title: v })
            }}
          />

        {link.description && <p className="detail-desc">{link.description}</p>}

        <p className="mono"><span>{domainOf(link.url)}</span> · Added {new Date(link.createdAt).toLocaleDateString()}</p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn-pill" href={link.url} target="_blank" rel="noreferrer">
            <ArrowSquareOut size={16} /> Open original
          </a>
          {isDraft && (
            <button className="btn-pill" onClick={() => retryMetadata(link.id)}>
              <ClockCounterClockwise size={16} /> Retry preview
            </button>
          )}
          <button
            className="btn-pill"
            onClick={() => {
              if (window.confirm('Delete this link?')) {
                deleteLink(link.id)
                navigate('/')
              }
            }}
          >
            <Trash size={16} /> Delete
          </button>
        </div>
      </div>
    </motion.section>
  )
}