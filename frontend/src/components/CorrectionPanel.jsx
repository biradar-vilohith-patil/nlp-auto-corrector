/**
 * components/CorrectionPanel.jsx
 * ───────────────────────────────
 * Right panel. Features:
 * - Skeleton loader during processing
 * - Word-level diff highlighting
 * - 3D flip card: front = correction, back = refinement
 * - Metric chips, confidence badge, copy, "Use as Input"
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// ── Word diff renderer ──
function renderDiff(original, diffs) {
  if (!diffs || diffs.length === 0) return <span>{original}</span>

  const changeMap = {}
  for (const d of diffs) {
    if (d.original || d.corrected) changeMap[d.position] = d
  }

  const tokens = original.split(/(\s+)/)
  let idx = 0
  const nodes = []

  tokens.forEach((tok, i) => {
    if (/^\s+$/.test(tok)) { nodes.push(tok); return }
    const ch = changeMap[idx]
    if (ch) {
      const cls = ch.type === 'homophone' ? 'diff-hom' : 'diff-del'
      nodes.push(<span key={`d${i}`} className={cls}>{ch.original || tok}</span>)
      if (ch.corrected) {
        nodes.push(' ')
        nodes.push(<span key={`i${i}`} className="diff-ins">{ch.corrected}</span>)
      }
    } else {
      nodes.push(tok)
    }
    idx++
  })

  return <>{nodes}</>
}

// ── Confidence badge ──
function ConfBadge({ value }) {
  const pct   = Math.round(value * 100)
  const color = pct >= 85 ? 'var(--green)' : pct >= 65 ? 'var(--amber)' : 'var(--red)'
  const bg    = pct >= 85 ? 'var(--green-soft)' : pct >= 65 ? 'var(--amber-soft)' : 'var(--red-soft)'
  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      style={{ fontSize: 11.5, fontWeight: 600, color, background: bg,
      padding: '2px 9px', borderRadius: 100, border: `1px solid ${color}`, cursor: 'default' }}>
      {pct}% confidence
    </motion.span>
  )
}

// ── Skeleton ──
function Skeleton({ lines = [88, 72, 80, 55, 68] }) {
  return (
    <motion.div style={{ padding: '18px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {lines.map((w, i) => (
        <motion.div
          key={i}
          className="skeleton"
          style={{ width: `${w}%`, height: 13, marginBottom: 11, borderRadius: 6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
    </motion.div>
  )
}

// ── Copy util ──
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied to clipboard', {
      style: {
        background: 'var(--green-soft)', color: 'var(--green)',
        border: '1px solid var(--green)',
        fontFamily: "'DM Sans',sans-serif", fontSize: '13px',
      },
    })
  })
}

// ── Card header ──
function PanelHeader({ title, tagLabel, tagClass, copyValue, extra }) {
  return (
    <div className="card-header" style={{ gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
        <span className={`tag ${tagClass}`}>{tagLabel}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {extra}
        {copyValue && (
          <motion.button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => copyText(copyValue)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⎘ Copy
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ── Empty state ──
function EmptyState() {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="empty-icon">✦</div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>
        Awaiting Text Pipeline
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--muted2)', maxWidth: 220, lineHeight: 1.6 }}>
        Insert text on the left and run diagnostics to see engine evaluations.
      </p>
    </motion.div>
  )
}

// ── Correction face (front) ──
function CorrectionFace({ result, loading, onFlipHint }) {
  const diffNode = useMemo(() => result ? renderDiff(result.original, result.diffs) : null, [result])

  if (loading) return <><PanelHeader title="Neural Diagnostics" tagLabel="Processing…" tagClass="tag-proc" /><Skeleton /></>
  if (!result) return <EmptyState />

  return (
    <>
      <PanelHeader title="Pipeline Results" tagLabel="✓ Resolved" tagClass="tag-spell" copyValue={result.corrected} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 18px 0' }}>
        {result.spell_fixed > 0 && (
          <motion.span whileHover={{ scale: 1.05 }} className="chip chip-spell"><span className="chip-dot" />{result.spell_fixed} spelling</motion.span>
        )}
        {result.grammar_fixed > 0 && (
          <motion.span whileHover={{ scale: 1.05 }} className="chip chip-gram"><span className="chip-dot" />{result.grammar_fixed} grammar</motion.span>
        )}
        {result.homophone_fixed > 0 && (
          <motion.span whileHover={{ scale: 1.05 }} className="chip chip-hom"><span className="chip-dot" />{result.homophone_fixed} homophone</motion.span>
        )}
        <ConfBadge value={result.confidence} />
      </div>

      <motion.div
        style={{ padding: '14px 18px 18px', fontSize: 14.5, lineHeight: 1.9, borderTop: '1px solid var(--divider)', marginTop: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)' }}
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        {diffNode}
      </motion.div>

      <div style={{ margin: '0 18px 12px', padding: '10px 14px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
        <span style={{ color: 'var(--green)', marginRight: 6, fontWeight: 600 }}>✓</span>
        {result.corrected}
      </div>

      {onFlipHint && (
        <div style={{ padding: '10px 18px 14px', fontSize: 11.5, color: 'var(--muted2)', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>✦</span> Click <strong style={{ color: 'var(--accent)' }}>Refine Text</strong> to synthesize a stylistic rewrite →
        </div>
      )}
    </>
  )
}

// ── Refinement face (back) ──
function RefinementFace({ result, loading }) {
  if (loading) return <><PanelHeader title="Stylistic Refinement" tagLabel="Synthesizing…" tagClass="tag-proc" /><Skeleton lines={[90, 78, 85, 72, 60, 82, 50]} /></>
  if (!result) return null

  return (
    <>
      <PanelHeader
        title="Stylistic Refinement" tagLabel="✦ Synthesized" tagClass="tag-refine" copyValue={result.refined}
        extra={
          <motion.button
            className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('wr:loadText', { detail: result.refined }))
              toast.success('Loaded into editor', { style: { background: 'var(--purple-soft)', color: 'var(--purple)', border: '1px solid var(--purple)', fontFamily: "'DM Sans',sans-serif", fontSize: '13px' } })
            }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            ↑ Use as Input
          </motion.button>
        }
      />

      {result.improvements?.length > 0 && (
        <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.improvements.map((imp, i) => (
            <motion.div key={i} className="improvement-item" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <span className="improvement-icon">✦</span>{imp}
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        className="refined-text" style={{ padding: '16px 18px 20px', borderTop: '1px solid var(--divider)', marginTop: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
      >
        {result.refined}
      </motion.div>

      <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted2)' }}>
        <span>T5 Transformer Output</span>
        <span style={{ color: 'var(--purple)' }}>✦ AI-enhanced</span>
      </div>
    </>
  )
}

// ── Main export ──
export default function CorrectionPanel({ correctionResult, refineResult, correctionLoading, refineLoading }) {
  const isFlipped = Boolean(refineResult || refineLoading)

  return (
    <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>
      
      <AnimatePresence>
        {isFlipped && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>
            <span style={{ fontSize: 14 }}>✦</span> Viewing refined output <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>· card flipped 180°</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flip-scene" style={{ minHeight: 400 }}>
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-face flip-face-front"><CorrectionFace result={correctionResult} loading={correctionLoading} onFlipHint={Boolean(correctionResult)} /></div>
          <div className="flip-face flip-face-back"><RefinementFace result={refineResult} loading={refineLoading} /></div>
        </div>
      </div>

      <AnimatePresence>
        {isFlipped && correctionResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => window.dispatchEvent(new CustomEvent('wr:backToCorrection'))}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            >
              ← Back to diagnostics
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}