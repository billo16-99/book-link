import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { domainOf } from '../lib/validate'

const EASE = [0.32, 0.72, 0, 1]
const SPRING = { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }

export default function LinkCard({ link, index = 0 }) {
  const domain = domainOf(link.url)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: EASE, delay: index * 0.04 }}
    >
      <Link
        to={`/link/${link.id}`}
        className="link-card card-hover"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <motion.span layoutId={`preview-${link.id}`} transition={SPRING} className="card-preview">
          {link.image ? (
            <img src={link.image} alt="" loading="lazy" />
          ) : (
            <span className="letter-tile">{domain.charAt(0).toUpperCase()}</span>
          )}
        </motion.span>
        <span className="card-pills">
          <span className="pill-title">{link.title}</span>
          <span className="pill-domain mono">{domain}</span>
        </span>
      </Link>
    </motion.div>
  )
}
