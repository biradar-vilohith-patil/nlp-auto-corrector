/**
 * components/ThemeToggle.jsx
 * ────────────────────────────
 * Animated sun/moon toggle that switches dark ↔ light mode.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '../store/UIContext'

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="2" x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUI()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      className="btn-icon"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileTap={{ scale: 0.9 }}
      style={{ position: 'relative', width: 34, height: 34 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? 'var(--accent)' : 'var(--amber)',
          }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
