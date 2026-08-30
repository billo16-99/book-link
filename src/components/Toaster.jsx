import { useEffect, useState } from 'react'

let seq = 0

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onError(event) {
      const id = ++seq
      setToasts((prev) => [...prev, { id, message: event.detail }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
    }
    window.addEventListener('booklink:toast', onError)
    return () => window.removeEventListener('booklink:toast', onError)
  }, [])

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  )
}
