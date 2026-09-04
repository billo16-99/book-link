import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../hooks/useStore'

const EASE = [0.32, 0.72, 0, 1]

export default function Collections() {
  const { categories, links, loading } = useStore()
  const navigate = useNavigate()

  const categoryCounts = useMemo(() => {
    const counts = {}
    links.forEach((l) => {
      counts[l.categoryId] = (counts[l.categoryId] || 0) + 1
    })
    return counts
  }, [links])

  return (
    <section aria-label="Collections">
      <motion.h1
        className="display-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        Collections
      </motion.h1>
      {loading ? (
        <div className="collection-row">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card-preview skeleton category-card" />)}
        </div>
      ) : (
        <div className="collection-row">
          {categories.map((category, i) => {
            const count = categoryCounts[category.id] || 0
            return (
              <motion.button
                key={category.id}
                className="link-card card-hover category-card"
                onClick={() => navigate(`/?cat=${category.id}`)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: EASE, delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="card-preview">
                  <span className="letter-tile">{category.name.charAt(0)}</span>
                </span>
                <span className="card-pills">
                  <span className="pill-title">{category.name}</span>
                  <span className="pill-domain mono">{count} {count === 1 ? 'link' : 'links'}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
    </section>
  )
}