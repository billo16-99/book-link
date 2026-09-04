import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { SearchProvider } from './lib/search'
import { StoreProvider } from './hooks/useStore'
import NavBar from './components/NavBar'
import Toaster from './components/Toaster'
import Dashboard from './routes/Dashboard'
import LinkDetail from './routes/LinkDetail'
import Collections from './routes/Collections'

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/link/:id" element={<LinkDetail />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MotionConfig reducedMotion="user">
        <StoreProvider>
          <SearchProvider>
            <NavBar />
            <AnimatedRoutes />
            <Toaster />
          </SearchProvider>
        </StoreProvider>
      </MotionConfig>
    </HashRouter>
  )
}
