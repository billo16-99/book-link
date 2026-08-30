import { AnimatePresence, motion } from 'framer-motion'

export default function StatusDot({ status, onToggle }) {
  return (
    <button
      type="button"
      className="pill"
      onClick={onToggle}
      aria-label={`Status: ${status}. Activate to toggle`}
    >
      <span style={{ position: 'relative', display: 'inline-block', width: 12, height: 12 }}>
        <AnimatePresence initial={false}>
          <motion.span
            key={status}
            className={`dot dot--${status}`}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        </AnimatePresence>
      </span>
      <span>{status === 'saved' ? 'Saved' : 'Draft'}</span>
    </button>
  )
}
