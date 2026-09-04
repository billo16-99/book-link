import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShareNetwork, CopySimple, DownloadSimple, SlidersHorizontal, DotsThreeOutlineVertical } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { collectionQrPayload, linkQrPayload } from '../lib/qrPayload'
import { toggleTheme } from '../lib/theme'
import QrCode from '../components/QrCode'
import ActionCircle from '../components/ActionCircle'

export default function Profile() {
  const { links } = useStore()
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const [kebabOpen, setKebabOpen] = useState(false)
  const plateRef = useRef(null)

  const target = useMemo(
    () => (selectedLinkId ? links.find((l) => l.id === selectedLinkId) : null),
    [selectedLinkId, links],
  )

  const collection = useMemo(
    () => collectionQrPayload(links),
    [links],
  )

  const qrValue = target ? linkQrPayload(target) : collection.url
  const shareUrl = target ? target.url : collection.url

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {}
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Book Link', url: shareUrl }) } catch {}
    } else {
      copyShare()
    }
  }

  function downloadPng() {
    const img = plateRef.current?.querySelector('img')
    if (!img?.src) return
    const a = document.createElement('a')
    a.href = img.src
    a.download = 'book-link-qr.png'
    a.click()
  }

  return (
    <section className="profile-stack" aria-label="Profile">
      <motion.div
        ref={plateRef}
        className="qr-plate"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <QrCode value={qrValue} />
        {target && (
          <p className="mono" style={{ textAlign: 'center', marginTop: 12 }}>
            Single link QR
          </p>
        )}
      </motion.div>

      <div className="action-row">
        <ActionCircle label="Share" onPress={share}>
          <ShareNetwork size={22} />
        </ActionCircle>
        <ActionCircle label="Copy" onPress={copyShare}>
          <CopySimple size={22} />
        </ActionCircle>
        <ActionCircle label="Download PNG" onPress={downloadPng}>
          <DownloadSimple size={22} />
        </ActionCircle>
        <ActionCircle
          label="Edit selection"
          onPress={() => setSelectedLinkId(selectedLinkId ? null : '__pick__')}
        >
          <SlidersHorizontal size={22} />
        </ActionCircle>
        <ActionCircle label="More options" onPress={() => setKebabOpen((v) => !v)}>
          <DotsThreeOutlineVertical size={22} />
        </ActionCircle>
      </div>

      <AnimatePresence>
        {selectedLinkId === '__pick__' && (
          <motion.div
            className="kebab-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <button className="kebab-item" onClick={() => setSelectedLinkId(null)}>
              Whole collection ({collection.included}/{collection.total})
            </button>
            {links.slice(-10).reverse().map((l) => (
              <button key={l.id} className="kebab-item" onClick={() => setSelectedLinkId(l.id)}>
                {l.title || l.url}
              </button>
            ))}
          </motion.div>
        )}
        {kebabOpen && (
          <motion.div
            className="kebab-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <button className="kebab-item" onClick={() => toggleTheme()}>
              Toggle dark mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
