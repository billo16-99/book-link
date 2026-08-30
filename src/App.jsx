import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { SearchProvider } from './lib/search'
import NavBar from './components/NavBar'
import Toaster from './components/Toaster'

function NotFound() {
  return (
    <div className="empty-state">
      <p>Page not found.</p>
      <a className="btn-pill" href="#/">Back home</a>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<main><h1 style={{ textAlign: 'center' }}>Dashboard</h1></main>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <SearchProvider>
          <NavBar />
          <AnimatedRoutes />
          <Toaster />
        </SearchProvider>
      </MotionConfig>
    </HashRouter>
  )
}
