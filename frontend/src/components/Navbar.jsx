/**
 * components/Navbar.jsx
 * ─────────────────────
 * Sticky top bar — Cleaned up to remove unnecessary API health polling.
 */

import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  return (
    <motion.header
      className="navbar"
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 32px', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--overlay)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          WriteRight
        </span>
        <span style={{ 
          fontSize: 11, 
          fontWeight: 600,
          color: 'var(--muted)', 
          background: 'var(--surface-alt)', 
          padding: '2px 8px', 
          borderRadius: 100, 
          border: '1px solid var(--border)' 
        }}>
          v2.0 Engine
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ThemeToggle />
      </div>
    </motion.header>
  )
}