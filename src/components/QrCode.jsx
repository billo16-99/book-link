import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'

export default function QrCode({ value, size = 240 }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let alive = true
    setDataUrl('')
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#141414ff', light: '#ffffffff' },
    })
      .then((url) => alive && setDataUrl(url))
      .catch(() => alive && setDataUrl(''))
    return () => { alive = false }
  }, [value, size])

  return (
    <motion.img
      key={value}
      role="img"
      alt="QR code"
      src={dataUrl}
      width={size}
      height={size}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    />
  )
}