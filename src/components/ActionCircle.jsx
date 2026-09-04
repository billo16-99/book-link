import { motion } from 'framer-motion'

export default function ActionCircle({ label, onPress, children }) {
  return (
    <motion.button
      type="button"
      className="action-circle"
      aria-label={label}
      onClick={onPress}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
    >
      {children}
    </motion.button>
  )
}