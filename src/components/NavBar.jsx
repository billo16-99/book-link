import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookmarkSimple, MagnifyingGlass } from '@phosphor-icons/react'
import { useSearch } from '../lib/search'

export default function NavBar() {
  const { query, setQuery } = useSearch()
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
        <span className="nav-divider" aria-hidden="true" />
        <label className="nav-search">
          <MagnifyingGlass size={16} weight="light" aria-hidden="true" />
          <span className="sr-only">Search links</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links…"
          />
        </label>
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
