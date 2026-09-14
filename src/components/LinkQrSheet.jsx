import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CopySimple, DownloadSimple } from '@phosphor-icons/react'
import QrCode from './QrCode'
import { linkQrPayload } from '../lib/qrPayload'
import { springPop } from '../lib/motion'

export default function LinkQrSheet({ link, onClose }) {
  const open = Boolean(link)
  const plateRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
    } catch {}
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
    <AnimatePresence>
      {link && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog" aria-modal="true" aria-label="QR code"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={springPop}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 18 }}>QR code</strong>
              <button onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <div ref={plateRef} className="qr-plate" style={{ alignSelf: 'center' }}>
              <QrCode value={linkQrPayload(link)} />
            </div>
            <p className="mono" style={{ textAlign: 'center', margin: '-4px 12px 0' }}>
              {link.title || link.url}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-pill" onClick={copy}>
                <CopySimple size={16} /> Copy link
              </button>
              <button className="btn-pill" onClick={downloadPng}>
                <DownloadSimple size={16} /> Download PNG
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}