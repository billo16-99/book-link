import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookmarkSimple } from '@phosphor-icons/react'

export default function NavBar() {
  return (
    <motion.header
      className="nav-wrap"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <nav className="pill nav-pill" aria-label="Primary">
        <Link to="/" className="nav-brand">
          <BookmarkSimple size={18} weight="duotone" aria-hidden="true" />
          Book Link
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/collections" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Collections
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Profile
          </NavLink>
        </div>
      </nav>
    </motion.header>
  )
}
