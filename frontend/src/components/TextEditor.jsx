/**
 * components/TextEditor.jsx
 * ─────────────────────────
 * Left panel: textarea, char/word counters, action buttons.
 * Toggles removed for a cleaner, opinionated UX.
 */

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_CHARS = 4096

const STYLES = ['professional', 'casual', 'academic', 'concise']

export default function TextEditor({ onCorrect, onRefine, onClear, loading, hasResult }) {
  const [text, setText]       = useState('')
  const [focused, setFocused] = useState(false)
  const [style, setStyle]     = useState('professional')
  const ref = useRef(null)

  // Listen for "use-as-input" event from Home
  useEffect(() => {
    function handler(e) {
      setText(e.detail || '')
      setTimeout(() => ref.current?.focus(), 100)
    }
    window.addEventListener('wr:loadText', handler)
    return () => window.removeEventListener('wr:loadText', handler)
  }, [])

  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  const pct   = Math.min((chars / MAX_CHARS) * 100, 100)

  function handleChange(e) {
    if (e.target.value.length <= MAX_CHARS) setText(e.target.value)
  }

  function handleClear() {
    setText(''); onClear(); ref.current?.focus()
  }

  const barColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--amber)'
    : 'linear-gradient(90deg, var(--accent), var(--accent-2))'

  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      {/* ── Main input card ── */}
      <div className={`card ${focused ? 'focused' : ''} ${loading ? 'processing' : ''}`}
           style={{ '--ring-color': 'rgba(79,70,229,.2)' }}>

        {/* Card header - simplified */}
        <div className="card-header" style={{ justifyContent: 'flex-start' }}>
          <div className="label-row">
            <span className="label-dot" />
            Input Text
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          className="editor-textarea"
          value={text}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={9}
          disabled={loading}
          placeholder={"Paste or type your text here…\n\nTry: 'She dont know wher she goed yesterday, it were a compliceted situaton.'"}
        />

        {/* Char progress bar */}
        <div className="char-bar-track">
          <motion.div
            className="char-bar-fill"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.15 }}
            style={{ background: barColor }}
          />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Words <strong style={{ color: 'var(--text-2)' }}>{words}</strong>
            </span>
            <span style={{ fontSize: 12, color: pct > 90 ? 'var(--red)' : 'var(--muted)' }}>
              Chars <strong style={{ color: pct > 90 ? 'var(--red)' : 'var(--text-2)' }}>{chars}</strong>
              <span style={{ color: 'var(--muted2)', marginLeft: 2 }}>/ {MAX_CHARS}</span>
            </span>
          </div>
          <AnimatePresence>
            {text && (
              <motion.button
                className="btn-danger"
                onClick={handleClear}
                disabled={loading}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                ✕ Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Action row ── */}
      <motion.div
        style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {/* Correct button */}
        <motion.button
          className="btn-primary"
          onClick={() => !loading && text.trim() && onCorrect(text)}
          disabled={!text.trim() || loading}
          whileHover={!loading && text.trim() ? { scale: 1.02, boxShadow: '0 4px 20px rgba(79,70,229,.45)' } : {}}
          whileTap={{ scale: 0.97 }}
          style={{ minWidth: 170 }}
        >
          {loading
            ? <><span className="spinner" /> Analysing…</>
            : <><span style={{ fontSize: 15 }}>⚡</span> Fix Spelling &amp; Grammar</>
          }
        </motion.button>

        {/* Refine button + style picker */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <motion.button
            className="btn-cyan"
            onClick={() => hasResult && !loading && onRefine(style)}
            disabled={!hasResult || loading}
            whileHover={hasResult && !loading ? { scale: 1.02, boxShadow: '0 4px 20px rgba(8,145,178,.4)' } : {}}
            whileTap={{ scale: 0.97 }}
            style={{ borderRadius: '10px 0 0 10px', paddingRight: 14 }}
          >
            {loading
              ? <><span className="spinner" /> Refining…</>
              : <><span style={{ fontSize: 13 }}>✦</span> Refine Text</>
            }
          </motion.button>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            disabled={!hasResult || loading}
            style={{
              padding: '0 10px',
              borderRadius: '0 10px 10px 0',
              border: '1px solid var(--accent-2)',
              borderLeft: 'none',
              background: 'var(--accent-2-soft)',
              color: hasResult ? 'var(--accent-2)' : 'var(--muted)',
              fontSize: 12.5,
              fontFamily: "'DM Sans', sans-serif",
              cursor: hasResult ? 'pointer' : 'not-allowed',
              outline: 'none',
              opacity: hasResult ? 1 : 0.5,
              transition: 'all 0.25s ease',
              fontWeight: 500,
            }}
          >
            {STYLES.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
    </motion.div>
  )
}