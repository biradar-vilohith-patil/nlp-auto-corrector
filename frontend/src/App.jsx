/**
 * App.jsx
 * ────────
 * Root shell: ambient background, navbar, page content, toasts.
 */

import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { useUI } from './store/UIContext'

export default function App() {
  const { theme } = useUI()

  return (
    <div className="app-shell">

      {/* ── Animated ambient background ── */}
      <div className="ambient" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>
      <div className="noise-overlay" aria-hidden="true" />

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Page ── */}
      <main className="page-content" style={{ position: 'relative', zIndex: 1 }}>
        <Home />
      </main>

      {/* ── Toast notifications ── */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2600,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
    </div>
  )
}
