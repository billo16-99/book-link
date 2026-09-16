import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QrCode as QrCodeIcon, Star } from '@phosphor-icons/react'
import { domainOf } from '../lib/validate'
import { favoriteOf } from '../lib/linkDefaults'
import { useStore } from '../hooks/useStore'
import { ease, springLayout } from '../lib/motion'
import LinkQrSheet from './LinkQrSheet'

export default function LinkCard({ link, index = 0 }) {
  const { updateLink } = useStore()
  const [qrOpen, setQrOpen] = useState(false)
  const domain = domainOf(link.url)
  const starred = favoriteOf(link)

  function toggleStar() {
    updateLink(link.id, { favorite: !starred })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease, delay: index * 0.04 }}
      >
        <div className="link-tile">
          <Link
            to={`/link/${link.id}`}
            className="link-card card-hover"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <motion.span layoutId={`preview-${link.id}`} transition={springLayout} className="card-preview">
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
          <motion.button
            type="button"
            className={`card-fav${starred ? ' is-fav' : ''}`}
            aria-label={`${starred ? 'Unfavorite' : 'Favorite'} ${link.title || domain}`}
            aria-pressed={starred}
            onClick={toggleStar}
            whileTap={{ scale: 0.9 }}
          >
            {starred ? (
              <Star size={15} weight="fill" aria-hidden="true" />
            ) : (
              <Star size={15} weight="regular" aria-hidden="true" />
            )}
          </motion.button>
          <motion.button
            type="button"
            className="card-qr"
            aria-label={`QR code for ${link.title || domain}`}
            onClick={() => setQrOpen(true)}
            whileTap={{ scale: 0.9 }}
          >
            <QrCodeIcon size={15} weight="bold" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.div>
      <LinkQrSheet link={qrOpen ? link : null} onClose={() => setQrOpen(false)} />
    </>
  )
}